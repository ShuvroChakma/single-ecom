"""
Email service with Jinja2 template engine.
"""
import smtplib
from datetime import datetime, timezone
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from typing import Optional, Dict, Any, List

from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.core.config import settings


# Setup Jinja2 environment
TEMPLATES_DIR = Path(__file__).parent.parent / "templates" / "emails"
jinja_env = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    autoescape=select_autoescape(['html', 'xml'])
)


class EmailService:
    """Service for sending emails via SMTP with Jinja2 templates."""
    
    @staticmethod
    def render_template(template_name: str, context: Dict[str, Any]) -> str:
        """
        Render an email template with context.
        
        Args:
            template_name: Name of the template file (e.g., 'otp.html')
            context: Dictionary of variables to pass to the template
            
        Returns:
            Rendered HTML string
        """
        template = jinja_env.get_template(template_name)
        return template.render(**context)
    
    @staticmethod
    async def send_email(
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """
        Send an email.
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML email content
            text_content: Plain text fallback (optional)
            
        Returns:
            True if email sent successfully, False otherwise
        """
        # If email is disabled, just log to console
        if not settings.EMAIL_ENABLED:
            print(f"\n{'='*60}")
            print(f"📧 EMAIL (Console Mode - EMAIL_ENABLED=False)")
            print(f"{'='*60}")
            print(f"To: {to_email}")
            print(f"Subject: {subject}")
            print(f"\n{text_content or 'See HTML content above'}")
            print(f"{'='*60}\n")
            return True
        
        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
            message["To"] = to_email
            
            # Add text and HTML parts
            if text_content:
                message.attach(MIMEText(text_content, "plain"))
            message.attach(MIMEText(html_content, "html"))
            
            # Send email
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(message)
            
            return True
            
        except Exception as e:
            print(f"❌ Failed to send email to {to_email}: {str(e)}")
            return False
    
    @staticmethod
    async def send_otp_email(email: str, otp: str, purpose: str = "email verification") -> bool:
        """
        Send OTP email for verification using Jinja2 template.
        
        Args:
            email: Recipient email
            otp: 6-digit OTP code
            purpose: Purpose of OTP (e.g., "email verification", "password reset")
            
        Returns:
            True if sent successfully
        """
        subject = f"Your {purpose.title()} Code"
        
        # Render HTML template
        html_content = EmailService.render_template('otp.html', {
            'otp': otp,
            'purpose': purpose,
            'app_name': settings.PROJECT_NAME
        })
        
        # Plain text fallback
        text_content = f"""
Verification Code for {purpose.title()}

Your verification code is: {otp}

This code is valid for 10 minutes.

If you didn't request this code, please ignore this email.

© 2024 {settings.PROJECT_NAME}
        """.strip()
        
        return await EmailService.send_email(email, subject, html_content, text_content)

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
        """Send order confirmation email after successful order creation."""
        subject = f"Order Confirmed – {order_number}"

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

        text_content = (
            f"Order Confirmed – {order_number}\n\n"
            f"Hi {customer_name},\n\n"
            f"Thank you for your order! Your order {order_number} has been received.\n\n"
            f"Total: ৳{total}\n"
            f"Payment: {payment_method}\n"
            f"Shipping to: {shipping_address}\n\n"
            f"View your order: {settings.FRONTEND_URL}/orders/{order_id}\n\n"
            f"© {datetime.now(timezone.utc).year} {settings.PROJECT_NAME}"
        )

        return await EmailService.send_email(email, subject, html_content, text_content)

    @staticmethod
    async def send_inquiry_acknowledgement_email(
        email: str,
        customer_name: str,
        metal_type: str,
        message: Optional[str] = None,
        budget_range: Optional[str] = None,
    ) -> bool:
        """Send acknowledgement email after a custom jewellery inquiry is submitted."""
        subject = f"We've Received Your Custom Jewellery Request – {settings.PROJECT_NAME}"

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

        text_content = (
            f"Hi {customer_name},\n\n"
            f"Thank you for your custom jewellery request!\n\n"
            f"Metal Type: {metal_type}\n"
            + (f"Budget Range: {budget_range}\n" if budget_range else "")
            + f"\nOur team will get back to you within 1–2 business days.\n\n"
            f"© {datetime.now(timezone.utc).year} {settings.PROJECT_NAME}"
        )

        return await EmailService.send_email(email, subject, html_content, text_content)

    @staticmethod
    async def send_password_reset_email(email: str, otp: str) -> bool:
        """
        Send password reset email with OTP.
        
        Args:
            email: Recipient email
            otp: 6-digit OTP code
            
        Returns:
            True if sent successfully
        """
        return await EmailService.send_otp_email(email, otp, "password reset")
    
    @staticmethod
    async def send_welcome_email(email: str, name: str) -> bool:
        """
        Send welcome email after successful registration using Jinja2 template.
        
        Args:
            email: Recipient email
            name: User's name
            
        Returns:
            True if sent successfully
        """
        subject = f"Welcome to {settings.PROJECT_NAME}!"
        
        # Render HTML template
        html_content = EmailService.render_template('welcome.html', {
            'name': name,
            'app_name': settings.PROJECT_NAME,
            'frontend_url': settings.FRONTEND_URL
        })
        
        # Plain text fallback
        text_content = f"""
Welcome to {settings.PROJECT_NAME}!

Hi {name},

Your account has been successfully verified and is ready to use.

Get started: {settings.FRONTEND_URL}/login

© 2024 {settings.PROJECT_NAME}
        """.strip()
        
        return await EmailService.send_email(email, subject, html_content, text_content)
