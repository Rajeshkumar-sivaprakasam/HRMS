from app.config import settings
from app.core.tasks.registry import (
    generate_payslip_pdf_task,
    send_activation_email_task,
    send_announcement_notification_task,
    send_leave_notification_task,
    send_payslip_notification_task,
    send_permission_notification_task,
    send_regularisation_notification_task,
    send_salary_revision_notification_task,
    send_ticket_update_notification_task,
)


class WorkerSettings:
    redis_settings = settings.REDIS_URL
    functions = [
        send_activation_email_task,
        send_leave_notification_task,
        send_permission_notification_task,
        send_regularisation_notification_task,
        generate_payslip_pdf_task,
        send_payslip_notification_task,
        send_salary_revision_notification_task,
        send_announcement_notification_task,
        send_ticket_update_notification_task,
    ]
    max_jobs = 10
    job_timeout = 300
    retry_jobs = True
    max_tries = 3
