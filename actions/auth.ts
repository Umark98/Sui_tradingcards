// actions/auth.ts
"use server";

import { mockLogin, mockSignup } from "@/lib/auth";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Mock authentication (replace with real logic later)
  const result = await mockLogin(email, password);
  if (!result.success) {
    return { error: result.message };
  }

  // Set session or cookie here if needed (e.g., with NextAuth.js)
  return { success: true };
}

export async function signup(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Mock signup (replace with real logic later)
  const result = await mockSignup(email, password);
  if (!result.success) {
    return { error: result.message };
  }

  return { success: true };
}