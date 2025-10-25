const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  serviceName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  organizer: {
    type: String,
    required: true,
    trim: true
  },
  timing: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: [
      'food', 'health', 'education', 'environment', 'senior', 'literacy',
      'youth', 'women', 'mentalhealth', 'sports', 'arts', 'animalcare',
      'tech', 'disaster', 'housing', 'legal', 'volunteer', 'recycling',
      'blooddonation', 'childcare', 'communityevents', 'transport',
      'library', 'healthawareness', 'career', 'skilltraining', 'gardening',
      'fundraising', 'recreation', 'disability', 'wastemanagement',
      'climateaction', 'cultural', 'music', 'elderly', 'language',
      'bloodpressure', 'sugarcare', 'vaccination', 'reforestation',
      'coaching', 'emergencyservices'
    ],
    default: 'education'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
serviceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Service', serviceSchema);
