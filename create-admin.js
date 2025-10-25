const mongoose = require('mongoose');
const Admin = require('./app_server/models/Admin');

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://aksh:aksh123@cluster1.zhb0w2z.mongodb.net/Project0', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Create new admin
    const newAdmin = new Admin({
      username: 'admin',
      email: 'admin@communityhub.com',
      password: 'admin123',
      role: 'superadmin'
    });

    await newAdmin.save();
    console.log('Admin created successfully!');
    console.log('Email: admin@communityhub.com');
    console.log('Password: admin123');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

