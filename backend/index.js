require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');


const connectDB = require('./config/database');
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'https://ai-meeting-tracker-nu.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});
connectDB();

app.use(helmet());

app.use(cors({ origin: 'https://ai-meeting-tracker-nu.vercel.app', credentials: true }));
app.options('*', cors());

app.use(express.json());
app.use(morgan('dev'));
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/meetings', require('./routes/meetingRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
// app.use('/api/users', require('./routes/userRoutes'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

// require('./sockets/taskSocket')(io);
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});