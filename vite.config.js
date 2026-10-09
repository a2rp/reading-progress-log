import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
    base: "/reading-progress-log/",
    build: { sourcemap: false },
    plugins: [react()],
});
