# StudyMate Backend Integration Guide

## ✅ What's Already Configured

### 1. **Gemma AI Integration** (`lib/gemma.ts`)
- ✅ Thin wrapper around Gemini API for Gemma 4
- ✅ JSON mode with response schema validation
- ✅ Two main functions:
  - `generateRoadmap(topic, courseName)` → Creates study milestones
  - `generateStudyPack(topic, sourceText)` → Creates notes, flashcards, MCQs

### 2. **API Routes with Gemma**

#### `/api/profile` (POST)
```typescript
// Accepts:
{
  courseName: string,
  weeklyGoalHours: number (1-80),
  biggestChallenge: string,
  preferredStudyTime: "morning" | "afternoon" | "evening" | "late-night",
  preferredFormat: "video" | "reading" | "practice" | "mixed"
}
// Writes to: profiles table in Supabase
// Returns: saved profile with ID
```

#### `/api/roadmap` (POST)
```typescript
// Accepts:
{
  topicId: string,
  topic: string,
  courseName: string
}
// Calls: Gemma AI to generate milestones
// Writes to: roadmaps table (stores milestones JSON)
// Returns: { topicId, milestones: [...] }

// Example response:
{
  "topicId": "uuid",
  "milestones": [
    { "id": "uuid", "title": "Understand eigenvalue definition", "estimatedMinutes": 20, "done": false },
    { "id": "uuid", "title": "Compute eigenvalues from characteristic polynomial", "estimatedMinutes": 30, "done": false },
    { "id": "uuid", "title": "Find eigenvector basis", "estimatedMinutes": 25, "done": false }
  ]
}
```

#### `/api/study-pack` (POST)
```typescript
// Accepts:
{
  topicId: string,
  topic: string,
  sourceText: string  // paste lecture notes here
}
// Calls: Gemma AI to generate study materials
// Writes to: study_packs table
// Returns: { topicId, notes, flashcards, mcqs }

// Example response:
{
  "topicId": "uuid",
  "notes": "Eigenvalues are scalar values that scale eigenvectors...",
  "flashcards": [
    { "front": "What is an eigenvalue?", "back": "A scalar λ such that Av = λv" },
    { "front": "How to find eigenvalues?", "back": "Solve det(A - λI) = 0" }
  ],
  "mcqs": [
    {
      "question": "For matrix A = [[3, 1], [1, 3]], what is the sum of eigenvalues?",
      "choices": ["3", "6", "9", "12"],
      "correctIndex": 1
    }
  ]
}
```

---

## 🔧 Environment Setup

Make sure `.env.local` has:
```env
# Gemma / Google AI
GEMINI_API_KEY=your_key_here
GEMMA_MODEL=gemma-4-27b-it

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_key_here
```

---

## 🧪 Testing the Backend

### Option 1: Run Test Script
```bash
node test-backend.js
```

This will:
1. ✅ Create a test profile via `/api/profile`
2. ✅ Generate a roadmap via `/api/roadmap` (calls Gemma)
3. ✅ Generate study pack via `/api/study-pack` (calls Gemma)
4. ✅ Verify data is written to Supabase

### Option 2: Manual Testing with cURL

**Test Profile:**
```bash
curl -X POST http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "courseName": "Linear Algebra",
    "weeklyGoalHours": 5,
    "biggestChallenge": "Eigenvalues",
    "preferredStudyTime": "morning",
    "preferredFormat": "mixed"
  }'
```

**Test Roadmap (Gemma):**
```bash
curl -X POST http://localhost:3000/api/roadmap \
  -H "Content-Type: application/json" \
  -d '{
    "topicId": "test-1",
    "topic": "Eigenvalues and Eigenvectors",
    "courseName": "Linear Algebra"
  }'
```

**Test Study Pack (Gemma):**
```bash
curl -X POST http://localhost:3000/api/study-pack \
  -H "Content-Type: application/json" \
  -d '{
    "topicId": "test-2",
    "topic": "Eigenvalues",
    "sourceText": "Lecture notes here..."
  }'
```

---

## ⚙️ How Gemma Integration Works

### Flow Diagram:
```
Frontend (dashboard) 
    ↓
POST /api/roadmap { topic, courseName }
    ↓
generateRoadmap() calls Gemma API
    ↓
Gemma AI returns JSON: { milestones: [...] }
    ↓
Roadmap route saves to Supabase roadmaps table
    ↓
Response sent back to frontend
    ↓
Frontend displays milestones with checkboxes
```

### Key Configuration:

**System Instructions** (in `lib/gemma.ts`):
- Roadmap: "Break topic into concrete study milestones..."
- Study Pack: "Turn raw lecture notes into a compact study pack..."

**Response Schema**: Validated JSON structure ensures Gemma returns correct format

---

## 📋 Checklist for Full Integration

- [x] Gemma API wrapper implemented (`lib/gemma.ts`)
- [x] `/api/profile` endpoint with Supabase write
- [x] `/api/roadmap` endpoint with Gemma + Supabase
- [x] `/api/study-pack` endpoint with Gemma + Supabase
- [ ] Test end-to-end with real topic (run `node test-backend.js`)
- [ ] Connect frontend forms to APIs
- [ ] Add difficulty-adjustment logic (attempt tracking)
- [ ] Add error handling & logging
- [ ] Performance optimization (caching, rate limiting)

---

## 🚀 Next Steps

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Run backend tests:**
   ```bash
   node test-backend.js
   ```

3. **Check Supabase dashboard:**
   - Verify data in `profiles`, `roadmaps`, `study_packs` tables

4. **Connect frontend:**
   - Hook onboarding form to `/api/profile`
   - Hook roadmap chat to `/api/roadmap`
   - Hook study pack generator to `/api/study-pack`

---

## 🐛 Debugging

**If Gemma requests fail:**
- Check GEMINI_API_KEY is set
- Verify model name matches (gemma-4-27b-it or gemma-4-26b-a4b-it)
- Check response schema matches actual response

**If Supabase writes fail:**
- Verify SUPABASE_SERVICE_ROLE_KEY is set
- Check table names match schema.sql
- Verify RLS policies allow demo writes

**If API returns 500:**
- Check server logs in terminal
- Verify environment variables are loaded
- Test with cURL first (rule out frontend issues)
