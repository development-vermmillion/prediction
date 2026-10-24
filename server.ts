/**
 * Custom Next.js server.
 *
 * Next serves the pages and API routes; the same HTTP server also hosts Socket.IO, which runs
 * the shared game rounds. This must be a long-running Node process (not serverless).
 */
import { createServer } from "node:http";
import next from "next";
import { bootstrap } from "./src/server/bootstrap";
import { attachSocket } from "./src/server/socket";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME ?? "0.0.0.0";
const port = Number(process.env.PORT ?? 3000);

async function main() {
  const app = next({ dev, hostname, port });
  const handleRequest = app.getRequestHandler();
  await app.prepare();
  const handleUpgrade = app.getUpgradeHandler();

  bootstrap();

  const server = createServer((req, res) => {
    handleRequest(req, res);
  });
  attachSocket(server);
  // Let Next handle its own websocket upgrades (HMR in dev); Socket.IO handles /socket.io.
  server.on("upgrade", (req, socket, head) => {
    if (!req.url?.startsWith("/socket.io")) handleUpgrade(req, socket, head);
  });

  server.listen(port, hostname, () => {
    console.log(`> Predicators ready on http://localhost:${port} (${dev ? "development" : "production"})`);
  });

  const shutdown = () => {
    console.log("Shutting down…");
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000).unref();
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
