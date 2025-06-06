"""Rename file_metadata to file_info

Revision ID: 51d7df124ad1
Revises: 31e110e9f88e
Create Date: 2025-04-25 18:50:58.613656

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '51d7df124ad1'
down_revision: Union[str, None] = '31e110e9f88e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('uploaded_files', sa.Column('file_info', sa.JSON(), nullable=True))
    op.drop_column('uploaded_files', 'file_metadata')
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('uploaded_files', sa.Column('file_metadata', postgresql.JSON(astext_type=sa.Text()), autoincrement=False, nullable=True))
    op.drop_column('uploaded_files', 'file_info')
    # ### end Alembic commands ###
