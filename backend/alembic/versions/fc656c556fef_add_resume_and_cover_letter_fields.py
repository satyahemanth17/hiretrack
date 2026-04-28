"""add resume and cover letter fields

Revision ID: fc656c556fef
Revises: 545adc79ca5f
Create Date: 2026-04-28 18:48:33.673221

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fc656c556fef'
down_revision: Union[str, Sequence[str], None] = '545adc79ca5f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('applications', sa.Column('resume_used', sa.String(length=500), nullable=True))
    op.add_column('applications', sa.Column('cover_letter_used', sa.Boolean(), nullable=True, server_default=sa.false()))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('applications', 'cover_letter_used')
    op.drop_column('applications', 'resume_used')
