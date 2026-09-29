import base64
import json
import re
from odoo import http
from odoo.http import request

class TailoraTenantApiController(http.Controller):

    def _normalize_incoming_host(self, host_str):
        if not host_str:
            return ""
        host = host_str.strip().lower()
        host = re.sub(r'^https?://', '', host)
        host = re.sub(r'^www\.', '', host)
        host = host.split(':')[0]
        return host.split('/')[0]

    @http.route('/api/public/tenant/logo/<int:config_id>', type='http', auth='public', methods=['GET'], csrf=False)
    def get_public_tenant_logo(self, config_id, **kwargs):
        config = request.env['tailora.tenant.config'].sudo().browse(config_id)
        if config.exists() and config.logo_file:
            try:
                image_data = base64.b64decode(config.logo_file)
                headers = [
                    ('Content-Type', 'image/png'),
                    ('Content-Length', len(image_data)),
                    ('Cache-Control', 'public, max-age=86400')
                ]
                return request.make_response(image_data, headers)
            except Exception:
                return request.not_found()
        return request.not_found()

    @http.route('/api/public/tenant/banner/image/<int:banner_id>', type='http', auth='public', methods=['GET'], csrf=False)
    def get_public_banner_image(self, banner_id, **kwargs):
        banner = request.env['tailora.tenant.banner'].sudo().browse(banner_id)
        if banner.exists() and banner.image_file:
            try:
                image_data = base64.b64decode(banner.image_file)
                headers = [
                    ('Content-Type', 'image/png'),
                    ('Content-Length', len(image_data)),
                    ('Cache-Control', 'public, max-age=86400')
                ]
                return request.make_response(image_data, headers)
            except Exception:
                return request.not_found()
        return request.not_found()

    @http.route('/api/public/tenant/showcase/image/<int:showcase_id>', type='http', auth='public', methods=['GET'], csrf=False)
    def get_public_showcase_image(self, showcase_id, **kwargs):
        showcase = request.env['tailora.tenant.showcase'].sudo().browse(showcase_id)
        if showcase.exists() and showcase.image_file:
            try:
                image_data = base64.b64decode(showcase.image_file)
                headers = [
                    ('Content-Type', 'image/png'),
                    ('Content-Length', len(image_data)),
                    ('Cache-Control', 'public, max-age=86400')
                ]
                return request.make_response(image_data, headers)
            except Exception:
                return request.not_found()
        return request.not_found()

    @http.route('/api/public/tenant/config/active', type='http', auth='public', methods=['GET'], csrf=False)
    def get_active_tenant_config(self, **kwargs):
        try:
            incoming_host = kwargs.get('domain') or request.httprequest.headers.get('x-tenant-host') or request.httprequest.host or 'linhphuong'
            clean_host = self._normalize_incoming_host(incoming_host)
            
            if clean_host == 'localhost' or clean_host == '127.0.0.1':
                clean_host = 'linhphuong'

            config_obj = request.env['tailora.tenant.config'].sudo()
            config = config_obj.search([('subdomain', '=', clean_host)], limit=1)
            
            if not config:
                config = config_obj.search([('custom_domain', '=', clean_host)], limit=1)
            if not config:
                subdomain_part = clean_host.split('.')[0]
                config = config_obj.search([('subdomain', '=', subdomain_part)], limit=1)
            if not config:
                config = config_obj.search([], limit=1)
                
            if not config:
                return request.make_response(json.dumps({'error': 'No tenant layout config matches this domain'}), [('Content-Type', 'application/json')], status=404)

            company = config.company_id
            
            logo_final_payload = config.logo_url or ""
            if config.logo_file and not logo_final_payload:
                logo_final_payload = f"/api/public/tenant/logo/{config.id}"

            homepage_banners = []
            if hasattr(config, 'banner_ids'):
                for b in config.banner_ids:
                    b_img = b.image_url or ""
                    if b.image_file and not b_img:
                        b_img = f"/api/public/tenant/banner/image/{b.id}"
                    homepage_banners.append(b_img)
            elif hasattr(config, 'homepage_banner_ids'):
                for b in config.homepage_banner_ids:
                    homepage_banners.append(b.url if hasattr(b, 'url') else '')

            featured_projects = []
            if hasattr(config, 'showcase_ids'):
                for s in config.showcase_ids:
                    s_img = ""
                    if s.image_file:
                        s_img = f"/api/public/tenant/showcase/image/{s.id}"
                    featured_projects.append({
                        'id': s.id,
                        'name': s.name,
                        'img_url': s_img
                    })

            tenant_bank_payload = {}
            if config.bank_name and (hasattr(config, 'bank_account_number') or hasattr(config, 'bank_account')):
                acc_num = getattr(config, 'bank_account_number', '') or getattr(config, 'bank_account', '')
                acc_holder = getattr(config, 'bank_account_holder', '') or getattr(config, 'bank_owner', '')
                tenant_bank_payload = {
                    'bank_name': config.bank_name,
                    'account_number': acc_num,
                    'account_holder': acc_holder
                }

            payload = {
                'id': config.id,
                'subdomain': config.subdomain or '',
                'custom_domain': config.custom_domain or '',
                'brand_name': company.name if company else '',
                'phone': company.phone if company else '',
                'email': company.email if company else '',
                'logo_url': logo_final_payload,
                'primary_color': config.primary_color or '#ffbc11',
                'homepage_banners': homepage_banners,
                'featured_projects': featured_projects,
                'about_us_short': config.about_us_short or '',
                'about_us_full': config.about_us_full or '',
                'footer_copyright': config.footer_copyright or (company.name if company else ''),
                'footer_description': config.footer_description or '',
                'zalo_oa_url': config.zalo_oa_url or '',
                'facebook_page_url': config.facebook_page_url or '',
                'youtube_channel_url': config.youtube_channel_url or '',
                'hotline_support': getattr(config, 'hotline_support', '') or (config.phone_hotline if hasattr(config, 'phone_hotline') else '') or (company.phone if company else ''),
                'email_support': getattr(config, 'email_support', '') or (company.email if company else ''),
                'office_address': getattr(config, 'office_address', '') or (company.street if company else ''),
                'business_hours': config.business_hours or '07:00 - 17:00',
                'payment_bank_info': tenant_bank_payload,
                'vat': company.vat if company else ''
            }

            return request.make_response(json.dumps(payload), [('Content-Type', 'application/json')])
        except Exception as e:
            return request.make_response(json.dumps({'error': str(e)}), [('Content-Type', 'application/json')], status=500)