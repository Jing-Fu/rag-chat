"""make_chat_session_prompt_nullable

Revision ID: 3c6f0f7f6a5a
Revises: 43b2c5aeaa2f
Create Date: 2026-04-14 15:45:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "3c6f0f7f6a5a"
down_revision: str | Sequence[str] | None = "43b2c5aeaa2f"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_constraint("chat_sessions_prompt_id_fkey", "chat_sessions", type_="foreignkey")
    op.alter_column(
        "chat_sessions",
        "prompt_id",
        existing_type=postgresql.UUID(as_uuid=True),
        nullable=True,
    )
    op.create_foreign_key(
        "chat_sessions_prompt_id_fkey",
        "chat_sessions",
        "prompt_templates",
        ["prompt_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    """Downgrade schema."""
    connection = op.get_bind()
    fallback_prompt_id = connection.execute(
        sa.text(
            "SELECT id FROM prompt_templates ORDER BY is_default DESC, created_at ASC LIMIT 1"
        )
    ).scalar()
    if fallback_prompt_id is None:
        raise RuntimeError(
            "Cannot downgrade chat_sessions.prompt_id without an existing prompt template."
        )

    connection.execute(
        sa.text(
            "UPDATE chat_sessions SET prompt_id = :prompt_id WHERE prompt_id IS NULL"
        ),
        {"prompt_id": fallback_prompt_id},
    )

    op.drop_constraint("chat_sessions_prompt_id_fkey", "chat_sessions", type_="foreignkey")
    op.alter_column(
        "chat_sessions",
        "prompt_id",
        existing_type=postgresql.UUID(as_uuid=True),
        nullable=False,
    )
    op.create_foreign_key(
        "chat_sessions_prompt_id_fkey",
        "chat_sessions",
        "prompt_templates",
        ["prompt_id"],
        ["id"],
    )
