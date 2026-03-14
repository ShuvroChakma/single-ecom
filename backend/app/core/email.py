"""
Email service using fastapi-mail (async SMTP via aiosmtplib).
"""
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Dict, Any, List

from fastapi_mail import FastMail, MessageSchema, MessageType, ConnectionConfig
from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.core.config import settings

logger = logging.getLogger(__name__)


# Setup Jinja2 environment
TEMPLATES_DIR = Path(__file__).parent.parent / "templates" / "emails"
jinja_env = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    autoescape=select_autoescape(['html', 'xml'])
)

# fastapi-mail connection config
_mail_config = ConnectionConfig(
    MAIL_USERNAME=settings.SMTP_USER,
    MAIL_PASSWORD=settings.SMTP_PASSWORD,
    MAIL_FROM=settings.SMTP_FROM_EMAIL,
    MAIL_FROM_NAME=settings.SMTP_FROM_NAME,
    MAIL_PORT=settings.SMTP_PORT,
    MAIL_SERVER=settings.SMTP_HOST,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
    SUPPRESS_SEND=not settings.EMAIL_ENABLED,  # console-only when disabled
)

_fm = FastMail(_mail_config)


class EmailService:
    """Async email service backed by fastapi-mail / aiosmtplib."""

    @staticmethod
    def render_template(template_name: str, context: Dict[str, Any]) -> str:
        template = jinja_env.get_template(template_name)
        return template.render(**context)

    @staticmethod
    async def send_email(
        to_email: str,
        subject: str,
        html_content: str,
    ) -> bool:
        if not settings.EMAIL_ENABLED:
            logger.info(f"[EMAIL DISABLED] To: {to_email} | Subject: {subject}")
            return True

        logger.info(f"[EMAIL] Attempting to send to={to_email} subject='{subject}' host={settings.SMTP_HOST}:{settings.SMTP_PORT} user={settings.SMTP_USER} from={settings.SMTP_FROM_EMAIL}")
        try:
            message = MessageSchema(
                subject=subject,
                recipients=[to_email],
                body=html_content,
                subtype=MessageType.html,
            )
            await _fm.send_message(message)
            logger.info(f"[EMAIL] Successfully sent to={to_email}")
            return True
        except Exception as e:
            logger.error(f"[EMAIL] Failed to send to={to_email}: {type(e).__name__}: {e}", exc_info=True)
            return False

    @staticmethod
    async def send_otp_email(email: str, otp: str, purpose: str = "email verification") -> bool:
        subject = f"Your {purpose.title()} Code"
        html_content = EmailService.render_template('otp.html', {
            'otp': otp,
            'purpose': purpose,
            'app_name': settings.PROJECT_NAME,
        })
        return await EmailService.send_email(email, subject, html_content)

    @staticmethod
    async def send_order_confirmation_email(
        email: str,
        customer_name: str,
        order_number: str,
        order_id: str,
        items: List[Dict[str, Any]],
        delivery_charge: str,
        total: str,
        payment_method: str,
        shipping_address: str,
        discount_amount: Optional[str] = None,
    ) -> bool:
        subject = f"Order Confirmed \u2013 {order_number}"
        html_content = EmailService.render_template('order_confirmation.html', {
            'customer_name': customer_name,
            'order_number': order_number,
            'order_id': order_id,
            'items': items,
            'discount_amount': discount_amount,
            'delivery_charge': delivery_charge,
            'total': total,
            'payment_method': payment_method,
            'shipping_address': shipping_address,
            'frontend_url': settings.FRONTEND_URL,
            'app_name': settings.PROJECT_NAME,
            'contact_email': settings.SMTP_FROM_EMAIL,
            'year': datetime.now(timezone.utc).year,
        })
        return await EmailService.send_email(email, subject, html_content)

    @staticmethod
    async def send_inquiry_acknowledgement_email(
        email: str,
        customer_name: str,
        metal_type: str,
        message: Optional[str] = None,
        budget_range: Optional[str] = None,
    ) -> bool:
        subject = f"We\u2019ve Received Your Custom Jewellery Request \u2013 {settings.PROJECT_NAME}"
        html_content = EmailService.render_template('inquiry_acknowledgement.html', {
            'customer_name': customer_name,
            'customer_email': email,
            'metal_type': metal_type,
            'budget_range': budget_range,
            'message': message,
            'app_name': settings.PROJECT_NAME,
            'contact_email': settings.SMTP_FROM_EMAIL,
            'year': datetime.now(timezone.utc).year,
        })
        return await EmailService.send_email(email, subject, html_content)

    @staticmethod
    async def send_password_reset_email(email: str, otp: str) -> bool:
        return await EmailService.send_otp_email(email, otp, "password reset")

    @staticmethod
    async def send_welcome_email(email: str, name: str) -> bool:
        subject = f"Welcome to {settings.PROJECT_NAME}!"
        html_content = EmailService.render_template('welcome.html', {
            'name': name,
            'app_name': settings.PROJECT_NAME,
            'frontend_url': settings.FRONTEND_URL,
        })
        return await EmailService.send_email(email, subject, html_content)
