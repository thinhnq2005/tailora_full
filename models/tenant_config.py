import re
from odoo import models, fields, api
from odoo.exceptions import ValidationError

class TailoraTenantConfig(models.Model):
    _name = 'tailora.tenant.config'
    _description = 'Tailora Tenant Configuration'
    _check_company = True

    company_id = fields.Many2one('res.company', string='Company', required=True, index=True, default=lambda self: self.env.company)
    primary_color = fields.Char(string='Primary Color', default='#3b2c07')
    subdomain = fields.Char(string='Internal Subdomain', required=True, index=True)
    custom_domain = fields.Char(string='Custom Domain', index=True)
    logo_url = fields.Char(string='Logo URL')
    logo_file = fields.Binary(string='Logo Upload', attachment=True)
    logo_name = fields.Char(string='Logo Filename')
    business_hours = fields.Char(string='Business Hours', default='07:00 - 17:00')
    hotline_support = fields.Char(string='Hotline Support')
    email_support = fields.Char(string='Email Support')
    office_address = fields.Char(string='Office Address')
    footer_copyright = fields.Char(string='Footer Copyright')
    footer_description = fields.Text(string='Footer Description')
    bank_name = fields.Char(string='Bank Name')
    bank_account_number = fields.Char(string='Bank Account Number')
    bank_account_holder = fields.Char(string='Bank Account Holder')
    zalo_oa_url = fields.Char(string='Zalo OA URL')
    facebook_page_url = fields.Char(string='Facebook Page URL')
    youtube_channel_url = fields.Char(string='YouTube Channel URL')
    about_us_short = fields.Text(string='About Us Short Summary')
    about_us_full = fields.Text(string='About Us Full Content')
    available_brands = fields.Char(string='Available Brands Lineup', default='Hòa Phát, Nghi Sơn, Tây Đô, Holcim')
    active_categories = fields.Many2many('product.category', 'tailora_tenant_config_category_rel', 'config_id', 'category_id', string='Active Web Categories')
    banner_ids = fields.One2many('tailora.tenant.banner', 'config_id', string='Homepage Hero Banners')
    showcase_ids = fields.One2many('tailora.tenant.showcase', 'config_id', string='Công trình tiêu biểu')

    def _normalize_domain(self, domain_str):
        if not domain_str:
            return False
        clean = domain_str.strip().lower()
        clean = re.sub(r'^https?://', '', clean)
        clean = re.sub(r'^www\.', '', clean)
        clean = clean.split('/')[0]
        return clean.split(':')[0]

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if 'subdomain' in vals:
                vals['subdomain'] = self._normalize_domain(vals['subdomain'])
                if not vals['subdomain'] or '.' in vals['subdomain']:
                    raise ValidationError("Ten mien phu noi bo phong ban khong hop le!")
            if 'custom_domain' in vals and vals['custom_domain']:
                vals['custom_domain'] = self._normalize_domain(vals['custom_domain'])
        return super(TailoraTenantConfig, self).create(vals_list)

    def write(self, vals):
        if 'subdomain' in vals:
            vals['subdomain'] = self._normalize_domain(vals['subdomain'])
            if not vals['subdomain']:
                raise ValidationError("Ten mien phu noi bo khong hop le!")
        if 'custom_domain' in vals and vals['custom_domain']:
            vals['custom_domain'] = self._normalize_domain(vals['custom_domain'])
        elif 'custom_domain' in vals and not vals['custom_domain']:
            vals['custom_domain'] = False 
        return super(TailoraTenantConfig, self).write(vals)


class TailoraTenantBanner(models.Model):
    _name = 'tailora.tenant.banner'
    _description = 'Tailora Tenant Banner'
    _order = 'sequence, id'

    config_id = fields.Many2one('tailora.tenant.config', string='Tenant Config', ondelete='cascade', required=True)
    sequence = fields.Integer(string='Sequence', default=10)
    image_url = fields.Char(string='Image URL')
    image_file = fields.Binary(string='Image Upload', attachment=True)
    image_name = fields.Char(string='Image Filename')

    @api.constrains('config_id')
    def _check_max_banners(self):
        for record in self:
            count = self.search_count([('config_id', '=', record.config_id.id)])
            if count > 5:
                raise ValidationError("He thong chi ho tro toi da 5 hinh anh banner truot!")


class TailoraTenantShowcase(models.Model):
    _name = 'tailora.tenant.showcase'
    _description = 'Tailora Tenant Showcase Project'
    _order = 'sequence, id'

    config_id = fields.Many2one('tailora.tenant.config', string='Tenant Config', ondelete='cascade', required=True)
    sequence = fields.Integer(string='Thứ tự', default=10)
    name = fields.Char(string='Tên công trình', required=True)
    description = fields.Text(string='Thông tin cung ứng')
    image_file = fields.Binary(string='Hình ảnh thực tế', attachment=True)
    image_name = fields.Char(string='Tên file ảnh')
