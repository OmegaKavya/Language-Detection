import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// No proxy and no API: the model runs in the browser, so there is no server
// side to talk to.
export default defineConfig({ plugins: [react()] });
