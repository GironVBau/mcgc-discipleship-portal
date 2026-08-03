"use server";

import { createClient } from "@/lib/supabase/server";

export async function approveEnrollee(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role: "student" })
    .eq("id", id);
    
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function rejectEnrollee(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("pending_enrollees")
    .delete()
    .eq("id", id);
    
  if (error) return { success: false, error: error.message };
  return { success: true };
}