"""
Email service using smtplib via asyncio.to_thread (IPv4-safe, non-blocking).
"""
import asyncio
import logging
import smtplib
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from typing import Optional, Dict, Any, List

from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.core.config import settings

logger = logging.getLogger(__name__)


# Setup Jinja2 environment
TEMPLATES_DIR = Path(__file__).parent.parent / "templates" / "emails"
jinja_env = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    autoescape=select_autoescape(['html', 'xml'])
)


class EmailService:
    """Async email service using smtplib via asyncio.to_thread."""

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

        logger.info(f"[EMAIL] Attempting send to={to_email} subject='{subject}'")

        def _send() -> None:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
            msg["To"] = to_email
            msg.attach(MIMEText(html_content, "html"))

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.ehlo()
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_FROM_EMAIL, [to_email], msg.as_string())

        try:
            await asyncio.to_thread(_send)
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
