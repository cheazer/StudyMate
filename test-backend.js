#!/usr/bin/env node

/**
 * StudyMate Backend Integration Test
 * Tests Gemma + Supabase integration end-to-end
 * 
 * Run: node test-backend.js
 */

require("dotenv").config();

const BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";

// Test data
const TEST_PROFILE = {
  courseName: "Linear Algebra",
  weeklyGoalHours: 5,
  biggestChallenge: "Understanding eigenvalues geometrically",
  preferredStudyTime: "morning",
  preferredFormat: "mixed",
};

const TEST_ROADMAP = {
  topicId: "test-topic-" + Date.now(),
  topic: "Eigenvalues and Eigenvectors",
  courseName: "Linear Algebra",
};

const TEST_LECTURE_NOTES = `
Lecture 9: Matrix Diagonalization

An eigenvalue λ and eigenvector v of matrix A satisfy: Av = λv

Key concepts:
1. Characteristic polynomial: det(A - λI) = 0
2. Eigenspace: all eigenvectors for a given eigenvalue
3. Algebraic vs geometric multiplicity
4. Diagonalization: A = PDP^(-1) where D is diagonal

Example: For A = [[4, 2], [1, 3]]:
- Characteristic polynomial: λ² - 7λ + 10 = 0
- Eigenvalues: λ₁ = 5, λ₂ = 2
- Eigenvector for λ₁ = 5: v₁ = [2, 1]
- Eigenvector for λ₂ = 2: v₂ = [1, -1]

Applications:
- Principal Component Analysis (PCA)
- Google PageRank algorithm
- Stability analysis in dynamical systems
- Vibration modes in mechanical systems
`;

const TEST_STUDY_PACK = {
  topicId: "test-topic-" + Date.now(),
  topic: "Eigenvalues and Eigenvectors",
  sourceText: TEST_LECTURE_NOTES,
};

async function testAPI(endpoint, data, label) {
  console.log(`\n📍 Testing: ${label}`);
  console.log(`   POST ${endpoint}`);
  console.log(`   Payload:`, JSON.stringify(data, null, 2));

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`   ❌ Error (${response.status}):`, result.error || result);
      return false;
    }

    console.log(`   ✅ Success!`);
    console.log(`   Response:`, JSON.stringify(result, null, 2).substring(0, 500) + "...");
    return true;
  } catch (err) {
    console.error(`   ❌ Request failed:`, err.message);
    return false;
  }
}

async function runTests() {
  console.log("🚀 StudyMate Backend Integration Tests");
  console.log("=====================================\n");

  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Gemma Model: ${process.env.GEMMA_MODEL || "gemma-4-26b-a4b-it"}`);
  console.log(`Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);

  // Test 1: Profile API
  const profileOk = await testAPI("/api/profile", TEST_PROFILE, "Profile Creation");

  // Test 2: Roadmap Generation with Gemma
  const roadmapOk = await testAPI("/api/roadmap", TEST_ROADMAP, "Roadmap Generation (Gemma)");

  // Test 3: Study Pack Generation with Gemma
  const studyPackOk = await testAPI("/api/study-pack", TEST_STUDY_PACK, "Study Pack Generation (Gemma)");

  // Summary
  console.log("\n=====================================");
  console.log("📊 Test Summary:");
  console.log(`   Profile API: ${profileOk ? "✅" : "❌"}`);
  console.log(`   Roadmap API: ${roadmapOk ? "✅" : "❌"}`);
  console.log(`   Study Pack API: ${studyPackOk ? "✅" : "❌"}`);

  if (profileOk && roadmapOk && studyPackOk) {
    console.log("\n🎉 All tests passed! Backend is ready.");
  } else {
    console.log("\n⚠️  Some tests failed. Check the errors above.");
  }
}

// Run tests
runTests().catch(console.error);
