## ✅ Quick Verification Checklist

### Step 1: Start Dev Server
```bash
npm run dev
```
**Wait for:** `ready - started server on 0.0.0.0:3000`

---

### Step 2: Test Each API (Open NEW Terminal)

#### **Test 1: Profile API**
```bash
curl -X POST http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "courseName": "Linear Algebra",
    "weeklyGoalHours": 5,
    "biggestChallenge": "Understanding eigenvalues",
    "preferredStudyTime": "morning",
    "preferredFormat": "mixed"
  }'
```

**✅ Success if you see:**
```json
{
  "id": "uuid-here",
  "user_id": "some-uuid",
  "course_name": "Linear Algebra",
  "weekly_goal_hours": 5,
  ...
}
```

**❌ If you see error:**
- Check `.env.local` has `SUPABASE_SERVICE_ROLE_KEY`
- Check Supabase connection

---

#### **Test 2: Roadmap API (Uses Gemma!)**
```bash
curl -X POST http://localhost:3000/api/roadmap \
  -H "Content-Type: application/json" \
  -d '{
    "topicId": "test-roadmap-1",
    "topic": "Eigenvalues and Eigenvectors",
    "courseName": "Linear Algebra"
  }'
```

**✅ Success if you see:**
```json
{
  "topicId": "test-roadmap-1",
  "milestones": [
    {
      "id": "uuid",
      "title": "Understand eigenvalue definition and notation",
      "estimatedMinutes": 25,
      "done": false
    },
    {
      "id": "uuid",
      "title": "Learn to compute eigenvalues from characteristic polynomial",
      "estimatedMinutes": 30,
      "done": false
    },
    ...
  ]
}
```

**❌ If you see error:**
- Check `.env.local` has `GEMINI_API_KEY` and `GEMMA_MODEL`
- Check internet connection (Gemma needs API call to Google)
- Check Gemma API key is valid

---

#### **Test 3: Study Pack API (Uses Gemma!)**
```bash
curl -X POST http://localhost:3000/api/study-pack \
  -H "Content-Type: application/json" \
  -d '{
    "topicId": "test-study-1",
    "topic": "Eigenvalues and Eigenvectors",
    "sourceText": "Lecture 9: An eigenvalue λ and eigenvector v of matrix A satisfy: Av = λv. The characteristic polynomial is det(A - λI) = 0. Example: For A = [[4, 2], [1, 3]], eigenvalues are λ₁ = 5 and λ₂ = 2."
  }'
```

**✅ Success if you see:**
```json
{
  "topicId": "test-study-1",
  "notes": "Eigenvalues are scalar values that represent the scaling factors...",
  "flashcards": [
    {
      "front": "What is an eigenvalue?",
      "back": "A scalar λ such that Av = λv for eigenvector v"
    },
    ...
  ],
  "mcqs": [
    {
      "question": "For matrix A with eigenvalues 5 and 2, what is their sum?",
      "choices": ["3", "7", "10", "15"],
      "correctIndex": 1
    },
    ...
  ]
}
```

**❌ If you see error:**
- Same as Roadmap test - check Gemma configuration

---

### Step 3: Verify Data in Supabase

1. Go to **https://supabase.com/dashboard**
2. Select your **StudyMate** project
3. Click **SQL Editor**
4. Run these queries:

```sql
-- Check profiles were saved
SELECT id, course_name, weekly_goal_hours FROM profiles ORDER BY created_at DESC LIMIT 3;

-- Check roadmaps were saved
SELECT topic_id, milestones FROM roadmaps LIMIT 3;

-- Check study packs were saved
SELECT topic_id, notes, jsonb_array_length(flashcards) as flashcard_count FROM study_packs LIMIT 3;
```

**✅ You should see data from the API tests above**

---

### Step 4: Run Full Test Script

In terminal:
```bash
node test-backend.js
```

This runs all 3 tests automatically and shows:
```
🚀 StudyMate Backend Integration Tests
=====================================

Base URL: http://localhost:3000
Gemma Model: gemma-4-26b-a4b-it
Supabase URL: https://cpflhxccxzlwidyvkbbf.supabase.co

📍 Testing: Profile Creation
   POST /api/profile
   ✅ Success!

📍 Testing: Roadmap Generation (Gemma)
   POST /api/roadmap
   ✅ Success!

📍 Testing: Study Pack Generation (Gemma)
   POST /api/study-pack
   ✅ Success!

📊 Test Summary:
   Profile API: ✅
   Roadmap API: ✅
   Study Pack API: ✅

🎉 All tests passed! Backend is ready.
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| `GEMINI_API_KEY is not set` | Add to `.env.local`: `GEMINI_API_KEY=your_key` |
| `Supabase connection failed` | Check `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` |
| `Gemma request failed (400)` | Check `GEMMA_MODEL=gemma-4-27b-it` matches env var |
| `Cannot POST /api/profile` | Dev server not running - run `npm run dev` |
| `Connection refused (localhost:3000)` | Dev server crashed - check terminal for errors |
| `Response had no text part` | Gemma API response format changed - check Gemma docs |

---

## ✨ Success Indicators

- ✅ All 3 API endpoints return 200 status
- ✅ Responses include data (milestones, flashcards, etc.)
- ✅ Data appears in Supabase tables
- ✅ `test-backend.js` shows all tests passing
- ✅ No errors in server terminal

**If you see all of these = Backend is fully working! 🚀**
