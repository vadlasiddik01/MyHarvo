'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/authContext';
import { useLanguage } from '@/lib/languageContext';
import { X, Save, Lock, User } from 'lucide-react';

interface ProfileProps {
  onClose: () => void;
}

export default function Profile({ onClose }: ProfileProps) {
  const { username, usernameHi, usernameTe, setUsername } = useAuth();
  const { displayExact } = useLanguage();
  const [editUsername, setEditUsername] = useState(username || '');
  const [editUsernameHi, setEditUsernameHi] = useState(usernameHi || '');
  const [editUsernameTe, setEditUsernameTe] = useState(usernameTe || '');
  const [editingUsername, setEditingUsername] = useState(false);
  const [showResetPin, setShowResetPin] = useState(false);
  const [pinForm, setPinForm] = useState({ password: '', newPin: '', confirmPin: '' });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSaveUsername = async () => {
    if (!editUsername.trim()) {
      setMessage({ type: 'error', text: 'Username cannot be empty' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/update-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newUsername: editUsername,
          usernameHi: editUsernameHi,
          usernameTe: editUsernameTe,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to update username' });
        return;
      }

      const data = await response.json();
      setUsername(data.username, data.usernameHi, data.usernameTe);
      setEditingUsername(false);
      setMessage({ type: 'success', text: 'Username updated successfully' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.log('[v0] Error updating username:', err);
      setMessage({ type: 'error', text: 'Failed to update username' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPin = async () => {
    if (!username) {
      setMessage({ type: 'error', text: 'Please sign in again before resetting PIN' });
      return;
    }

    if (!pinForm.password.trim()) {
      setMessage({ type: 'error', text: 'Password is required' });
      return;
    }

    if (pinForm.newPin.length !== 4 || !/^\d+$/.test(pinForm.newPin)) {
      setMessage({ type: 'error', text: 'PIN must be exactly 4 digits' });
      return;
    }

    if (pinForm.newPin !== pinForm.confirmPin) {
      setMessage({ type: 'error', text: 'PINs do not match' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: pinForm.password,
          username,
          newPin: pinForm.newPin,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to reset PIN' });
        return;
      }

      setMessage({ type: 'success', text: 'PIN reset successfully' });
      setPinForm({ password: '', newPin: '', confirmPin: '' });
      setShowResetPin(false);
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.log('[v0] Error resetting PIN:', err);
      setMessage({ type: 'error', text: 'Failed to reset PIN' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="bg-slate-800 border-slate-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-white">My Profile</CardTitle>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Username Section */}
          <div className="space-y-3 p-4 rounded-lg bg-slate-700">
            <div className="flex items-center gap-2">
              <User size={18} className="text-blue-400" />
              <h3 className="font-medium text-white">Display Name</h3>
            </div>

            {editingUsername ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editUsername}
                  onChange={e => setEditUsername(e.target.value)}
                  placeholder="Enter new username"
                  className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  value={editUsernameHi}
                  onChange={e => setEditUsernameHi(e.target.value)}
                  placeholder="Username exact Hindi"
                  className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  value={editUsernameTe}
                  onChange={e => setEditUsernameTe(e.target.value)}
                  placeholder="Username exact Telugu"
                  className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveUsername}
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Save size={16} className="mr-2" />
                    Save
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingUsername(false);
                      setEditUsername(username || '');
                      setEditUsernameHi(usernameHi || '');
                      setEditUsernameTe(usernameTe || '');
                    }}
                    className="flex-1 bg-slate-600 hover:bg-slate-500 text-white"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-slate-100 font-medium">{displayExact(username, usernameHi, usernameTe)}</span>
                <Button
                  onClick={() => {
                    setEditUsername(username || '');
                    setEditUsernameHi(usernameHi || '');
                    setEditUsernameTe(usernameTe || '');
                    setEditingUsername(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
                >
                  Edit
                </Button>
              </div>
            )}
          </div>

          {/* PIN Reset Section */}
          <div className="space-y-3 p-4 rounded-lg bg-slate-700">
            <div className="flex items-center gap-2">
              <Lock size={18} className="text-amber-400" />
              <h3 className="font-medium text-white">4-Digit PIN</h3>
            </div>

            {showResetPin ? (
              <div className="space-y-3">
                <input
                  type="password"
                  placeholder="Enter password"
                  value={pinForm.password}
                  onChange={e => setPinForm({ ...pinForm, password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="New 4-digit PIN"
                  value={pinForm.newPin}
                  onChange={e => setPinForm({ ...pinForm, newPin: e.target.value })}
                  maxLength={4}
                  className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="Confirm PIN"
                  value={pinForm.confirmPin}
                  onChange={e => setPinForm({ ...pinForm, confirmPin: e.target.value })}
                  maxLength={4}
                  className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleResetPin}
                    disabled={loading}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <Save size={16} className="mr-2" />
                    Update PIN
                  </Button>
                  <Button
                    onClick={() => {
                      setShowResetPin(false);
                      setPinForm({ password: '', newPin: '', confirmPin: '' });
                    }}
                    className="flex-1 bg-slate-600 hover:bg-slate-500 text-white"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setShowResetPin(true)}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              >
                Reset PIN
              </Button>
            )}
          </div>

          {/* Messages */}
          {message && (
            <div
              className={`p-3 rounded text-sm font-medium ${
                message.type === 'success'
                  ? 'bg-green-900 text-green-100 border border-green-700'
                  : 'bg-red-900 text-red-100 border border-red-700'
              }`}
            >
              {message.text}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
