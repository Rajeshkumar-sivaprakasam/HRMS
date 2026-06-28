"""
All background task functions are defined here.
Each function must be idempotent.
"""

import structlog

log = structlog.get_logger()


async def send_activation_email_task(ctx: dict, employee_id: str, token: str) -> None:
    """Send account activation email to a new employee."""
    log.info("task.send_activation_email", employee_id=employee_id)
    # Import here to avoid circular imports
    from app.core.email.sendgrid import email_client

    # TODO: build HTML from Jinja2 template
    subject = "Welcome to HRForz — Set Up Your Password"
    html = f"<p>Click the link to activate your account. Token: {token}</p>"
    # In production, fetch employee email from DB
    log.info("task.activation_email_sent", employee_id=employee_id)


async def send_leave_notification_task(
    ctx: dict,
    leave_id: str,
    notification_type: str,
) -> None:
    """Notify relevant parties about a leave status change."""
    log.info("task.leave_notification", leave_id=leave_id, type=notification_type)


async def send_permission_notification_task(
    ctx: dict,
    permission_id: str,
    notification_type: str,
) -> None:
    log.info("task.permission_notification", permission_id=permission_id, type=notification_type)


async def send_regularisation_notification_task(
    ctx: dict,
    request_id: str,
    notification_type: str,
) -> None:
    log.info("task.regularisation_notification", request_id=request_id, type=notification_type)


async def generate_payslip_pdf_task(
    ctx: dict,
    payroll_run_id: str,
    employee_id: str,
) -> None:
    log.info("task.generate_payslip", run_id=payroll_run_id, employee_id=employee_id)


async def send_payslip_notification_task(ctx: dict, run_id: str) -> None:
    log.info("task.payslip_notification", run_id=run_id)


async def send_salary_revision_notification_task(
    ctx: dict, employee_id: str, revision_id: str
) -> None:
    log.info("task.salary_revision_notification", employee_id=employee_id)


async def send_announcement_notification_task(
    ctx: dict, announcement_id: str
) -> None:
    log.info("task.announcement_notification", announcement_id=announcement_id)


async def send_ticket_update_notification_task(
    ctx: dict, ticket_id: str
) -> None:
    log.info("task.ticket_update_notification", ticket_id=ticket_id)
