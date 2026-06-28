"""add_pf_esi_pt_details_to_employee

Revision ID: b2c3d4e5f6g7
Revises: a1b2c3d4e5f6
Create Date: 2026-05-07 14:30:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'b2c3d4e5f6g7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('employees', sa.Column('pf_status', sa.String(length=20), nullable=True))
    op.add_column('employees', sa.Column('pf_number', sa.String(length=50), nullable=True))
    op.add_column('employees', sa.Column('pf_uan_number', sa.String(length=20), nullable=True))
    op.add_column('employees', sa.Column('pf_join_date', sa.Date(), nullable=True))
    op.add_column('employees', sa.Column('pf_account_name', sa.String(length=150), nullable=True))
    op.add_column('employees', sa.Column('esi_status', sa.String(length=20), nullable=True))
    op.add_column('employees', sa.Column('pt_state', sa.String(length=100), nullable=True))
    op.add_column('employees', sa.Column('pt_registered_location', sa.String(length=100), nullable=True))


def downgrade() -> None:
    op.drop_column('employees', 'pt_registered_location')
    op.drop_column('employees', 'pt_state')
    op.drop_column('employees', 'esi_status')
    op.drop_column('employees', 'pf_account_name')
    op.drop_column('employees', 'pf_join_date')
    op.drop_column('employees', 'pf_uan_number')
    op.drop_column('employees', 'pf_number')
    op.drop_column('employees', 'pf_status')
