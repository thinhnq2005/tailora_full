# -*- coding: utf-8 -*-
from odoo import models, fields, api
from datetime import datetime

class SaleOrder(models.Model):
    _inherit = 'sale.order'

    state = fields.Selection(selection_add=[
        ('admin_confirmed', 'Đã chốt giá thương lượng'),
        ('customer_confirmed', 'Khách đã chốt đơn Zalo'),
    ], ondelete={'admin_confirmed': 'cascade', 'customer_confirmed': 'cascade'})

    discount_status = fields.Selection([
        ('base_price', 'Giá niêm yết'),
        ('discounted', 'Đã chiết khấu thầu')
    ], string='Trạng thái chiết khấu', default='base_price', required=True)
    x_session_id = fields.Char(string="Session ID Trình Duyệt", copy=False, index=True)

    # 🛠️ KHU VỰC KHAI BÁO BAO VÂY DUMMY FIELDS ĐỂ KHÔNG BỊ SẬP REGISTRY ODOO
    x_debt_negotiation_status = fields.Char(string='Trạng thái đàm phán ngầm', default='locked')
    x_last_modifier = fields.Char(string='Người chỉnh sửa cuối', default='company')
    x_warehouse_id = fields.Many2one('vlxd.warehouse', string='Bến bãi xuất vật tư ngầm')
    x_shipping_lat = fields.Float(string='Vĩ độ công trình cũ', default=0.0)
    x_shipping_lng = fields.Float(string='Kinh độ công trình cũ', default=0.0)
    x_shipping_distance_km = fields.Float(string='Khoảng cách cũ', default=0.0)
    x_calculated_distance = fields.Float(string='Khoảng cách tính toán cũ', default=0.0)
    x_assigned_vehicle_type = fields.Char(string='Loại xe cũ', default='Xe tải')
    x_delivery_fee_warning = fields.Char(string='Cảnh báo phí ship cũ', default='')
    pre_discount_total = fields.Float(string='Tổng tiền trước chiết khấu cũ', default=0.0)
    x_actual_delivery_fee = fields.Float(string='Phí giao hàng thực tế cũ', default=0.0)

    delivery_note = fields.Text(
        string='Ghi chú vận chuyển', 
        default='Biểu phí ship bến bãi đã được thống nhất qua Zalo và thu trực tiếp khi hạ hàng.'
    )
    shipping_address_raw = fields.Char(string='Địa chỉ công trình (Khách gõ/Ghim)')
    
    delivery_fee_status = fields.Selection([
        ('pending', 'Chờ báo giá xe'),
        ('included', 'Miễn phí vận chuyển'),
        ('calculated', 'Đã chốt phí ship')
    ], string='Trạng thái phí ship', default='pending')
    
    x_assigned_vehicle_info = fields.Char(string='Thông tin điều phối xe')
    x_driver_name_info = fields.Char(string='Tài xế phụ trách bốc xếp')
    x_delivery_fee_calculated = fields.Float(string='Phí vận chuyển thực tế chốt (VND)', default=0.0)

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if vals.get('name', '/') == '/' or vals.get('name', '').startswith('SO'):
                date_str = datetime.now().strftime('%Y%m%d')
                seq = self.env['ir.sequence'].next_by_code('sale.order.rfq.b2b') or self.env['ir.sequence'].next_by_code('sale.order') or '/'
                vals['name'] = f"LP-{date_str}-{seq[-4:] if len(seq) >= 4 else seq}"
        return super(SaleOrder, self).create(vals_list)

    def action_admin_approve_discount(self):
        self.ensure_one()
        if self.state == 'draft':
            self.write({'state': 'admin_confirmed', 'discount_status': 'discounted'})
        return True

    def action_confirm_to_sale_order(self):
        self.ensure_one()
        if self.state in ['draft', 'sent', 'admin_confirmed']:
            self.action_confirm()
        return True
    
    def action_customer_accept_rfq(self):
        """Hàm dummy bao vây phòng trừ View XML cũ gọi ngầm chốt đơn"""
        self.ensure_one()
        return True