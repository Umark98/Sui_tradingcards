'use client';

import React, { useState, useEffect } from 'react';

export default function TestEmailPage() {
  const [email, setEmail] = useState('');
  const [emailType, setEmailType] = useState<'test' | 'welcome' | 'collection'>('test');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [config, setConfig] = useState<any>(null);
  
  // Custom data for email templates
  const [customMessage, setCustomMessage] = useState('');
  const [walletAddress, setWalletAddress] = useState('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
  const [nftTitle, setNftTitle] = useState('Brella - Epic Level 3');
  const [txDigest, setTxDigest] = useState('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');

  useEffect(() => {
    // Check email configuration on load
    fetch('/api/test-email')
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(err => console.error('Failed to load config:', err));
  }, []);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          type: emailType,
          customMessage,
          data: {
            walletAddress,
            nftTitle,
            transactionDigest: txDigest,
          },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: '✅ Email sent successfully',
        });
      } else {
        setMessage({
          type: 'error',
          text: `❌ ${data.error}`,
        });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `❌ Failed to send email: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 test-email-section">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            📧 Email Testing Portal
          </h1>
          <p className="text-gray-300">
            Test your Amazon SES email configuration
          </p>
        </div>

        {/* Main Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <form onSubmit={handleSendEmail} className="space-y-6">
            {/* Email Type Selection */}
            <div>
              <label className="block text-white font-semibold mb-3">
                Email Template Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setEmailType('test')}
                  className={`p-4 rounded-lg border-2 transition ${
                    emailType === 'test'
                      ? 'bg-purple-500 border-purple-500 text-white'
                      : 'bg-white/5 border-white/20 text-gray-300 hover:border-white/40'
                  }`}
                >
                  <div className="text-3xl mb-2">📧</div>
                  <div className="font-bold">Test Email</div>
                  <div className="text-xs mt-1 opacity-75">Simple test message</div>
                </button>

                <button
                  type="button"
                  onClick={() => setEmailType('welcome')}
                  className={`p-4 rounded-lg border-2 transition ${
                    emailType === 'welcome'
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-white/5 border-white/20 text-gray-300 hover:border-white/40'
                  }`}
                >
                  <div className="text-3xl mb-2">👋</div>
                  <div className="font-bold">Welcome Email</div>
                  <div className="text-xs mt-1 opacity-75">New user registration</div>
                </button>

                <button
                  type="button"
                  onClick={() => setEmailType('collection')}
                  className={`p-4 rounded-lg border-2 transition ${
                    emailType === 'collection'
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'bg-white/5 border-white/20 text-gray-300 hover:border-white/40'
                  }`}
                >
                  <div className="text-3xl mb-2">🎉</div>
                  <div className="font-bold">Collection Email</div>
                  <div className="text-xs mt-1 opacity-75">NFT collected confirmation</div>
                </button>
              </div>
            </div>

            {/* Recipient Email */}
            <div>
              <label htmlFor="email" className="block text-white font-semibold mb-2">
                Recipient Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="your-email@example.com"
              />
              <p className="text-xs text-gray-400 mt-1">
                Enter the email address where you want to send the test email
              </p>
            </div>

            {/* Custom Message */}
            <div>
              <label htmlFor="customMessage" className="block text-white font-semibold mb-2">
                Custom Message
              </label>
              <textarea
                id="customMessage"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-vertical"
                placeholder="Write your custom message here..."
              />
              <p className="text-xs text-gray-400 mt-1">
                This message will be included in the email
              </p>
            </div>

            {/* Dynamic Fields Based on Email Type */}
            {emailType === 'welcome' && (
              <div>
                <label htmlFor="wallet" className="block text-white font-semibold mb-2">
                  Wallet Address (for demo)
                </label>
                <input
                  type="text"
                  id="wallet"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white font-mono text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {emailType === 'collection' && (
              <>
                <div>
                  <label htmlFor="nftTitle" className="block text-white font-semibold mb-2">
                    NFT Title
                  </label>
                  <input
                    type="text"
                    id="nftTitle"
                    value={nftTitle}
                    onChange={(e) => setNftTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label htmlFor="txDigest" className="block text-white font-semibold mb-2">
                    Transaction Digest
                  </label>
                  <input
                    type="text"
                    id="txDigest"
                    value={txDigest}
                    onChange={(e) => setTxDigest(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white font-mono text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </>
            )}

            {/* Message Display */}
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !config?.configured}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending Email...
                </span>
              ) : (
                <>📧 Send Test Email</>
              )}
            </button>
          </form>
        </div>

        {/* Email Templates Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h3 className="text-white font-bold mb-2">📧 Test Email</h3>
            <p className="text-gray-400 text-sm">
              Simple email to verify SMTP configuration is working
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h3 className="text-white font-bold mb-2">👋 Welcome Email</h3>
            <p className="text-gray-400 text-sm">
              Sent when a new user registers with their wallet address
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h3 className="text-white font-bold mb-2">🎉 Collection Email</h3>
            <p className="text-gray-400 text-sm">
              Sent when a user successfully collects an NFT
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
          <h3 className="text-white font-bold text-lg mb-3">📝 Instructions</h3>
          <ol className="text-gray-300 space-y-2 text-sm">
            <li>1. Select an email template type above</li>
            <li>2. Enter the recipient email address</li>
            <li>3. Fill in any template-specific data (if applicable)</li>
            <li>4. Click "Send Test Email"</li>
            <li>5. Check the recipient's inbox for the test email</li>
          </ol>
        </div>

        {/* Back to Portal Link */}
        <div className="mt-8 text-center">
          <a
            href="/portal"
            className="inline-block bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg border border-white/20 transition"
          >
            ← Back to Portal
          </a>
        </div>
      </div>
    </div>
  );
}

