from fastapi import APIRouter, HTTPException

from models.schemas import ExportRequest, ExportResult
from services.context_service import ContextService
from services.export_service import ExportService
from services.git_service import GitService

router = APIRouter(tags=["export"])

git_service = GitService("data")
context_service = ContextService(git_service)
export_service = ExportService()


@router.post("/repos/{repo_id}/export", response_model=ExportResult)
def export_context(repo_id: str, body: ExportRequest):
    try:
        # Checkout the requested branch if specified
        if body.branch:
            git_service.checkout(repo_id, body.branch)

        context = context_service.get_context(repo_id)
        content = export_service.export(context, body.target)
        return ExportResult(target=body.target, content=content)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Repo not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/export/targets", response_model=list[str])
def list_targets():
    return export_service.list_targets()
