#!/bin/bash

# StudyMate Backend Verification Checklist
# Run these commands to verify the Gemma + Supabase integration

echo "🧪 StudyMate Backend Verification"
echo "=================================="
echo ""

# Step 1: Check environment variables
echo "1️⃣  Checking Environment Variables..."
echo ""
echo "   Looking for in .env.local:"
grep -E "GEMINI_API_KEY|GEMMA_MODEL|SUPABASE" .env.local 2>/dev/null | head -5
if [ $? -eq 0 ]; then
    echo "   ✅ Environment variables found"
else
    echo "   ❌ .env.local missing or incomplete"
    exit 1
fi

echo ""
echo "2️⃣  Starting dev server (make sure Node.js dependencies are installed)..."
echo ""
echo "   Run: npm run dev"
echo "   Wait for: 'ready - started server on 0.0.0.0:3000'"
echo ""

echo "3️⃣  Once server is running, test the APIs in a NEW TERMINAL:"
echo ""
echo "   Test Profile API:"
echo "   ─────────────────"
echo "   curl -X POST http://localhost:3000/api/profile \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"courseName\": \"Linear Algebra\", \"weeklyGoalHours\": 5, \"biggestChallenge\": \"Eigenvalues\", \"preferredStudyTime\": \"morning\", \"preferredFormat\": \"mixed\"}'"
echo ""
echo "   Expected Response: { ...profile data... }"
echo ""

echo "   Test Roadmap API (Calls Gemma!):"
echo "   ─────────────────────────────────"
echo "   curl -X POST http://localhost:3000/api/roadmap \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"topicId\": \"test-123\", \"topic\": \"Eigenvalues and Eigenvectors\", \"courseName\": \"Linear Algebra\"}'"
echo ""
echo "   Expected Response: { \"topicId\": \"test-123\", \"milestones\": [{ \"id\": \"...\", \"title\": \"...\", \"estimatedMinutes\": 20 }, ...] }"
echo ""

echo "   Test Study Pack API (Calls Gemma!):"
echo "   ────────────────────────────────────"
echo "   curl -X POST http://localhost:3000/api/study-pack \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"topicId\": \"test-456\", \"topic\": \"Eigenvalues\", \"sourceText\": \"Eigenvalues are scalar values that satisfy Av = λv for matrix A and vector v...\"}'"
echo ""
echo "   Expected Response: { \"topicId\": \"test-456\", \"notes\": \"...\", \"flashcards\": [...], \"mcqs\": [...] }"
echo ""

echo "4️⃣  Verify Data in Supabase:"
echo "   ─────────────────────────"
echo "   1. Go to: https://supabase.com/dashboard"
echo "   2. Find your project (StudyMate)"
echo "   3. Click 'SQL Editor'"
echo "   4. Run these queries:"
echo ""
echo "   -- Check profiles table:"
echo "   SELECT * FROM profiles ORDER BY created_at DESC LIMIT 5;"
echo ""
echo "   -- Check roadmaps table:"
echo "   SELECT topic_id, jsonb_array_length(milestones) as milestone_count FROM roadmaps LIMIT 5;"
echo ""
echo "   -- Check study_packs table:"
echo "   SELECT topic_id, jsonb_array_length(flashcards) as flashcard_count FROM study_packs LIMIT 5;"
echo ""

echo "5️⃣  Run Automated Test:"
echo "   ────────────────────"
echo "   node test-backend.js"
echo ""
echo "   This will test all 3 APIs and show results."
echo ""

echo "=================================="
echo "✅ If all steps pass, backend is working!"
echo ""
