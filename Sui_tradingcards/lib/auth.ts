// lib/auth.ts
// Mock authentication system - replace with real authentication later

// Mock user database (in memory)
const mockUsers = new Map([
  ["umar", { password: "12345", name: "Umar" }]
]);

export async function mockLogin(username: string, password: string) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Validate input
  if (!username || !password) {
    return { success: false, message: "Username and password are required" };
  }
  
  // Check if user exists
  const user = mockUsers.get(username);
  if (!user) {
    return { success: false, message: "Invalid username or password" };
  }
  
  // Check password
  if (user.password !== password) {
    return { success: false, message: "Invalid username or password" };
  }
  
  return { 
    success: true, 
    message: "Login successful",
    user: {
      username,
      name: user.name
    }
  };
}

export async function mockSignup(username: string, password: string) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Validate input
  if (!username || !password) {
    return { success: false, message: "Username and password are required" };
  }
  
  // Check username length
  if (username.length < 3) {
    return { success: false, message: "Username must be at least 3 characters" };
  }
  
  // Check password length
  if (password.length < 3) {
    return { success: false, message: "Password must be at least 3 characters" };
  }
  
  // Check if user already exists
  if (mockUsers.has(username)) {
    return { success: false, message: "Username already exists" };
  }
  
  // Add new user to mock database
  mockUsers.set(username, { 
    password, 
    name: username // Use username as name
  });
  
  return { 
    success: true, 
    message: "Signup successful",
    user: {
      username,
      name: username
    }
  };
}

// Get all mock users (for testing purposes)
export function getMockUsers() {
  return Array.from(mockUsers.entries()).map(([username, user]) => ({
    username,
    name: user.name
  }));
}