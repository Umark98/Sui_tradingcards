// components/LoginForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/actions/auth";
import { useAuth } from "@/contexts/AuthContext";
import Button from "./Button";

export default function LoginForm() {
  const [error, setError] = useState("");
  const router = useRouter();
  const { login: authLogin } = useAuth();

  async function handleSubmit(formData: FormData) {
    const result = await login(formData);
    if (result.error) {
      setError(result.error);
    } else {
      // Set user in auth context
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
        Login
      </Button>
      <div className="text-sm text-gray-600 mt-4 p-3 bg-gray-50 rounded">
        <p><strong>Login Credentials:</strong></p>
        <p>• Username: umar</p>
        <p>• Password: 12345</p>
      </div>
    </form>
  );
}