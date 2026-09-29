# -*- coding: utf-8 -*-
from odoo import models, fields

class ResPartner(models.Model):
    _inherit = 'res.partner'

    credit_limit = fields.Monetary(string='Hạn mức nợ gối đầu', currency_field='credit_limit_currency_id', company_dependent=True)
    credit_limit_currency_id = fields.Many2one('res.currency', string='Tiền tệ hạn mức', default=lambda self: self.env.company.currency_id)
    
    contact_name_pdp = fields.Char(string='Tên chỉ huy/Cai thầu công trình')
    contact_phone_pdp = fields.Char(string='SĐT liên hệ chỉ huy bãi')
    
    sale_order_ids = fields.One2many('sale.order', 'partner_id', string='Tiến độ Đơn thầu & Báo giá')
    invoice_ids = fields.One2many('account.move', 'partner_id', string='Sổ cái Công nợ bến bãi')
    ocr_extraction_ids = fields.One2many('tailora.ocr.extraction', 'partner_id', string='Lịch sử quét toa hàng OCR')
    chatbot_history_ids = fields.One2many('tailora.chatbot.history', 'partner_id', string='Nhật ký tư vấn bến bãi')