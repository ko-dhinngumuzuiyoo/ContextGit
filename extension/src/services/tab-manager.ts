import type { Platform, TabConnection } from "../types/workflow";

class TabManager {
  private connections = new Map<number, TabConnection>();

  register(tabId: number, platform: Platform, url: string): void {
    this.connections.set(tabId, {
      tabId,
      platform,
      url,
      status: "connected",
      lastSeen: new Date().toISOString(),
    });
  }

  unregister(tabId: number): void {
    this.connections.delete(tabId);
  }

  getByPlatform(platform: Platform): TabConnection | undefined {
    for (const conn of this.connections.values()) {
      if (conn.platform === platform && conn.status !== "disconnected") {
        return conn;
      }
    }
    return undefined;
  }

  getByTabId(tabId: number): TabConnection | undefined {
    return this.connections.get(tabId);
  }

  updateStatus(
    tabId: number,
    status: TabConnection["status"],
  ): void {
    const conn = this.connections.get(tabId);
    if (conn) {
      conn.status = status;
      conn.lastSeen = new Date().toISOString();
    }
  }

  listConnected(): TabConnection[] {
    return Array.from(this.connections.values()).filter(
      (c) => c.status !== "disconnected",
    );
  }

  getPlatformForTab(tabId: number): Platform | undefined {
    return this.connections.get(tabId)?.platform;
  }
}

export const tabManager = new TabManager();
