# 🎓 StudyMate Course Learning System

## Overview

Complete course learning system with:
- ✅ Course detail pages with roadmap & progress tracking
- ✅ Study hours logging (track daily study)
- ✅ AI-powered study guide (Gemma chatbot)
- ✅ Adaptive content generation (notes, videos, questions)
- ✅ Video generation with TTS narration
- ✅ Difficulty-based content adjustment

---

## 🏗️ Architecture

### Frontend Flow

```
Courses Page
    ↓ (click course card)
Course Detail Page
    ├─ Roadmap & Progress Tab
    │   ├─ Show course roadmap
    │   ├─ Display progress percentage
    │   ├─ Log study hours today
    │   └─ View generated study materials
    │
    └─ AI Study Guide Tab
        └─ Gemma Chat Interface
            ├─ "Create guided notes on..."
            ├─ "Generate a video about..."
            └─ "Create practice questions for..."
```

### Backend Flow

```
User Message (Chat)
    ↓
/api/course-chat
    ├─ Detect content type (notes/video/questions)
    ├─ Extract topic from message
    ├─ Call Gemma AI to generate content
    └─ Return response with content

Study Hours
    ↓
/api/study-hours
    └─ Log to Supabase streak_log table

Video Generation
    ↓
/api/generate-video
    └─ Call Python backend (scripts/video_generator.py)
        ├─ Generate TTS audio from script
        ├─ Create slides with MoviePy
        ├─ Composite video + audio
        └─ Return video file path
```

---

## 📁 New Files Created

### Frontend
- `app/courses/[id]/page.tsx` - Course detail page
- `app/courses/page.tsx` - Updated courses list with navigation
- `app/api/course-chat/route.ts` - Gemma-powered chat API
- `app/api/study-hours/route.ts` - Study hours logging API
- `app/api/generate-video/route.ts` - Video generation API

### Backend
- `scripts/video_generator.py` - Python video generation with TTS

---

## 🎯 Key Features

### 1. Course Detail Page

**Left Section - Roadmap**
- Shows course milestones with checkboxes
- Tracks which items are completed
- Visual progress indication

**Right Section - Stats**
- Hours studied this week vs. goal
- Course progress percentage
- Quick hours logging input
- Recent study materials

**Tabs**
- **Overview**: Roadmap + Progress
- **AI Study Guide**: Gemma chatbot

### 2. Gemma-Powered Study Guide

**Auto-detects Content Type:**

```javascript
User says: "Create notes on eigenvalues"
→ Detects: "notes"
→ Calls Gemma to generate guided notes
→ Shows preview with "📖 Read Notes" button

User says: "Generate a practice video for vectors"
→ Detects: "video"
→ Calls Python backend to create video with TTS
→ Shows preview with "▶ Watch Video" button

User says: "Make practice questions on linear transformations"
→ Detects: "questions"
→ Calls Gemma to generate MCQs
→ Shows preview with "Start Quiz" button
```

### 3. Study Hours Logging

```typescript
// POST /api/study-hours
{
  courseId: "linear-algebra",
  hoursStudied: 2.5,
  date: "2026-07-26T00:00:00Z"
}

// Response
{
  success: true,
  hoursStudied: 2.5,
  date: "2026-07-26"
}

// Data saved to Supabase streak_log table
```

### 4. Video Generation with TTS

```
Script from Gemma
    ↓
Python Backend (scripts/video_generator.py)
    ├─ Convert script to audio (Google TTS)
    ├─ Create title slide
    ├─ Split script into content slides
    ├─ Composite video clips
    ├─ Mix in audio track
    └─ Output MP4 file

Result: Professional educational video with narration
```

---

## 🚀 How to Use

### For Users (Frontend)

1. **Go to Courses Page**
   - Click "Courses" in top navigation
   - See all your courses with progress bars

2. **Enter a Course**
   - Click on any course card → Course detail page

3. **View Roadmap**
   - Click "📚 Roadmap & Progress" tab
   - See course milestones
   - Log today's study hours
   - Check recent study materials

4. **Use AI Study Guide**
   - Click "🤖 AI Study Guide" tab
   - Chat with Gemma AI
   - Examples:
     - "Create comprehensive notes on eigenvalues"
     - "Generate a 10-minute video explaining matrix decomposition"
     - "Make 5 practice questions about vector spaces"

### API Examples

**Generate Study Notes:**
```bash
curl -X POST http://localhost:3000/api/course-chat \
  -H "Content-Type: application/json" \
  -d '{
    "courseName": "Linear Algebra",
    "message": "Create guided notes on eigenvalues and eigenvectors"
  }'
```

**Log Study Hours:**
```bash
curl -X POST http://localhost:3000/api/study-hours \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "linear-algebra",
    "hoursStudied": 2.5
  }'
```

**Generate Video:**
```bash
curl -X POST http://localhost:3000/api/generate-video \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Eigenvalues Explained",
    "script": "An eigenvalue is a scalar value that... [video script here]"
  }'
```

---

## 🔧 Setup & Dependencies

### Node.js Dependencies
Already included in `package.json`:
- Next.js
- React
- Zod (validation)

### Python Dependencies

Install for video generation:
```bash
pip install moviepy google-cloud-text-to-speech pillow
```

Set up Google Cloud TTS:
1. Create Google Cloud project
2. Enable Text-to-Speech API
3. Create service account key
4. Set environment variable:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"
   ```

---

## 📊 Data Flow

### Study Hours Tracking

```
User logs 2.5 hours
    ↓
POST /api/study-hours
    ↓
Upsert to streak_log table
    ├─ user_id
    ├─ date
    └─ minutes_studied (150)
    ↓
Next week's dashboard updates with new hours
```

### Content Generation with Difficulty Adjustment

```
User completes MCQ quiz
    ↓
Record attempt in attempts table
    ├─ topic_id
    ├─ mcq_id
    ├─ correct (true/false)
    └─ attempted_at
    ↓
Calculate mastery metrics (lib/difficulty-adjustment.ts)
    ├─ accuracy = correct / total
    ├─ difficulty = too-easy | just-right | too-hard
    └─ pacing_multiplier = 0.6 | 1.0 | 1.8
    ↓
Next roadmap generation uses adjusted pacing
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Chat returns empty response | Check Gemma API key in `.env.local` |
| Video generation fails | Install Python dependencies: `pip install moviepy google-cloud-text-to-speech` |
| Study hours not saving | Verify Supabase credentials and RLS policies |
| TTS audio doesn't play | Check Google Cloud credentials and API is enabled |
| 404 on course detail page | Ensure `[id]` folder exists in `app/courses/` |

---

## 🎯 Next Steps

- [ ] Connect Supabase auth to track real user IDs
- [ ] Add progress animation when studying
- [ ] Store generated videos in cloud storage
- [ ] Add quiz attempt tracking and scoring
- [ ] Implement difficulty-based roadmap regeneration
- [ ] Add video streaming instead of file download
- [ ] Create flashcard UI for notes
- [ ] Add milestone completion notifications

---

## 📝 Code Examples

### Creating Custom Content Type

```typescript
// In /api/course-chat/route.ts
if (contentType === "custom-type") {
  const response = await callGemmaJSON<{ content: string }>({
    systemInstruction: "Your custom instruction",
    prompt: `Generate custom content for: ${topic}`,
    responseSchema: {
      type: "object",
      properties: { content: { type: "string" } },
      required: ["content"],
    },
  });
  content = response.content;
  responseText = `Generated custom content...`;
  return NextResponse.json({ text: responseText, contentType: "custom-type", content });
}
```

### Logging Study Hours from Frontend

```typescript
async function logHours() {
  const res = await fetch("/api/study-hours", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      courseId: "linear-algebra",
      hoursStudied: 2.5,
    }),
  });
  
  const data = await res.json();
  if (res.ok) {
    // Success - update UI
    console.log(`✅ Logged ${data.hoursStudied} hours`);
  }
}
```

---

## ✨ Success Indicators

- ✅ Courses page shows clickable course cards
- ✅ Course detail page loads with roadmap and stats
- ✅ Chat accepts messages and generates content
- ✅ Study hours are logged to Supabase
- ✅ Videos generate with TTS narration
- ✅ Practice questions display in chat
- ✅ Notes show in preview modal

**All working = Complete course learning system! 🎉**
