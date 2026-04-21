const express = require('express');
const router = express.Router();
const {
  getMeetings,
  getMeetingById,
  createMeeting,
  saveMeetingNotes,
  extractMeetingItems,
} = require('../controllers/meetingController');
const { protect } = require('../middleware/authMiddleware');

// All meeting routes require authentication
// protect middleware runs before every route here
router.use(protect);

router.route('/').get(getMeetings).post(createMeeting);
router.route('/:id').get(getMeetingById);
router.route('/:id/notes').put(saveMeetingNotes);
router.route('/:id/extract').post(extractMeetingItems);

module.exports = router;