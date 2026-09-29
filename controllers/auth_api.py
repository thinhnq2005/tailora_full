# -*- coding: utf-8 -*-
import json
from odoo import http
from odoo.http import request

class TailoraAuthApiController(http.Controller):

    @http.route('/api/public/auth/login', type='json', auth='public', methods=['POST'], csrf=False)
    def portal_login(self, login, password, type, **kwargs):
        try:
            login_email = str(login).strip()
            password_plain = str(password).strip()

            # Truy vấn bản ghi user thông qua tài khoản cột 'login'
            user = request.env['res.users'].sudo().search([('login', '=', login_email)], limit=1)
            if not user:
                return {"error": "Tài khoản Google này chưa đăng ký thành viên trên bến bãi."}

            # Đóng gói mảng dữ liệu chính xác theo kiến trúc bảo mật Odoo 18
            credential = {
                'type': 'password',
                'password': password_plain
            }

            try:
                # Gọi hàm nội bộ xác thực mà không làm sinh lỗi thừa tham số vị trí
                user.sudo().with_user(user)._check_credentials(credential, {'interactive': False})
            except Exception:
                return {"error": "Mật khẩu hệ thống không chính xác."}

            partner = user.partner_id
            if type == 'B2B' and partner.company_type != 'company':
                return {"error": "Tài khoản của bạn không thuộc quyền hạn của đối tác Nhà thầu Sỉ (B2B)."}

            # Thiết lập Session ID hợp quy cho phiên làm việc
            request.session.uid = user.id
            return {
                'uid': user.id,
                'name': partner.name,
                'email': partner.email or '',
                'phone': partner.phone or '',
                'company_type': partner.company_type,
                'credit_limit': partner.credit_limit,
                'session_id': request.session.sid
              }
        except Exception as e:
            return {"error": str(e)}

    @http.route('/api/public/auth/register', type='json', auth='public', methods=['POST'], csrf=False)
    def portal_register(self, login, password, type, **kwargs):
        try:
            email = str(login).strip()
            password_plain = str(password).strip()

            existing_user = request.env['res.users'].sudo().search([('login', '=', email)], limit=1)
            if existing_user:
                return {"error": "Tài khoản này đã tồn tại trên hệ thống. Vui lòng chuyển sang Đăng nhập."}

            company_type = 'company' if type == 'B2B' else 'person'
            display_name = email.split('@')[0].upper()
            
            # Cấu hình dữ liệu mảng res.users và ép nhóm quyền Portal ('base.group_portal')
            user_vals = {
                'name': display_name,
                'login': email,
                'company_id': request.env.company.id,
                'groups_id': [(6, 0, [request.env.ref('base.group_portal').id])]
            }
            
            new_user = request.env['res.users'].sudo().create(user_vals)
            # Khởi tạo mật khẩu an toàn thông qua hàm write đồng bộ mã hóa mật hóa
            new_user.sudo().write({'password': password_plain})
            
            # Đồng bộ cấu hình loại thực thể đối tác B2B/B2C
            new_user.partner_id.sudo().write({
                'email': email,
                'company_type': company_type
            })

            # Tự động cấp quyền session đăng nhập ngay sau khi đăng ký thành công
            request.session.uid = new_user.id
            partner = new_user.partner_id

            return {
                'uid': new_user.id,
                'name': partner.name,
                'email': partner.email or '',
                'phone': partner.phone or '',
                'company_type': partner.company_type,
                'credit_limit': partner.credit_limit,
                'session_id': request.session.sid
            }
        except Exception as e:
            return {"error": str(e)}

    @http.route('/api/public/auth/logout', type='json', auth='user', methods=['POST'], csrf=False)
    def portal_logout(self, **kwargs):
        try:
            request.session.logout()
            return {'success': True}
        except Exception as e:
            return {'error': str(e)}