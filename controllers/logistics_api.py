# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request
import json

class TailoraLogisticsApiController(http.Controller):

    @http.route('/api/public/logistics/vehicles', type='json', auth='public', methods=['POST'], csrf=False)
    def get_warehouse_vehicles(self, **kwargs):
        try:
            data = request.get_json_data() or {}
            warehouse_id = data.get('warehouse_id')
            
            domain = []
            if warehouse_id:
                domain.append(('warehouse_ids', 'in', [int(warehouse_id)]))
                
            vehicles = request.env['fleet.vehicle'].sudo().search(domain)
            result = []
            for v in vehicles:
                warehouses_data = [{
                    'name': wh.name, 
                    'address': wh.address or ""
                } for wh in v.warehouse_ids]
                
                big_image_base64 = ""
                if v.x_web_fleet_image:
                    big_image_base64 = v.x_web_fleet_image.decode('utf-8')
                elif v.brand_id and v.brand_id.image_128:
                    big_image_base64 = v.brand_id.image_128.decode('utf-8')

                result.append({
                    'id': v.id,
                    'name': v.name or '',
                    'x_web_fleet_name': v.x_web_fleet_name or '',
                    'license_plate': v.license_plate or '',
                    'vehicle_type': v.x_vehicle_type or '',
                    'capacity_desc': v.x_capacity_desc or '',
                    'max_weight_capacity': v.x_max_weight_capacity,
                    'warehouses': warehouses_data,
                    'x_web_fleet_image': big_image_base64  
                })
            return {'success': True, 'vehicles': result}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    @http.route('/api/public/shipping/calculate', type='json', auth='public', methods=['POST'], csrf=False)
    def calculate_shipping_cost(self, **kwargs):
        try:
            data = request.get_json_data() or {}
            sale_order_id = data.get('sale_order_id')
            address_text = data.get('address_text')

            if sale_order_id and address_text:
                sale_order = request.env['sale.order'].sudo().browse(int(sale_order_id))
                if sale_order.exists() and sale_order.state == 'draft':
                    sale_order.write({
                        'shipping_address_raw': address_text
                    })

            return {
                'success': True,
                'msg': 'Logged shipping text address profile successfully.'
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}

    @http.route('/api/public/order/track', type='json', auth='public', methods=['POST'], csrf=False)
    def track_order_progress(self, **kwargs):
        try:
            data = request.get_json_data() or {}
            order_ref = data.get('order_id') or data.get('order_name')
            
            if not order_ref:
                return {'success': False, 'error': 'Missing reference order key'}

            sale_order = request.env['sale.order'].sudo().search([
                '|', ('id', '=', order_ref if isinstance(order_ref, int) else 0), ('name', '=', str(order_ref))
            ], limit=1)

            if not sale_order:
                return {'success': False, 'error': 'Sales order tracking record not found'}

            current_status = sale_order.x_delivery_status or 'draft'
            progress_percent = sale_order.x_delivery_progress_percent or 0

            pickings = request.env['stock.picking'].sudo().search([('sale_id', '=', sale_order.id)], order='create_date desc')
            fleet_info = {
                'license_plate': 'Chờ bến bãi xếp xe', 
                'driver_name': 'Chờ điều phối tài xế', 
                'driver_phone': '---'
            }
            
            if pickings:
                pick = pickings[0]
                fleet_info = {
                    'license_plate': pick.vehicle_id.license_plate if pick.vehicle_id else 'Chờ bến bãi xếp xe',
                    'driver_name': pick.driver_id.name if pick.driver_id else 'Chờ điều phối tài xế',
                    'driver_phone': pick.driver_id.mobile or pick.driver_id.phone or '---'
                }

            return {
                'success': True,
                'order_id': sale_order.id,
                'order_name': sale_order.name,
                'delivery_status': current_status,
                'progress_percentage': progress_percent,
                'logistics_fleet': fleet_info,
                'shipping_fee_agreed': getattr(sale_order, 'x_delivery_fee_calculated', 0.0)
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}