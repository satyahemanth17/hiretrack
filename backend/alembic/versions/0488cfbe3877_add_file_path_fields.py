"""add file path fields

Revision ID: 0488cfbe3877
Revises: fc656c556fef
Create Date: 2026-04-29 02:05:26.371531

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0488cfbe3877'
down_revision: Union[str, Sequence[str], None] = 'fc656c556fef'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('applications', sa.Column('resume_used', sa.String(length=500), nullable=True))
    op.add_column('applications', sa.Column('cover_letter_used', sa.Boolean(), nullable=True))
    op.add_column('applications', sa.Column('resume_file_path', sa.String(length=500), nullable=True))
    op.add_column('applications', sa.Column('cover_letter_file_path', sa.String(length=500), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('applications', 'cover_letter_file_path')
    op.drop_column('applications', 'resume_file_path')
    op.drop_column('applications', 'cover_letter_used')
    op.drop_column('applications', 'resume_used')
