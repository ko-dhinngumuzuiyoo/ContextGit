import git from "isomorphic-git";
import { getFs, deleteFs } from "../storage/fs";
import { db } from "../storage/db";
import type { RepoInfo, CommitInfo } from "../types/repo";
import { createTwoFilesPatch } from "diff";

const DIR = "/";
const AUTHOR = { name: "ContextGit", email: "user@contextgit" };
const META_FILE = ".contextgit.yaml";

export class GitService {
  // --- Repo CRUD ---

  async createRepo(name: string): Promise<RepoInfo> {
    const id = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
    const fs = getFs(id);

    await git.init({ fs, dir: DIR, defaultBranch: "main" });

    const metaContent = `name: ${name}\ncreated: ${new Date().toISOString()}\n`;
    await fs.promises.writeFile(`${DIR}${META_FILE}`, metaContent, "utf8");

    await git.add({ fs, dir: DIR, filepath: META_FILE });
    await git.commit({
      fs,
      dir: DIR,
      message: "Initial commit: create context repo",
      author: AUTHOR,
    });

    await db.repos.add({ id, name, created: new Date().toISOString() });

    return { id, name, current_branch: "main", branches: ["main"] };
  }

  async listRepos(): Promise<RepoInfo[]> {
    const metas = await db.repos.toArray();
    const results: RepoInfo[] = [];

    for (const meta of metas) {
      try {
        const info = await this.getRepoInfo(meta.id);
        results.push(info);
      } catch {
        // Repo data corrupted or missing, skip
      }
    }
    return results;
  }

  async getRepoInfo(repoId: string): Promise<RepoInfo> {
    const fs = getFs(repoId);
    const meta = await db.repos.get(repoId);
    const name = meta?.name ?? repoId;

    const branches = await git.listBranches({ fs, dir: DIR });
    const current =
      (await git.currentBranch({ fs, dir: DIR })) ?? "main";

    return { id: repoId, name, current_branch: current, branches };
  }

  async deleteRepo(repoId: string): Promise<void> {
    deleteFs(repoId);
    await db.repos.delete(repoId);
  }

  // --- Branch ---

  async listBranches(repoId: string): Promise<string[]> {
    const fs = getFs(repoId);
    return git.listBranches({ fs, dir: DIR });
  }

  async createBranch(repoId: string, branchName: string): Promise<string[]> {
    const fs = getFs(repoId);
    await git.branch({ fs, dir: DIR, ref: branchName });
    return git.listBranches({ fs, dir: DIR });
  }

  async checkout(repoId: string, branchName: string): Promise<string> {
    const fs = getFs(repoId);
    await git.checkout({ fs, dir: DIR, ref: branchName });
    return branchName;
  }

  // --- Commit ---

  async commit(repoId: string, message: string): Promise<CommitInfo> {
    const fs = getFs(repoId);

    // Stage all known files
    const files = (await fs.promises.readdir(DIR)) as string[];
    for (const file of files) {
      if (file === ".git") continue;
      await git.add({ fs, dir: DIR, filepath: file });
    }

    const sha = await git.commit({
      fs,
      dir: DIR,
      message,
      author: AUTHOR,
    });

    const [entry] = await git.log({ fs, dir: DIR, depth: 1 });
    return {
      hash: sha.slice(0, 7),
      message: entry.commit.message,
      author: entry.commit.author.name,
      date: new Date(entry.commit.author.timestamp * 1000).toISOString(),
    };
  }

  async getLog(repoId: string, maxCount = 50): Promise<CommitInfo[]> {
    const fs = getFs(repoId);
    const entries = await git.log({ fs, dir: DIR, depth: maxCount });

    return entries.map((entry) => ({
      hash: entry.oid.slice(0, 7),
      message: entry.commit.message,
      author: entry.commit.author.name,
      date: new Date(entry.commit.author.timestamp * 1000).toISOString(),
    }));
  }

  async getDiff(
    repoId: string,
    ref1 = "HEAD~1",
    ref2 = "HEAD",
  ): Promise<string> {
    const fs = getFs(repoId);
    try {
      const content1 = await this.readFileAtRef(fs, ref1, "context.yaml");
      const content2 = await this.readFileAtRef(fs, ref2, "context.yaml");
      return createTwoFilesPatch(
        "context.yaml",
        "context.yaml",
        content1,
        content2,
      );
    } catch {
      return "";
    }
  }

  // --- File I/O ---

  async readFile(repoId: string, filename: string): Promise<string | null> {
    const fs = getFs(repoId);
    try {
      const content = await fs.promises.readFile(`${DIR}${filename}`, "utf8");
      return content as string;
    } catch {
      return null;
    }
  }

  async writeFile(
    repoId: string,
    filename: string,
    content: string,
  ): Promise<void> {
    const fs = getFs(repoId);
    await fs.promises.writeFile(`${DIR}${filename}`, content, "utf8");
  }

  // --- Directory ---

  async ensureDir(repoId: string, dirPath: string): Promise<void> {
    const fs = getFs(repoId);
    const parts = dirPath.split("/").filter(Boolean);
    let current = DIR;
    for (const part of parts) {
      current = current === "/" ? `/${part}` : `${current}/${part}`;
      try {
        await fs.promises.stat(current);
      } catch {
        await fs.promises.mkdir(current);
      }
    }
  }

  // --- Advanced commit: stage all files recursively ---

  async commitAll(repoId: string, message: string): Promise<CommitInfo> {
    const fs = getFs(repoId);
    await this.stageAll(fs, DIR, "");
    const sha = await git.commit({
      fs,
      dir: DIR,
      message,
      author: AUTHOR,
    });
    const [entry] = await git.log({ fs, dir: DIR, depth: 1 });
    return {
      hash: sha.slice(0, 7),
      message: entry.commit.message,
      author: entry.commit.author.name,
      date: new Date(entry.commit.author.timestamp * 1000).toISOString(),
    };
  }

  private async stageAll(
    fs: ReturnType<typeof getFs>,
    dir: string,
    prefix: string,
  ): Promise<void> {
    const entries = (await fs.promises.readdir(
      prefix ? `${dir}${prefix}` : dir,
    )) as string[];
    for (const entry of entries) {
      if (entry === ".git") continue;
      const relativePath = prefix ? `${prefix}/${entry}` : entry;
      const fullPath = `${dir}${relativePath}`;
      try {
        const stat = await fs.promises.stat(fullPath);
        if (stat.isDirectory()) {
          await this.stageAll(fs, dir, relativePath);
        } else {
          await git.add({ fs, dir, filepath: relativePath });
        }
      } catch {
        // Skip if stat fails
      }
    }
  }

  // --- Merge ---

  async merge(
    repoId: string,
    sourceBranch: string,
    targetBranch = "main",
  ): Promise<void> {
    const fs = getFs(repoId);
    await git.checkout({ fs, dir: DIR, ref: targetBranch });
    await git.merge({
      fs,
      dir: DIR,
      ours: targetBranch,
      theirs: sourceBranch,
      author: AUTHOR,
    });
  }

  // --- Branch diff ---

  async getBranchDiff(
    repoId: string,
    baseBranch: string,
    compareBranch: string,
  ): Promise<string> {
    const fs = getFs(repoId);
    try {
      // Get file list from compare branch
      const compareLog = await git.log({
        fs,
        dir: DIR,
        ref: compareBranch,
        depth: 1,
      });
      if (compareLog.length === 0) return "";

      const { tree: compareTree } = await git.readTree({
        fs,
        dir: DIR,
        oid: compareLog[0].oid,
      });

      const baseLog = await git.log({
        fs,
        dir: DIR,
        ref: baseBranch,
        depth: 1,
      });

      const diffs: string[] = [];
      for (const entry of compareTree) {
        if (entry.type !== "blob") continue;
        const newContent = await this.readBlobContent(fs, entry.oid);
        let oldContent = "";
        if (baseLog.length > 0) {
          oldContent = await this.readFileAtRef(fs, baseBranch, entry.path);
        }
        if (newContent !== oldContent) {
          diffs.push(
            createTwoFilesPatch(
              `a/${entry.path}`,
              `b/${entry.path}`,
              oldContent,
              newContent,
            ),
          );
        }
      }
      return diffs.join("\n");
    } catch {
      return "";
    }
  }

  // --- Read file at specific branch (without checkout) ---

  async readFileAtBranch(
    repoId: string,
    branch: string,
    filename: string,
  ): Promise<string | null> {
    const fs = getFs(repoId);
    try {
      return this.readFileAtRef(fs, branch, filename) || null;
    } catch {
      return null;
    }
  }

  // --- Helpers ---

  private async readBlobContent(
    fs: ReturnType<typeof getFs>,
    oid: string,
  ): Promise<string> {
    const { blob } = await git.readBlob({ fs, dir: DIR, oid });
    return new TextDecoder().decode(blob);
  }

  private async readFileAtRef(
    fs: ReturnType<typeof getFs>,
    ref: string,
    filepath: string,
  ): Promise<string> {
    // Resolve ref to oid
    let oid: string;
    if (ref.endsWith("~1")) {
      const baseRef = ref.replace("~1", "");
      const logs = await git.log({ fs, dir: DIR, ref: baseRef, depth: 2 });
      if (logs.length < 2) return "";
      oid = logs[1].oid;
    } else {
      const logs = await git.log({ fs, dir: DIR, ref, depth: 1 });
      if (logs.length === 0) return "";
      oid = logs[0].oid;
    }

    // Read the tree at this commit
    const { tree } = await git.readTree({ fs, dir: DIR, oid });
    const entry = tree.find((e) => e.path === filepath);
    if (!entry) return "";

    const { blob } = await git.readBlob({ fs, dir: DIR, oid: entry.oid });
    return new TextDecoder().decode(blob);
  }
}

export const gitService = new GitService();
