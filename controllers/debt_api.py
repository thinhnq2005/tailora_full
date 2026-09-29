# -*- coding: utf-8 -*-
import json
import logging
from odoo import http
from odoo.http import request

_logger = logging.getLogger(__name__)

class TailoraDebtApi(http.Controller):

    def _get_tenant_company_id(self):
        tenant_host = request.httprequest.headers.get('x-tenant-host') or 'localhost'
        clean_host = tenant_host.strip().lower().split(':')[0]
        tenant_config_obj = request.env['tailora.tenant.config'].sudo()
        tenant_config = False
        
        if clean_host == 'localhost':
            tenant_config = tenant_config_obj.search([('subdomain', '=', 'thinhvlxd')], limit=1)
        else:
            tenant_config = tenant_config_obj.search([('custom_domain', '=', clean_host)], limit=1)
            if not tenant_config:
                subdomain_part = clean_host.split('.')[0]
                tenant_config = tenant_config_obj.search([('subdomain', '=', subdomain_part)], limit=1)
        
        if tenant_config and tenant_config.company_id:
            return tenant_config.company_id.id
        return request.env.company.id

    @http.route('/api/debt/summary', type='http', auth='public', methods=['GET'], csrf=False)
    def get_customer_debt_summary(self, **kwargs):
        """Kết xuất bảng phân kỳ đợt tĩnh Read-only cho nhà thầu đối soát số liệu bến bãi"""
        try:
            company_id = self._get_tenant_company_id()
            partner = request.env.user.partner_id if request.session.uid else False

            if not partner:
                return request.make_response(
                    json.dumps({'error': 'Yêu cầu đăng nhập tài khoản để đối soát.'}),
                    headers=[('Content-Type', 'application/json')],
                    status=401
                )

            debt_orders = request.env['sale.order'].sudo().with_company(company_id).search([
                ('partner_id', '=', partner.id),
                ('x_is_debt_order', '=', True),
                ('state', 'not in', ['cancel'])
            ], order='create_date desc')

            orders_payload = []
            for order in debt_orders:
                phases_payload = []
                for phase in order.x_debt_phase_ids:
                    phases_payload.append({
                        'phase_id': phase.id,
                        'phase_name': phase.name,
                        'product_name': phase.product_id.name or '',
                        'quantity': phase.quantity,
                        'price_unit': phase.price_unit,
                        'amount_due': phase.amount_due,
                        'payment_status': phase.payment_status, 
                        'delivery_status': phase.delivery_status 
                    })

                orders_payload.append({
                    'order_id': order.id,
                    'order_name': order.name,
                    'total_amount': order.amount_total,
                    'debt_phases': phases_payload
                })

            result = {
                'customer_name': partner.name,
                'credit_limit': partner.credit_limit,
                'current_debt_balance': partner.credit,
                'active_debt_orders': orders_payload
            }

            return request.make_response(
                json.dumps(result),
                headers=[('Content-Type', 'application/json')],
                status=200
            )
        except Exception as e:
            _logger.error(f"[DEBT API READ-ONLY VIEW ERROR] {str(e)}")
            return request.make_response(
                json.dumps({'error': str(e)}),
                headers=[('Content-Type', 'application/json')],
                status=500
            )

    @http.route('/api/debt/order/phase-pay', type='json', auth='public', methods=['POST'], csrf=False)
    def customer_submit_vietqr_payment(self):
        """Lắng nghe yêu cầu: Chuyển trạng thái đợt sang dạng 'Chờ kế toán đối soát biến động số dư'"""
        try:
            payload = request.get_json_data() or {}
            body = payload.get('params', {}) if 'params' in payload else payload
            phase_id = body.get('phase_id')

            if not phase_id:
                return {'success': False, 'error': 'Thiếu ID đợt thanh toán.'}

            company_id = self._get_tenant_company_id()
            phase = request.env['sale.order.debt.phase'].sudo().with_company(company_id).browse(int(phase_id))
            
            if not phase.exists() or phase.payment_status != 'unpaid':
                return {'success': False, 'error': 'Trạng thái đợt vật tư không hợp lệ hoặc đã thanh toán.'}

            # Báo hiệu lên Odoo Backend để kế toán tự kiểm tra app ngân hàng rồi duyệt tay
            phase.write({'payment_status': 'pending'})
            return {
                'success': True, 
                'msg': 'Hệ thống ghi nhận, bến bãi đang đối soát sao kê tài khoản ngân hàng.'
            }
        except Exception as e:
            _logger.error(f"[DEBT TRANSACTION LOG ERROR] {str(e)}")
            return {'success': False, 'error': str(e)}