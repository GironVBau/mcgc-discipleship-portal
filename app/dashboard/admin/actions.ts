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

// Admin client initialized with secret service role key
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Helper function to safely delete files owned by a user from a storage bucket.
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
    console.warn(`Notice: Could not clear storage bucket '${bucketName}':`, err);
  }
}

/**
 * APPROVE ENROLLEE
 * Creates real user in Supabase Auth & profiles table, then deletes from pending queue.
 * Matches exact PostgreSQL schema: surname, phone_number, username.
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

  // Ensure password meets minimum length requirement
  if (!enrollee.password_hash || enrollee.password_hash.length < 6) {
    throw new Error("Cannot approve student: Password must be at least 6 characters long.");
  }

  const firstName = enrollee.first_name || "";
  const surname = enrollee.surname || enrollee.last_name || "";
  const fullName = `${firstName} ${surname}`.trim() || enrollee.email;
  const username = enrollee.username || enrollee.email.split("@")[0];
  const phoneNumber = enrollee.phone_number || enrollee.phone || "";

  let userId: string;

  // 2. Try creating user in Supabase Auth
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: enrollee.email,
    password: enrollee.password_hash,
    email_confirm: true,
    user_metadata: {
      first_name: firstName,
      surname: surname,
      full_name: fullName,
      username: username,
      phone_number: phoneNumber,
      role: "student",
    },
  });

  if (authError) {
    // If user already exists in Auth, grab their existing Auth ID
    if (authError.message.includes("already been registered")) {
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = usersData.users.find((u) => u.email === enrollee.email);

      if (existingUser) {
        userId = existingUser.id;
      } else {
        throw new Error(`Auth Error: ${authError.message}`);
      }
    } else {
      throw new Error(`Auth Error: ${authError.message}`);
    }
  } else {
    userId = authUser.user.id;
  }

  // 3. Upsert user into public.profiles table using exact database column names
  const { error: profileError } = await supabaseAdmin.from("profiles").upsert([
    {
      id: userId,
      first_name: firstName,
      surname: surname,              // Matches public.profiles column
      full_name: fullName,
      username: username,            // Saves username to public.profiles
      email: enrollee.email,
      phone_number: phoneNumber,     // Matches public.profiles column
      role: "student",
      updated_at: new Date().toISOString(),
    },
  ]);

  if (profileError) {
    console.error("Profile creation error:", profileError.message);
    throw new Error(`Profile creation failed: ${profileError.message}`);
  }

  // 4. Remove record from pending queue
  await supabaseAdmin.from("pending_enrollees").delete().eq("id", requestId);

  revalidatePath("/dashboard/admin");
}

/**
 * REJECT ENROLLEE
 * Deletes application from pending_enrollees queue and purges associated uploaded files.
 */
export async function rejectEnrollee(requestId: string) {
  // 1. Fetch applicant details to check for attached files
  const { data: enrollee } = await supabaseAdmin
    .from("pending_enrollees")
    .select("file_path")
    .eq("id", requestId)
    .maybeSingle();

  // 2. Delete uploaded document from storage if exists
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
 * Purges user from Auth (which CASCADE deletes profiles row), 
 * and cleans up their uploaded files in storage.
 */
export async function deleteStudent(userId: string) {
  // 1. Clean up student storage buckets
  await deleteUserStorageFiles("student-documents", userId);
  await deleteUserStorageFiles("avatars", userId);

  // 2. Purge user from Supabase Auth
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (authError) {
    // Fallback: manually delete from profiles table
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