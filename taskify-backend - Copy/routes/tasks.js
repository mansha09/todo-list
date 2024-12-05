const express = require('express');
const auth = require('../middleware/auth'); // Import the authentication middleware
const Task = require('../models/Task'); // Import the Task model

const router = express.Router();

// Create a Task
router.post('/', auth, async (req, res) => {
  const { title, description, dueDate } = req.body;

  try {
    const task = new Task({
      userId: req.user, // User ID from middleware
      title,
      description,
      dueDate
    });

    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong!' });
  }
});

// Get All Tasks
router.get('/', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong!' });
  }
});

// Update a Task
router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { title, description, dueDate, status } = req.body;

  try {
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { title, description, dueDate, status },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found!' });
    }

    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update task!' });
  }
});


// Delete a Task
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;

  try {
    const deletedTask = await Task.findByIdAndDelete(id);

    if (!deletedTask) {
      return res.status(404).json({ message: 'Task not found!' });
    }

    res.status(200).json({ message: 'Task deleted successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete task!' });
  }
});



router.get('/filter/:status', auth, async (req, res) => {
  const { status } = req.params;
  try {
    const tasks = await Task.find({ userId: req.user, status });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tasks!' });
  }
});








module.exports = router;
