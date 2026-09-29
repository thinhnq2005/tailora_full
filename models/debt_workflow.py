# -*- coding: utf-8 -*-
from odoo import models, fields, api

class SaleOrder(models.Model):
    _inherit = 'sale.order'

    x_is_debt_order = fields.Boolean(
        string='Đơn hàng công nợ chia đợt', 
        default=False,
        help="Bật để kích hoạt kế hoạch chia đợt thanh toán từ bến bãi hiển thị lên React."
    )
    
    x_debt_phase_ids = fields.One2many(
        'sale.order.debt.phase', 
        'order_id', 
        string='Kế hoạch chia đợt Công nợ'
    )


class SaleOrderDebtPhase(models.Model):
    _name = 'sale.order.debt.phase'
    _description = 'Phân kỳ đợt thanh toán công nợ bến bãi'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'sequence, id'

    order_id = fields.Many2one('sale.order', string='Đơn hàng gốc', ondelete='cascade', required=True)
    sequence = fields.Integer(string='Thứ tự đợt', default=10)
    name = fields.Char(string='Tên đợt vật tư', required=True)
    
    product_id = fields.Many2one('product.product', string='Sản phẩm cấp đợt này', required=True)
    quantity = fields.Float(string='Số lượng giao đợt này', default=1.0, digits='Product Unit of Measure')
    price_unit = fields.Float(string='Đơn giá đợt', required=True)
    amount_due = fields.Float(string='Thành tiền đợt này', compute='_compute_amount_due', store=True)
    
    payment_status = fields.Selection([
        ('unpaid', 'Chưa thanh toán'),
        ('pending', 'Chờ duyệt VietQR'),
        ('paid', 'Đã thanh toán đợt')
    ], string='Trạng thái tiền', default='unpaid', tracking=True)

    delivery_status = fields.Selection([
        ('ready', 'Chờ bốc hàng tại bãi'),
        ('shipping', 'Đang vận chuyển'),
        ('done', 'Đã ký nhận công trình')
    ], string='Trạng thái hàng', default='ready', tracking=True)

    @api.depends('quantity', 'price_unit')
    def _compute_amount_due(self):
        for record in self:
            record.amount_due = record.quantity * record.price_unit

    @api.onchange('product_id')
    def _onchange_product_id(self):
        if self.product_id:
            self.price_unit = self.product_id.lst_price

    def button_approve_payment_phase(self):
        """Hành động một chiều thu tiền đợt khi đối soát hoàn tất"""
        self.ensure_one()
        self.write({'payment_status': 'paid'})
        self.order_id.message_post(
            body=f"<b>[Hệ thống bến bãi]:</b> Đã duyệt thanh toán thành công cho đợt: {self.name} - Số tiền: {self.amount_due:,.0f} VND."
        )
        return True