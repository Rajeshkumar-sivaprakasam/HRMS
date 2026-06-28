"""add_holiday_types_table

Revision ID: a1b2c3d4e5f6
Revises: ddf3068832ef
Create Date: 2026-05-07 14:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'ddf3068832ef'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'holiday_types',
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('code', sa.String(length=30), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code'),
        sa.UniqueConstraint('name'),
    )
    op.create_index(op.f('ix_holiday_types_id'), 'holiday_types', ['id'], unique=False)
    op.create_index(op.f('ix_holiday_types_deleted_at'), 'holiday_types', ['deleted_at'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_holiday_types_deleted_at'), table_name='holiday_types')
    op.drop_index(op.f('ix_holiday_types_id'), table_name='holiday_types')
    op.drop_table('holiday_types')
