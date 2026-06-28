"""refactor_holiday_type_to_fk

Revision ID: c3d4e5f6g7h8
Revises: b2c3d4e5f6g7
Create Date: 2026-05-07 15:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'c3d4e5f6g7h8'
down_revision: Union[str, None] = 'b2c3d4e5f6g7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create holiday_type_id column (nullable)
    op.add_column('holidays', sa.Column('holiday_type_id', sa.UUID(), nullable=True))

    # Add FK constraint
    op.create_foreign_key(
        'fk_holidays_holiday_type_id',
        'holidays', 'holiday_types',
        ['holiday_type_id'], ['id'],
        ondelete='RESTRICT'
    )

    # Add index on holiday_type_id
    op.create_index(op.f('ix_holidays_holiday_type_id'), 'holidays', ['holiday_type_id'], unique=False)

    # Drop the old holiday_type enum column
    op.drop_column('holidays', 'holiday_type')


def downgrade() -> None:
    # Add back the old holiday_type column
    op.add_column('holidays', sa.Column('holiday_type', sa.String(length=20), nullable=False, server_default='national'))

    # Drop FK and index
    op.drop_index(op.f('ix_holidays_holiday_type_id'), table_name='holidays')
    op.drop_constraint('fk_holidays_holiday_type_id', 'holidays', type_='foreignkey')

    # Drop the new column
    op.drop_column('holidays', 'holiday_type_id')
