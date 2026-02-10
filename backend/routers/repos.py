from fastapi import APIRouter, HTTPException

from models.schemas import ContextData, RepoCreate, RepoInfo
from services.context_service import ContextService
from services.git_service import GitService

router = APIRouter(tags=["repos"])

git_service = GitService("data")
context_service = ContextService(git_service)


@router.get("/repos", response_model=list[RepoInfo])
def list_repos():
    return git_service.list_repos()


@router.post("/repos", response_model=RepoInfo, status_code=201)
def create_repo(body: RepoCreate):
    repo = git_service.create_repo(body.name)
    context_service.init_context(repo.id)
    git_service.commit(repo.id, "Initialize context.yaml")
    return git_service.get_repo_info(repo.id)


@router.get("/repos/{repo_id}", response_model=RepoInfo)
def get_repo(repo_id: str):
    try:
        return git_service.get_repo_info(repo_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Repo not found")


@router.delete("/repos/{repo_id}", status_code=204)
def delete_repo(repo_id: str):
    try:
        git_service.delete_repo(repo_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Repo not found")


@router.get("/repos/{repo_id}/context", response_model=ContextData)
def get_context(repo_id: str):
    try:
        return context_service.get_context(repo_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Repo not found")


@router.put("/repos/{repo_id}/context", response_model=ContextData)
def update_context(repo_id: str, body: ContextData):
    try:
        context_service.save_context(repo_id, body)
        return context_service.get_context(repo_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Repo not found")
