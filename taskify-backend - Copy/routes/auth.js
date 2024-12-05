const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import User model
const nodemailer = require('nodemailer'); // Import Nodemailer

const router = express.Router();

// Forgot Password Route
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found!' });
    }

    // Generate a password reset token (you can use a more secure token generation here)
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Set up the transporter using email credentials from .env file
    const transporter = nodemailer.createTransport({
      service: 'gmail', // You can use other services like SendGrid, Mailgun, etc.
      auth: {
        user: process.env.EMAIL_USER, // Your email from .env file
        pass: process.env.EMAIL_PASS, // Your password from .env file
      },
    });

    // Compose the reset email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Link',
      text: `You requested a password reset. Please click the following link to reset your password: \n\n http://localhost:3000/reset-password?token=${resetToken} \n\nThe link will expire in 1 hour.`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Password reset link sent!' });
  } catch (error) {
    console.error('Forgot Password Error:', error.message);
    res.status(500).json({ message: 'Something went wrong!' });
  }
});

// Reset Password Route (You need this to reset the password after clicking the link)
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found!' });
    }

    // Hash the new password and save it
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully!' });
  } catch (error) {
    console.error('Reset Password Error:', error.message);
    res.status(500).json({ message: 'Something went wrong!' });
  }
});

// Signup Route
router.post('/signup', async (req, res) => {
  const { name, email, password, description } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists!' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save the user with the description field
    const user = new User({ name, email, password: hashedPassword, description });
    await user.save();

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ user: { id: user._id, name: user.name, email: user.email, description: user.description }, token });
  } catch (error) {
    console.error('Signup Error:', error.message);
    res.status(500).json({ message: 'Something went wrong!' });
  }
});


// Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found!' });
    }

    // Compare the password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials!' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ user: { id: user._id, name: user.name, email: user.email }, token });
  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ message: 'Something went wrong!' });
  }
});

module.exports = router;
