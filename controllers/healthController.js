import mongoose from "mongoose";

// Health Check Controller
export const healthCheck = async (req, res) => {
  try {
    // Check Database Connection Status
    const dbState = mongoose.connection.readyState;
    // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
    const dbStatus = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'][dbState];

    res.status(200).json({
      success: true,
      message: 'Service is healthy',
      serviceStatus: 'Running',
      databaseStatus: dbStatus,
      uptime: process.uptime(),
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Service is not healthy',
      error: error.message,
    });
  }
};