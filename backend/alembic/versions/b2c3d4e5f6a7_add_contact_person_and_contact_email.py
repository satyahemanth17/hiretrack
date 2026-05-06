"""add contact_person and contact_email

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-05-06 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add contact_person and contact_email columns."""
    op.add_column("applications", sa.Column("contact_person", sa.String(255), nullable=True))
    op.add_column("applications", sa.Column("contact_email", sa.String(255), nullable=True))


def downgrade() -> None:
    """Remove contact_person and contact_email columns."""
    op.drop_column("applications", "contact_email")
    op.drop_column("applications", "contact_person")
