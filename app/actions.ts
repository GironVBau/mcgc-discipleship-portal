"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Missing Supabase environment variables! Ensure SUPABASE_SERVICE_ROLE_KEY is configured in .env.local"
  );
}

// Admin client initialized with the secret service role key
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Helper function to safely purge files owned by a user from a storage bucket.
 */
async function deleteUserStorageFiles(bucketName: string, folderPath: string) {
  try {
    const { data: files } = await supabaseAdmin.storage
      .from(bucketName)
      .list(folderPath);

    if (files && files.length > 0) {
      const pathsToDelete = files.map((file) => `${folderPath}/${file.name}`);
      await supabaseAdmin.storage.from(bucketName).remove(pathsToDelete);
    }
  } catch (err) {
    console.warn(`Storage notice for bucket '${bucketName}':`, err);
  }
}

/**
 * APPROVE ENROLLEE
 * Creates real user in Supabase Auth & profiles table, then deletes from pending queue.
 */
export async function approveEnrollee(requestId: string) {
  // 1. Fetch pending applicant details
  const { data: enrollee, error: fetchError } = await supabaseAdmin
    .from("pending_enrollees")
    .select("*")
    .eq("id", requestId)
    .single();

  if (fetchError || !enrollee) {
    throw new Error("Pending application not found.");
  }

  // 2. Create actual active user in Supabase Auth (auto-confirmed)
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: enrollee.email,
    password: enrollee.password_hash,
    email_confirm: true,
    user_metadata: {
      first_name: enrollee.first_name,
      last_name: enrollee.last_name,
      full_name: `${enrollee.first_name} ${enrollee.last_name}`,
      username: enrollee.username,
      phone_number: enrollee.phone_number,
      role: "student",
    },
  });

  if (authError) {
    throw new Error(`Auth Error: ${authError.message}`);
  }

  // 3. Upsert user into public.profiles table
  const { error: profileError } = await supabaseAdmin.from("profiles").upsert([
    {
      id: authUser.user.id,
      first_name: enrollee.first_name,
      last_name: enrollee.last_name,
      full_name: `${enrollee.first_name} ${enrollee.last_name}`,
      username: enrollee.username,
      email: enrollee.email,
      phone: enrollee.phone_number,
      role: "student",
    },
  ]);

  if (profileError) {
    console.error("Profile creation warning:", profileError.message);
  }

  // 4. Remove record from pending queue
  await supabaseAdmin.from("pending_enrollees").delete().eq("id", requestId);

  revalidatePath("/dashboard/admin");
}

/**
 * REJECT ENROLLEE
 * Deletes application from pending_enrollees queue and removes any associated pending files.
 */
export async function rejectEnrollee(requestId: string) {
  // 1. Fetch applicant details if they uploaded document files prior to approval
  const { data: enrollee } = await supabaseAdmin
    .from("pending_enrollees")
    .select("file_path")
    .eq("id", requestId)
    .maybeSingle();

  // 2. Delete uploaded document from storage if path exists
  if (enrollee?.file_path) {
    await supabaseAdmin.storage
      .from("student-documents")
      .remove([enrollee.file_path]);
  }

  // 3. Delete application from database
  const { error } = await supabaseAdmin.from("pending_enrollees").delete().eq("id", requestId);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/admin");
}

/**
 * DELETE ACTIVE STUDENT
 * Purges user from Auth (which CASCADE deletes profiles row and database records), 
 * and cleans up their uploaded files in storage.
 */
export async function deleteStudent(userId: string) {
  // 1. Clean up student files from storage buckets (if applicable)
  await deleteUserStorageFiles("student-documents", userId);
  await deleteUserStorageFiles("avatars", userId);

  // 2. Purge user from Supabase Auth
  // PostgreSQL ON DELETE CASCADE will automatically wipe their row from public.profiles
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (authError) {
    // Fallback: manually delete from profiles if auth delete fails
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      throw new Error(`Deletion Error: ${profileError.message}`);
    }
  }

  revalidatePath("/dashboard/admin");
}