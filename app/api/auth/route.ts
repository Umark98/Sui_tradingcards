// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Replace with your auth logic (e.g., database check)
        if (
          credentials.email === "test@example.com" &&
          credentials.password === "password123"
        ) {
          return { id: "1", name: "Test User", email: credentials.email };
        }
        return null;
      },
    }),
  ],
});