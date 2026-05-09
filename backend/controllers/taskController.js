const ActionItem = require('../models/ActionItem');
const Meeting = require('../models/Meeting');

// GET /api/tasks?meetingId=xxx - get tasks for a meeting
const getTasks = async (req, res) => {
  try {
    const { meetingId } = req.query;
    let filter = {};
    
    if (meetingId) {
      filter.meetingId = meetingId;
    } else {
      const userMeetings = await Meeting.find({ createdBy: req.user._id }).select('_id');
      const meetingIds = userMeetings.map(m => m._id);
      filter.meetingId = { $in: meetingIds };
    }

    const tasks = await ActionItem.find(filter)
      .populate('assignee', 'name email avatar')
      .sort({ createdAt: 1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/tasks/:id/status - update task status
const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'in-progress', 'done'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const task = await ActionItem.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('assignee', 'name email');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Emit socket event so all connected clients update in real-time
    req.io.to(task.meetingId.toString()).emit('task:updated', {
      taskId: task._id,
      status: task.status,
    });

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/tasks/:id/assign - assign task to a user
const assignTask = async (req, res) => {
  try {
    const { userId } = req.body;

    const task = await ActionItem.findByIdAndUpdate(
      req.params.id,
      { assignee: userId },
      { new: true }
    ).populate('assignee', 'name email');

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/tasks/:id/comments - add a comment to a task
const addComment = async (req, res) => {
  try {
    const { text } = req.body;

    const task = await ActionItem.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Push a new comment into the comments array
    task.comments.push({ text, author: req.user._id });
    await task.save();

    // Populate the author field in comments
    await task.populate('comments.author', 'name email');

    res.status(201).json(task.comments[task.comments.length - 1]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/tasks/analytics - get stats for dashboard
const getAnalytics = async (req, res) => {
  try {
    const userMeetings = await Meeting.find({ createdBy: req.user._id }).select('_id');
    const meetingIds = userMeetings.map(m => m._id);

    // MongoDB aggregation pipeline - powerful way to calculate stats
    const stats = await ActionItem.aggregate([
      {
        $match: { meetingId: { $in: meetingIds } }
      },
      {
        // $group groups documents and calculates values
        $group: {
          _id: '$status', // group by status field
          count: { $sum: 1 }, // count how many in each group
        },
      },
    ]);

    const riskItems = await ActionItem.countDocuments({ 
      meetingId: { $in: meetingIds },
      riskFlag: true, 
      status: { $ne: 'done' } 
    });
    const overdueItems = await ActionItem.countDocuments({
      meetingId: { $in: meetingIds },
      dueDate: { $lt: new Date() }, // dueDate is in the past
      status: { $ne: 'done' },
    });

    res.json({ stats, riskItems, overdueItems });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTasks, updateTaskStatus, assignTask, addComment, getAnalytics };