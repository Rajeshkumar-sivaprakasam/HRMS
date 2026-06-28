from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.core.exceptions.handlers import register_exception_handlers
from app.core.logging.setup import configure_logging
from app.core.middleware.rate_limit import RateLimitMiddleware
from app.core.middleware.request_id import RequestIDMiddleware
from app.core.middleware.timing import TimingMiddleware
from app.core.observability.metrics import instrument_app
from app.core.observability.tracing import configure_tracing

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    configure_tracing()
    logger.info("hrms_api_started")
    yield
    logger.info("hrms_api_stopped")


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="HRForz API",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # Middleware (outermost first)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(RateLimitMiddleware)
    app.add_middleware(TimingMiddleware)
    app.add_middleware(RequestIDMiddleware)

    register_exception_handlers(app)
    instrument_app(app)

    # Routers
    from app.modules.auth.router import router as auth_router
    from app.modules.employees.router import router as employees_router
    from app.modules.departments.router import router as departments_router
    from app.modules.designations.router import router as designations_router
    from app.modules.work_locations.router import router as work_locations_router
    from app.modules.attendance.router import router as attendance_router
    from app.modules.leaves.router import router as leaves_router
    from app.modules.permissions.router import router as permissions_router
    from app.modules.holidays.router import router as holidays_router
    from app.modules.organisation.router import router as organisation_router
    from app.modules.payroll.structures.router import router as payroll_structures_router
    from app.modules.payroll.salary.router import router as payroll_salary_router
    from app.modules.payroll.runs.router import router as payroll_runs_router
    from app.modules.payroll.payslips.router import router as payslips_router
    from app.modules.payroll.employee.router import router as payroll_employee_router
    from app.modules.payroll.revisions.router import router as revisions_router
    from app.modules.payroll.tds.router import router as tds_router
    from app.modules.payroll.fnf.router import router as fnf_router
    from app.modules.payroll.reports.router import router as payroll_reports_router
    from app.modules.dashboard.employee.router import router as emp_dashboard_router
    from app.modules.dashboard.hr.router import router as hr_dashboard_router
    from app.modules.helpdesk.router import router as helpdesk_router
    from app.modules.announcements.router import router as announcements_router
    from app.modules.notifications.router import router as notifications_router
    from app.modules.dropdowns.router import router as dropdowns_router
    from app.modules.company_settings.router import all_routers as company_settings_routers
    from app.modules.setup.router import router as setup_router
    from app.modules.audit.router import router as audit_router
    from app.modules.onboarding.router import router as onboarding_router
    from app.modules.lookup.router import dropdown_router, account_type_router, leave_plan_router
    from app.modules.approvals.router import router as approvals_router
    from app.modules.countries.router import router as countries_router

    prefix = "/v1"

    app.include_router(auth_router, prefix=prefix)
    app.include_router(employees_router, prefix=prefix)
    app.include_router(departments_router, prefix=prefix)
    app.include_router(designations_router, prefix=prefix)
    app.include_router(work_locations_router, prefix=prefix)
    app.include_router(attendance_router, prefix=prefix)
    app.include_router(leaves_router, prefix=prefix)
    app.include_router(permissions_router, prefix=prefix)
    app.include_router(holidays_router, prefix=prefix)
    app.include_router(organisation_router, prefix=prefix)
    app.include_router(payroll_structures_router, prefix=prefix)
    app.include_router(payroll_salary_router, prefix=prefix)
    app.include_router(payroll_runs_router, prefix=prefix)
    app.include_router(payslips_router, prefix=prefix)
    app.include_router(payroll_employee_router, prefix=prefix)
    app.include_router(revisions_router, prefix=prefix)
    app.include_router(tds_router, prefix=prefix)
    app.include_router(fnf_router, prefix=prefix)
    app.include_router(payroll_reports_router, prefix=prefix)
    app.include_router(emp_dashboard_router, prefix=prefix)
    app.include_router(hr_dashboard_router, prefix=prefix)
    app.include_router(helpdesk_router, prefix=prefix)
    app.include_router(announcements_router, prefix=prefix)
    app.include_router(notifications_router, prefix=prefix)
    app.include_router(dropdowns_router, prefix=prefix)
    app.include_router(countries_router, prefix=prefix)
    app.include_router(dropdown_router, prefix=prefix)
    app.include_router(account_type_router, prefix=prefix)
    app.include_router(leave_plan_router, prefix=prefix)
    app.include_router(approvals_router, prefix=prefix)
    for cs_router in company_settings_routers:
        app.include_router(cs_router, prefix=prefix)
    app.include_router(setup_router, prefix=prefix)
    app.include_router(audit_router, prefix=prefix)
    app.include_router(onboarding_router, prefix=prefix)

    @app.get("/health", tags=["health"])
    async def health_check():
        return {"status": "ok", "version": "1.0.0"}

    return app


app = create_app()
