from fastapi import APIRouter, HTTPException

from models.schemas import CommitCreate, CommitInfo, DiffResult
from services.git_service import GitService

router = APIRouter(tags=["commits"])

git_service = GitService("data")


@router.post("/repos/{repo_id}/commits", response_model=CommitInfo, status_code=201)
def create_commit(repo_id: str, body: CommitCreate):
    try:
        return git_service.commit(repo_id, body.message)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Repo not found")


@router.get("/repos/{repo_id}/commits", response_model=list[CommitInfo])
def list_commits(repo_id: str):
    try:
        return git_service.get_log(repo_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Repo not found")


@router.get("/repos/{repo_id}/diff", response_model=DiffResult)
def get_diff(repo_id: str, ref1: str = "HEAD~1", ref2: str = "HEAD"):
    try:
        diff_text = git_service.get_diff(repo_id, ref1, ref2)
        return DiffResult(diff_text=diff_text, from_ref=ref1, to_ref=ref2)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Repo not found")
