import { defineConfig } from "vite";

const base = process.env.VITE_BASE_PATH ?? (process.env.GITHUB_ACTIONS === "true" ? "/kprj/" : "/");

export default defineConfig({
  base,
});
