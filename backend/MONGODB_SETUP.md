# MongoDB Setup Guide: Atlas + Compass

## 📌 MongoDB Atlas Setup (Cloud Database)

### 1. Create MongoDB Atlas Account
- Visit [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- Click "Try Free"
- Sign up with email or Google account

### 2. Create a Cluster
- After login, click "Create Deployment"
- Choose "Free" tier
- Select a region close to you
- Click "Create"
- Wait 5-10 minutes for cluster creation

### 3. Create Database User
- In the left sidebar, click "Database Access"
- Click "Add New Database User"
- Username: `admin` (or your preferred name)
- Password: Create a strong password (save it!)
- Click "Add User"

### 4. Allow Network Access
- In left sidebar, click "Network Access"
- Click "Add IP Address"
- Click "Allow Access from Anywhere" (for development)
- Confirm with "0.0.0.0/0"
- Click "Confirm"

### 5. Get Connection String
- Click "Database" in left sidebar
- Click "Connect" button on your cluster
- Choose "Drivers"
- Copy the connection string (looks like below)
- Replace `<username>` with your username
- Replace `<password>` with your password
- Replace `tutoring-db` with your database name

**Format:**
```
mongodb+srv://username:password@cluster0.abcde.mongodb.net/tutoring-db?retryWrites=true&w=majority
```

### 6. Update .env File
```
MONGODB_ATLAS_URI=mongodb+srv://admin:yourpassword@cluster0.abcde.mongodb.net/tutoring-db?retryWrites=true&w=majority
```

---

## 🗂️ MongoDB Compass Setup (Local Database)

### 1. Download MongoDB Community Server
- Visit [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
- Select your OS (Windows)
- Download the installer
- Run the installer and follow the steps
- Default installation path: `C:\Program Files\MongoDB\Server\7.0\`

### 2. MongoDB Service (Automatic)
- MongoDB should start automatically as a Windows service
- To verify, search "Services" in Windows
- Look for "MongoDB Server" - should be "Running"

### 3. Download MongoDB Compass
- Visit [mongodb.com/products/compass](https://www.mongodb.com/products/compass)
- Click "Download Compass"
- Install it like a normal application
- Launch Compass

### 4. Connect to Local MongoDB in Compass
- In Compass, click "New Connection"
- Connection string: `mongodb://localhost:27017`
- Click "Connect"
- You should see "admin", "config", "local" databases

### 5. Create Your Database
- In Compass, click "Create Database"
- Database name: `tutoring-db`
- Collection name: `users`
- Click "Create Database"

### 6. Update .env File (to use local Compass)
```
MONGODB_COMPASS_URI=mongodb://localhost:27017/tutoring-db
```

---

## 🔄 How Your App Uses Both Databases

### Default (MongoDB Atlas - Cloud)
```javascript
// Uses MONGODB_ATLAS_URI
const mongoURI = process.env.MONGODB_ATLAS_URI;
```

### To Switch to Local Compass
Uncomment in `config/db.js`:
```javascript
// const mongoURI = process.env.MONGODB_COMPASS_URI;
```

---

## 🚀 Running Your Backend

### Installation
```bash
cd backend
npm install
```

### Run Development Server
```bash
npm run dev
```
(Uses nodemon for auto-restart)

### Run Production Server
```bash
npm start
```

### Test if Running
- Visit `http://localhost:5000`
- Should see JSON with API endpoints

---

## 🧪 Testing API Endpoints

### Using Postman or curl:

#### Create a User (POST)
```
POST http://localhost:5000/api/users
Body (JSON):
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "tutor",
  "bio": "I teach Math"
}
```

#### Get All Users (GET)
```
GET http://localhost:5000/api/users
```

#### Get Single User (GET)
```
GET http://localhost:5000/api/users/{userId}
```

#### Update User (PUT)
```
PUT http://localhost:5000/api/users/{userId}
Body (JSON):
{
  "name": "Updated Name",
  "bio": "Updated bio"
}
```

#### Delete User (DELETE)
```
DELETE http://localhost:5000/api/users/{userId}
```

---

## ✅ Verification

### In MongoDB Compass (Local):
1. Open Compass
2. Connect to `mongodb://localhost:27017`
3. Navigate to `tutoring-db` → `users`
4. You should see your created users here

### In MongoDB Atlas (Cloud):
1. Go to [atlas.mongodb.com](https://www.mongodb.com/cloud/atlas)
2. Click "Browse Collections"
3. Navigate to `tutoring-db` → `users`
4. You should see your created users here

---

## 🐛 Troubleshooting

### "MongoDB Connection Error"
- Check if MongoDB service is running (Windows Services)
- Verify .env file has correct URI
- Check MongoDB Atlas network access (0.0.0.0/0)

### "User already exists" error
- Each email must be unique
- Use different email in POST request

### "MongoDB is not running" (Compass error)
- Start MongoDB service: Services → MongoDB Server → Start
- Or restart computer

### "Cannot connect to Atlas"
- Verify password has no special characters (or URL-encode them)
- Check IP address is allowed (0.0.0.0/0)
- Verify database user was created

---

## 📚 Next Steps
1. Connect your React frontend to backend
2. Add authentication (JWT tokens)
3. Hash passwords using bcryptjs
4. Add more models (Messages, Courses, etc.)
