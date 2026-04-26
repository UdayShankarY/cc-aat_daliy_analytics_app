import "dotenv/config";
import { getEnv } from "./lib/env.js";
import { connectDb } from "./db.js";
import { createApp } from "./app.js";
async function main() {
    const env = getEnv(process.env);
    await connectDb(env.MONGODB_URI);
    const app = createApp(env);
    app.listen(env.PORT, () => {
        console.log(`[server] listening on http://localhost:${env.PORT}`);
    });
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
