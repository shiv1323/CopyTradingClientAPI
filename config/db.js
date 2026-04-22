import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const options = {
      // Connection Pool Settings
      maxPoolSize: process.env.MONGODB_MAX_POOL_SIZE, // Maximum number of connections in the pool
      minPoolSize: process.env.MONGODB_MIN_POOL_SIZE, // Minimum number of connections in the pool

      // Timeout Settings
      serverSelectionTimeoutMS: process.env.MONGODB_SERVER_SELECTION_TIMEOUT, // How long to try selecting a server
      socketTimeoutMS: process.env.MONGODB_SOCKET_TIMEOUT, // How long a send or receive on a socket can take before timeout
      connectTimeoutMS: process.env.MONGODB_CONNECT_TIMEOUT, // How long to wait for initial connection

      // Heartbeat Settings
      heartbeatFrequencyMS: process.env.MONGODB_HEARTBEAT_FREQUENCY, // Frequency of server monitoring
      
      // Write Concern
      retryWrites: true, // Retry writes that fail due to transient errors
      w: "majority", // Write concern - wait for majority of replica set members

      // Other Settings
      family: 4, // Use IPv4, skip trying IPv6
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Connection Pool: min=${options.minPoolSize}, max=${options.maxPoolSize}`);
    
    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB reconnected successfully");
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("MongoDB connection closed through app termination");
      process.exit(0);
    });

  } catch (error) {
    console.error("Database connection error:", error.message);
    process.exit(1);
  }
};

