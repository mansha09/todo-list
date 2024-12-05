const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const Task = require('./models/Task'); // Import Task model

dotenv.config(); // Load environment variables

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON requests

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected!'))
  .catch((err) => console.error('MongoDB connection failed:', err));

// Root Test Route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Backend is working!' });
});

// Routes
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use your email service (e.g., Gmail, Outlook, etc.)
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASS, // Your email password
  },
});

// Cron Job: Check for tasks due within the next hour
cron.schedule('* * * * *', async () => {
  console.log('Running scheduled task notification job...');
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

  try {
    // Fetch tasks due within the next hour
    const tasksDueSoon = await Task.find({
      dueDate: { $gte: now, $lte: oneHourFromNow },
    }).populate('userId'); // Ensure user details (e.g., email) are available

    tasksDueSoon.forEach((task) => {
      // Send email notification
      transporter.sendMail(
        {
          from: process.env.EMAIL_USER, // Sender address
          to: task.userId.email, // User email
          subject: `Reminder: Task "${task.title}" is due soon!`,
          text: `Hello ${task.userId.name},\n\nThis is a reminder that your task "${task.title}" is due at ${new Date(
            task.dueDate
          ).toLocaleString()}.\n\nPlease complete it on time!`,
        },
        (error, info) => {
          if (error) {
            console.error(`Failed to send email: ${error.message}`);
          } else {
            console.log(`Email sent: ${info.response}`);
          }
        }
      );

      // Optional: Add SMS notification (if using Twilio)
      // sendSmsNotification(task.userId.phone, task.title, task.dueDate);
    });
  } catch (error) {
    console.error('Error during notification job:', error);
  }
});

// Start the Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Function to send SMS (Optional: Twilio setup)
const sendSmsNotification = (phone, title, dueDate) => {
  const client = require('twilio')(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  client.messages
    .create({
      body: `Reminder: Task "${title}" is due at ${new Date(
        dueDate
      ).toLocaleString()}.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    })
    .then((message) => console.log(`SMS sent: ${message.sid}`))
    .catch((error) => console.error(`Failed to send SMS: ${error.message}`));
};
