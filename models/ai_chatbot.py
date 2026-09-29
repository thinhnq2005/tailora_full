# -*- coding: utf-8 -*-
from odoo import models, fields

class TailoraChatbotKeyword(models.Model):
    _name = 'tailora.chatbot.keyword'
    _description = 'Tailora Chatbot Product Mapping Keywords'

    keyword = fields.Char(string='User Query Keyword', required=True, index=True)
    product_ids = fields.Many2many('product.product', 'tailora_chatbot_keyword_product_rel', 'keyword_id', 'product_id', string='Mapped Product Variants')

class TailoraChatbotHistory(models.Model):
    _name = 'tailora.chatbot.history'
    _description = 'Tailora Chatbot Conversation History'
    _check_company = True

    company_id = fields.Many2one('res.company', string='Company', required=True, ondelete='cascade', default=lambda self: self.env.company)
    partner_id = fields.Many2one('res.partner', string='Customer')
    session_id = fields.Char(string='Session ID', index=True)
    message_log = fields.Text(string='Message Log JSON Array')
    extracted_cart_data = fields.Text(string='Extracted OCR Cart Data JSON')