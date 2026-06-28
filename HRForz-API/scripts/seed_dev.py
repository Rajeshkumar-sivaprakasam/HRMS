#!/usr/bin/env python3
"""Comprehensive development seed script.

Usage:
    python scripts/seed_dev.py           # seed if empty
    python scripts/seed_dev.py --force   # truncate and reseed
"""
import asyncio
import json
import os
import random
import sys
from datetime import date, datetime, time, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

random.seed(42)


def _working_days(start: date, end: date) -> list[date]:
    days, d = [], start
    while d <= end:
        if d.weekday() < 5:
            days.append(d)
        d += timedelta(days=1)
    return days


async def main() -> None:
    db_url = os.environ.get(
        "DATABASE_URL", "postgresql://hrms_user:hrms_pass@localhost:5433/hrms_db"
    )
    import ssl as _ssl
    connect_args = {}
    if "sslmode=require" in db_url:
        db_url = db_url.replace("?sslmode=require", "").replace("&sslmode=require", "")
        ssl_ctx = _ssl.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = _ssl.CERT_NONE
        connect_args["ssl"] = ssl_ctx
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
    from sqlalchemy import select, text

    engine = create_async_engine(db_url, echo=False, connect_args=connect_args)
    Session = async_sessionmaker(engine, expire_on_commit=False)

    async with Session() as db:
        from app.models.organisation import Organisation

        existing = (await db.execute(select(Organisation))).scalars().first()
        if existing and "--force" not in sys.argv:
            print("Already seeded. Use --force to truncate and reseed.")
            return

        if "--force" in sys.argv:
            print("Force mode: truncating all tables...")
            for tbl in [
                "notifications", "announcements",
                "helpdesk_comments", "helpdesk_tickets", "helpdesk_categories",
                "payroll_adjustments", "fnf_settlements", "tds_declarations",
                "salary_revisions", "payslips", "payroll_runs",
                "employee_salaries", "salary_structure_components",
                "salary_structures", "salary_components",
                "permission_requests", "permission_policies",
                "attendance_regularisations", "attendance_records",
                "employee_shift_assignments", "shift_schedules",
                "leave_requests", "leave_balances", "leave_policies",
                "employee_documents", "users", "employees",
                "designations", "departments", "work_locations",
                "holidays", "audit_logs", "organisations",
            ]:
                await db.execute(text(f"TRUNCATE TABLE {tbl} CASCADE"))
            await db.commit()

        print("Seeding data...\n")

        # -- 1. ORGANISATION --------------------------------------------------
        from app.models.organisation import Organisation

        org = Organisation(
            name="HRForz Technologies",
            legal_name="HRForz Technologies Pvt Ltd",
            gstin="33AABCH1234F1ZX",
            pan="AABCH1234F",
            pf_registration_number="TN/CHN/12345/ENF/EMP/0001",
            esi_registration_number="31000000000001",
            website="https://hrforz.com",
            email="hr@hrforz.com",
            phone="+91-44-12345678",
            address_line1="5th Floor, Prestige Tower",
            address_line2="Anna Salai",
            city="Chennai",
            state="Tamil Nadu",
            pincode="600002",
            country="India",
            financial_year_start_month=4,
            payroll_cycle_day=28,
            is_pf_applicable=True,
            is_esi_applicable=True,
            is_professional_tax_applicable=True,
        )
        db.add(org)
        await db.flush()
        print(f"  [ok] Organisation : {org.name}")

        # -- 2. WORK LOCATIONS ------------------------------------------------
        from app.models.department import WorkLocation

        loc_hq = WorkLocation(
            name="HQ - Chennai", code="CHN",
            address="5th Floor, Prestige Tower, Anna Salai",
            city="Chennai", state="Tamil Nadu",
        )
        loc_blr = WorkLocation(
            name="Bengaluru Office", code="BLR",
            address="WeWork Embassy, Outer Ring Road",
            city="Bengaluru", state="Karnataka",
        )
        loc_remote = WorkLocation(
            name="Remote", code="REMOTE",
            city="Various", state="Various",
        )
        db.add_all([loc_hq, loc_blr, loc_remote])
        await db.flush()
        print("  [ok] Work Locations: 3")

        # -- 3. DEPARTMENTS (heads assigned after employees) ------------------
        from app.models.department import Department

        dept_eng   = Department(name="Engineering",     code="ENG",   description="Product & Platform Engineering")
        dept_hr    = Department(name="Human Resources", code="HR",    description="People Operations")
        dept_fin   = Department(name="Finance",         code="FIN",   description="Finance & Accounts")
        dept_sales = Department(name="Sales",           code="SALES", description="Sales & Business Development")
        dept_ops   = Department(name="Operations",      code="OPS",   description="Business Operations")
        db.add_all([dept_eng, dept_hr, dept_fin, dept_sales, dept_ops])
        await db.flush()
        print("  [ok] Departments   : 5")

        # -- 4. DESIGNATIONS --------------------------------------------------
        from app.models.department import Designation

        desig_swe  = Designation(name="Software Engineer",  code="SWE",  level=2, department_id=dept_eng.id)
        desig_sre  = Designation(name="Senior Engineer",    code="SRE",  level=3, department_id=dept_eng.id)
        desig_tl   = Designation(name="Tech Lead",          code="TL",   level=4, department_id=dept_eng.id)
        desig_hre  = Designation(name="HR Executive",       code="HRE",  level=2, department_id=dept_hr.id)
        desig_hrm  = Designation(name="HR Manager",         code="HRM",  level=3, department_id=dept_hr.id)
        desig_ace  = Designation(name="Accounts Executive", code="ACE",  level=2, department_id=dept_fin.id)
        desig_finm = Designation(name="Finance Manager",    code="FINM", level=3, department_id=dept_fin.id)
        desig_se   = Designation(name="Sales Executive",    code="SE",   level=2, department_id=dept_sales.id)
        desig_sm   = Designation(name="Sales Manager",      code="SM",   level=3, department_id=dept_sales.id)
        desig_opsm = Designation(name="Operations Manager", code="OPSM", level=3, department_id=dept_ops.id)
        db.add_all([
            desig_swe, desig_sre, desig_tl,
            desig_hre, desig_hrm,
            desig_ace, desig_finm,
            desig_se, desig_sm,
            desig_opsm,
        ])
        await db.flush()
        print("  [ok] Designations  : 10")

        # -- 5. EMPLOYEES -----------------------------------------------------
        from app.models.employee import Employee
        from app.shared.enums.employee import (
            AccountType, EmployeeStatus, EmploymentType, Gender, WorkLocationType,
        )

        today = date.today()

        # Managers first (no reporting_manager_id yet)
        emp_priya = Employee(
            employee_code="EMP001", first_name="Priya", last_name="Sharma",
            email="priya.sharma@hrforz.com", phone="+91-9876543201",
            gender=Gender.FEMALE.value, date_of_birth=date(1990, 3, 15),
            status=EmployeeStatus.ACTIVE.value, employment_type=EmploymentType.FULL_TIME.value,
            work_location_type=WorkLocationType.OFFICE.value,
            date_of_joining=date(2021, 1, 10), probation_end_date=date(2021, 4, 10), notice_period_days=60,
            department_id=dept_eng.id, designation_id=desig_tl.id, work_location_id=loc_hq.id,
            address_line1="12, Gandhi Nagar", city="Chennai", state="Tamil Nadu", pincode="600020",
            bank_name="HDFC Bank", account_number="50100012345678", ifsc_code="HDFC0001234",
            account_type=AccountType.SAVINGS.value,
            pan_number="ABCPS1234A", aadhar_number="123456789012", uan_number="100987654321",
            emergency_contact_name="Rahul Sharma", emergency_contact_phone="+91-9876500001",
            emergency_contact_relation="Spouse", current_ctc=1800000,
        )
        emp_kavita = Employee(
            employee_code="EMP002", first_name="Kavita", last_name="Rao",
            email="kavita.rao@hrforz.com", phone="+91-9876543202",
            gender=Gender.FEMALE.value, date_of_birth=date(1988, 7, 22),
            status=EmployeeStatus.ACTIVE.value, employment_type=EmploymentType.FULL_TIME.value,
            work_location_type=WorkLocationType.OFFICE.value,
            date_of_joining=date(2020, 6, 1), probation_end_date=date(2020, 9, 1), notice_period_days=60,
            department_id=dept_hr.id, designation_id=desig_hrm.id, work_location_id=loc_hq.id,
            address_line1="45, Nungambakkam High Road", city="Chennai", state="Tamil Nadu", pincode="600034",
            bank_name="SBI", account_number="32456789012", ifsc_code="SBIN0001234",
            account_type=AccountType.SAVINGS.value,
            pan_number="ABCPR5678B", aadhar_number="234567890123", uan_number="100987654322",
            emergency_contact_name="Ravi Rao", emergency_contact_phone="+91-9876500002",
            emergency_contact_relation="Spouse", current_ctc=1000000,
        )
        emp_anil = Employee(
            employee_code="EMP003", first_name="Anil", last_name="Gupta",
            email="anil.gupta@hrforz.com", phone="+91-9876543203",
            gender=Gender.MALE.value, date_of_birth=date(1985, 11, 30),
            status=EmployeeStatus.ACTIVE.value, employment_type=EmploymentType.FULL_TIME.value,
            work_location_type=WorkLocationType.OFFICE.value,
            date_of_joining=date(2019, 3, 1), probation_end_date=date(2019, 6, 1), notice_period_days=90,
            department_id=dept_fin.id, designation_id=desig_finm.id, work_location_id=loc_hq.id,
            address_line1="78, T. Nagar", city="Chennai", state="Tamil Nadu", pincode="600017",
            bank_name="ICICI Bank", account_number="123456789012", ifsc_code="ICIC0001234",
            account_type=AccountType.SAVINGS.value,
            pan_number="ABCAG9012C", aadhar_number="345678901234", uan_number="100987654323",
            emergency_contact_name="Sunita Gupta", emergency_contact_phone="+91-9876500003",
            emergency_contact_relation="Spouse", current_ctc=1200000,
        )
        emp_deepa = Employee(
            employee_code="EMP004", first_name="Deepa", last_name="Nair",
            email="deepa.nair@hrforz.com", phone="+91-9876543204",
            gender=Gender.FEMALE.value, date_of_birth=date(1992, 5, 18),
            status=EmployeeStatus.ACTIVE.value, employment_type=EmploymentType.FULL_TIME.value,
            work_location_type=WorkLocationType.HYBRID.value,
            date_of_joining=date(2021, 8, 15), probation_end_date=date(2021, 11, 15), notice_period_days=60,
            department_id=dept_sales.id, designation_id=desig_sm.id, work_location_id=loc_blr.id,
            address_line1="23, Koramangala 5th Block", city="Bengaluru", state="Karnataka", pincode="560095",
            bank_name="Axis Bank", account_number="456789012345", ifsc_code="UTIB0001234",
            account_type=AccountType.SAVINGS.value,
            pan_number="ABCDN3456D", aadhar_number="456789012345", uan_number="100987654324",
            emergency_contact_name="Suresh Nair", emergency_contact_phone="+91-9876500004",
            emergency_contact_relation="Brother", current_ctc=1200000,
        )
        db.add_all([emp_priya, emp_kavita, emp_anil, emp_deepa])
        await db.flush()

        # Individual contributors (with reporting_manager_id)
        emp_arjun = Employee(
            employee_code="EMP005", first_name="Arjun", last_name="Mehta",
            email="arjun.mehta@hrforz.com", phone="+91-9876543205",
            gender=Gender.MALE.value, date_of_birth=date(1997, 2, 28),
            status=EmployeeStatus.ACTIVE.value, employment_type=EmploymentType.FULL_TIME.value,
            work_location_type=WorkLocationType.OFFICE.value,
            date_of_joining=date(2022, 7, 1), probation_end_date=date(2022, 10, 1), notice_period_days=30,
            department_id=dept_eng.id, designation_id=desig_swe.id, work_location_id=loc_hq.id,
            reporting_manager_id=emp_priya.id,
            address_line1="9, Adyar", city="Chennai", state="Tamil Nadu", pincode="600020",
            bank_name="HDFC Bank", account_number="50100087654321", ifsc_code="HDFC0001234",
            account_type=AccountType.SAVINGS.value,
            pan_number="ABCAM5678E", aadhar_number="567890123456", uan_number="100987654325",
            emergency_contact_name="Sita Mehta", emergency_contact_phone="+91-9876500005",
            emergency_contact_relation="Mother", current_ctc=800000,
        )
        emp_sneha = Employee(
            employee_code="EMP006", first_name="Sneha", last_name="Patel",
            email="sneha.patel@hrforz.com", phone="+91-9876543206",
            gender=Gender.FEMALE.value, date_of_birth=date(1998, 9, 5),
            status=EmployeeStatus.ACTIVE.value, employment_type=EmploymentType.FULL_TIME.value,
            work_location_type=WorkLocationType.WFH.value,
            date_of_joining=date(2023, 1, 16), probation_end_date=date(2023, 4, 16), notice_period_days=30,
            department_id=dept_eng.id, designation_id=desig_sre.id, work_location_id=loc_remote.id,
            reporting_manager_id=emp_priya.id,
            address_line1="34, Velachery", city="Chennai", state="Tamil Nadu", pincode="600042",
            bank_name="Kotak Mahindra Bank", account_number="9876543210", ifsc_code="KKBK0001234",
            account_type=AccountType.SALARY.value,
            pan_number="ABCSP9012F", aadhar_number="678901234567", uan_number="100987654326",
            emergency_contact_name="Ramesh Patel", emergency_contact_phone="+91-9876500006",
            emergency_contact_relation="Father", current_ctc=900000,
        )
        emp_rajesh = Employee(
            employee_code="EMP007", first_name="Rajesh", last_name="Kumar",
            email="rajesh.kumar@hrforz.com", phone="+91-9876543207",
            gender=Gender.MALE.value, date_of_birth=date(1996, 12, 10),
            status=EmployeeStatus.ACTIVE.value, employment_type=EmploymentType.FULL_TIME.value,
            work_location_type=WorkLocationType.OFFICE.value,
            date_of_joining=date(2023, 3, 1), probation_end_date=date(2023, 6, 1), notice_period_days=30,
            department_id=dept_hr.id, designation_id=desig_hre.id, work_location_id=loc_hq.id,
            reporting_manager_id=emp_kavita.id,
            address_line1="56, Mylapore", city="Chennai", state="Tamil Nadu", pincode="600004",
            bank_name="SBI", account_number="12345678901", ifsc_code="SBIN0001234",
            account_type=AccountType.SAVINGS.value,
            pan_number="ABCRK3456G", aadhar_number="789012345678", uan_number="100987654327",
            emergency_contact_name="Priya Kumar", emergency_contact_phone="+91-9876500007",
            emergency_contact_relation="Spouse", current_ctc=500000,
        )
        emp_vikram = Employee(
            employee_code="EMP008", first_name="Vikram", last_name="Singh",
            email="vikram.singh@hrforz.com", phone="+91-9876543208",
            gender=Gender.MALE.value, date_of_birth=date(1995, 4, 20),
            status=EmployeeStatus.ACTIVE.value, employment_type=EmploymentType.FULL_TIME.value,
            work_location_type=WorkLocationType.HYBRID.value,
            date_of_joining=date(2022, 11, 1), probation_end_date=date(2023, 2, 1), notice_period_days=30,
            department_id=dept_sales.id, designation_id=desig_se.id, work_location_id=loc_blr.id,
            reporting_manager_id=emp_deepa.id,
            address_line1="12, Indiranagar", city="Bengaluru", state="Karnataka", pincode="560038",
            bank_name="Yes Bank", account_number="1234567890123456", ifsc_code="YESB0001234",
            account_type=AccountType.CURRENT.value,
            pan_number="ABCVS7890H", aadhar_number="890123456789", uan_number="100987654328",
            emergency_contact_name="Anita Singh", emergency_contact_phone="+91-9876500008",
            emergency_contact_relation="Spouse", current_ctc=600000,
        )
        db.add_all([emp_arjun, emp_sneha, emp_rajesh, emp_vikram])
        await db.flush()

        all_emps = [emp_priya, emp_kavita, emp_anil, emp_deepa, emp_arjun, emp_sneha, emp_rajesh, emp_vikram]
        print(f"  [ok] Employees     : {len(all_emps)}")

        # -- 6. ASSIGN DEPARTMENT HEADS ---------------------------------------
        dept_eng.head_employee_id   = emp_priya.id
        dept_hr.head_employee_id    = emp_kavita.id
        dept_fin.head_employee_id   = emp_anil.id
        dept_sales.head_employee_id = emp_deepa.id
        await db.flush()
        print("  [ok] Dept heads    : assigned")

        # -- 7. USERS ---------------------------------------------------------
        from app.models.user import User
        from app.shared.enums.auth import Role
        from app.core.security.password import hash_password

        pwd = hash_password("Employee@1234")
        user_map = [
            (emp_priya,  Role.MANAGER.value),
            (emp_kavita, Role.HR_ADMIN.value),
            (emp_anil,   Role.FINANCE_ADMIN.value),
            (emp_deepa,  Role.MANAGER.value),
            (emp_arjun,  Role.EMPLOYEE.value),
            (emp_sneha,  Role.EMPLOYEE.value),
            (emp_rajesh, Role.EMPLOYEE.value),
            (emp_vikram, Role.EMPLOYEE.value),
        ]
        for emp, role in user_map:
            db.add(User(
                email=emp.email, hashed_password=pwd, role=role,
                is_active=True, is_email_verified=True, employee_id=emp.id,
            ))
        await db.flush()
        print(f"  [ok] Users         : {len(user_map)}")

        # -- 8. SHIFT SCHEDULES + ASSIGNMENTS ---------------------------------
        from app.models.attendance import ShiftSchedule, EmployeeShiftAssignment

        shift_gen   = ShiftSchedule(name="General Shift", start_time=time(9, 0),  end_time=time(18, 0), grace_minutes=15, is_default=True)
        shift_early = ShiftSchedule(name="Early Shift",   start_time=time(8, 0),  end_time=time(17, 0), grace_minutes=10, is_default=False)
        db.add_all([shift_gen, shift_early])
        await db.flush()

        for emp in all_emps:
            db.add(EmployeeShiftAssignment(
                employee_id=emp.id, shift_id=shift_gen.id,
                effective_from=emp.date_of_joining,
            ))
        await db.flush()
        print("  [ok] Shifts        : 2 schedules, 8 assignments")

        # -- 9. LEAVE POLICIES + BALANCES -------------------------------------
        from app.models.leave import LeavePolicy, LeaveBalance, LeaveRequest
        from app.shared.enums.leave import LeaveType, LeaveDurationType, LeaveStatus

        policies = [
            LeavePolicy(leave_type=LeaveType.CL.value,  annual_quota=12, carry_forward_limit=5,  is_paid=True,  requires_approval=True, min_days_notice=1),
            LeavePolicy(leave_type=LeaveType.SL.value,  annual_quota=6,  carry_forward_limit=0,  is_paid=True,  requires_approval=True, min_days_notice=0),
            LeavePolicy(leave_type=LeaveType.LOP.value, annual_quota=0,  carry_forward_limit=0,  is_paid=False, requires_approval=True, min_days_notice=0),
            LeavePolicy(leave_type=LeaveType.WFH.value, annual_quota=24, carry_forward_limit=0,  is_paid=True,  requires_approval=True, min_days_notice=1),
        ]
        db.add_all(policies)
        await db.flush()

        quota_map = {LeaveType.CL.value: 12, LeaveType.SL.value: 6, LeaveType.WFH.value: 24}
        taken_map = {LeaveType.CL.value: 2,  LeaveType.SL.value: 1, LeaveType.WFH.value: 4}
        for emp in all_emps:
            for lt_val, quota in quota_map.items():
                db.add(LeaveBalance(
                    employee_id=emp.id, leave_type=lt_val, year=today.year,
                    entitled=quota, taken=taken_map[lt_val], carried_forward=0,
                ))
        await db.flush()
        print(f"  [ok] Leave         : 4 policies, {len(all_emps) * 3} balances")

        # -- 10. HOLIDAYS -----------------------------------------------------
        from app.models.holiday import Holiday
        from app.shared.enums.holiday import HolidayType

        y = today.year
        holidays = [
            Holiday(name="New Year's Day",       holiday_date=date(y, 1,  1),  holiday_type=HolidayType.NATIONAL.value, year=y),
            Holiday(name="Republic Day",          holiday_date=date(y, 1, 26),  holiday_type=HolidayType.NATIONAL.value, year=y),
            Holiday(name="Good Friday",           holiday_date=date(y, 4,  3),  holiday_type=HolidayType.NATIONAL.value, year=y),
            Holiday(name="Independence Day",      holiday_date=date(y, 8, 15),  holiday_type=HolidayType.NATIONAL.value, year=y),
            Holiday(name="Gandhi Jayanti",        holiday_date=date(y, 10,  2), holiday_type=HolidayType.NATIONAL.value, year=y),
            Holiday(name="Diwali",                holiday_date=date(y, 10, 20), holiday_type=HolidayType.NATIONAL.value, year=y),
            Holiday(name="Christmas",             holiday_date=date(y, 12, 25), holiday_type=HolidayType.NATIONAL.value, year=y),
            Holiday(name="HRForz Foundation Day", holiday_date=date(y, 11, 14), holiday_type=HolidayType.COMPANY.value,  year=y, description="Annual company holiday"),
            Holiday(name="Pongal",                holiday_date=date(y, 1, 14),  holiday_type=HolidayType.STATE.value,    year=y, work_location_id=loc_hq.id),
            Holiday(name="Onam",                  holiday_date=date(y, 8, 27),  holiday_type=HolidayType.STATE.value,    year=y, work_location_id=loc_blr.id),
        ]
        db.add_all(holidays)
        await db.flush()
        print(f"  [ok] Holidays      : {len(holidays)}")

        # -- 11. SALARY COMPONENTS --------------------------------------------
        from app.models.payroll import (
            SalaryComponent, SalaryStructure, SalaryStructureComponent,
            EmployeeSalary, PayrollRun, Payslip, SalaryRevision,
            TDSDeclaration, PayrollAdjustment,
        )
        from app.shared.enums.payroll import (
            SalaryComponentType, SalaryCalcType, ComponentCategory,
            PaymentMode, TaxRegime, PayrollRunStatus, SalaryRevisionType,
            AdjustmentType,
        )

        SC = SalaryComponentType
        CC = ComponentCategory
        CT = SalaryCalcType

        components = [
            SalaryComponent(name="Basic Salary",             code="BASIC",   component_type=SC.EARNING.value,   category=CC.AUTO.value,      calc_type=CT.FORMULA.value,   value=40,   is_taxable=True,  is_pf_applicable=True,  is_esi_applicable=True,  display_order=1),
            SalaryComponent(name="House Rent Allowance",     code="HRA",     component_type=SC.EARNING.value,   category=CC.AUTO.value,      calc_type=CT.FORMULA.value,   value=20,   is_taxable=False, is_pf_applicable=False, is_esi_applicable=False, display_order=2),
            SalaryComponent(name="Special Allowance",        code="SPECIAL", component_type=SC.EARNING.value,   category=CC.AUTO.value,      calc_type=CT.FORMULA.value,   value=30,   is_taxable=True,  is_pf_applicable=False, is_esi_applicable=False, display_order=3),
            SalaryComponent(name="Conveyance Allowance",     code="CONV",    component_type=SC.EARNING.value,   category=CC.CUSTOM.value,    calc_type=CT.FIXED.value,     value=1600, is_taxable=False, is_pf_applicable=False, is_esi_applicable=False, display_order=4),
            SalaryComponent(name="Medical Allowance",        code="MED",     component_type=SC.EARNING.value,   category=CC.CUSTOM.value,    calc_type=CT.FIXED.value,     value=1250, is_taxable=False, is_pf_applicable=False, is_esi_applicable=False, display_order=5),
            SalaryComponent(name="PF Employee Contribution", code="PF_EMP",  component_type=SC.DEDUCTION.value, category=CC.STATUTORY.value, calc_type=CT.STATUTORY.value, value=12,   is_taxable=False, is_pf_applicable=True,  is_esi_applicable=False, display_order=6),
            SalaryComponent(name="Professional Tax",         code="PT",      component_type=SC.DEDUCTION.value, category=CC.STATUTORY.value, calc_type=CT.FIXED.value,     value=200,  is_taxable=False, is_pf_applicable=False, is_esi_applicable=False, display_order=7),
            SalaryComponent(name="Income Tax (TDS)",         code="TDS",     component_type=SC.DEDUCTION.value, category=CC.STATUTORY.value, calc_type=CT.MANUAL.value,    value=0,    is_taxable=False, is_pf_applicable=False, is_esi_applicable=False, display_order=8),
        ]
        db.add_all(components)
        await db.flush()
        print(f"  [ok] Salary comps  : {len(components)}")

        # -- 12. SALARY STRUCTURES --------------------------------------------
        struct_std    = SalaryStructure(name="Standard Structure", description="For individual contributors")
        struct_senior = SalaryStructure(name="Senior Structure",   description="For managers and leads")
        db.add_all([struct_std, struct_senior])
        await db.flush()

        for comp in components:
            for struct in [struct_std, struct_senior]:
                db.add(SalaryStructureComponent(
                    structure_id=struct.id, component_id=comp.id, display_order=comp.display_order,
                ))
        await db.flush()
        print("  [ok] Salary structs: 2 structures, 16 component links")

        # -- 13. EMPLOYEE SALARIES --------------------------------------------
        salary_rows = [
            (emp_priya,  1800000, 720000, 360000, struct_senior),
            (emp_kavita, 1000000, 400000, 200000, struct_senior),
            (emp_anil,   1200000, 480000, 240000, struct_senior),
            (emp_deepa,  1200000, 480000, 240000, struct_senior),
            (emp_arjun,   800000, 320000, 160000, struct_std),
            (emp_sneha,   900000, 360000, 180000, struct_std),
            (emp_rajesh,  500000, 200000, 100000, struct_std),
            (emp_vikram,  600000, 240000, 120000, struct_std),
        ]
        for emp, ctc, basic, hra, struct in salary_rows:
            db.add(EmployeeSalary(
                employee_id=emp.id, structure_id=struct.id,
                ctc=ctc, basic=basic, hra=hra,
                effective_from=emp.date_of_joining,
                payment_mode=PaymentMode.BANK_TRANSFER.value,
                tax_regime=TaxRegime.NEW.value,
                is_current=True,
            ))
        await db.flush()
        print(f"  [ok] Emp salaries  : {len(salary_rows)}")

        # -- 14. ATTENDANCE RECORDS (last 30 days) ----------------------------
        from app.models.attendance import AttendanceRecord
        from app.shared.enums.attendance import AttendanceStatus, ClockMethod

        work_days = _working_days(today - timedelta(days=30), today - timedelta(days=1))
        att_count = 0
        for emp in all_emps:
            for wd in work_days:
                r = random.random()
                if r < 0.75:
                    status = AttendanceStatus.PRESENT.value
                    h_in  = random.randint(0, 20)
                    h_out = random.randint(0, 30)
                    cin   = datetime(wd.year, wd.month, wd.day, 9,  h_in)
                    cout  = datetime(wd.year, wd.month, wd.day, 18, h_out)
                    wh    = round((cout - cin).total_seconds() / 3600, 2)
                    is_late = h_in > 15
                elif r < 0.85:
                    status = AttendanceStatus.WFH.value
                    cin   = datetime(wd.year, wd.month, wd.day, 9,  random.randint(0, 30))
                    cout  = datetime(wd.year, wd.month, wd.day, 18, random.randint(0, 30))
                    wh    = round((cout - cin).total_seconds() / 3600, 2)
                    is_late = False
                elif r < 0.92:
                    status = AttendanceStatus.ON_LEAVE.value
                    cin = cout = wh = None
                    is_late = False
                else:
                    status = AttendanceStatus.ABSENT.value
                    cin = cout = wh = None
                    is_late = False

                db.add(AttendanceRecord(
                    employee_id=emp.id, attendance_date=wd, status=status,
                    clock_in=cin, clock_out=cout,
                    clock_in_method=ClockMethod.WEB_PORTAL.value if cin else None,
                    clock_out_method=ClockMethod.WEB_PORTAL.value if cout else None,
                    work_hours=wh, is_late=is_late, is_early_out=False,
                ))
                att_count += 1

        await db.flush()
        print(f"  [ok] Attendance    : {att_count} records")

        # -- 15. LEAVE REQUESTS -----------------------------------------------
        leave_reqs = [
            LeaveRequest(
                employee_id=emp_arjun.id, leave_type=LeaveType.CL.value,
                duration_type=LeaveDurationType.FULL_DAY.value,
                from_date=today - timedelta(days=15), to_date=today - timedelta(days=14),
                days_count=2, reason="Personal work",
                status=LeaveStatus.APPROVED.value,
                applied_on=datetime.utcnow() - timedelta(days=16),
                approved_by=emp_priya.id, approved_at=datetime.utcnow() - timedelta(days=15),
            ),
            LeaveRequest(
                employee_id=emp_sneha.id, leave_type=LeaveType.SL.value,
                duration_type=LeaveDurationType.FULL_DAY.value,
                from_date=today - timedelta(days=10), to_date=today - timedelta(days=10),
                days_count=1, reason="Fever",
                status=LeaveStatus.APPROVED.value,
                applied_on=datetime.utcnow() - timedelta(days=10),
                approved_by=emp_priya.id, approved_at=datetime.utcnow() - timedelta(days=10),
            ),
            LeaveRequest(
                employee_id=emp_rajesh.id, leave_type=LeaveType.CL.value,
                duration_type=LeaveDurationType.FULL_DAY.value,
                from_date=today + timedelta(days=5), to_date=today + timedelta(days=6),
                days_count=2, reason="Family function",
                status=LeaveStatus.PENDING.value,
                applied_on=datetime.utcnow(),
            ),
            LeaveRequest(
                employee_id=emp_vikram.id, leave_type=LeaveType.WFH.value,
                duration_type=LeaveDurationType.FULL_DAY.value,
                from_date=today + timedelta(days=2), to_date=today + timedelta(days=2),
                days_count=1, reason="Internet installation at home",
                status=LeaveStatus.PENDING.value,
                applied_on=datetime.utcnow(),
            ),
            LeaveRequest(
                employee_id=emp_anil.id, leave_type=LeaveType.CL.value,
                duration_type=LeaveDurationType.FIRST_HALF.value,
                from_date=today - timedelta(days=5), to_date=today - timedelta(days=5),
                days_count=0.5, reason="Bank work",
                status=LeaveStatus.APPROVED.value,
                applied_on=datetime.utcnow() - timedelta(days=5),
                approved_by=emp_kavita.id, approved_at=datetime.utcnow() - timedelta(days=5),
            ),
        ]
        db.add_all(leave_reqs)
        await db.flush()
        print(f"  [ok] Leave requests: {len(leave_reqs)}")

        # -- 16. PERMISSION POLICY + REQUESTS ---------------------------------
        from app.models.permission import PermissionPolicy, PermissionRequest
        from app.shared.enums.permission import ExcessAction, PermissionType, PermissionStatus

        db.add(PermissionPolicy(
            max_hours_per_day=2.0, max_hours_per_month=8.0,
            excess_action=ExcessAction.LOP.value, is_active=True,
        ))

        perm_reqs = [
            PermissionRequest(
                employee_id=emp_arjun.id,
                permission_date=today - timedelta(days=5),
                permission_type=PermissionType.LATE_IN.value,
                from_time=time(9, 0), to_time=time(10, 30), duration_hours=1.5,
                reason="Doctor appointment in the morning",
                status=PermissionStatus.APPROVED.value,
                approved_by=emp_priya.id,
                approved_at=datetime.utcnow() - timedelta(days=5),
            ),
            PermissionRequest(
                employee_id=emp_vikram.id,
                permission_date=today + timedelta(days=1),
                permission_type=PermissionType.EARLY_OUT.value,
                from_time=time(16, 0), to_time=time(18, 0), duration_hours=2.0,
                reason="Son's school annual day event",
                status=PermissionStatus.PENDING.value,
            ),
            PermissionRequest(
                employee_id=emp_sneha.id,
                permission_date=today - timedelta(days=12),
                permission_type=PermissionType.MID_DAY_OUT.value,
                from_time=time(13, 0), to_time=time(14, 30), duration_hours=1.5,
                reason="Bank visit for account related work",
                status=PermissionStatus.APPROVED.value,
                approved_by=emp_priya.id,
                approved_at=datetime.utcnow() - timedelta(days=12),
            ),
        ]
        db.add_all(perm_reqs)
        await db.flush()
        print(f"  [ok] Permissions   : 1 policy, {len(perm_reqs)} requests")

        # -- 17. PAYROLL RUN + PAYSLIPS ---------------------------------------
        lm = (today.replace(day=1) - timedelta(days=1))
        pay_dt = datetime(lm.year, lm.month, 28, 17, 0)
        apr_dt = datetime(lm.year, lm.month, min(lm.day, 29), 18, 0)

        pr = PayrollRun(
            month=lm.month, year=lm.year,
            status=PayrollRunStatus.RELEASED.value,
            total_employees=len(all_emps),
            total_gross=0, total_deductions=0, total_net=0,
            processed_by=emp_kavita.id, processed_at=pay_dt,
            approved_by=emp_anil.id,    approved_at=apr_dt,
            locked_at=apr_dt,
            remarks="Regular monthly payroll",
        )
        db.add(pr)
        await db.flush()

        total_gross = total_ded = total_net = 0
        for emp, ctc, basic, hra, struct in salary_rows:
            monthly_gross = round(ctc / 12, 2)
            pf_emp        = round(basic / 12 * 0.12, 2)
            pt            = 200
            net           = round(monthly_gross - pf_emp - pt, 2)
            deductions    = round(pf_emp + pt, 2)
            breakdown = json.dumps({
                "earnings": {
                    "Basic Salary":         round(basic / 12, 2),
                    "House Rent Allowance": round(hra / 12, 2),
                    "Special Allowance":    round(ctc * 0.30 / 12, 2),
                    "Conveyance Allowance": 1600,
                    "Medical Allowance":    1250,
                },
                "deductions": {
                    "PF Employee":      pf_emp,
                    "Professional Tax": pt,
                    "Income Tax (TDS)": 0,
                },
            })
            db.add(Payslip(
                payroll_run_id=pr.id, employee_id=emp.id,
                month=lm.month, year=lm.year,
                working_days=22, paid_days=22, lop_days=0,
                gross_salary=monthly_gross, total_deductions=deductions,
                net_salary=net,
                pf_employee=pf_emp, pf_employer=pf_emp,
                esi_employee=0, esi_employer=0, tds=0,
                is_published=True, component_breakdown=breakdown,
            ))
            total_gross += monthly_gross
            total_ded   += deductions
            total_net   += net

        pr.total_gross      = round(total_gross, 2)
        pr.total_deductions = round(total_ded, 2)
        pr.total_net        = round(total_net, 2)
        await db.flush()
        print(f"  [ok] Payroll       : {lm.strftime('%B %Y')} run + {len(salary_rows)} payslips  (Net Rs.{round(total_net):,})")

        # -- 18. SALARY REVISIONS ---------------------------------------------
        fy_start = date(today.year, 4, 1) if today.month >= 4 else date(today.year - 1, 4, 1)
        revisions = [
            SalaryRevision(
                employee_id=emp_arjun.id,
                revision_type=SalaryRevisionType.INCREMENT.value,
                old_ctc=650000, new_ctc=800000, hike_percentage=23.08,
                effective_from=fy_start,
                reason="Annual increment — exceeded performance targets Q3 & Q4",
                approved_by=emp_priya.id,
            ),
            SalaryRevision(
                employee_id=emp_sneha.id,
                revision_type=SalaryRevisionType.PROMOTION.value,
                old_ctc=700000, new_ctc=900000, hike_percentage=28.57,
                effective_from=fy_start,
                reason="Promotion: Software Engineer to Senior Engineer",
                approved_by=emp_priya.id,
            ),
            SalaryRevision(
                employee_id=emp_rajesh.id,
                revision_type=SalaryRevisionType.INCREMENT.value,
                old_ctc=420000, new_ctc=500000, hike_percentage=19.05,
                effective_from=fy_start,
                reason="Annual increment after successful probation completion",
                approved_by=emp_kavita.id,
            ),
        ]
        db.add_all(revisions)
        await db.flush()
        print(f"  [ok] Sal revisions : {len(revisions)}")

        # -- 19. TDS DECLARATIONS ---------------------------------------------
        fy_label = f"{fy_start.year}-{str(fy_start.year + 1)[2:]}"
        for emp, ctc, *_ in salary_rows:
            db.add(TDSDeclaration(
                employee_id=emp.id, financial_year=fy_label,
                tax_regime=TaxRegime.NEW.value,
                declared_amount=150000, approved_amount=150000,
                status="approved",
                declaration_data=json.dumps({
                    "80C": 150000, "HRA_Exemption": 0, "Standard_Deduction": 50000,
                }),
            ))
        await db.flush()
        print(f"  [ok] TDS decls     : {len(salary_rows)}")

        # -- 20. PAYROLL ADJUSTMENTS ------------------------------------------
        adj_list = [
            PayrollAdjustment(
                employee_id=emp_arjun.id, month=lm.month, year=lm.year,
                adjustment_type=AdjustmentType.EARNING.value,
                amount=5000, reason="Performance bonus — sprint delivery",
                is_applied=True, created_by=emp_kavita.id,
            ),
            PayrollAdjustment(
                employee_id=emp_vikram.id, month=lm.month, year=lm.year,
                adjustment_type=AdjustmentType.DEDUCTION.value,
                amount=2000, reason="Advance salary recovery",
                is_applied=True, created_by=emp_kavita.id,
            ),
        ]
        db.add_all(adj_list)
        await db.flush()
        print(f"  [ok] Payroll adjs  : {len(adj_list)}")

        # -- 21. HELPDESK -----------------------------------------------------
        from app.models.helpdesk import HelpdeskCategory, HelpdeskTicket, HelpdeskComment
        from app.shared.enums.helpdesk import TicketStatus, TicketPriority

        hd_cats = [
            HelpdeskCategory(name="IT Support",    description="Laptop, software, VPN, access issues"),
            HelpdeskCategory(name="HR Queries",    description="Leave policy, onboarding, documentation"),
            HelpdeskCategory(name="Payroll Issues", description="Salary discrepancies, payslip queries"),
            HelpdeskCategory(name="Facilities",    description="Office infrastructure, equipment requests"),
        ]
        db.add_all(hd_cats)
        await db.flush()
        cat_it, cat_hr, cat_pay, cat_fac = hd_cats

        tickets = [
            HelpdeskTicket(
                ticket_number="TKT-2026-001", employee_id=emp_arjun.id,
                category_id=cat_it.id,
                subject="VPN not connecting from home",
                description="Unable to connect to company VPN from home network since yesterday. Getting authentication failed error.",
                priority=TicketPriority.HIGH.value, status=TicketStatus.IN_PROGRESS.value,
                assigned_to=emp_kavita.id,
            ),
            HelpdeskTicket(
                ticket_number="TKT-2026-002", employee_id=emp_rajesh.id,
                category_id=cat_pay.id,
                subject="April payslip not visible in portal",
                description="My April 2026 payslip is not showing in the salary portal. All previous months are visible. Please check and update.",
                priority=TicketPriority.MEDIUM.value, status=TicketStatus.OPEN.value,
            ),
            HelpdeskTicket(
                ticket_number="TKT-2026-003", employee_id=emp_vikram.id,
                category_id=cat_hr.id,
                subject="Leave balance discrepancy - CL shows incorrect count",
                description="My CL balance shows 8 days remaining but I have taken only 1 leave this year. The opening balance appears incorrect.",
                priority=TicketPriority.LOW.value, status=TicketStatus.RESOLVED.value,
                assigned_to=emp_kavita.id,
                resolved_at=datetime.utcnow() - timedelta(days=3),
            ),
            HelpdeskTicket(
                ticket_number="TKT-2026-004", employee_id=emp_sneha.id,
                category_id=cat_fac.id,
                subject="Request for ergonomic chair - WFH setup",
                description="I have been experiencing back pain. Requesting an ergonomic chair for home office under WFH support policy.",
                priority=TicketPriority.LOW.value, status=TicketStatus.OPEN.value,
            ),
        ]
        db.add_all(tickets)
        await db.flush()

        comments = [
            HelpdeskComment(
                ticket_id=tickets[0].id, employee_id=emp_kavita.id,
                comment="Hi Arjun, we have raised a ticket with IT. Please try resetting VPN credentials from the IT portal in the meantime.",
                is_internal=False,
            ),
            HelpdeskComment(
                ticket_id=tickets[0].id, employee_id=emp_arjun.id,
                comment="Thank you Kavita. I tried resetting but still getting the same error. Please escalate if possible.",
                is_internal=False,
            ),
            HelpdeskComment(
                ticket_id=tickets[0].id, employee_id=emp_kavita.id,
                comment="[Internal] IT team is checking firewall rules - possible ISP block from Arjun's region.",
                is_internal=True,
            ),
            HelpdeskComment(
                ticket_id=tickets[2].id, employee_id=emp_kavita.id,
                comment="Verified. Opening balance for 2026 was incorrectly carried forward. Corrected to 12 CL. Balance updated.",
                is_internal=False,
            ),
        ]
        db.add_all(comments)
        await db.flush()
        print(f"  [ok] Helpdesk      : {len(hd_cats)} categories, {len(tickets)} tickets, {len(comments)} comments")

        # -- 22. ANNOUNCEMENTS ------------------------------------------------
        from app.models.announcement import Announcement

        announcements = [
            Announcement(
                title="Q1 2026 All-Hands Meeting - May 15",
                content=(
                    "We are pleased to invite all employees to the Q1 2026 All-Hands meeting "
                    "on May 15, 2026 at 3:00 PM IST. Agenda: company performance, product roadmap "
                    "for Q2, team recognitions, and open Q&A. Zoom link will be shared via email."
                ),
                target_audience="all",
                published_by=emp_kavita.id,
                published_at=today,
                expires_at=date(today.year, 5, 16),
                is_published=True, is_pinned=True,
            ),
            Announcement(
                title="Updated WFH Policy - Effective June 1, 2026",
                content=(
                    "Effective June 1, 2026, employees may avail up to 2 WFH days per week "
                    "with prior manager approval (minimum 24 hours notice). "
                    "Refer to HR Policy v3.2 on the intranet for complete guidelines."
                ),
                target_audience="all",
                published_by=emp_kavita.id,
                published_at=today - timedelta(days=7),
                is_published=True, is_pinned=False,
            ),
            Announcement(
                title="Engineering - Sprint 18 Planning on May 8",
                content=(
                    "Sprint 18 planning is scheduled for May 8, 2026 at 10:00 AM. "
                    "All engineering team members must attend. "
                    "Please update JIRA tasks and close all pending Sprint 17 items before the session."
                ),
                target_audience="department",
                target_department_id=dept_eng.id,
                published_by=emp_priya.id,
                published_at=today - timedelta(days=2),
                expires_at=date(today.year, 5, 9),
                is_published=True, is_pinned=False,
            ),
        ]
        db.add_all(announcements)
        await db.flush()
        print(f"  [ok] Announcements : {len(announcements)}")

        # -- 23. NOTIFICATIONS ------------------------------------------------
        from app.models.notification import Notification
        from app.shared.enums.notification import NotificationType as NT

        net_arjun = round((800000 / 12) - round(320000 / 12 * 0.12, 2) - 200)

        notifications = [
            Notification(
                recipient_id=emp_priya.id,
                notification_type=NT.LEAVE_APPLIED.value,
                title="Leave Request - Rajesh Kumar",
                body="Rajesh Kumar has applied for 2 days Casual Leave (May 11-12). Awaiting your approval.",
                reference_id=leave_reqs[2].id, reference_type="leave_request", is_read=False,
            ),
            Notification(
                recipient_id=emp_deepa.id,
                notification_type=NT.LEAVE_APPLIED.value,
                title="WFH Request - Vikram Singh",
                body="Vikram Singh has applied for 1 WFH day on May 8. Awaiting your approval.",
                reference_id=leave_reqs[3].id, reference_type="leave_request", is_read=False,
            ),
            Notification(
                recipient_id=emp_arjun.id,
                notification_type=NT.LEAVE_APPROVED.value,
                title="Leave Approved",
                body="Your Casual Leave request (Apr 21-22) has been approved by Priya Sharma.",
                reference_id=leave_reqs[0].id, reference_type="leave_request", is_read=True,
                read_at=datetime.utcnow() - timedelta(days=14),
            ),
            Notification(
                recipient_id=emp_arjun.id,
                notification_type=NT.PAYSLIP_RELEASED.value,
                title=f"Payslip for {lm.strftime('%B %Y')} Published",
                body=f"Your salary slip for {lm.strftime('%B %Y')} is now available. Net pay: Rs.{net_arjun:,}",
                reference_id=pr.id, reference_type="payroll_run", is_read=False,
            ),
            Notification(
                recipient_id=emp_sneha.id,
                notification_type=NT.SALARY_REVISED.value,
                title="Salary Revised - Congratulations!",
                body="Your CTC has been revised to Rs.9,00,000 effective April 1, 2026. Offer letter available in Documents.",
                reference_id=revisions[1].id, reference_type="salary_revision", is_read=True,
                read_at=datetime.utcnow() - timedelta(days=30),
            ),
            Notification(
                recipient_id=emp_vikram.id,
                notification_type=NT.TICKET_RESOLVED.value,
                title="Helpdesk Ticket Resolved - TKT-2026-003",
                body="Your leave balance issue has been resolved. CL balance corrected. Please verify in the portal.",
                reference_id=tickets[2].id, reference_type="helpdesk_ticket", is_read=False,
            ),
            Notification(
                recipient_id=emp_priya.id,
                notification_type=NT.PERMISSION_APPLIED.value,
                title="Permission Request - Arjun Mehta",
                body="Arjun Mehta has requested late-in permission (1.5 hrs) for May 1 due to a doctor appointment.",
                reference_id=perm_reqs[0].id, reference_type="permission_request", is_read=True,
                read_at=datetime.utcnow() - timedelta(days=5),
            ),
            Notification(
                recipient_id=emp_arjun.id,
                notification_type=NT.PERMISSION_APPROVED.value,
                title="Permission Approved",
                body="Your late-in permission request for May 1 has been approved by Priya Sharma.",
                reference_id=perm_reqs[0].id, reference_type="permission_request", is_read=True,
                read_at=datetime.utcnow() - timedelta(days=5),
            ),
        ]
        db.add_all(notifications)
        await db.flush()
        print(f"  [ok] Notifications : {len(notifications)}")

        # -- COMMIT -----------------------------------------------------------
        await db.commit()

        print("\n" + "=" * 62)
        print("  Seed data committed successfully!")
        print("=" * 62)
        print(f"  {'ROLE':<16} {'EMAIL':<32} PASSWORD")
        print(f"  {'-'*16} {'-'*32} {'-'*14}")
        creds = [
            ("super_admin",    "admin@hrforz.com",         "Admin@1234"),
            ("manager",        "priya.sharma@hrforz.com",  "Employee@1234"),
            ("hr_admin",       "kavita.rao@hrforz.com",    "Employee@1234"),
            ("finance_admin",  "anil.gupta@hrforz.com",    "Employee@1234"),
            ("manager",        "deepa.nair@hrforz.com",    "Employee@1234"),
            ("employee",       "arjun.mehta@hrforz.com",   "Employee@1234"),
            ("employee",       "sneha.patel@hrforz.com",   "Employee@1234"),
            ("employee",       "rajesh.kumar@hrforz.com",  "Employee@1234"),
            ("employee",       "vikram.singh@hrforz.com",  "Employee@1234"),
        ]
        for role, email, pw in creds:
            print(f"  {role:<16} {email:<32} {pw}")
        print("=" * 62)

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
