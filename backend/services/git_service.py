from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone

from git import Repo

from models.schemas import CommitInfo, RepoInfo


class GitService:
    """GitPython wrapper for managing Context Repos."""

    def __init__(self, data_dir: str):
        self.data_dir = os.path.abspath(data_dir)
        os.makedirs(self.data_dir, exist_ok=True)

    def _repo_path(self, repo_id: str) -> str:
        path = os.path.join(self.data_dir, repo_id)
        if not os.path.isdir(path):
            raise FileNotFoundError(f"Repo not found: {repo_id}")
        return path

    def _get_repo(self, repo_id: str) -> Repo:
        return Repo(self._repo_path(repo_id))

    # --- Repo CRUD ---

    def create_repo(self, name: str) -> RepoInfo:
        repo_id = uuid.uuid4().hex[:8]
        repo_path = os.path.join(self.data_dir, repo_id)
        os.makedirs(repo_path)

        repo = Repo.init(repo_path)

        # Store repo name in a metadata file
        meta_path = os.path.join(repo_path, ".contextgit.yaml")
        with open(meta_path, "w", encoding="utf-8") as f:
            f.write(f"name: {name}\ncreated: {datetime.now(timezone.utc).isoformat()}\n")

        repo.index.add([".contextgit.yaml"])
        repo.index.commit("Initial commit: create context repo")

        return RepoInfo(
            id=repo_id,
            name=name,
            current_branch="master",
            branches=["master"],
        )

    def list_repos(self) -> list[RepoInfo]:
        repos: list[RepoInfo] = []
        if not os.path.isdir(self.data_dir):
            return repos

        for entry in os.listdir(self.data_dir):
            full = os.path.join(self.data_dir, entry)
            if not os.path.isdir(full) or entry.startswith("."):
                continue
            git_dir = os.path.join(full, ".git")
            if not os.path.isdir(git_dir):
                continue

            try:
                repo = Repo(full)
                name = self._read_repo_name(full)
                branches = [h.name for h in repo.heads]
                current = repo.active_branch.name if not repo.head.is_detached else "HEAD"
                repos.append(RepoInfo(
                    id=entry,
                    name=name,
                    current_branch=current,
                    branches=branches,
                ))
            except Exception:
                continue

        return repos

    def get_repo_info(self, repo_id: str) -> RepoInfo:
        repo = self._get_repo(repo_id)
        name = self._read_repo_name(self._repo_path(repo_id))
        branches = [h.name for h in repo.heads]
        current = repo.active_branch.name if not repo.head.is_detached else "HEAD"
        return RepoInfo(
            id=repo_id,
            name=name,
            current_branch=current,
            branches=branches,
        )

    def delete_repo(self, repo_id: str) -> None:
        import shutil
        import stat
        path = self._repo_path(repo_id)

        def on_error(func, fpath, _exc_info):
            os.chmod(fpath, stat.S_IWRITE)
            func(fpath)

        shutil.rmtree(path, onexc=on_error)

    # --- Branch ---

    def list_branches(self, repo_id: str) -> list[str]:
        repo = self._get_repo(repo_id)
        return [h.name for h in repo.heads]

    def create_branch(self, repo_id: str, branch_name: str) -> list[str]:
        repo = self._get_repo(repo_id)
        repo.create_head(branch_name)
        return [h.name for h in repo.heads]

    def checkout(self, repo_id: str, branch_name: str) -> str:
        repo = self._get_repo(repo_id)
        repo.heads[branch_name].checkout()
        return branch_name

    # --- Commit ---

    def commit(self, repo_id: str, message: str) -> CommitInfo:
        repo = self._get_repo(repo_id)
        repo.index.add("*")
        c = repo.index.commit(message)
        return CommitInfo(
            hash=c.hexsha[:7],
            message=c.message,
            author=str(c.author),
            date=datetime.fromtimestamp(c.committed_date, tz=timezone.utc).isoformat(),
        )

    def get_log(self, repo_id: str, max_count: int = 50) -> list[CommitInfo]:
        repo = self._get_repo(repo_id)
        commits: list[CommitInfo] = []
        for c in repo.iter_commits(max_count=max_count):
            commits.append(CommitInfo(
                hash=c.hexsha[:7],
                message=c.message,
                author=str(c.author),
                date=datetime.fromtimestamp(c.committed_date, tz=timezone.utc).isoformat(),
            ))
        return commits

    def get_diff(self, repo_id: str, ref1: str = "HEAD~1", ref2: str = "HEAD") -> str:
        repo = self._get_repo(repo_id)
        try:
            return repo.git.diff(ref1, ref2)
        except Exception:
            return ""

    # --- File I/O ---

    def read_file(self, repo_id: str, filename: str) -> str | None:
        path = os.path.join(self._repo_path(repo_id), filename)
        if not os.path.isfile(path):
            return None
        with open(path, "r", encoding="utf-8") as f:
            return f.read()

    def write_file(self, repo_id: str, filename: str, content: str) -> None:
        path = os.path.join(self._repo_path(repo_id), filename)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)

    # --- Phase 2 stubs ---

    def diff_branches(self, repo_id: str, source: str, target: str) -> str:
        repo = self._get_repo(repo_id)
        return repo.git.diff(target, source)

    def merge_branch(self, repo_id: str, source: str, target: str) -> str:
        raise NotImplementedError("Merge will be implemented in Phase 2")

    # --- Helpers ---

    def _read_repo_name(self, repo_path: str) -> str:
        meta = os.path.join(repo_path, ".contextgit.yaml")
        if os.path.isfile(meta):
            with open(meta, "r", encoding="utf-8") as f:
                for line in f:
                    if line.startswith("name:"):
                        return line.split(":", 1)[1].strip()
        return os.path.basename(repo_path)
