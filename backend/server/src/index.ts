import "dotenv/config";
import { getEnv } from "./lib/env.js";
import { connectDb } from "./db.js";
import { createApp } from "./app.js";

async function main() {
  const env = getEnv(process.env as Record<string, unknown>);
  await connectDb(env.MONGODB_URI);

  const app = createApp(env);
  app.listen(env.PORT, () => {
    console.log(`[server] listening on http://localhost:${env.PORT}`);
  });
}

main().catch((err) => {
  // Node 24 can crash when inspecting some error objects (util.inspect).
  // Log safely so the real startup error is visible.
  const e = err as unknown;
  if (e && typeof e === "object" && "stack" in e && typeof (e as { stack?: unknown }).stack === "string") {
    console.error((e as { stack: string }).stack);
  } else {
    console.error(String(e));
  }
  process.exit(1);
});

