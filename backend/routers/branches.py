from fastapi import APIRouter, HTTPException

from models.schemas import BranchCreate, CheckoutRequest
from services.git_service import GitService

router = APIRouter(tags=["branches"])

git_service = GitService("data")


@router.get("/repos/{repo_id}/branches", response_model=list[str])
def list_branches(repo_id: str):
    try:
        return git_service.list_branches(repo_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Repo not found")


@router.post("/repos/{repo_id}/branches", response_model=list[str], status_code=201)
def create_branch(repo_id: str, body: BranchCreate):
    try:
        return git_service.create_branch(repo_id, body.name)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Repo not found")


@router.post("/repos/{repo_id}/checkout")
def checkout_branch(repo_id: str, body: CheckoutRequest):
    try:
        branch = git_service.checkout(repo_id, body.branch)
        return {"current_branch": branch}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Repo not found")
    except IndexError:
        raise HTTPException(status_code=404, detail="Branch not found")
