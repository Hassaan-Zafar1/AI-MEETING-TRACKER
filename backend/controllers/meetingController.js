const Meeting = require('../models/Meeting');
const ActionItem = require('../models/ActionItem');
const { extractActionItems } = require('../utils/aiService');
const { scheduleReminder } = require('../jobs/reminderQueue');

// GET /api/meetings - get all meetings for current user
const getMeetings = async (req, res) => {
  try {
    // Find meetings where the user is creator OR participant
    // .sort({ createdAt: -1 }) = newest first
    const meetings = await Meeting.find({
      $or: [
        { createdBy: req.user._id },
        { participants: req.user._id },
      ],
    })
      .populate('createdBy', 'name email') // replace createdBy id with actual user data
      .populate('participants', 'name email')
      .sort({ createdAt: -1 });

    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/meetings/:id - get single meeting with its action items
const getMeetingById = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('participants', 'name email');

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Fetch all action items for this meeting
    const actionItems = await ActionItem.find({ meetingId: meeting._id })
      .populate('assignee', 'name email')
      .sort({ createdAt: 1 });

    res.json({ meeting, actionItems });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/meetings - create a new meeting
const createMeeting = async (req, res) => {
  try {
    const { title, date, participants } = req.body;

    const meeting = await Meeting.create({
      title,
      date,
      participants: participants || [],
      createdBy: req.user._id,
    });

    // Populate before sending back
    await meeting.populate('createdBy', 'name email');

    res.status(201).json(meeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/meetings/:id/notes - save raw meeting notes
const saveMeetingNotes = async (req, res) => {
  try {
    const { rawNotes } = req.body;

    const meeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      { rawNotes },
      { new: true } // return the updated document
    );

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    res.json(meeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/meetings/:id/extract - THE MAIN AI ROUTE
// Sends notes to AI, saves extracted action items, emits socket events
const extractMeetingItems = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    if (!meeting.rawNotes || meeting.rawNotes.trim() === '') {
      return res.status(400).json({ message: 'No notes found. Please save notes first.' });
    }

    // Call our AI service
    const { summary, actionItems } = await extractActionItems(
      meeting.rawNotes,
      meeting.date.toISOString()
    );

    // Save the AI-generated summary to the meeting
    meeting.summary = summary;
    meeting.isProcessed = true;
    await meeting.save();

    // Delete old action items if re-extracting
    await ActionItem.deleteMany({ meetingId: meeting._id });

    // Save all extracted action items to the database
    const savedItems = await ActionItem.insertMany(
      actionItems.map((item) => ({
        ...item,
        meetingId: meeting._id,
      }))
    );

    // Schedule reminders for items with due dates
    // (Bull queue handles this in the background)
    for (const item of savedItems) {
      if (item.dueDate) {
        await scheduleReminder(item);
      }
    }

    // Emit a Socket.IO event so other connected users see the new items instantly
    // req.io is the Socket.IO instance we attached in index.js
    req.io.to(meeting._id.toString()).emit('tasks:created', savedItems);

    res.json({ summary, actionItems: savedItems });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMeetings,
  getMeetingById,
  createMeeting,
  saveMeetingNotes,
  extractMeetingItems,
};