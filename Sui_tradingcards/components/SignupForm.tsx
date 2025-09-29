// components/SignupForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signup } from "@/actions/auth";
import { useAuth } from "@/contexts/AuthContext";
import Button from "./Button";

export default function SignupForm() {
  const [error, setError] = useState("");
  const router = useRouter();
  const { login: authLogin } = useAuth();

  async function handleSubmit(formData: FormData) {
    const result = await signup(formData);
    if (result.error) {
      setError(result.error);
    } else {
      // Auto-login after successful signup
      authLogin(result.user);
      router.push("/"); // Redirect to home on success
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="username" className="block text-sm font-medium">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          className="w-full p-2 border rounded"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="w-full p-2 border rounded"
        />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <Button type="submit" className="w-full py-2">
        Sign Up
      </Button>
      <div className="text-sm text-gray-600 mt-4 p-3 bg-gray-50 rounded">
        <p><strong>Signup Requirements:</strong></p>
        <p>• Username must be at least 3 characters</p>
        <p>• Password must be at least 3 characters</p>
        <p>• Cannot use existing username: umar</p>
      </div>
    </form>
  );
}