const express = require('express');
const router = express.Router();

const stravaController = require('../controllers/stravaController');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validation');
const { stravaLimiter } = require('../middleware/rateLimiter');
const { stravaTokenSchema } = require('../validators/authValidators');

// Apply auth middleware to all Strava routes
router.use(authMiddleware);

// Apply rate limiting to Strava API endpoints
router.use(stravaLimiter);

// Strava integration routes
router.post('/exchange_token', validate(stravaTokenSchema), stravaController.exchangeToken);
router.get('/activities', stravaController.getActivities);
router.get('/activities/refresh', stravaController.refreshActivities);

module.exports = router;