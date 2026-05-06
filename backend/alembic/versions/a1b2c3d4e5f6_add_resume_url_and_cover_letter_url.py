"""add resume_url and cover_letter_url

Revision ID: a1b2c3d4e5f6
Revises: 0488cfbe3877
Create Date: 2026-04-29 00:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '0488cfbe3877'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('applications', sa.Column('resume_url', sa.String(length=500), nullable=True))
    op.add_column('applications', sa.Column('cover_letter_url', sa.String(length=500), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('applications', 'cover_letter_url')
    op.drop_column('applications', 'resume_url')
