# -*- coding: utf-8 -*-
import json
import logging
from odoo import http
from odoo.http import request

_logger = logging.getLogger(__name__)

class TailoraCartApiController(http.Controller):

    def _get_tenant_company_id(self):
        tenant_host = request.httprequest.headers.get('x-tenant-host') or 'localhost'
        clean_host = tenant_host.strip().lower().split(':')[0]
        tenant_config_obj = request.env['tailora.tenant.config'].sudo()
        
        if clean_host == 'localhost':
            tenant_config = tenant_config_obj.search([('subdomain', '=', 'thinhvlxd')], limit=1)
        else:
            tenant_config = tenant_config_obj.search([('custom_domain', '=', clean_host)], limit=1)
            if not tenant_config:
                subdomain_part = clean_host.split('.', 1)[0]
                tenant_config = tenant_config_obj.search([('subdomain', '=', subdomain_part)], limit=1)
        
        if tenant_config and tenant_config.company_id:
            return tenant_config.company_id.id
        return request.env.company.id

    def _get_cart_order_env(self):
        company_id = self._get_tenant_company_id()
        sale_order_obj = request.env['sale.order'].sudo().with_company(company_id)

        # GĂM CHẶT THEO USER ĐĂNG NHẬP: Lấy partner_id của tài khoản hiện tại, nếu rỗng thì bốc tài khoản fallback
        if request.session.uid:
            partner_id = request.env.user.partner_id.id
        else:
            fallback_partner = request.env['res.partner'].sudo().with_company(company_id).search([('name', 'ilike', 'NGUYENQUOCTHINH292970')], limit=1)
            partner_id = fallback_partner.id if fallback_partner else 1

        domain = [
            ('state', '=', 'draft'),
            ('partner_id', '=', partner_id),
            ('company_id', '=', company_id)
        ]

        order = sale_order_obj.search(domain, limit=1)
        return order, sale_order_obj, partner_id, company_id

    @http.route('/api/cart/items', type='http', auth='public', methods=['GET'], csrf=False)
    def get_cart_items(self):
        try:
            order, _, _, company_id = self._get_cart_order_env()
            cart_data = []
            
            if order:
                valid_lines = order.order_line.filtered(
                    lambda l: l.product_id.default_code != 'SHIP' and l.product_id.company_id.id == company_id
                )
                for line in valid_lines:
                    tmpl_id = line.product_id.product_tmpl_id.id if line.product_id.product_tmpl_id else line.product_id.id
                    cart_data.append({
                        'id': line.id,
                        'product_id': tmpl_id,
                        'variant_id': line.product_id.id,
                        'name': line.product_id.display_name,
                        'quantity': int(line.product_uom_qty),
                        'price': line.price_unit,
                        'uom': line.product_uom.name or 'đơn vị',
                        'image': f"/web/image/product.product/{line.product_id.id}/image_128"
                    })
                    
            return http.Response(json.dumps(cart_data), status=200, content_type='application/json')
        except Exception as e:
            _logger.error(str(e))
            return http.Response(json.dumps([]), status=200, content_type='application/json')

    @http.route('/api/cart/update', type='http', auth='public', methods=['POST'], csrf=False)
    def update_cart_item(self):
        try:
            body = json.loads(request.httprequest.data)
            product_id = body.get('variant_id') or body.get('product_id')
            quantity = float(body.get('quantity', 0))

            if not product_id:
                return http.Response(json.dumps({'error': 'Missing product identity'}), status=400, content_type='application/json')

            order, sale_order_obj, partner_id, company_id = self._get_cart_order_env()
            
            # Tìm sản phẩm theo đúng Template ID từ trang chủ gửi lên
            template = request.env['product.template'].sudo().with_company(company_id).search([('id', '=', int(product_id))], limit=1)
            if template:
                variant = template.product_variant_id
            else:
                variant = request.env['product.product'].sudo().with_company(company_id).search([('id', '=', int(product_id))], limit=1)
                
            if not variant or not variant.exists():
                return http.Response(json.dumps({'error': 'Product not found'}), status=404, content_type='application/json')

            if not order and quantity > 0:
                order = sale_order_obj.create({
                    'partner_id': partner_id,
                    'company_id': company_id,
                    'state': 'draft',
                })

            if order:
                existing_line = order.order_line.filtered(lambda l: l.product_id.id == variant.id)
                if existing_line:
                    if quantity <= 0:
                        existing_line.unlink()
                    else:
                        existing_line.write({'product_uom_qty': quantity})
                elif quantity > 0:
                    request.env['sale.order.line'].sudo().with_company(company_id).create({
                        'order_id': order.id,
                        'product_id': variant.id,
                        'product_uom_qty': quantity,
                        'price_unit': variant.lst_price,
                        'product_uom': variant.uom_id.id,
                    })

            return self.get_cart_items()
        except Exception as e:
            _logger.error(str(e))
            return http.Response(json.dumps({'error': str(e)}), status=500, content_type='application/json')