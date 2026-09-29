# -*- coding: utf-8 -*-
from odoo import models, fields

class AccountMove(models.Model):
    _inherit = 'account.move'

    sale_order_id = fields.Many2one(
        'sale.order', 
        string='Đơn hàng gốc sinh nợ', 
        readonly=True,
        index=True,
        ondelete='set null'
    )
    
    payment_ids = fields.One2many(
        'account.payment', 
        'move_id', 
        string='Lịch sử phiếu thu lũy kế'
    )

    payment_state = fields.Selection(
        selection_add=[
            ('not_paid', 'Chưa đối soát nợ'),
            ('partial', 'Đã ứng một phần'),
            ('paid', 'Đã tất toán dư nợ')
        ], 
        ondelete={
            'not_paid': 'cascade', 
            'partial': 'cascade', 
            'paid': 'cascade'
        }
    )


class AccountPayment(models.Model):
    _inherit = 'account.payment'

    move_id = fields.Many2one(
        'account.move', 
        string='Hóa đơn/Chứng từ công nợ đối khớp', 
        index=True,
        ondelete='cascade'
    )