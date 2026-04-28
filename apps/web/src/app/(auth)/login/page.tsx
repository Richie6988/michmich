'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot, BarryLogo } from '@/components/barry/barry-mascot';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAppStore();
  const [email, setEmail] = useState('chloe@test.barry');
  const [password, setPassword] = useState('barry2026');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(email);
    router.push('/');
  };

  const quickLogin = (userEmail: string) => {
    login(userEmail);
    router.push('/');
  };

  return (
    <div className="w-full max-w-sm">
      {/* Logo & mascot */}
      <div className="text-center mb-8">
        <BarryMascot pose="friendly" size={120} />
        <div className="flex items-center justify-center gap-2 mt-4">
          <BarryLogo size={36} />
          <h1 className="font-display font-extrabold text-3xl text-barry-blue">Barry</h1>
        </div>
        <p className="text-barry-grey text-sm mt-2">Barry sait ou.</p>
      </div>

      {/* Login form */}
      <form onSubmit={handleLogin} className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-barry-black mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="barry-input"
            placeholder="ton@email.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-barry-black mb-1.5">Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="barry-input"
            placeholder="Mot de passe"
          />
        </div>
        <button type="submit" className="btn-primary w-full">
          Se connecter
        </button>
      </form>

      {/* Quick login for testing */}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs text-barry-grey text-center mb-3">Connexion rapide (prototype)</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { name: 'Chloe', email: 'chloe@test.barry', color: '#2563EB' },
            { name: 'Tom', email: 'tom@test.barry', color: '#F97316' },
            { name: 'Marc', email: 'marc@test.barry', color: '#10B981' },
            { name: 'Sarah', email: 'sarah@test.barry', color: '#8B5CF6' },
          ].map(u => (
            <button
              key={u.email}
              onClick={() => quickLogin(u.email)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 hover:border-barry-blue hover:bg-blue-50 transition-colors"
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: u.color }}>
                {u.name[0]}
              </div>
              <span className="text-sm font-medium text-barry-black">{u.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
