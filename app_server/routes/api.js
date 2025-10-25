
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Service = require('../models/Service');
const Review = require('../models/Review');
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../public/images/uploads/'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

// Default services data
const defaultServices = [
  {
    name: 'Community Food Bank',
    email: 'admin@foodbank.org',
    phone: '555-0123',
    serviceName: '🥗 Community Food Bank',
    description: 'Providing nutritious food assistance to families in need. We offer fresh produce, canned goods, and pantry staples to ensure no one goes hungry in our community.',
    location: '123 Community Center Dr, Hometown',
    organizer: 'Food Bank Volunteers',
    timing: 'Monday-Friday: 9AM-5PM, Saturday: 10AM-2PM',
    category: 'food',
    image: 'https://t3.ftcdn.net/jpg/02/52/38/80/360_F_252388016_KjPnB9vglSCuUJAumCDNbmMzGdzPAucK.jpg'
  },
  {
    name: 'Local Health Clinic',
    email: 'info@healthclinic.org',
    phone: '555-0124',
    serviceName: '🏥 Local Health Clinic',
    description: 'Comprehensive healthcare services including check-ups, vaccinations, and health screenings. Affordable care for uninsured and underinsured community members.',
    location: '456 Medical Plaza, Hometown',
    organizer: 'Community Health Partners',
    timing: 'Monday-Friday: 8AM-6PM, Saturday: 9AM-1PM',
    category: 'health',
    image: 'https://impeccabuild.com.au/wp-content/uploads/2020/07/Medical-Clinic-Interior-Design-Ideas-Medical-Fitouts-ImpeccaBuild-3-scaled.jpg'
  },
  {
    name: 'Tutoring Program',
    email: 'tutors@educationcenter.org',
    phone: '555-0125',
    serviceName: '📚 Tutoring Program',
    description: 'Free tutoring services for students of all ages. Our volunteer tutors help with homework, test preparation, and skill-building in various subjects.',
    location: '789 Education Ave, Hometown',
    organizer: 'Community Education Foundation',
    timing: 'Tuesday & Thursday: 4PM-7PM, Saturday: 10AM-2PM',
    category: 'education',
    image: 'https://www.tutordoctor.com/wp-content/uploads/2023/09/homeschool1.jpg'
  },
  {
    name: 'Environmental Cleanup',
    email: 'volunteers@greenearth.org',
    phone: '555-0126',
    serviceName: '🌿 Environmental Cleanup',
    description: 'Monthly community cleanup events to keep our neighborhoods beautiful and sustainable. Join us in making a positive impact on our environment.',
    location: 'Various locations around Hometown',
    organizer: 'Green Earth Initiative',
    timing: 'First Saturday of each month: 9AM-12PM',
    category: 'environment',
    image: 'https://media.istockphoto.com/id/1077156290/photo/people-cleaning-the-environment.jpg?s=612x612&w=0&k=20&c=XnZ7DdZ9Xo8r4rfCWicAXnSrF3QqGm58MFMidM-2z9A='
  },
  {
    name: 'Senior Care Services',
    email: 'care@seniorcenter.org',
    phone: '555-0127',
    serviceName: '👴 Senior Care Services',
    description: 'Companionship, assistance, and activities for seniors in our community. Transportation, meal delivery, and social activities to combat isolation.',
    location: '321 Senior Center Blvd, Hometown',
    organizer: 'Senior Care Network',
    timing: 'Monday-Friday: 10AM-4PM',
    category: 'senior',
    image: 'https://assistinghands.com/20/wp-content/uploads/sites/43/2019/09/Elderly-Care-near-La-Grange-IL.jpg'
  },
  {
    name: 'Adult Literacy Program',
    email: 'literacy@learningcenter.org',
    phone: '555-0128',
    serviceName: '✍️ Adult Literacy Program',
    description: 'Free literacy classes for adults looking to improve reading, writing, and basic computer skills. Patient, supportive environment for all levels.',
    location: '654 Learning Lane, Hometown',
    organizer: 'Community Literacy Council',
    timing: 'Monday & Wednesday: 6PM-8PM',
    category: 'literacy',
    image: 'https://cdn.britannica.com/57/102257-050-AD29F06D/Project-Literacy-adult-education-course-Watertown-Mass.jpg'
  }
];

// Initialize default services
const initializeDefaultServices = async () => {
  try {
    const count = await Service.countDocuments();
    if (count === 0) {
      await Service.insertMany(defaultServices);
      console.log('Default services initialized');
    }
  } catch (error) {
    console.error('Error initializing default services:', error);
  }
};

// Initialize default admin
const initializeDefaultAdmin = async () => {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const defaultAdmin = new Admin({
        username: 'admin',
        email: 'admin@communityhub.com',
        password: 'admin123',
        role: 'superadmin'
      });
      await defaultAdmin.save();
      console.log('Default admin created');
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
};

// GET /api/services - Fetch all services
router.get('/services', async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/services - Add new service
router.post('/services', upload.single('image'), async (req, res) => {
  try {
    let imagePath = undefined;

    console.log('Request body keys:', Object.keys(req.body));
    console.log('Has file:', !!req.file);

    // Handle image upload or URL
    if (req.file) {
      // File upload selected - multer processed the file
      imagePath = `/images/uploads/${req.file.filename}`;
      console.log('Service creation - using uploaded image file:', imagePath);
    } else if (req.body.imageUrl && req.body.imageUrl.trim()) {
      // URL provided through separate imageUrl field
      imagePath = req.body.imageUrl.trim();
      console.log('Service creation - using image URL from imageUrl field:', imagePath);
    }

    // Remove imageUrl from req.body since we only want image field
    const { imageUrl, ...serviceData } = req.body;

    // Set the final image field
    serviceData.image = imagePath;

    console.log('Creating service with data:', {
      ...serviceData,
      imageSet: !!serviceData.image
    });

    const service = new Service(serviceData);
    await service.save();

    console.log('Service created successfully:', service._id);
    res.status(201).json(service);
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(400).json({ error: error.message });
  }
});

// GET /api/services/:id - Fetch specific service with reviews
router.get('/services/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const reviews = await Review.find({ serviceId: req.params.id }).sort({ createdAt: -1 });
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

    res.json({
      service,
      reviews,
      averageRating: Math.round(averageRating * 10) / 10
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/services/:id - Update service (admin only)
router.put('/services/:id', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const serviceId = req.params.id;
    console.log('Updating service:', serviceId);
    console.log('Request body:', req.body);
    console.log('Has file:', !!req.file);

    const updateData = { ...req.body, updatedAt: new Date() };

    // Handle image upload or URL
    if (req.file) {
      // New file uploaded
      updateData.image = `/images/uploads/${req.file.filename}`;
      console.log('Service update - using new uploaded image:', updateData.image);
    } else if (req.body.imageUrl && req.body.imageUrl.trim()) {
      // URL provided through imageUrl field
      updateData.image = req.body.imageUrl.trim();
      console.log('Service update - using image URL from imageUrl field:', updateData.image);
    } else {
      // No image changes requested - keep existing
      console.log('Service update - keeping existing image');
      delete updateData.image;
    }

    const service = await Service.findByIdAndUpdate(
      serviceId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    console.log('Service updated successfully:', service._id);
    res.json(service);
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/services/:id - Delete service (admin only)
router.delete('/services/:id', verifyToken, async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Delete associated reviews
    await Review.deleteMany({ serviceId: req.params.id });

    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/reviews - Add new review
router.post('/reviews', async (req, res) => {
  try {
    const review = new Review(req.body);
    await review.save();
    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/reviews/:serviceId - Get reviews for a service
router.get('/reviews/:serviceId', async (req, res) => {
  try {
    const reviews = await Review.find({ serviceId: req.params.serviceId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/login - Admin login
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email, isActive: true });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await admin.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await admin.updateLastLogin();

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/services - Get all services for admin panel
router.get('/admin/services', verifyToken, async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize default data function
const initializeDefaultData = async () => {
  try {
    await initializeDefaultServices();
    await initializeDefaultAdmin();
  } catch (error) {
    console.error('Error initializing default data:', error);
  }
};

// Initialize default data
router.post('/initialize', async (req, res) => {
  try {
    await initializeDefaultServices();
    await initializeDefaultAdmin();
    res.json({ message: 'Default data initialized successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// Export the initialize function for use in app.js
module.exports.initializeDefaultData = initializeDefaultData;

module.exports = router;
