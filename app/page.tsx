import { redirect } from "next/navigation";

export default function Home() {
  // TODO: once auth exists, check whether the user already has a profile —
  // send them to /dashboard if so, /onboarding if not.
  redirect("/onboarding");
}
