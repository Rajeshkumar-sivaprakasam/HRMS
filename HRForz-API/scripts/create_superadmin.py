#!/usr/bin/env python3
"""Create a super-admin user.

Usage: python scripts/create_superadmin.py
"""
import asyncio
import os
import uuid

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine


async def main() -> None:
    database_url = os.environ["DATABASE_URL"]
    if database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    engine = create_async_engine(database_url, echo=False)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    email = input("Email: ").strip()
    password = input("Password: ").strip()
    first_name = input("First name: ").strip()
    last_name = input("Last name: ").strip()

    async with session_factory() as session:
        from app.core.security.password import hash_password
        from app.models.employee import Employee
        from app.models.user import User
        from app.shared.enums.auth import Role
        from app.shared.enums.employee import EmployeeStatus, EmploymentType, WorkLocationType

        emp = Employee(
            employee_code="EMP0001",
            first_name=first_name,
            last_name=last_name,
            email=email,
            status=EmployeeStatus.ACTIVE,
            employment_type=EmploymentType.FULL_TIME,
            work_location_type=WorkLocationType.OFFICE,
        )
        session.add(emp)
        await session.flush()

        user = User(
            email=email,
            hashed_password=hash_password(password),
            role=Role.SUPER_ADMIN,
            is_active=True,
            is_email_verified=True,
            employee_id=emp.id,
        )
        session.add(user)
        await session.commit()
        print(f"Super admin created: {email}")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
