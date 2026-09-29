# -*- coding: utf-8 -*-
from odoo import models, fields

class VlxdWarehouse(models.Model):
    _name = 'vlxd.warehouse'
    _description = 'Bến Bãi Vật Liệu Xây Dựng'

    name = fields.Char(string='Tên bến bãi', required=True)
    address = fields.Char(string='Địa chỉ bãi')
    latitude = fields.Float(string='Vĩ độ GPS tham chiếu', digits=(10, 7), default=10.0)
    longitude = fields.Float(string='Kinh độ GPS tham chiếu', digits=(10, 7), default=105.0)


class StockPicking(models.Model):
    _inherit = 'stock.picking'

    vehicle_id = fields.Many2one('fleet.vehicle', string='Phương tiện vận chuyển')
    driver_id = fields.Many2one('res.partner', string='Tài xế giao hàng')
    x_delivery_status = fields.Selection([
        ('draft', 'Chờ xếp hàng'),
        ('loading', 'Đang bốc vật tư'),
        ('shipping', 'Đang lăn bánh'),
        ('delivered', 'Đã hạ hàng công trình'),
        ('returned', 'Quay đầu bến bãi')
    ], string='Trạng thái chuyến đi', default='draft')
    x_delivery_progress_percent = fields.Integer(string='Tiến độ giao hàng (%)', default=0)


class SaleOrder(models.Model):
    _inherit = 'sale.order'

    x_delivery_status = fields.Selection([
        ('draft', 'Chờ điều phối'),
        ('assigned', 'Đã xếp xe bến bãi'),
        ('shipping', 'Đang vận chuyển'),
        ('delivered', 'Đã giao tới công trình'),
        ('exception', 'Sự cố bến bãi')
    ], string='Trạng thái logistics', default='draft')

    x_delivery_progress_percent = fields.Integer(
        related='picking_ids.x_delivery_progress_percent',
        string='Tiến độ giao hàng (%)',
        readonly=True,
        store=True
    )


class FleetVehicle(models.Model):
    _inherit = 'fleet.vehicle'

    warehouse_ids = fields.Many2many(
        'vlxd.warehouse',
        'fleet_vehicle_warehouse_rel',
        'vehicle_id',
        'warehouse_id',
        string='Thuộc bến bãi hành chính'
    )
    driver_employee_id = fields.Many2one('hr.employee', string='Tài xế phụ trách', domain="[('job_id.name', 'ilike', 'Tài xế')]")
    x_max_weight_capacity = fields.Float(string='Tải trọng tối đa định mức (kg)', default=2500.0)
    x_vehicle_type = fields.Char(string='Loại phương tiện di động', default='Xe tải nhỏ')
    x_capacity_desc = fields.Char(string='Mô tả quy cách tải sản phẩm', default='Di chuyển linh hoạt hẻm nhỏ')
    x_web_fleet_name = fields.Char(string='Tên hiển thị Web', default='Xe tải TAILORA')
    x_web_fleet_image = fields.Binary(string='Ảnh bự hiển thị Web')


class HrEmployee(models.Model):
    _inherit = 'hr.employee'

    allowed_warehouse_ids = fields.Many2many(
        'vlxd.warehouse',
        'hr_employee_warehouse_rel',
        'employee_id',
        'warehouse_id',
        string='Bến bãi quản lý trực thuộc'
    )

class VlxdWarehouseReorderDummy(models.Model):
    _name = 'vlxd.warehouse.reorder'
    _description = 'Model gia lap de sua loi dong bo phân quyen bến bãi'

    warehouse_id = fields.Many2one('vlxd.warehouse', string='Bến bãi')


class FleetShippingRuleDummy(models.Model):
    _name = 'fleet.shipping.rule'
    _description = 'Model gia lap de sua loi dong bo cuoc ship cu'