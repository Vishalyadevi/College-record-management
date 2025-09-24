import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const connectDB = async () => {
  try {
    // Get the MongoDB URI from environment variables
    const mongoURI = process.env.MONGODB_URI;

    // Ensure the URI is available
    if (!mongoURI) {
      throw new Error("MongoDB URI is not defined in environment variables.");
    }

    // Connect to MongoDB using mongoose
    const conn = await mongoose.connect(mongoURI)

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1); // Exit with failure
  }
};

export default connectDB;
