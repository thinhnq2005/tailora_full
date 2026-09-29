# -*- coding: utf-8 -*-
import json
from odoo import http
from odoo.http import request

class TailoraOcrApiController(http.Controller):

    @http.route('/api/rfq/threshold-list', type='http', auth='public', methods=['GET'], csrf=False)
    def get_threshold_list(self):
        try:
            company = request.env.company
            categories = request.env['product.category'].sudo().search([])
            payload = {}
            for categ in categories:
                templates = request.env['product.template'].sudo().search([('categ_id', '=', categ.id)], limit=1)
                if templates:
                    payload[categ.name.lower()] = templates[0].rfq_threshold
            
            if 'default' not in payload:
                payload['default'] = 20.0
                
            return http.Response(
                json.dumps(payload),
                status=200,
                content_type='application/json'
            )
        except Exception as e:
            return http.Response(
                json.dumps({'error': str(e)}),
                status=500,
                content_type='application/json'
            )

    @http.route('/api/ocr/process-mapping', type='json', auth='public', methods=['POST'], csrf=False)
    def api_ocr_process_mapping(self):
        try:
            payload = request.get_json_data() or {}
            body = payload.get('params', {}) if 'params' in payload else payload
            
            raw_lines = body.get('lines', [])
            company_id = body.get('company_id') or request.env.company.id
            session_id = body.get('session_id')
            image_url = body.get('image_url')
            partner_id = body.get('partner_id')

            extraction_log = request.env['tailora.ocr.extraction'].sudo().create({
                'company_id': company_id,
                'session_id': session_id,
                'image_url': image_url,
                'partner_id': int(partner_id) if partner_id else False,
                'state': 'draft'
            })

            response_lines = []

            for line in raw_lines:
                search_text = str(line.get('raw_text', '')).lower().strip()
                quantity = float(line.get('quantity', 1.0))
                
                products = request.env['product.product'].sudo().with_company(company_id).search([
                    ('sale_ok', '=', True)
                ])
                
                matched_product = False
                alternatives = []
                
                for prod in products:
                    aliases = (prod.product_tmpl_id.ocr_aliases or '').lower()
                    if search_text in aliases or search_text in prod.name.lower():
                        if not matched_product:
                            matched_product = prod
                        else:
                            alternatives.append(prod)
                
                if not matched_product:
                    categories = request.env['product.category'].sudo().search([])
                    matched_categ = False
                    for categ in categories:
                        keywords = (categ.ocr_keywords or '').lower()
                        if search_text in keywords or search_text in categ.name.lower():
                            matched_categ = categ
                            break
                    
                    if matched_categ:
                        categ_prods = request.env['product.product'].sudo().with_company(company_id).search([
                            ('categ_id', '=', matched_categ.id),
                            ('sale_ok', '=', True)
                        ], limit=5)
                        if categ_prods:
                            matched_product = categ_prods[0]
                            alternatives = categ_prods[1:]

                request.env['tailora.ocr.extraction.line'].sudo().create({
                    'extraction_id': extraction_log.id,
                    'raw_text': line.get('raw_text'),
                    'quantity': quantity,
                    'product_id': matched_product.id if matched_product else False,
                    'alternative_product_ids': [(6, 0, [alt.id for alt in alternatives])]
                })

                selected_item_data = {
                    'id': matched_product.id if matched_product else None,
                    'name': matched_product.display_name if matched_product else line.get('raw_text'),
                    'price': matched_product.lst_price if matched_product else 0.0,
                    'uom': matched_product.uom_id.name if matched_product and matched_product.uom_id else 'đơn vị',
                    'category': matched_product.product_tmpl_id.categ_id.name.lower() if matched_product and matched_product.product_tmpl_id.categ_id else 'default'
                }

                alts_data = []
                for alt in alternatives:
                    alts_data.append({
                        'id': alt.id,
                        'name': alt.display_name,
                        'price': alt.lst_price,
                        'uom': alt.uom_id.name if alt.uom_id else 'đơn vị',
                        'category': alt.product_tmpl_id.categ_id.name.lower() if alt.product_tmpl_id.categ_id else 'default'
                    })

                response_lines.append({
                    'raw_text': line.get('raw_text'),
                    'quantity': quantity,
                    'selected_item': selected_item_data,
                    'alternatives': alts_data
                })

            extraction_log.write({'state': 'mapped'})

            return {
                'success': True,
                'extraction_id': extraction_log.id,
                'mapped_lines': response_lines
            }
            
        except Exception as e:
            if 'extraction_log' in locals():
                extraction_log.write({'state': 'failed'})
            return {'success': False, 'error': str(e)}