import mongoose from 'mongoose';
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }
  try {
    await mongoose.connect(uri, { });
    console.log('DB connected');
  } catch (err) {
    console.error('DB connection error:', err.message);
    process.exit(1);
  }
};
export default connectDB;
