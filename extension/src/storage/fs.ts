import LightningFS from "@isomorphic-git/lightning-fs";

const fsInstances = new Map<string, LightningFS>();

export function getFs(repoId: string): LightningFS {
  if (!fsInstances.has(repoId)) {
    fsInstances.set(repoId, new LightningFS(`contextgit-${repoId}`));
  }
  return fsInstances.get(repoId)!;
}

export function deleteFs(repoId: string): void {
  const fs = fsInstances.get(repoId);
  if (fs) {
    fs.init(`contextgit-${repoId}`, { wipe: true });
    fsInstances.delete(repoId);
  }
  indexedDB.deleteDatabase(`contextgit-${repoId}`);
}
