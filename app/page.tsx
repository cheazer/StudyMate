import { redirect } from "next/navigation";

export default function Home() {
  // TODO: once there's a fast way to check for an existing profile, send
  // already-onboarded users straight to /dashboard instead.
  redirect("/login");
}
