"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Missing Supabase environment variables! Ensure SUPABASE_SERVICE_ROLE_KEY is configured in Vercel or .env.local"
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
    const { data: files, error } = await supabaseAdmin.storage
      .from(bucketName)
      .list(folderPath);

    if (error) {
      console.warn(`Notice: Failed to list files in '${bucketName}/${folderPath}':`, error.message);
      return;
    }

    if (files && files.length > 0) {
      const pathsToDelete = files.map((file) => `${folderPath}/${file.name}`);
      await supabaseAdmin.storage.from(bucketName).remove(pathsToDelete);
    }
  } catch (err) {
    console.warn(`Notice: Could not clear storage bucket '${bucketName}':`, (err as Error).message);
  }
}

/**
 * APPROVE ENROLLEE
 * Creates real user in Supabase Auth & profiles table, then deletes from pending queue.
 */
export async function approveEnrollee(requestId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Fetch pending applicant details
    const { data: enrollee, error: fetchError } = await supabaseAdmin
      .from("pending_enrollees")
      .select("*")
      .eq("id", requestId)
      .single();

    if (fetchError || !enrollee) {
      return { success: false, error: "Pending application not found." };
    }

    // Safely resolve raw password string
    let rawPassword = String(enrollee.password || enrollee.password_hash || "").trim();
    
    // Ensure the password meets Supabase Auth's 6-character minimum
    if (!rawPassword || rawPassword.length < 6) {
      rawPassword = rawPassword ? rawPassword.padEnd(6, "0") : "Student2026!";
    }

    const firstName = String(enrollee.first_name || "").trim();
    const surname = String(enrollee.surname || enrollee.last_name || "").trim();
    const fullName = `${firstName} ${surname}`.trim() || enrollee.email;
    const username = String(enrollee.username || enrollee.email.split("@")[0]).trim();
    const phoneNumber = String(enrollee.phone_number || enrollee.phone || "").trim();

    // Clean user metadata (no undefined/null values)
    const userMetadata = {
      first_name: firstName,
      surname: surname,
      full_name: fullName,
      username: username,
      phone_number: phoneNumber,
      role: "student",
    };

    let userId: string | undefined;

    // 2. Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: enrollee.email,
      password: rawPassword,
      email_confirm: true,
      user_metadata: userMetadata,
    });

    if (authError) {
      console.error("Auth creation failed:", authError);

      if (authError.message?.includes("already been registered") || authError.status === 422) {
        // Fallback: Lookup existing user if already present in Auth system
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 100,
        });
        const existingUser = usersData?.users?.find((u) => u.email === enrollee.email);

        if (existingUser) {
          userId = existingUser.id;
        } else {
          return { success: false, error: `Auth Error: ${authError.message}` };
        }
      } else {
        return { success: false, error: `Auth Error: ${authError.message || "Failed to create user in Auth system."}` };
      }
    } else {
      userId = authUser.user.id;
    }

    if (!userId) {
      return { success: false, error: "Failed to determine user ID." };
    }

    // 3. Upsert into public.profiles table
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: userId,
      first_name: firstName,
      surname: surname,
      full_name: fullName,
      username: username,
      email: enrollee.email,
      phone_number: phoneNumber,
      role: "student",
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      return { success: false, error: `Profile Creation Error: ${profileError.message}` };
    }

    // 4. Remove record from pending queue
    await supabaseAdmin.from("pending_enrollees").delete().eq("id", requestId);

    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (err) {
    const error = err as Error;
    console.error("Approve enrollee unexpected error:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}

/**
 * REJECT ENROLLEE
 * Deletes application from pending_enrollees queue and purges associated uploaded files.
 */
export async function rejectEnrollee(requestId: string): Promise<{ success: boolean; error?: string }> {
  try {
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
    if (error) return { success: false, error: error.message };

    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (err) {
    const error = err as Error;
    return { success: false, error: error.message || "Failed to reject enrollee." };
  }
}

/**
 * DELETE ACTIVE STUDENT
 * Purges user from Auth (which CASCADE deletes profiles row), 
 * and cleans up their uploaded files in storage.
 */
export async function deleteStudent(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
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
        return { success: false, error: `Deletion Error: ${profileError.message}` };
      }
    }

    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (err) {
    const error = err as Error;
    return { success: false, error: error.message || "Failed to delete student." };
  }
}