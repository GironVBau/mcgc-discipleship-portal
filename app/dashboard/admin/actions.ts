"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Missing Supabase environment variables! Ensure SUPABASE_SERVICE_ROLE_KEY is configured."
  );
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

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
 */
ort async function approveEnrollee(requestId: string): Promise<{ success: boolean; error?: string }> {
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

    const password = enrollee.password_hash || enrollee.password;
    if (!password || password.length < 6) {
      return { success: false, error: "Student password missing or less than 6 characters in application record." };
    }
exp
    const firstName = enrollee.first_name || "";
    const surname = enrollee.surname || enrollee.last_name || "";
    const fullName = `${firstName} ${surname}`.trim() || enrollee.email;
    const username = enrollee.username || enrollee.email.split("@")[0];
    const phoneNumber = enrollee.phone_number || enrollee.phone || "";

    let userId: string | undefined;

    // 2. Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: enrollee.email,
      password: password,
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
      if (authError.message.includes("already registered") || authError.status === 422) {
        const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = usersList?.users?.find((u) => u.email === enrollee.email);
        if (existingUser) {
          userId = existingUser.id;
        } else {
          return { success: false, error: `Auth Error: ${authError.message}` };
        }
      } else {
        return { success: false, error: `Auth Error: ${authError.message}` };
      }
    } else {
      userId = authUser.user.id;
    }

    if (!userId) {
      return { success: false, error: "Failed to resolve Auth User ID." };
    }

    // 3. Upsert user into profiles table
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
  } catch (err: any) {
    console.error("Approve enrollee error:", err);
    return { success: false, error: err.message || "An unexpected error occurred during approval." };
  }
}

/**
 * REJECT ENROLLEE
 */
export async function rejectEnrollee(requestId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: enrollee } = await supabaseAdmin
      .from("pending_enrollees")
      .select("file_path")
      .eq("id", requestId)
      .maybeSingle();

    if (enrollee?.file_path) {
      await supabaseAdmin.storage
        .from("student-documents")
        .remove([enrollee.file_path]);
    }

    const { error } = await supabaseAdmin.from("pending_enrollees").delete().eq("id", requestId);
    if (error) return { success: false, error: error.message };

    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to reject application." };
  }
}

/**
 * DELETE ACTIVE STUDENT
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

  const firstName = enrollee.first_name || "";
  const surname = enrollee.surname || enrollee.last_name || "";
  const fullName = `${firstName} ${surname}`.trim() || enrollee.email;
  const username = enrollee.username || enrollee.email.split("@")[0];
  const phoneNumber = enrollee.phone_number || enrollee.phone || "";

  // Note: If enrollee.password_hash is a bcrypt hash, createUser will throw HTTP 500/error.
  // Ensure enrollee.password_hash is either plain text or pass a temporary password.
  const userPassword = enrollee.password_hash;

  if (!userPassword || userPassword.length < 6) {
    throw new Error("Invalid password length. Must be at least 6 characters.");
  }

  let userId: string;

  // 2. Create user in Supabase Auth
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: enrollee.email,
    password: userPassword,
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
    console.error("Supabase Auth API Error:", authError);

    // If user already exists in Auth, fetch their ID
    if (authError.message?.includes("already been registered") || authError.status === 422) {
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = usersData?.users?.find((u) => u.email === enrollee.email);

      if (existingUser) {
        userId = existingUser.id;
      } else {
        throw new Error(`Auth Error: ${authError.message}`);
      }
    } else {
      throw new Error(`Auth Error (${authError.status || 500}): ${authError.message || "Failed to create Auth user"}`);
    }
  } else {
    userId = authUser.user.id;
  }

  // 3. Upsert into public.profiles
  const { error: profileError } = await supabaseAdmin.from("profiles").upsert([
    {
      id: userId,
      first_name: firstName,
      surname: surname,
      full_name: fullName,
      username: username,
      email: enrollee.email,
      phone_number: phoneNumber,
      role: "student",
      updated_at: new Date().toISOString(),
    },
  ]);

  if (profileError) {
    throw new Error(`Profile Error: ${profileError.message}`);
  }

  // 4. Delete from pending_enrollees
  await supabaseAdmin.from("pending_enrollees").delete().eq("id", requestId);

  revalidatePath("/dashboard/admin");
}