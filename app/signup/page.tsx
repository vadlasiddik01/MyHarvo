'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/authContext';
import { LanguageToggle, useLanguage } from '@/lib/languageContext';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { normalizeName } from '@/lib/normalize';

export default function SignupPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username.trim()) {
      setError(t('Username is required'));
      return;
    }

    if (!password.trim()) {
      setError(t('Password is required'));
      return;
    }

    if (password.length < 6) {
      setError(t('Password must be at least 6 characters'));
      return;
    }

    if (!pin.trim() || pin.length !== 4) {
      setError(t('PIN must be exactly 4 digits'));
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      setError(t('PIN must contain only digits'));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: normalizeName(username), password, pin }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(t(data.error || 'Signup failed'));
        return;
      }

      setSuccess(t('Account created successfully! Redirecting...'));
      setUser(data.userId, data.username);
      
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err) {
      setError(t('An error occurred during signup'));
      console.error('[v0] Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="fixed right-4 top-4">
        <LanguageToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">{t('Create Account')}</h1>
            <p className="text-slate-400 text-sm">{t('Join MyHarvo to manage your harvesting operations')}</p>
          </div>

          {/* Warning Box */}
          <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-4 mb-6">
            <p className="text-amber-100 text-sm">
              <strong>{t('Important:')}</strong> {t('Remember your username and password - they cannot be changed later!')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                {t('Username (Display Name)')}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="harvester_001"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                disabled={loading}
              />
              <p className="text-xs text-slate-400 mt-1">{t('Can be edited later')}</p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                {t('Password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">{t('Cannot be reset later - keep it safe')}</p>
            </div>

            {/* PIN */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                {t('4-Digit PIN')}
              </label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.slice(0, 4))}
                placeholder="0000"
                maxLength={4}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-center text-2xl tracking-widest"
                disabled={loading}
              />
              <p className="text-xs text-slate-400 mt-1">{t('Can be reset later with password')}</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 bg-red-900/30 border border-red-700 rounded-lg p-3">
                <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
                <p className="text-red-100 text-sm">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="flex items-center gap-2 bg-green-900/30 border border-green-700 rounded-lg p-3">
                <CheckCircle size={18} className="text-green-400 flex-shrink-0" />
                <p className="text-green-100 text-sm">{success}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
            >
              {loading ? t('Creating Account...') : t('Create Account')}
            </Button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              {t('Already have an account?')}{' '}
              <button
                onClick={() => router.push('/signin')}
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                {t('Sign In')}
              </button>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
