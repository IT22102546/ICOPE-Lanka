import mongoose from "mongoose";

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is missing in environment");
  }

  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected");
  } catch (error) {
    if (error && typeof error.message === "string" && error.message.toLowerCase().includes("authentication failed")) {
      throw new Error(
        "MongoDB authentication failed. Verify the Atlas Database Access username/password, URL-encode special characters in the password, and confirm your IP is allowed in Atlas Network Access."
      );
    }

    throw error;
  }
};

export default connectDB;
