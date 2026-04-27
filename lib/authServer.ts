import { NextRequest, NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createSupabaseAuthClient } from "./supabaseServer";

export type AuthedUser = {
  user: User;
  token: string;
};

export function unauthorized(message = "Please sign in first.") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export async function getAuthedUser(req: NextRequest): Promise<AuthedUser | null> {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : "";
  if (!token) return null;

  const supabase = createSupabaseAuthClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  return { user: data.user, token };
}
