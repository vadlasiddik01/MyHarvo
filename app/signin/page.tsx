'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/authContext';
import { LanguageToggle, useLanguage } from '@/lib/languageContext';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { getGoogleAccessToken } from '@/lib/googleOAuthClient';

export default function SigninPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const { t } = useLanguage();
  
  // Sign In State
  const [signInUsername, setSignInUsername] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInPin, setSignInPin] = useState('');
  const [signInMethod, setSignInMethod] = useState<'password' | 'pin'>('password');
  const [showPassword, setShowPassword] = useState(false);
  const [signInError, setSignInError] = useState('');
  const [signInLoading, setSignInLoading] = useState(false);
  const [googleSignInLoading, setGoogleSignInLoading] = useState(false);

  // Reset PIN State
  const [resetUsername, setResetUsername] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetNewPin, setResetNewPin] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError('');

    if (!signInUsername.trim()) {
      setSignInError(t('Username is required'));
      return;
    }

    if (signInMethod === 'password') {
      if (!signInPassword.trim()) {
        setSignInError(t('Password is required'));
        return;
      }
    } else {
      if (!signInPin.trim() || signInPin.length !== 4) {
        setSignInError(t('PIN must be exactly 4 digits'));
        return;
      }
    }

    setSignInLoading(true);

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: signInUsername,
          password: signInMethod === 'password' ? signInPassword : undefined,
          pin: signInMethod === 'pin' ? signInPin : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSignInError(t(data.error || 'Sign in failed'));
        return;
      }

      setUser(data.userId, data.username);
      router.push('/');
    } catch (err) {
      setSignInError(t('An error occurred during sign in'));
      console.error('[v0] Signin error:', err);
    } finally {
      setSignInLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setSignInError('');
    setGoogleSignInLoading(true);

    try {
      const googleAccessToken = await getGoogleAccessToken();
      const response = await fetch('/api/auth/google-signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleAccessToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSignInError(t(data.error || 'Google sign in failed'));
        return;
      }

      setUser(data.userId, data.username);
      router.push('/');
    } catch (err) {
      setSignInError(err instanceof Error ? err.message : t('Google sign in failed'));
    } finally {
      setGoogleSignInLoading(false);
    }
  };

  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (!resetUsername.trim()) {
      setResetError(t('Username is required'));
      return;
    }

    if (!resetPassword.trim()) {
      setResetError(t('Password is required'));
      return;
    }

    if (!resetNewPin.trim() || resetNewPin.length !== 4) {
      setResetError(t('New PIN must be exactly 4 digits'));
      return;
    }

    if (!/^\d{4}$/.test(resetNewPin)) {
      setResetError(t('PIN must contain only digits'));
      return;
    }

    setResetLoading(true);

    try {
      const response = await fetch('/api/auth/reset-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: resetUsername,
          password: resetPassword,
          newPin: resetNewPin,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setResetError(t(data.error || 'PIN reset failed'));
        return;
      }

      setResetSuccess(t('PIN reset successfully! You can now sign in with your new PIN.'));
      setResetUsername('');
      setResetPassword('');
      setResetNewPin('');
    } catch (err) {
      setResetError(t('An error occurred during PIN reset'));
      console.error('[v0] Reset PIN error:', err);
    } finally {
      setResetLoading(false);
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
            <h1 className="text-3xl font-bold text-white mb-2">{t('Welcome to MyHarvo')}</h1>
            <p className="text-slate-400 text-sm">{t('Sign in to your harvesting management account')}</p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-700 mb-6">
              <TabsTrigger value="signin">{t('Sign In')}</TabsTrigger>
              <TabsTrigger value="reset">{t('Reset PIN')}</TabsTrigger>
            </TabsList>

            {/* Sign In Tab */}
            <TabsContent value="signin">
              <Button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleSignInLoading || signInLoading}
                className="mb-5 w-full border border-slate-600 bg-slate-700 text-white hover:bg-slate-600"
              >
                {googleSignInLoading ? t('Signing In...') : 'Sign in with Google'}
              </Button>

              <div className="mb-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-700" />
                <span className="text-xs text-slate-500">or</span>
                <div className="h-px flex-1 bg-slate-700" />
              </div>

              <form onSubmit={handleSignIn} className="space-y-5">
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    {t('Username')}
                  </label>
                  <input
                    type="text"
                    value={signInUsername}
                    onChange={(e) => setSignInUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    disabled={signInLoading}
                  />
                </div>

                {/* Sign In Method Tabs */}
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSignInMethod('password')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                        signInMethod === 'password'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {t('Password')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignInMethod('pin')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                        signInMethod === 'pin'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {t('PIN')}
                    </button>
                  </div>

                  {signInMethod === 'password' ? (
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-2">
                        {t('Password')}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={signInPassword}
                          onChange={(e) => setSignInPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          disabled={signInLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-2">
                        {t('4-Digit PIN')}
                      </label>
                      <input
                        type="password"
                        value={signInPin}
                        onChange={(e) => setSignInPin(e.target.value.slice(0, 4))}
                        placeholder="0000"
                        maxLength={4}
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-center text-2xl tracking-widest"
                        disabled={signInLoading}
                      />
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {signInError && (
                  <div className="flex items-center gap-2 bg-red-900/30 border border-red-700 rounded-lg p-3">
                    <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
                    <p className="text-red-100 text-sm">{signInError}</p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={signInLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
                >
                  {signInLoading ? t('Signing In...') : t('Sign In')}
                </Button>
              </form>

              {/* Sign Up Link */}
              <div className="mt-6 text-center">
                <p className="text-slate-400 text-sm">
                  {t("Don't have an account?")}{' '}
                  <button
                    onClick={() => router.push('/signup')}
                    className="text-blue-400 hover:text-blue-300 font-medium"
                  >
                    {t('Create Account')}
                  </button>
                </p>
              </div>
            </TabsContent>

            {/* Reset PIN Tab */}
            <TabsContent value="reset">
              <form onSubmit={handleResetPin} className="space-y-5">
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    {t('Username')}
                  </label>
                  <input
                    type="text"
                    value={resetUsername}
                    onChange={(e) => setResetUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    disabled={resetLoading}
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    {t('Password')}
                  </label>
                  <div className="relative">
                    <input
                      type={showResetPassword ? 'text' : 'password'}
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      disabled={resetLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                    >
                      {showResetPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* New PIN */}
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    {t('New 4-digit PIN')}
                  </label>
                  <input
                    type="password"
                    value={resetNewPin}
                    onChange={(e) => setResetNewPin(e.target.value.slice(0, 4))}
                    placeholder="0000"
                    maxLength={4}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-center text-2xl tracking-widest"
                    disabled={resetLoading}
                  />
                </div>

                {/* Error Message */}
                {resetError && (
                  <div className="flex items-center gap-2 bg-red-900/30 border border-red-700 rounded-lg p-3">
                    <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
                    <p className="text-red-100 text-sm">{resetError}</p>
                  </div>
                )}

                {/* Success Message */}
                {resetSuccess && (
                  <div className="flex items-center gap-2 bg-green-900/30 border border-green-700 rounded-lg p-3">
                    <CheckCircle size={18} className="text-green-400 flex-shrink-0" />
                    <p className="text-green-100 text-sm">{resetSuccess}</p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
                >
                  {resetLoading ? t('Resetting PIN...') : t('Reset PIN')}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}
