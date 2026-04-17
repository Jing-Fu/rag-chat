"""enable_pg_trgm_for_hybrid_retrieval

Revision ID: 8a2f9b7d4c13
Revises: 3c6f0f7f6a5a
Create Date: 2026-04-17 09:55:00.000000
"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "8a2f9b7d4c13"
down_revision: str | Sequence[str] | None = "3c6f0f7f6a5a"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_chunks_content_trgm "
        "ON chunks USING gin (content gin_trgm_ops)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_documents_filename_trgm "
        "ON documents USING gin (filename gin_trgm_ops)"
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DROP INDEX IF EXISTS ix_documents_filename_trgm")
    op.execute("DROP INDEX IF EXISTS ix_chunks_content_trgm")
    op.execute("DROP EXTENSION IF EXISTS pg_trgm")
