const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();

// Enable CORS
const corsOptions = {
  origin: '*', // Allow all origins (you can restrict this in production)
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Middleware for parsing JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection string (Replace with your actual MongoDB connection string)
const mongoURI = 'mongodb://memonote:y3cWZyx3A7oNcycRLfQHAwo7czsi1twfvSYIrDi9l0KledCmXUWnHNMoQed3YpiuEcGHS8ikbOzWACDb6OQB9Q==@memonote.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@memonote@';

// Connect to MongoDB
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit the application if the database connection fails
  });

// Define a schema for a note
const noteSchema = new mongoose.Schema(
  {
    noteId: { type: String, required: true, unique: true },
    content: { type: String, required: true },
  },
  { timestamps: true } // Automatically manage createdAt and updatedAt fields
);

// Create a model for the note
const Note = mongoose.model('Note', noteSchema);

// Route to save or update a note
app.post('/save-note', async (req, res) => {
  const { noteId, content } = req.body;

  if (!noteId) {
    return res.status(400).json({ success: false, message: 'noteId is required' });
  }

  if (!content.trim()) {
    // If content is empty or only whitespace, delete the note entry if it exists
    try {
      await Note.findOneAndDelete({ noteId });  // Delete the note if content is empty
      return res.status(200).json({ success: true, message: 'Note deleted due to empty content' });
    } catch (error) {
      console.error('Error deleting note:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  try {
    let note = await Note.findOne({ noteId });

    if (note) {
      // Update existing note
      note.content = content;
      await note.save();
    } else {
      // Create new note
      note = new Note({
        noteId,
        content,
      });
      await note.save();
    }

    const noteUrl = `${req.protocol}://${req.get('host')}/get-note/${note.noteId}`;
    res.status(200).json({ success: true, noteId: note.noteId, url: noteUrl });
  } catch (error) {
    console.error('Error saving note:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Route to delete a note by noteId
app.delete('/delete-note/:noteId', async (req, res) => {
  const { noteId } = req.params;

  try {
    const note = await Note.findOneAndDelete({ noteId });
    
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    res.status(200).json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Define a route for the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Define a route for displaying a note
app.get('/get-note/:noteId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'note.html'));
});

// Define a route to fetch note content as JSON
app.get('/api/get-note/:noteId', async (req, res) => {
  const { noteId } = req.params;

  try {
    const note = await Note.findOne({ noteId });

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    res.status(200).json({ success: true, content: note.content });
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Handle undefined routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
