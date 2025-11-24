import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/UserModel.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@devenir.shop' });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      existingAdmin.role = 'admin';
      existingAdmin.isEmailVerified = true;
      await existingAdmin.save();
      console.log('Updated admin role');
      await mongoose.disconnect();
      return;
    }

    // Create new admin user
    const hashedPassword = await bcrypt.hash('Admin@123456', 10);
    
    const adminUser = new User({
      username: 'admin_devenir',
      email: 'admin@devenir.shop',
      phone: '0123456789',
      password: hashedPassword,
      role: 'admin',
      isEmailVerified: true,
      firstName: 'Admin',
      lastName: 'Devenir',
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully:');
    console.log('Email: admin@devenir.shop');
    console.log('Username: admin_devenir');
    console.log('Password: Admin@123456');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

createAdminUser();
