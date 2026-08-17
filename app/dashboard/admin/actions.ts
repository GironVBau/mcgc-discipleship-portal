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

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

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

export async function approveEnrollee(requestId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: enrollee, error: fetchError } = await supabaseAdmin
      .from("pending_enrollees")
      .select("*")
      .eq("id", requestId)
      .single();

    if (fetchError || !enrollee) {
      return { success: false, error: "Pending application not found." };
    }

    let rawPassword = String(enrollee.password || enrollee.password_hash || "").trim();
    if (!rawPassword || rawPassword.length < 6) {
      rawPassword = rawPassword ? rawPassword.padEnd(6, "0") : "Student2026!";
    }

    const firstName = String(enrollee.first_name || "").trim();
    const surname = String(enrollee.surname || enrollee.last_name || "").trim();
    const fullName = `${firstName} ${surname}`.trim() || enrollee.email;
    const username = String(enrollee.username || enrollee.email.split("@")[0]).trim();
    const phoneNumber = String(enrollee.phone_number || enrollee.phone || "").trim();

    const userMetadata = {
      first_name: firstName,
      surname: surname,
      full_name: fullName,
      username: username,
      phone_number: phoneNumber,
      role: "student",
    };

    let userId: string | undefined;

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: enrollee.email,
      password: rawPassword,
      email_confirm: true,
      user_metadata: userMetadata,
    });

    if (authError) {
      if (authError.message?.includes("already been registered") || authError.status === 422) {
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 100 });
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

    await supabaseAdmin.from("pending_enrollees").delete().eq("id", requestId);

    revalidatePath("/dashboard/admin");
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    const error = err as Error;
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}

export async function rejectEnrollee(requestId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: enrollee } = await supabaseAdmin
      .from("pending_enrollees")
      .select("file_path")
      .eq("id", requestId)
      .maybeSingle();

    if (enrollee?.file_path) {
      await supabaseAdmin.storage.from("student-documents").remove([enrollee.file_path]);
    }

    const { error } = await supabaseAdmin.from("pending_enrollees").delete().eq("id", requestId);
    if (error) return { success: false, error: error.message };

    revalidatePath("/dashboard/admin");
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    const error = err as Error;
    return { success: false, error: error.message || "Failed to reject enrollee." };
  }
}

export async function deleteStudent(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteUserStorageFiles("student-documents", userId);
    await deleteUserStorageFiles("avatars", userId);

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      const { error: profileError } = await supabaseAdmin.from("profiles").delete().eq("id", userId);
      if (profileError) {
        return { success: false, error: `Deletion Error: ${profileError.message}` };
      }
    }

    revalidatePath("/dashboard/admin");
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    const error = err as Error;
    return { success: false, error: error.message || "Failed to delete student." };
  }
}

export async function deleteAnnouncement(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from("announcements")
      .delete()
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/admin");
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    const error = err as Error;
    return { success: false, error: error.message || "Failed to delete announcement." };
  }
}