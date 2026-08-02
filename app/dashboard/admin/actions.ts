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

    const rawPassword = enrollee.password_hash || enrollee.password;
    if (!rawPassword) {
      return { success: false, error: "Cannot approve: No password found in application record." };
    }

    const firstName = enrollee.first_name || "";
    const surname = enrollee.surname || enrollee.last_name || "";
    const fullName = `${firstName} ${surname}`.trim() || enrollee.email;
    const username = enrollee.username || enrollee.email.split("@")[0];
    const phoneNumber = enrollee.phone_number || enrollee.phone || "";

    // Check if the password is a pre-hashed BCrypt string or raw plain-text
    const isBcrypt = rawPassword.startsWith("$2a$") || rawPassword.startsWith("$2b$") || rawPassword.startsWith("$2y$");

    const createUserPayload: Record<string, unknown> = {
      email: enrollee.email,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        surname: surname,
        full_name: fullName,
        username: username,
        phone_number: phoneNumber,
        role: "student",
      },
    };

    if (isBcrypt) {
      // Pass directly to Supabase Auth's password_hash field
      createUserPayload.password_hash = rawPassword;
    } else {
      // Enforce minimum password length requirement for plain-text
      if (rawPassword.length < 6) {
        return { success: false, error: "Cannot approve: Password must be at least 6 characters long." };
      }
      createUserPayload.password = rawPassword;
    }

    let userId: string | undefined;

    // 2. Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser(
      createUserPayload as Parameters<typeof supabaseAdmin.auth.admin.createUser>[0]
    );

    if (authError) {
      console.error("Auth creation failed:", authError);

      if (authError.message?.includes("already been registered") || authError.status === 422) {
        // Fallback: Attempt to look up existing user
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