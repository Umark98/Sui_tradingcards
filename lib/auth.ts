// lib/auth.ts
export async function mockLogin(email: string, password: string) {
  // Simulate database check
  if (email === "test@example.com" && password === "password123") {
    return { success: true, message: "Login successful" };
  }
  return { success: false, message: "Invalid email or password" };
}

export async function mockSignup(email: string, password: string) {
  // Simulate database check
  if (email === "test@example.com") {
    return { success: false, message: "Email already exists" };
  }
  return { success: true, message: "Signup successful" };
}