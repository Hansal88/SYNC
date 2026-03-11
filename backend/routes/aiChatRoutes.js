const express = require('express');
const axios = require('axios');
const AIChat = require('../models/AIChat');
const Tutor = require('../models/Tutor');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

/*
POST /api/ai-chat/send
*/
router.post('/send', verifyToken, async (req, res) => {
try {

```
const { message, role } = req.body;
const userId = req.userId;

if (!message) {
  return res.status(400).json({ message: 'Message is required' });
}

let chat = await AIChat.findOne({ userId });

if (!chat) {
  chat = new AIChat({
    userId,
    messages: []
  });
}

chat.messages.push({
  role: 'user',
  content: message
});

/*
===== Tutor Recommendation Logic =====
*/

let tutors = [];

if (role === "learner") {

  const keywords = message.toLowerCase();

  const tutorDocs = await Tutor.find({
    skills: { $regex: keywords, $options: "i" }
  })
    .limit(5)
    .select("name skills rating bio");

  tutors = tutorDocs.map(t => ({
    name: t.name,
    skills: t.skills,
    rating: t.rating,
    bio: t.bio
  }));
}

/*
===== Send to n8n =====
*/

const response = await axios.post(
  process.env.N8N_WEBHOOK_URL,
  {
    message,
    role,
    tutors
  }
);

const aiText =
  response.data.text ||
  response.data.reply ||
  response.data.response ||
  "AI could not generate a response.";

chat.messages.push({
  role: 'assistant',
  content: aiText
});

await chat.save();

res.json({
  response: aiText
});
```

} catch (error) {

```
console.error("AI Chat Error:", error);

res.status(500).json({
  message: "Internal server error"
});
```

}
});

/*
GET CHAT HISTORY
*/
router.get('/history', verifyToken, async (req, res) => {

try {

```
const chat = await AIChat.findOne({ userId: req.userId });

if (!chat) {
  return res.json({ messages: [] });
}

res.json({
  messages: chat.messages
});
```

} catch (error) {

```
console.error(error);

res.status(500).json({
  message: "Internal server error"
});
```

}

});

module.exports = router;
