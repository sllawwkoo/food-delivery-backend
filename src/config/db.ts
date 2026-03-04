import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI not found in .env");
  }

  try {
    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log("✅ MongoDB connected");

  } catch (error) {
    console.error("❌ Mongo connection error:", error);
    process.exit(1);
  }
}


export async function disconnectDB() {
  await mongoose.connection.close();
  console.log("🛑 MongoDB disconnected");
}