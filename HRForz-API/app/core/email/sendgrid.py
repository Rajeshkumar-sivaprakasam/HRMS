import structlog
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

from app.config import settings
from app.core.email.base import EmailClient

log = structlog.get_logger()


class SendGridEmailClient(EmailClient):
    def __init__(self) -> None:
        self._client = SendGridAPIClient(api_key=settings.SENDGRID_API_KEY)

    async def send(
        self,
        to_email: str,
        subject: str,
        html_content: str,
    ) -> None:
        message = Mail(
            from_email=(settings.EMAIL_FROM, settings.EMAIL_FROM_NAME),
            to_emails=to_email,
            subject=subject,
            html_content=html_content,
        )
        try:
            self._client.send(message)
            log.info("email_sent", to=to_email, subject=subject)
        except Exception as exc:
            log.error("email_send_failed", to=to_email, error=str(exc))
            raise


email_client: SendGridEmailClient = SendGridEmailClient()
