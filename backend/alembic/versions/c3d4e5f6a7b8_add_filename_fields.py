"""add filename fields

Revision ID: c3d4e5f6a7b8
Revises: a1b2c3d4e5f6
Create Date: 2026-05-06 20:47:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, Sequence[str], None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('applications', sa.Column('resume_filename', sa.String(length=255), nullable=True))
    op.add_column('applications', sa.Column('cover_letter_filename', sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column('applications', 'cover_letter_filename')
    op.drop_column('applications', 'resume_filename')
