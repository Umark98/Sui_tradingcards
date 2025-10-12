'use client';

import React, { useState, useEffect } from 'react';
import UserPortal from '@/components/portal/UserPortal';
import LoginForm from '@/components/portal/LoginForm';

export default function PortalPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const storedEmail = localStorage.getItem('portal_user_email');
    if (storedEmail) {
      // Auto-login
      handleLogin(storedEmail);
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (email: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        localStorage.setItem('portal_user_email', email);
      } else {
        console.error('Login failed:', data.error);
        localStorage.removeItem('portal_user_email');
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('portal_user_email');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-full portal-section">
      {!user ? (
        <LoginForm onLogin={handleLogin} />
      ) : (
        <UserPortal user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

