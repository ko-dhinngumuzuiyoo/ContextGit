from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


# --- Context Data ---


class GlossaryItem(BaseModel):
    term: str
    definition: str


class Decision(BaseModel):
    title: str
    detail: str
    date: str | None = None


class ContextData(BaseModel):
    purpose: str = ""
    assumptions: list[str] = []
    glossary: list[GlossaryItem] = []
    decisions: list[Decision] = []


# --- Repo ---


class RepoCreate(BaseModel):
    name: str


class RepoInfo(BaseModel):
    id: str
    name: str
    current_branch: str
    branches: list[str]


# --- Branch ---


class BranchCreate(BaseModel):
    name: str


class CheckoutRequest(BaseModel):
    branch: str


# --- Commit ---


class CommitCreate(BaseModel):
    message: str


class CommitInfo(BaseModel):
    hash: str
    message: str
    author: str
    date: str


# --- Diff ---


class DiffResult(BaseModel):
    diff_text: str
    from_ref: str
    to_ref: str


# --- Export ---


class ExportRequest(BaseModel):
    target: Literal["chatgpt", "claude", "gemini"]
    branch: str = "main"


class ExportResult(BaseModel):
    target: str
    content: str
