import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// IMPORTANT: if you deploy to GitHub Pages as a project site
// (https://<you>.github.io/<repo-name>/), set base to "/<repo-name>/".
// If you deploy to a custom domain or a user/org root page, leave it as "/".
export default defineConfig({
  plugins: [react()],
  base: "/impact-water-stock/",
});
