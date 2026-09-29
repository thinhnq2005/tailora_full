# -*- coding: utf-8 -*-
from odoo import models, fields, api

class TailoraOcrExtraction(models.Model):
    _name = 'tailora.ocr.extraction'
    _description = 'Tailora OCR Mapping Logs'
    _check_company = True

    company_id = fields.Many2one('res.company', string='Company', required=True, ondelete='cascade', default=lambda self: self.env.company)
    partner_id = fields.Many2one('res.partner', string='Customer')
    session_id = fields.Char(string='Session ID', index=True)
    image_url = fields.Char(string='Uploaded Image URL')
    line_ids = fields.One2many('tailora.ocr.extraction.line', 'extraction_id', string='Extraction Lines')
    state = fields.Selection([
        ('draft', 'Draft'),
        ('mapped', 'Mapped'),
        ('failed', 'Failed')
    ], string='Status', default='draft', required=True, index=True)


class TailoraOcrExtractionLine(models.Model):
    _name = 'tailora.ocr.extraction.line'
    _description = 'Tailora OCR Mapping Line'

    extraction_id = fields.Many2one('tailora.ocr.extraction', string='Extraction Reference', ondelete='cascade', required=True)
    raw_text = fields.Char(string='Raw Text', required=True)
    quantity = fields.Float(string='Quantity', default=1.0)
    product_id = fields.Many2one('product.product', string='Matched Product')
    alternative_product_ids = fields.Many2many('product.product', 'ocr_line_product_rel', 'line_id', 'product_id', string='Alternative Products')

    def action_auto_map_product(self):
        self.ensure_one()
        search_text = self.raw_text.lower().strip()
        
        products = self.env['product.product'].search([('sale_ok', '=', True)])
        matched_product = False
        alternatives = []
        
        for prod in products:
            aliases = (prod.product_tmpl_id.ocr_aliases or '').lower()
            if search_text in aliases or search_text in prod.name.lower():
                if not matched_product:
                    matched_product = prod
                else:
                    alternatives.append(prod.id)
                    
        if matched_product:
            self.write({
                'product_id': matched_product.id,
                'alternative_product_ids': [(6, 0, alternatives)]
            })
        else:
            categories = self.env['product.category'].search([])
            matched_categ = False
            for categ in categories:
                keywords = (categ.ocr_keywords or '').lower()
                if search_text in keywords or search_text in categ.name.lower():
                    matched_categ = categ
                    break
            
            if matched_categ:
                categ_prods = self.env['product.product'].search([('categ_id', '=', matched_categ.id), ('sale_ok', '=', True)], limit=5)
                if categ_prods:
                    self.write({
                        'product_id': categ_prods[0].id,
                        'alternative_product_ids': [(6, 0, categ_prods.ids)]
                    })