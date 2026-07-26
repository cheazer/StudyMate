# 🧪 Quick Test Checklist - Course Learning System

## Before Testing: Setup

- [ ] Install Python deps: `pip install moviepy google-cloud-text-to-speech pillow`
- [ ] Set Google Cloud credentials: `export GOOGLE_APPLICATION_CREDENTIALS="..."`
- [ ] Verify `.env.local` has GEMINI_API_KEY and Supabase keys
- [ ] Run `npm run dev` - server should start on localhost:3000

---

## Frontend Tests

### Test 1: Courses Navigation
- [ ] Go to `/courses` in browser
- [ ] See 6 course cards with colors
- [ ] Each card shows emoji, name, progress bar
- [ ] Click a course card → navigate to `/courses/linear-algebra`

### Test 2: Course Detail Page Loads
- [ ] Course header displays correctly
- [ ] Two tabs visible: "📚 Roadmap & Progress" and "🤖 AI Study Guide"
- [ ] Overview tab shows:
  - [ ] Course roadmap checklist (milestones)
  - [ ] Progress percentage
  - [ ] Hours tracked this week
  - [ ] Study hours input field
- [ ] No console errors

### Test 3: Study Hours Logging
- [ ] Enter "2.5" in hours input field
- [ ] Click "Log" button
- [ ] Should show success message or toast
- [ ] Check Supabase `streak_log` table → new entry added

### Test 4: Chat Tab
- [ ] Click "🤖 AI Study Guide" tab
- [ ] See chat interface with empty message history
- [ ] Message input field is visible
- [ ] "Send" button is clickable

---

## API Tests (curl commands)

### Test 5: Course Chat - Generate Notes
```bash
curl -X POST http://localhost:3000/api/course-chat \
  -H "Content-Type: application/json" \
  -d '{
    "courseName": "Linear Algebra",
    "message": "Create comprehensive notes on eigenvalues"
  }'
```
**Expected Response:**
```json
{
  "text": "Here are comprehensive notes on eigenvalues...",
  "contentType": "notes",
  "content": { "notes": "..." }
}
```

- [ ] Response is successful (200)
- [ ] Contains "text", "contentType", "content"
- [ ] contentType is "notes"

### Test 6: Course Chat - Generate Questions
```bash
curl -X POST http://localhost:3000/api/course-chat \
  -H "Content-Type: application/json" \
  -d '{
    "courseName": "Linear Algebra",
    "message": "Create practice questions on matrix multiplication"
  }'
```
**Expected:**
- [ ] Response 200
- [ ] contentType is "questions"
- [ ] Contains 5 MCQ questions

### Test 7: Course Chat - Generate Video Script
```bash
curl -X POST http://localhost:3000/api/course-chat \
  -H "Content-Type: application/json" \
  -d '{
    "courseName": "Linear Algebra",
    "message": "Generate a video about vectors"
  }'
```
**Expected:**
- [ ] Response 200
- [ ] contentType is "video"
- [ ] Script is 5-10 minutes worth of narration

### Test 8: Study Hours Logging API
```bash
curl -X POST http://localhost:3000/api/study-hours \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "linear-algebra",
    "hoursStudied": 3.5
  }'
```
**Expected:**
- [ ] Response 200
- [ ] Returns success: true
- [ ] Message confirms hours logged

### Test 9: Get Weekly Study Hours
```bash
curl http://localhost:3000/api/study-hours?userId=demo-user
```
**Expected:**
- [ ] Returns array of daily study records
- [ ] Shows total hours for the week
- [ ] Each entry has date and minutes_studied

### Test 10: Video Generation (Optional - Requires Google Creds)
```bash
curl -X POST http://localhost:3000/api/generate-video \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Eigenvalues Explained",
    "script": "An eigenvalue is a scalar value. In linear algebra, eigenvalues are important for understanding matrix transformations. They tell us how much a transformation scales vectors."
  }'
```
**Expected:**
- [ ] If credentials set: Returns videoPath (generates video with TTS)
- [ ] If credentials missing: Returns helpful error about dependencies
- [ ] Video file should be in `./generated_videos/` directory

---

## Database Tests

### Test 11: Verify Supabase Tables
- [ ] Go to Supabase Dashboard
- [ ] Check `streak_log` table → new entries from hours logging
- [ ] Each entry has: user_id, date, minutes_studied
- [ ] No errors in row-level security

---

## Success Criteria

| Test | Status | Notes |
|------|--------|-------|
| Course cards clickable | ✓/✗ | Routes to /courses/[id] |
| Detail page loads | ✓/✗ | No 404 or console errors |
| Hours logging works | ✓/✗ | Saved to Supabase |
| Chat detects "notes" | ✓/✗ | Gemma generates notes |
| Chat detects "questions" | ✓/✗ | 5 MCQ questions |
| Chat detects "video" | ✓/✗ | Video script returned |
| Video gen (if Google set) | ✓/✗ | MP4 file created |

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| 404 on course page | Ensure `app/courses/[id]/page.tsx` exists |
| Chat returns empty | Check GEMINI_API_KEY in `.env.local` |
| Hours not saving | Check Supabase RLS policies, verify table exists |
| Video gen fails | Install Python deps: `pip install moviepy google-cloud-text-to-speech` |
| TTS no audio | Set GOOGLE_APPLICATION_CREDENTIALS environment variable |
| Chat sends but no response | Check server logs for Gemma API errors |

---

## Full End-to-End Test

1. Go to `/courses`
2. Click on "Linear Algebra" course
3. Verify roadmap loads
4. Log 2.5 hours of study
5. Switch to AI Study Guide tab
6. Type: "Create notes on eigenvalues"
7. Should see generated notes appear in chat
8. Type: "Make 5 practice questions"
9. Should see MCQ questions
10. Type: "Generate a short video about vectors"
11. Should see video script (if Python deps installed, will generate actual video)

**If all tests pass → System is working! 🎉**

---

## Performance Notes

- First Gemma call: ~2-5 seconds (API latency)
- Subsequent calls: ~1-3 seconds
- Video generation: 5-10 minutes (depends on script length)
- Study hours logging: <500ms

---

## Manual Testing in Browser Dev Tools

```javascript
// Test course chat
fetch('/api/course-chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    courseName: 'Linear Algebra',
    message: 'Create notes on determinants'
  })
}).then(r => r.json()).then(console.log);

// Test hours logging
fetch('/api/study-hours', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    courseId: 'linear-algebra',
    hoursStudied: 2.5
  })
}).then(r => r.json()).then(console.log);
```

---

**All tests passing? You're ready to use StudyMate! 🚀📚**
