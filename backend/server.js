const express = require('express');
const { config } = require('dotenv');
const Anthropic = require('@anthropic-ai/sdk');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Load environment variables
config();

const app = express();
const port = process.env.PORT || 3010;

app.use(cors());
app.use(express.json());

// Set up multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

app.post('/api/message', upload.single('file'), async (req, res) => {
  const { question } = req.body;
  const file = req.file;

  try {
    // Initialize messages array
    const messages = [];

    // Add file content if provided
    if (file) {
      const fileContent = fs.readFileSync(path.join(__dirname, file.path), 'utf-8');
      messages.push({ role: "user", content: fileContent });
    } else
      if (question) {
        messages.push({ role: "user", content: question });
      }

    // If neither file nor question is provided
    if (messages.length === 0) {
      return res.status(400).json({ error: 'No file or question provided' });
    }

    // Send the message to Anthropic API
    const msg = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 1024,
      messages: messages,
    });

    res.json(msg);
  } catch (error) {
    console.error('Error fetching message:', error.message || error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message || error });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
