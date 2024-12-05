const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  description: { type: String, required: true }, // Add description field
  phone: { type: String }, // Optional for SMS notifications
  resetPasswordToken: { type: String }, // Token for password reset
  resetPasswordExpires: { type: Date }, // Token expiry time
});

module.exports = mongoose.model('User', userSchema);
