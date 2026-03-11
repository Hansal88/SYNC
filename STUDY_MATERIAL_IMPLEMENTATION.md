# Study Material Module - API Documentation & Implementation Guide

## 📋 Overview

The Study Material module is a production-grade file management system for tutoring platforms. Tutors can create folders, upload educational content (videos, presentations, notes), and learners can access shared materials.

---

## 🗂️ Backend Architecture

### Database Schemas

#### **StudyFolder.js**
```javascript
{
  title: String (required),
  description: String (optional),
  createdBy: ObjectId (Tutor ID, required),
  courseId: String (optional),
  icon: String (default: '📁'),
  isPublic: Boolean (default: true),
  fileCount: Number (default: 0),
  createdAt: Date,
  updatedAt: Date
}
```

#### **StudyFile.js**
```javascript
{
  folderId: ObjectId (required),
  uploadedBy: ObjectId (Tutor ID, required),
  fileName: String (required),
  fileType: String (enum: 'video', 'ppt', 'note', required),
  fileSize: Number (required),
  fileUrl: String (required),
  mimeType: String (optional),
  visibleToLearners: Boolean (default: true),
  duration: Number (for videos, in seconds),
  downloads: Number (default: 0),
  views: Number (default: 0),
  createdAt: Date,
  updatedAt: Date
}
```

### File Upload Configuration

**Size Limits:**
- Videos: 100MB (mp4, mkv)
- PPTs: 50MB (ppt, pptx)
- Notes: 50MB (pdf, doc, docx)

**Storage Path:**
- `/backend/uploads/study-material/videos/`
- `/backend/uploads/study-material/ppts/`
- `/backend/uploads/study-material/notes/`

---

## 🔗 REST API Endpoints

### Folder Operations

#### **CREATE FOLDER** (Tutor only)
```
POST /api/study-material/folders
Authorization: Bearer {token}

Request Body:
{
  "title": "JavaScript Basics",
  "description": "Introduction to JavaScript",
  "courseId": "CS101",
  "icon": "📚"
}

Response:
{
  "message": "Folder created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "JavaScript Basics",
    "createdBy": "507f1f77bcf86cd799439012",
    "fileCount": 0,
    "createdAt": "2026-01-24T10:30:00Z"
  }
}
```

#### **GET ALL FOLDERS**
```
GET /api/study-material/folders
Authorization: Bearer {token}

Response:
{
  "message": "Folders retrieved successfully",
  "count": 5,
  "data": [
    { folder objects },
    ...
  ]
}

Logic:
- Tutors see their own folders
- Learners see all public folders
```

#### **GET FOLDER BY ID**
```
GET /api/study-material/folders/:folderId
Authorization: Bearer {token}

Response:
{
  "message": "Folder retrieved",
  "data": { folder object }
}
```

#### **UPDATE FOLDER** (Owner only)
```
PUT /api/study-material/folders/:folderId
Authorization: Bearer {token}

Request Body:
{
  "title": "Updated Title",
  "description": "New description",
  "isPublic": true,
  "icon": "📖"
}

Response: Updated folder object
```

#### **DELETE FOLDER** (Owner only)
```
DELETE /api/study-material/folders/:folderId
Authorization: Bearer {token}

Action: Deletes folder and all files within it
Response:
{
  "message": "Folder and all its files deleted successfully"
}
```

### File Operations

#### **UPLOAD FILE** (Tutor only)
```
POST /api/study-material/files/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
- file: <file object>
- folderId: "507f1f77bcf86cd799439011"

Response:
{
  "message": "File uploaded successfully",
  "data": {
    "fileId": "507f1f77bcf86cd799439013",
    "fileName": "lecture1.mp4",
    "fileType": "video",
    "fileUrl": "/api/uploads/study-material/videos/lecture1-1234567890.mp4",
    "fileSize": 52428800
  }
}
```

#### **GET FILES BY FOLDER**
```
GET /api/study-material/files/:folderId
Authorization: Bearer {token}

Response:
{
  "message": "Files retrieved successfully",
  "count": 3,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "fileName": "lecture1.mp4",
      "fileType": "video",
      "fileSize": 52428800,
      "fileUrl": "/api/uploads/study-material/videos/lecture1-1234567890.mp4",
      "views": 45,
      "downloads": 12,
      "uploadedBy": { name, email },
      "createdAt": "2026-01-24T10:30:00Z"
    },
    ...
  ]
}

Logic:
- Tutors see all files in their folders
- Learners see only visibleToLearners: true files
```

#### **DELETE FILE** (Uploader only)
```
DELETE /api/study-material/files/:fileId
Authorization: Bearer {token}

Action: Deletes file from storage and database, decrements folder fileCount
Response:
{
  "message": "File deleted successfully"
}
```

#### **RECORD FILE VIEW**
```
POST /api/study-material/files/:fileId/view
Authorization: Bearer {token}

Response:
{
  "message": "View recorded",
  "views": 46
}
```

---

## 🎨 Frontend Architecture

### Component Structure

```
StudyMaterial.jsx (Main page)
├── CreateFolderModal.jsx (Create folder form)
├── FolderView.jsx (Folder contents)
│   ├── UploadFileModal.jsx (File upload form)
│   ├── VideoPlayerModal.jsx (Video streaming)
│   └── FileCard.jsx (File display)
└── FolderCard.jsx (Folder preview)
```

### Page Routes

```
Tutor Routes:
- /TutorDashboard/study-material (Main page)

Learner Routes:
- /dashboard/learner/study-material (Main page)
```

### Features by Role

**Tutor:**
- ✅ Create folders
- ✅ Edit/delete own folders
- ✅ Upload videos, PPTs, notes
- ✅ Delete own files
- ✅ View upload analytics (views, downloads)

**Learner:**
- ✅ View all public folders
- ✅ Download files
- ✅ Stream videos
- ✅ View file metadata
- ❌ Upload, delete, or edit

---

## 🔐 Security & Authorization

### Backend Middleware

**`requireTutor`** - Enforces tutor-only access
- Validates JWT token
- Checks userRole === 'tutor'
- Returns 403 if not tutor

**`verifyStudyMaterial`** - Verifies authentication
- Validates JWT token
- Allows both tutors and learners

**File Upload Validation**
- MIME type checking
- File size limits by type
- Extension validation
- Duplicate prevention via unique filenames

### Authorization Rules

```
Folder Creation:   Tutor only
Folder Update:     Owner (tutor) only
Folder Delete:     Owner (tutor) only
Folder View:       Owner (tutor) or public (learners)

File Upload:       Tutor only
File Delete:       Uploader (tutor) only
File Download:     Owner (tutor) or visibleToLearners (learners)
File View:         Same as download
```

---

## 📊 Analytics & Tracking

Each file tracks:
- **views**: Number of times viewed/streamed
- **downloads**: Number of times downloaded
- **uploadedBy**: Creator's user ID
- **createdAt**: Upload timestamp

Learners can see file statistics when viewing folders.

---

## 🚀 Performance Optimizations

1. **Indexing**: MongoDB indexes on frequently queried fields
   - `folderId + visibleToLearners`
   - `uploadedBy`
   - `fileType`
   - `createdAt`

2. **Pagination**: Ready for future pagination (can add `limit` and `skip`)

3. **Static File Serving**: Express static middleware for direct file access

4. **Progress Tracking**: Real-time upload progress on frontend

---

## 🧪 Testing Checklist

### Tutor Functionality
- [ ] Create folder with all fields
- [ ] Create folder with minimal fields
- [ ] Update folder details
- [ ] Delete folder (confirms deletion of files)
- [ ] Upload video (< 100MB)
- [ ] Upload PPT (< 50MB)
- [ ] Upload note (< 50MB)
- [ ] Reject file > size limit
- [ ] Reject unsupported file type
- [ ] Delete own file
- [ ] Cannot delete other's file (403)

### Learner Functionality
- [ ] View all public folders
- [ ] Cannot see private folders (403)
- [ ] View files in folder
- [ ] Download file
- [ ] Stream video
- [ ] See view count
- [ ] Cannot upload (403)
- [ ] Cannot delete (403)
- [ ] Cannot create folder (403)

### UI/UX
- [ ] Folder cards display correctly
- [ ] Upload progress shows percentage
- [ ] Error messages clear
- [ ] Video player works full-screen
- [ ] File downloads with correct name
- [ ] Drag-drop file selection works
- [ ] Responsive on mobile/tablet

---

## 🛠️ Configuration

### Environment Variables (if needed)
```
UPLOAD_DIR=/backend/uploads/study-material
MAX_FILE_SIZE=100000000
JWT_SECRET=your-secret-key
```

### CORS Settings (already configured)
```
Origin: http://localhost:5173
Methods: GET, POST, PUT, DELETE, OPTIONS
Headers: Content-Type, Authorization
```

---

## 📝 Example Workflows

### Tutor Workflow
1. Navigate to Study Material
2. Click "New Folder"
3. Enter folder details (title, description, course ID, icon)
4. Click "Create Folder"
5. Select folder
6. Click "Add File to Folder"
7. Choose file (video/ppt/note)
8. Wait for upload to complete
9. File appears in folder view
10. Learners can now access it

### Learner Workflow
1. Navigate to Study Material
2. See all tutor's public folders
3. Click folder to view
4. See files grouped by type (videos, PPTs, notes)
5. Click "Play" for video or "Download" for documents
6. File streams/downloads

---

## 🐛 Error Handling

All endpoints return:
- **Success**: 200/201 with message and data
- **Bad Request**: 400 with error message
- **Unauthorized**: 401 "No token provided"
- **Forbidden**: 403 "Access denied"
- **Not Found**: 404 "Folder/File not found"
- **Server Error**: 500 with error message

Example error response:
```json
{
  "message": "PPT files must not exceed 50MB",
  "error": "File size validation failed"
}
```

---

## 🎯 Hackathon-Ready Checklist

✅ Schema design complete
✅ All CRUD endpoints implemented
✅ Role-based access control enforced
✅ File upload with validation
✅ React components styled with Tailwind
✅ API service fully integrated
✅ Routing configured
✅ Error handling implemented
✅ Analytics tracking ready
✅ Video streaming functional
✅ File download support
✅ Responsive design
✅ Dark mode support
✅ Loading states
✅ Progress indicators
✅ Modal components
✅ Smooth animations

---

## 📞 Support & Maintenance

### Future Enhancements
- Pagination for large file lists
- Search/filter by file type
- Bulk upload
- File preview (PDF, documents)
- Sharing links with expiry
- File permission management
- Storage quota per tutor
- CDN integration for large files

---

**Module Status: PRODUCTION-READY** ✅

Last Updated: January 24, 2026
