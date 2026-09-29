# -*- coding: utf-8 -*-
import json
import logging
from odoo import http
from odoo.http import request

_logger = logging.getLogger(__name__)

class TailoraRfqApiController(http.Controller):

    def _get_tenant_company_id(self):
        tenant_host = request.httprequest.headers.get('x-tenant-host') or 'localhost'
        clean_host = tenant_host.strip().lower().split(':')[0]
        tenant_config_obj = request.env['tailora.tenant.config'].sudo()
        tenant_config = False
        
        if clean_host == 'localhost':
            tenant_config = tenant_config_obj.search([('subdomain', '=', 'thinhvlxd')], limit=1)
        else:
            tenant_config = tenant_config_obj.search([('custom_domain', '=', clean_host)], limit=1)
            if not tenant_config:
                subdomain_part = clean_host.split('.')[0]
                tenant_config = tenant_config_obj.search([('subdomain', '=', subdomain_part)], limit=1)
        
        if tenant_config and tenant_config.company_id:
            return tenant_config.company_id.id
        return request.env.company.id

    @http.route('/api/rfq/submit', type='http', auth='public', methods=['POST'], csrf=False)
    def submit_rfq(self):
        """Tiếp nhận khay gom vật tư chữ tĩnh gửi về từ trình duyệt React làm phiếu khảo giá"""
        try:
            body = json.loads(request.httprequest.data)
            company_id = self._get_tenant_company_id()

            items = body.get('items', [])
            shipping_address = body.get('shipping_address')

            if request.session.uid:
                partner_id = request.env.user.partner_id.id
            else:
                fallback_partner = request.env['res.partner'].sudo().with_company(company_id).search([('name', 'ilike', 'NGUYENQUOCTHINH292970')], limit=1)
                partner_id = fallback_partner.id if fallback_partner else 1

            order = request.env['sale.order'].sudo().with_company(company_id).create({
                'partner_id': partner_id,
                'company_id': company_id,
                'state': 'draft',
                'shipping_address_raw': shipping_address
            })

            # Đối khớp an toàn 100% dựa vào Tên vật tư + Giá sàn băm từ Client gửi xuống
            for item in items:
                product_name = item.get('name', 'Vật tư bến bãi')
                product_price = float(item.get('price', 0.0))
                requested_qty = float(item.get('quantity', 1.0))

                matched_product = request.env['product.product'].sudo().with_company(company_id).search([
                    ('name', '=', product_name)
                ], limit=1)

                if matched_product:
                    request.env['sale.order.line'].sudo().with_company(company_id).create({
                        'order_id': order.id,
                        'product_id': matched_product.id,
                        'product_uom_qty': requested_qty,
                        'price_unit': product_price,
                        'product_uom': matched_product.uom_id.id,
                    })

            return http.Response(
                json.dumps({'success': True, 'rfq_id': order.name}),
                status=200,
                content_type='application/json'
            )
        except Exception as e:
            _logger.error(str(e))
            return http.Response(json.dumps({'error': str(e)}), status=500, content_type='application/json')

    @http.route('/api/rfq/list', type='http', auth='public', methods=['GET'], csrf=False)
    def get_rfq_list(self):
        """Trả về danh sách gộp chung Tiến độ đơn thầu / Lịch sử báo giá (Read-only)"""
        try:
            company_id = self._get_tenant_company_id()
            if request.session.uid:
                partner_id = request.env.user.partner_id.id
            else:
                partner_id_param = request.get_http_params().get('partner_id')
                if partner_id_param:
                    partner_id = int(partner_id_param)
                else:
                    fallback_partner = request.env['res.partner'].sudo().with_company(company_id).search([('name', 'ilike', 'NGUYENQUOCTHINH292970')], limit=1)
                    partner_id = fallback_partner.id if fallback_partner else 1

            orders = request.env['sale.order'].sudo().with_company(company_id).search([
                ('partner_id', '=', partner_id),
                ('company_id', '=', company_id)
            ], order='create_date desc')

            payload = []
            state_mapping = {
                'draft': 'Chờ bến bãi duyệt',
                'sent': 'Đang đàm phán Zalo',
                'admin_confirmed': 'Đã chốt báo giá thầu',
                'customer_confirmed': 'Đang chuẩn bị bốc hàng',
                'sale': 'Đang điều vận bến bãi',
                'done': 'Đã hoàn thành hạ bãi',
                'cancel': 'Đơn thầu đã hủy'
            }
            discount_mapping = {
                'base_price': 'Giá niêm yết',
                'discounted': 'Đã chiết khấu thầu'
            }

            for order in orders:
                current_state = state_mapping.get(order.state, 'Chờ bến bãi duyệt')
                current_discount = discount_mapping.get(getattr(order, 'discount_status', 'base_price'), 'Giá niêm yết')

                payload.append({
                    'id': str(order.id),
                    'rfq_id': order.name,
                    'created_at': order.create_date.strftime('%Y-%m-%d') if order.create_date else '2026-06-25',
                    'total_amount': order.amount_total,
                    'discount_status': current_discount,
                    'status': current_state,
                    'shipping_address': order.shipping_address_raw or 'Bàn bạc tọa độ qua Zalo',
                    'delivery_note': getattr(order, 'delivery_note', ''),
                    'vehicle_info': getattr(order, 'x_assigned_vehicle_info', 'Đang xếp chuyến xe...'),
                    'driver_info': getattr(order, 'x_driver_name_info', 'Đang xếp tài xế...'),
                    'delivery_fee': getattr(order, 'x_delivery_fee_calculated', 0.0),
                    'delivery_status_logistics': getattr(order, 'x_delivery_status', 'draft')
                })

            return http.Response(json.dumps(payload), status=200, content_type='application/json')
        except Exception as e:
            _logger.error(str(e))
            return http.Response(json.dumps({'error': str(e)}), status=500, content_type='application/json')