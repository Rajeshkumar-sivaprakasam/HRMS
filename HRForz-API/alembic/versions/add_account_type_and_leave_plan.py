"""add_account_type_and_leave_plan

Revision ID: account_type_leave_plan_001
Revises: d1e2f3g4h5i6
Create Date: 2026-05-08 10:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'account_type_leave_plan_001'
down_revision: Union[str, None] = 'd1e2f3g4h5i6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'account_types',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('code', sa.String(length=30), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
        sa.UniqueConstraint('code')
    )
    op.create_index('idx_account_types_deleted_at', 'account_types', ['deleted_at'])

    op.create_table(
        'leave_plans',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('country', sa.String(length=100), nullable=False),
        sa.Column('leave_types', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('country')
    )
    op.create_index('idx_leave_plans_country', 'leave_plans', ['country'])
    op.create_index('idx_leave_plans_deleted_at', 'leave_plans', ['deleted_at'])


def downgrade() -> None:
    op.drop_index('idx_leave_plans_deleted_at', table_name='leave_plans')
    op.drop_index('idx_leave_plans_country', table_name='leave_plans')
    op.drop_table('leave_plans')
    op.drop_index('idx_account_types_deleted_at', table_name='account_types')
    op.drop_table('account_types')
