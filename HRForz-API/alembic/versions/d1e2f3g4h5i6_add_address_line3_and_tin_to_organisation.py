"""add_address_line3_and_tin_to_organisation

Revision ID: d1e2f3g4h5i6
Revises: c3d4e5f6g7h8
Create Date: 2026-05-07 16:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'd1e2f3g4h5i6'
down_revision: Union[str, None] = 'c3d4e5f6g7h8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('organisations', sa.Column('address_line3', sa.String(length=255), nullable=True))
    op.add_column('organisations', sa.Column('tin', sa.String(length=20), nullable=True))


def downgrade() -> None:
    op.drop_column('organisations', 'tin')
    op.drop_column('organisations', 'address_line3')
