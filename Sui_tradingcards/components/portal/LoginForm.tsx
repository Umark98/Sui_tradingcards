'use client';

import React, { useState } from 'react';

interface LoginFormProps {
  onLogin: (email: string) => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isRegistering) {
        // Register new user
        const response = await fetch('/api/portal/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (response.ok) {
          setMessage({
            type: 'success',
            text: `Account created! Your wallet: ${data.user.wallet}. Check your email for verification.`,
          });
          // Auto-switch to login after 3 seconds
          setTimeout(() => {
            setIsRegistering(false);
            setMessage(null);
          }, 3000);
        } else {
          setMessage({ type: 'error', text: data.error });
        }
      } else {
        // Login existing user
        const response = await fetch('/api/portal/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (response.ok) {
          onLogin(email);
        } else {
          setMessage({ type: 'error', text: data.error });
        }
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-4 py-20">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-white/20 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🎴 NFT Collection Portal
          </h1>
          <p className="text-gray-300">
            {isRegistering ? 'Register for portal access' : 'Enter your email to continue'}
          </p>
          {isRegistering && (
            <p className="text-yellow-300 text-sm mt-2">
              ⚠️ Only existing database users can register
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-white text-sm font-semibold mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />
          </div>

          {message && (
            <div
              className={`p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-500/20 text-green-200 border border-green-500/50'
                  : 'bg-red-500/20 text-red-200 border border-red-500/50'
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : (
              <>{isRegistering ? 'Create Account' : 'Login'}</>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          {isRegistering ? (
            <button
              onClick={() => {
                setIsRegistering(false);
                setMessage(null);
              }}
              className="text-purple-300 hover:text-purple-100 text-sm transition"
            >
              ← Back to Login
            </button>
          ) : (
            <button
              onClick={() => {
                setIsRegistering(true);
                setMessage(null);
              }}
              className="text-purple-300 hover:text-purple-100 text-sm transition"
            >
              First time? Register here
            </button>
          )}
        </div>

        <div className="mt-8 p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
          <h3 className="text-white font-semibold mb-2">ℹ️ Access Information:</h3>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>🔐 Only existing database users can access</li>
            <li>📧 Enter your registered email to login</li>
            <li>🎴 View your pre-assigned NFTs</li>
            <li>✨ Click "Collect" to mint them on Sui blockchain</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

