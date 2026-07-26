import { redirect } from "next/navigation";

// Roadmaps are now generated per-course from uploaded PDF material and live
// inside each course's folder — see app/courses/[courseId]/page.tsx.
export default function RoadmapPage() {
  redirect("/courses");
}
