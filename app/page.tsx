'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Dashboard from '@/components/Dashboard';
import HarvestingRecords from '@/components/HarvestingRecords';
import DieselManagement from '@/components/DieselManagement';
import ServiceRepairs from '@/components/ServiceRepairs';
import Reports from '@/components/Reports';
import Profile from '@/components/Profile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Droplet, Wrench, Newspaper, Home, LogOut, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/authContext';
import { LanguageToggle, useLanguage } from '@/lib/languageContext';

export default function Page() {
  const router = useRouter();
  const { userId, username, isLoggedIn, logout, checkAuth } = useAuth();
  const { t, displayText, displayExact } = useLanguage();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mounted, setMounted] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    checkAuth();
    setMounted(true);
  }, [checkAuth]);

  useEffect(() => {
    if (mounted && !isLoggedIn) {
      router.push('/signin');
    }
  }, [mounted, isLoggedIn, router]);

  if (!mounted || !isLoggedIn) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">{t('Loading...')}</div>
      </main>
    );
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      logout();
      router.push('/signin');
    } catch (err) {
      console.error('[v0] Logout error:', err);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">{displayExact('MyHarvo')}</h1>
              <p className="text-slate-400">{t('Track your harvesting operations, costs, and maintenance')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <LanguageToggle />
              <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
                <User size={18} className="text-blue-400" />
                <span className="text-white font-medium">{displayText(username)}</span>
              </div>
              <Button
                onClick={() => setShowProfile(true)}
                variant="outline"
                className="border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700 hover:text-white"
                aria-label="Settings"
              >
                <Settings size={18} />
              </Button>
              <Button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
              >
                <LogOut size={18} />
                {t('Logout')}
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-slate-800 border border-slate-700">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">{t('Dashboard')}</span>
              </TabsTrigger>
              <TabsTrigger value="harvesting" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">{t('Harvesting')}</span>
              </TabsTrigger>
              <TabsTrigger value="diesel" className="flex items-center gap-2">
                <Droplet className="w-4 h-4" />
                <span className="hidden sm:inline">{t('Diesel')}</span>
              </TabsTrigger>
              <TabsTrigger value="services" className="flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                <span className="hidden sm:inline">{t('Services')}</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <Newspaper className="w-4 h-4" />
                <span className="hidden sm:inline">{t('Reports')}</span>
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="dashboard">
                <Dashboard />
              </TabsContent>

              <TabsContent value="harvesting">
                <HarvestingRecords />
              </TabsContent>

              <TabsContent value="diesel">
                <DieselManagement />
              </TabsContent>

              <TabsContent value="services">
                <ServiceRepairs />
              </TabsContent>

              <TabsContent value="reports">
                <Reports />
              </TabsContent>
            </div>
          </Tabs>
        </div>
        {showProfile && <Profile onClose={() => setShowProfile(false)} />}
      </main>
  );
}
