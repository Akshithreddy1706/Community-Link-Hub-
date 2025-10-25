const express = require('express');
const router = express.Router();
const ctrlLocations = require('../controllers/locations'); // <-- fix here
const ctrlOthers = require('../controllers/others');
/* Locations pages */
router.get('/', ctrlLocations.homelist);
router.get('/location', ctrlLocations.locationInfo);
router.get('/location/review/new', ctrlLocations.addReview);
// ...existing code...
router.get('/main', (req, res) => {
  res.render('main');
});
// ...existing code...
/* Other pages */
router.get('/about', ctrlOthers.about);
module.exports = router;