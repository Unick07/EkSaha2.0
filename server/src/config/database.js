import mongoose from "mongoose";

export async function connectDatabase() {
  if (!process.env.MONGODB_URI) {
    return false;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    return true;
  } catch (error) {
    console.warn("MongoDB unavailable; public frontend remains available:", error.message);
    return false;
  }
}
