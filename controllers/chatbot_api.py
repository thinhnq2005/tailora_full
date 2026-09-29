# -*- coding: utf-8 -*-
import json
import logging
from odoo import http
from odoo.http import request

_logger = logging.getLogger(__name__)

class TailoraChatbotApiController(http.Controller):

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

    def _get_fallback_products(self, company_id, category_name=False, limit=3):
        domain = [('sale_ok', '=', True), ('company_id', '=', company_id)]
        if category_name:
            category = request.env['product.category'].sudo().search([
                '|', ('name', 'ilike', category_name), ('ocr_keywords', 'ilike', category_name)
            ], limit=1)
            if category:
                domain.append(('categ_id', '=', category.id))
        products = request.env['product.product'].sudo().search(domain, limit=limit)
        return products

    @http.route('/api/chatbot/query', type='json', auth='public', methods=['POST'], csrf=False)
    def process_assistant_query(self):
        try:
            payload = request.get_json_data() or {}
            body = payload.get('params', {}) if 'params' in payload else payload
            prompt = str(body.get('prompt', '')).strip().lower()
            session_id = body.get('session_id') or request.session.sid
            company_id = self._get_tenant_company_id()
            partner = request.env.user.partner_id if request.session.uid else False

            response_data = {
                'intent_key': 'general_consulting',
                'matched_keywords': [],
                'product_cards': [],
                'combo_cards': [],
                'metadata': {},
                'extracted_cart_staging': []
            }

            tenant_config = request.env['tailora.tenant.config'].sudo().search([('company_id', '=', company_id)], limit=1)
            response_data['metadata']['office_address'] = tenant_config.office_address if tenant_config else ''

            keywords_records = request.env['tailora.chatbot.keyword'].sudo().search([])
            matched_products = request.env['product.product'].sudo().browse([])
            for kw in keywords_records:
                if kw.keyword.lower() in prompt:
                    matched_products |= kw.product_ids
                    response_data['matched_keywords'].append(kw.keyword)

            if any(k in prompt for k in ['giá', 'báo giá', 'nhiêu', 'bao tiền', 'mắc', 'rẻ', 'chiết khấu', 'chiet khau']):
                response_data['intent_key'] = 'check_price'
                if not matched_products:
                    if 'xi măng' in prompt or 'xi mang' in prompt:
                        matched_products = self._get_fallback_products(company_id, 'xi măng')
                    elif any(k in prompt for k in ['sắt', 'thép', 'phi']):
                        matched_products = self._get_fallback_products(company_id, 'sắt')
                    elif any(k in prompt for k in ['cát', 'đá']):
                        matched_products = self._get_fallback_products(company_id, 'cát')

                if matched_products:
                    prices = matched_products.mapped('lst_price')
                    response_data['metadata']['price_range'] = {
                        'min': min(prices) if prices else 0,
                        'max': max(prices) if prices else 0
                    }
                else:
                    response_data['metadata']['has_target_product'] = False
                    category_kw = 'xi măng' if 'xi măng' in prompt or 'xi mang' in prompt else ('sắt' if any(k in prompt for k in ['sắt', 'thép']) else False)
                    if category_kw:
                        alternative_prods = self._get_fallback_products(company_id, category_kw, limit=3)
                        matched_products |= alternative_prods
                        alt_prices = alternative_prods.mapped('lst_price')
                        response_data['metadata']['alternative_price_range'] = {
                            'min': min(alt_prices) if alt_prices else 0,
                            'max': max(alt_prices) if alt_prices else 0
                        }

            elif any(k in prompt for k in ['thương hiệu', 'nhà máy', 'tiêu chuẩn', 'chứng chỉ', 'co/cq', 'cocq', 'quy cách', 'móng', 'dầm', 'gạch ống']):
                response_data['intent_key'] = 'technical_consulting'
                if any(k in prompt for k in ['móng', 'dầm', 'nhà phố', 'trọn gói']):
                    response_data['intent_key'] = 'combo_recommendation'
                else:
                    if not matched_products:
                        if 'thép' in prompt or 'sắt' in prompt:
                            matched_products = request.env['product.product'].sudo().search([
                                '|', ('name', 'ilike', 'Hòa Phát'), ('name', 'ilike', 'Miền Nam'),
                                ('sale_ok', '=', True), ('company_id', '=', company_id)
                            ], limit=3)
                        elif 'gạch' in prompt or 'gach' in prompt:
                            matched_products = request.env['product.product'].sudo().search([
                                ('name', 'ilike', 'Gạch'), ('sale_ok', '=', True), ('company_id', '=', company_id)
                            ], limit=3)

            elif any(k in prompt for k in ['combo', 'trọn gói', 'tron goi', 'gói', 'nhà cấp 4', 'đổ sàn', 'làm móng']):
                response_data['intent_key'] = 'combo_recommendation'

            elif any(k in prompt for k in ['bãi ở đâu', 'địa chỉ', 'xe gì', 'ba gác', 'xe ben', 'xe cẩu', 'phí ship', 'giao liền', 'mất bao lâu', 'hẻm nhỏ']):
                response_data['intent_key'] = 'logistics_info'
                response_data['metadata']['vehicles'] = []

            elif any(k in prompt for k in ['quét mã', 'qr', 'vietqr', 'công nợ', 'nợ', 'thanh toán', 'gối đầu', 'đối soát']):
                response_data['intent_key'] = 'payment_debt_policy'
                if partner:
                    customer = request.env['res.partner'].sudo().browse(partner.id)
                    response_data['metadata']['credit_limit'] = customer.credit_limit
                    response_data['metadata']['current_debt'] = customer.credit
                else:
                    response_data['metadata']['credit_limit'] = 0
                    response_data['metadata']['current_debt'] = 0

            if not matched_products and response_data['intent_key'] in ['general_consulting', 'technical_consulting']:
                matched_products = self._get_fallback_products(company_id, limit=3)

            for prod in matched_products:
                tmpl = prod.product_tmpl_id
                response_data['product_cards'].append({
                    'product_id': prod.id,
                    'display_name': prod.display_name,
                    'lst_price': prod.lst_price,
                    'uom_name': prod.uom_id.name or '',
                    'brand_name': tmpl.brand_name or '',
                    'spec_short': tmpl.spec_short or '',
                    'cocq_certificate': tmpl.cocq_certificate or '',
                    'image_url': f'/api/public/product/image/{tmpl.id}'
                })

            history_domain = [('company_id', '=', company_id)]
            if partner:
                history_domain.append(('partner_id', '=', partner.id))
            else:
                history_domain.append(('session_id', '=', session_id))
            history = request.env['tailora.chatbot.history'].sudo().search(history_domain, limit=1)
            if history and history.extracted_cart_data:
                try:
                    response_data['extracted_cart_staging'] = json.loads(history.extracted_cart_data)
                except Exception:
                    pass

            return response_data

        except Exception as e:
            _logger.error(f"[CHATBOT API ERROR] {str(e)}")
            return {'error': str(e), 'intent_key': 'error'}