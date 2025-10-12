"use client";

import CardConfigForm from '@/components/admin/CardConfigForm';

export default function CardConfigPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6 min-h-full admin-section">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              ⚙️ Card Configuration
            </h1>
            <p className="text-gray-300">
              Configure NFT card types, rarities, and levels for your trading card system.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <CardConfigForm />
        </div>
      </div>
    </div>
  );
}
