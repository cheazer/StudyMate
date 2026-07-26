import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { rowToTopic } from "@/lib/mappers";

export async function GET() {
  const { data, error } = await supabaseServer()
    .from("topics")
    .select("*")
    .order("last_touched", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ topics: (data ?? []).map(rowToTopic) });
}
