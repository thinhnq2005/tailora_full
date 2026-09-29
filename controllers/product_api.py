import base64
import json
from odoo import http
from odoo.http import request

class TailoraProductApiController(http.Controller):

    @http.route('/api/public/product/image/<int:product_id>', type='http', auth='public', methods=['GET'], csrf=False)
    def get_public_product_image(self, product_id, **kwargs):
        product = request.env['product.template'].sudo().browse(product_id)
        if product.exists() and product.image_256:
            try:
                image_data = base64.b64decode(product.image_256)
                headers = [
                    ('Content-Type', 'image/png'),
                    ('Content-Length', len(image_data)),
                    ('Cache-Control', 'public, max-age=86400')
                ]
                return request.make_response(image_data, headers)
            except Exception:
                return request.not_found()
        return request.not_found()

    # KHỐI PROXY TẢI FILE CO/CQ PUBLIC KHÔNG CẦN SESSION AUTH
    @http.route('/api/public/product/cocq/<int:product_id>', type='http', auth='public', methods=['GET'], csrf=False)
    def get_public_product_cocq(self, product_id, **kwargs):
        try:
            p = request.env['product.template'].sudo().browse(product_id)
            if p.exists() and p.cocq_certificate:
                file_data = base64.b64decode(p.cocq_certificate)
                file_name = p.cocq_certificate_name or f"CO_CQ_{product_id}.pdf"
                headers = [
                    ('Content-Type', 'application/pdf'),
                    ('Content-Length', len(file_data)),
                    ('Content-Disposition', f'inline; filename="{file_name}"'),
                    ('Cache-Control', 'public, max-age=3600')
                ]
                return request.make_response(file_data, headers)
        except Exception:
            pass
        return request.not_found()

    # KHỐI PROXY TẢI FILE CATALOGUE PUBLIC KHÔNG CẦN SESSION AUTH
    @http.route('/api/public/product/catalogue/<int:product_id>', type='http', auth='public', methods=['GET'], csrf=False)
    def get_public_product_catalogue(self, product_id, **kwargs):
        try:
            p = request.env['product.template'].sudo().browse(product_id)
            if p.exists() and p.e_catalogue:
                file_data = base64.b64decode(p.e_catalogue)
                file_name = p.e_catalogue_name or f"Catalogue_{product_id}.pdf"
                headers = [
                    ('Content-Type', 'application/pdf'),
                    ('Content-Length', len(file_data)),
                    ('Content-Disposition', f'inline; filename="{file_name}"'),
                    ('Cache-Control', 'public, max-age=3600')
                ]
                return request.make_response(file_data, headers)
        except Exception:
            pass
        return request.not_found()

    @http.route('/api/public/products', type='http', auth='public', methods=['GET'], csrf=False)
    def get_public_products_list(self, **kwargs):
        try:
            domain = [('sale_ok', '=', True)]
            products = request.env['product.template'].sudo().search(domain)
            payload = []
            
            for p in products:
                img_url = f"/api/public/product/image/{p.id}" if p.image_256 else None
                
                # SỬA ĐƯỜNG DẪN: Trỏ trực tiếp sang cổng API public vừa viết ở phía trên
                cocq_url = f"/api/public/product/cocq/{p.id}" if p.cocq_certificate else None
                catalogue_url = f"/api/public/product/catalogue/{p.id}" if p.e_catalogue else None
                
                payload.append({
                    'id': p.id,
                    'name': p.name,
                    'price': p.list_price,
                    'price_min': p.price_min if hasattr(p, 'price_min') else p.list_price,
                    'price_max': p.price_max if hasattr(p, 'price_max') else p.list_price,
                    'category': p.categ_id.name.lower() if p.categ_id else 'default',
                    'uom': p.x_web_uom_custom if (hasattr(p, 'x_web_uom_custom') and p.x_web_uom_custom) else (p.uom_id.name or 'đơn vị'),
                    'brand': p.brand_name or 'Nội địa',
                    'spec_short': p.spec_short or 'Tiêu chuẩn',
                    'img_url': img_url,
                    'cocq_url': cocq_url,
                    'catalogue_url': catalogue_url
                })
                
            return request.make_response(json.dumps(payload), [('Content-Type', 'application/json')])
        except Exception as e:
            return request.make_response(json.dumps({'error': str(e)}), [('Content-Type', 'application/json')], status=500)