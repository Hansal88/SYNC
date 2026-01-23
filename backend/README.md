# Backend Setup Complete! 🎉

## What You Now Have

Your backend is now fully set up and running! Here's the structure:

```
backend/
├── config/
│   └── db.js              # MongoDB connection setup
├── models/
│   └── User.js            # User schema and model
├── routes/
│   └── userRoutes.js      # CRUD operations for users
├── server.js              # Main server file
├── package.json           # Dependencies
├── .env                   # Environment variables (UPDATE THIS!)
├── .gitignore             # Git ignore rules
└── MONGODB_SETUP.md       # Detailed MongoDB guide
```

---

## 🔥 IMPORTANT: Next Steps to Get Working

### Step 1: Set Up MongoDB Atlas (Cloud)

**🎯 You MUST do this to connect to cloud database!**

1. Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a cluster (takes 5-10 min)
4. Create a database user with strong password
5. Add your IP to network access (use 0.0.0.0/0 for development)
6. Get your connection string
7. **UPDATE YOUR `.env` FILE:**

```env
MONGODB_ATLAS_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/tutoring-db?retryWrites=true&w=majority
```

**Replace:**
- `username` → your MongoDB user (e.g., admin)
- `password` → your strong password
- `cluster0.xxxxx` → your actual cluster name from Atlas

### Step 2: Save and Test

After updating `.env`, the server will auto-restart (nodemon watches for changes).

You should see:
```
✅ MongoDB Connected Successfully!
Database: tutoring-db
Host: cluster0.xxxxx.mongodb.net
```

---

## 📝 Current Server Status

**Server:** Running on `http://localhost:5000`
**Status:** Waiting for MongoDB connection
**Terminal ID:** d9bf59cc-8a5c-43ae-b0c2-613246a93bf1

### Available Endpoints (once MongoDB is connected):

```
POST   /api/users              # Create a new user
GET    /api/users              # Get all users
GET    /api/users/:id          # Get one user
PUT    /api/users/:id          # Update a user
DELETE /api/users/:id          # Delete a user

GET    /                       # API Documentation
GET    /health                 # Health check
```

---

## 🧪 Quick Testing

### Option 1: Using Postman
1. Download [Postman](https://www.postman.com/downloads/)
2. Create a new request
3. Method: `POST`
4. URL: `http://localhost:5000/api/users`
5. Body (JSON):
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepass123",
  "role": "tutor",
  "bio": "I teach Mathematics"
}
```
6. Click Send

### Option 2: Using curl (Command Line)
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"John Doe\",\"email\":\"john@example.com\",\"password\":\"pass123\",\"role\":\"tutor\",\"bio\":\"I teach Math\"}"
```

---

## 🗂️ MongoDB Compass (Local Database)

If you want to also use local MongoDB:

1. Download from [mongodb.com/products/compass](https://www.mongodb.com/products/compass)
2. Install MongoDB Community Server
3. In Compass, connect to `mongodb://localhost:27017`
4. To use it in your backend, uncomment in `config/db.js`:

```javascript
// const mongoURI = process.env.MONGODB_COMPASS_URI;
```

And comment out:
```javascript
// const mongoURI = process.env.MONGODB_ATLAS_URI;
```

---

## 📚 File Explanations

### `.env` - Environment Variables
Stores sensitive info (passwords, API keys) separately from code.

### `config/db.js` - Database Connection
Handles MongoDB connection. Loads URI from `.env` and connects using Mongoose.

### `models/User.js` - Data Schema
Defines what a User looks like:
- name (required)
- email (unique, required)
- password (required)
- role (learner or tutor)
- bio (optional)
- timestamps (auto created)

### `routes/userRoutes.js` - API Endpoints
CRUD operations:
- **CREATE**: POST /api/users - Add new user
- **READ**: GET /api/users - Get all users
- **READ**: GET /api/users/:id - Get specific user
- **UPDATE**: PUT /api/users/:id - Modify user
- **DELETE**: DELETE /api/users/:id - Remove user

### `server.js` - Main Application
Express app setup, middleware, routes, and server start.

---

## ⚠️ Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "querySrv ENOTFOUND" | Update your `.env` with correct MongoDB Atlas URI |
| "User already exists" | Each email must be unique, use different email |
| "Cannot reach localhost:5000" | Server might have crashed, check terminal output |
| "Cannot connect to MongoDB" | Check .env, Atlas network access, and database user exists |

---

## 🚀 Once Everything Works

1. **Test creation:** POST a new user
2. **Test reading:** GET all users
3. **Check Compass or Atlas:** Your data should appear in the database
4. **Test update:** PUT to modify a user
5. **Test delete:** DELETE a user

Then connect your React frontend! 🎨

---

## 🔗 Connecting Frontend to Backend

In your React app, use this base URL for API calls:

```javascript
const API_BASE_URL = 'http://localhost:5000/api';

// Example fetch
fetch(`${API_BASE_URL}/users`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name, email, password, role, bio })
})
```

---

## 📖 Learn More

- [Express.js Docs](https://expressjs.com/)
- [Mongoose Docs](https://mongoosejs.com/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [REST API Best Practices](https://restfulapi.net/)

---

## ✅ Checklist

- [ ] MongoDB Atlas account created
- [ ] Cluster created
- [ ] Database user created
- [ ] Network access allowed (0.0.0.0/0)
- [ ] Connection string copied
- [ ] `.env` file updated with correct URI
- [ ] Server shows "✅ MongoDB Connected Successfully!"
- [ ] POST /api/users works and creates user in database
- [ ] GET /api/users retrieves all users
