import React, { useState } from 'react';
import type { UserSession } from '../types';

interface LoginViewProps {
  onLogin: (user: UserSession) => void;
}

const DEMO_USERS: Array<UserSession & { password: string }> = [
  { username: 'admin', password: 'admin', name: 'Dylan', role: 'admin' },
  { username: 'test1', password: 'pass1', name: 'Test 1', role: 'apprenant' },
  { username: 'test2', password: 'pass2', name: 'Test 2', role: 'apprenant' },
];

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const u = username.trim();
    const p = password.trim();
    const found = DEMO_USERS.find((item) => item.username === u && item.password === p);
    if (!found) {
      setError('Identifiant ou mot de passe incorrect.');
      return;
    }
    setError('');
    onLogin({ username: found.username, name: found.name, role: found.role });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f7f8] px-4 py-10">
      <div className="w-full max-w-[440px] bg-white border border-[#dce7e9] rounded-2xl p-8 sm:p-10 shadow-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <img
            src="/logo.svg"
            alt="Connecteo"
            className="h-20 w-auto object-contain mb-4"
            referrerPolicy="no-referrer"
          />
          <h1 className="text-2xl font-black tracking-tight text-[#096475]">
            Plateforme de formation
          </h1>
          <p className="text-sm text-[#66757a] mt-1.5">
            Connectez-vous pour accéder à votre espace de gestion ou d’apprentissage.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="login-username"
              className="block text-sm font-bold text-[#243238] mb-1.5"
            >
              Nom d&apos;utilisateur
            </label>
            <input
              id="login-username"
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Votre identifiant"
              className="w-full h-11 px-3.5 rounded-lg border border-[#d6e2e4] bg-[#fbfdfd] text-[#243238] text-sm focus:outline-none focus:border-[#00afa9] focus:ring-3 focus:ring-[#00afa9]/15 transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-sm font-bold text-[#243238] mb-1.5"
            >
              Mot de passe
            </label>
            <input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre mot de passe"
              className="w-full h-11 px-3.5 rounded-lg border border-[#d6e2e4] bg-[#fbfdfd] text-[#243238] text-sm focus:outline-none focus:border-[#00afa9] focus:ring-3 focus:ring-[#00afa9]/15 transition-colors"
            />
          </div>

          {error && (
            <p className="text-sm font-semibold text-[#c0392b]" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full h-11 rounded-lg bg-[#00afa9] hover:bg-[#096475] text-white font-bold text-sm transition-colors cursor-pointer"
          >
            Se connecter
          </button>
        </form>

        <div className="mt-7 pt-5 border-t border-[#e8f0f1]">
          <p className="text-xs text-[#6f7d81] mb-2.5">Accès rapide de test :</p>
          <div className="flex flex-wrap gap-2">
            {DEMO_USERS.map((u) => (
              <button
                key={u.username}
                type="button"
                onClick={() => {
                  setUsername(u.username);
                  setPassword(u.password);
                  setError('');
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-md border border-[#dce7e9] bg-[#f8fbfb] text-[#096475] hover:bg-[#e4f5f4] transition-colors cursor-pointer"
              >
                {u.role === 'admin' ? 'Admin' : 'Apprenant'} ({u.username})
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
