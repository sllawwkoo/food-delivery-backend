import "dotenv/config";
import { app } from "./app";
import { connectDB, disconnectDB } from "./config/db";

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

start();

process.on("SIGINT", async () => {
  console.log("🛑 Gracefully shutting down...");
  await disconnectDB();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await disconnectDB();
  process.exit(0);
});