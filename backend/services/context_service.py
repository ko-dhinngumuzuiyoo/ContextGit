from __future__ import annotations

import yaml

from models.schemas import ContextData
from services.git_service import GitService

CONTEXT_FILE = "context.yaml"

DEFAULT_CONTEXT = ContextData(
    purpose="",
    assumptions=[],
    glossary=[],
    decisions=[],
)


class ContextService:
    """Manages context.yaml read/write through GitService."""

    def __init__(self, git_service: GitService):
        self.git = git_service

    def get_context(self, repo_id: str) -> ContextData:
        raw = self.git.read_file(repo_id, CONTEXT_FILE)
        if raw is None:
            return DEFAULT_CONTEXT
        data = yaml.safe_load(raw) or {}
        return ContextData(**data)

    def save_context(self, repo_id: str, context: ContextData) -> None:
        content = yaml.dump(
            context.model_dump(),
            default_flow_style=False,
            allow_unicode=True,
            sort_keys=False,
        )
        self.git.write_file(repo_id, CONTEXT_FILE, content)

    def init_context(self, repo_id: str) -> ContextData:
        """Create the initial context.yaml if it doesn't exist."""
        existing = self.git.read_file(repo_id, CONTEXT_FILE)
        if existing is not None:
            return self.get_context(repo_id)
        self.save_context(repo_id, DEFAULT_CONTEXT)
        return DEFAULT_CONTEXT
