import math
from odoo import models, fields, api

class ProductCategory(models.Model):
    _inherit = 'product.category'

    ocr_keywords = fields.Text(string='OCR Keywords')


class ProductTemplate(models.Model):
    _inherit = 'product.template'

    rfq_threshold = fields.Float(string='RFQ Threshold Amount', default=0.0)
    ocr_aliases = fields.Text(string='OCR Target Aliases')
    brand_name = fields.Char(string='Brand Name', default='Nội địa')
    spec_short = fields.Char(string='Specification Short', default='Tiêu chuẩn')
    cocq_certificate = fields.Binary(string='CO/CQ Quality Certificate', attachment=True)
    cocq_certificate_name = fields.Char(string='CO/CQ File Name')
    e_catalogue = fields.Binary(string='E-Catalogue Technical Document', attachment=True)
    e_catalogue_name = fields.Char(string='E-Catalogue File Name')

    price_min = fields.Float(string='Giá sàn sỉ', default=0.0, store=True, readonly=False)
    price_max = fields.Float(string='Giá trần thầu', default=0.0, store=True, readonly=False)
    x_web_uom_custom = fields.Char(string='Đơn vị tính hiển thị Web', default='m3', help="Nhập quy cách để hiển thị dạng: giá/đơn_vị")

    @api.depends('list_price')
    def _compute_price_range(self):
        for template in self:
            base_price = template.list_price
            if base_price > 0:
                template.price_min = math.floor(base_price * 0.9)
                template.price_max = math.ceil(base_price * 1.1)
            else:
                template.price_min = 0.0
                template.price_max = 0.0


class VlxdProductCombo(models.Model):
    _name = 'vlxd.product.combo'
    _description = 'Gói Vật Tư Định Mức Cố Định'

    name = fields.Char(string='Tên gói Combo', required=True)
    code = fields.Char(string='Mã định danh định mức', required=True, copy=False)
    image_1920 = fields.Binary(string='Hình ảnh đại diện gói', attachment=True)
    fixed_price = fields.Float(string='Giá tổng cố định (VND)', required=True, default=0.0)
    description = fields.Text(string='Mô tả chi tiết giải pháp gói')
    combo_line_ids = fields.One2many('vlxd.product.combo.line', 'combo_id', string='Thành phần vật tư định mức')
    active = fields.Boolean(string='Đang hoạt động', default=True)

    _sql_constraints = [
        ('unique_code', 'unique(code)', 'Mã định danh Combo này đã tồn tại trong hệ thống!')
    ]


class VlxdProductComboLine(models.Model):
    _name = 'vlxd.product.combo.line'
    _description = 'Dòng vật tư thành phần trong Combo'

    combo_id = fields.Many2one('vlxd.product.combo', string='Gói Combo gốc', ondelete='cascade', required=True)
    product_id = fields.Many2one('product.product', string='Vật tư thành phần', required=True, domain="[('sale_ok', '=', True)]")
    quantity = fields.Float(string='Số lượng định mức', required=True, default=1.0)
    uom_id = fields.Many2one('uom.uom', string='Đơn vị tính', related='product_id.uom_id', readonly=True)
    lst_price = fields.Float(string='Giá bán lẻ gốc', related='product_id.lst_price', readonly=True)