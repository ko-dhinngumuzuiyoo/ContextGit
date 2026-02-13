import { defineConfig } from "wxt";

export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "ContextGit",
    description:
      "Manage shared context for LLMs with Git-like version control",
    version: "0.1.0",
    permissions: ["sidePanel", "storage", "activeTab"],
    side_panel: {
      default_path: "sidepanel.html",
    },
    action: {
      default_title: "Open ContextGit",
    },
  },
});
