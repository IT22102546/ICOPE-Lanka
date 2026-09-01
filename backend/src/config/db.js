import mongoose from "mongoose";

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is missing in environment");
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log("MongoDB connected");
  } catch (error) {
    const message = String(error?.message || "").toLowerCase();

    if (message.includes("authentication failed")) {
      throw new Error(
        "MongoDB authentication failed. Verify the Atlas Database Access username/password, URL-encode special characters in the password, and confirm your IP is allowed in Atlas Network Access."
      );
    }

    if (message.includes("could not connect to any servers") || message.includes("isn't whitelisted") || message.includes("ip that isn't whitelisted")) {
      throw new Error(
        "MongoDB Atlas connection failed. Check Atlas Network Access, add your current public IP to the whitelist, and confirm the cluster is reachable from this network."
      );
    }

    if (message.includes("querysrv enotfound") || message.includes("enotfound")) {
      throw new Error(
        "MongoDB SRV lookup failed. The Atlas hostname in MONGODB_URI does not resolve from this machine. Verify the cluster URI in Atlas, confirm the host name is correct, and check your DNS/network connection."
      );
    }

    throw error;
  }
};

export default connectDB;
