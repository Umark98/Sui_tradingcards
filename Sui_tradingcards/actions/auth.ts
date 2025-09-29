// actions/auth.ts
"use server";

import { mockLogin, mockSignup } from "@/lib/auth";

export async function login(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  // Mock authentication (replace with real logic later)
  const result = await mockLogin(username, password);
  if (!result.success) {
    return { error: result.message };
  }

  // Set session or cookie here if needed (e.g., with NextAuth.js)
  return { success: true, user: result.user };
}

export async function signup(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  // Mock signup (replace with real logic later)
  const result = await mockSignup(username, password);
  if (!result.success) {
    return { error: result.message };
  }

  return { success: true, user: result.user };
}