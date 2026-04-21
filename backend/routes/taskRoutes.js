const express = require('express');
const router = express.Router();
const {
  getTasks,
  updateTaskStatus,
  assignTask,
  addComment,
  getAnalytics,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getTasks);
router.get('/analytics', getAnalytics);
router.put('/:id/status', updateTaskStatus);
router.put('/:id/assign', assignTask);
router.post('/:id/comments', addComment);

module.exports = router;