"""remove_user_prompt_template_from_prompt_templates

Revision ID: b9f3d1a6c2e4
Revises: 8a2f9b7d4c13
Create Date: 2026-04-17 17:40:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b9f3d1a6c2e4"
down_revision: str | Sequence[str] | None = "8a2f9b7d4c13"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_column("prompt_templates", "user_prompt_template")


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column(
        "prompt_templates",
        sa.Column(
            "user_prompt_template",
            sa.Text(),
            nullable=False,
            server_default=sa.text(
                "'請只根據提供的知識庫內容回答問題。\n\n"
                "如果內容不足以支持答案，請明確說不知道，不要自行捏造細節。\n"
                "請優先提供精簡、可驗證且重點明確的回答。\n\n"
                "知識庫內容：\n{context}\n\n"
                "對話歷史：\n{history}\n\n"
                "問題：\n{question}'"
            ),
        ),
    )
