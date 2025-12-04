import mongoose from 'mongoose';

// Mock database for testing when MongoDB is not available
const mockUsers = new Map();
const mockDoctors = new Map();

const connectDB = async () => {
  try {
    // Try to connect to MongoDB first
    if (process.env.MONGODB_URI && process.env.MONGODB_URI !== 'mock') {
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    } else {
      console.log('Using mock database for testing');
    }
  } catch (error) {
    console.log('MongoDB connection failed, using mock database for testing');
  }
};

export default connectDB;
export { mockUsers, mockDoctors };
