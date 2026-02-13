from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import repos, branches, commits, export

app = FastAPI(title="ContextGit API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://context-git.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(repos.router, prefix="/api")
app.include_router(branches.router, prefix="/api")
app.include_router(commits.router, prefix="/api")
app.include_router(export.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "ContextGit API", "version": "0.1.0"}
