'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Clock, Droplet, Wrench, TrendingUp } from 'lucide-react';
import { formatTime, formatTimeWithColon } from '@/lib/timeUtils';
import { formatLocalizedDate, useLanguage } from '@/lib/languageContext';

interface HarvestingRecord {
  _id: string;
  village: string;
  villageHi?: string;
  villageTe?: string;
  hoursWorked: number;
  date: string;
}

interface DieselRecord {
  _id: string;
  village: string;
  totalCost: number;
  date: string;
}

interface ServiceRecord {
  _id: string;
  cost: number;
  date: string;
}

export default function Dashboard() {
  const { language, t, displayText, displayExact } = useLanguage();
  const [harvestingData, setHarvestingData] = useState<HarvestingRecord[]>([]);
  const [dieselData, setDieselData] = useState<DieselRecord[]>([]);
  const [serviceData, setServiceData] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [harvestRes, dieselRes, serviceRes] = await Promise.all([
          fetch('/api/harvesting'),
          fetch('/api/diesel'),
          fetch('/api/service'),
        ]);

        if (harvestRes.ok) setHarvestingData(await harvestRes.json());
        if (dieselRes.ok) setDieselData(await dieselRes.json());
        if (serviceRes.ok) setServiceData(await serviceRes.json());
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toMinutes = (hours: number) => Math.round(Number(hours || 0) * 60);
  const toHours = (minutes: number) => minutes / 60;

  // Calculate metrics
  const totalHarvestMinutes = harvestingData.reduce((sum, r) => sum + toMinutes(r.hoursWorked), 0);
  const totalHours = toHours(totalHarvestMinutes);
  const totalDieselCost = dieselData.reduce((sum, r) => sum + r.totalCost, 0);
  const totalServiceCost = serviceData.reduce((sum, r) => sum + r.cost, 0);

  // Group by village for charts
  const villageHarvesting = harvestingData.reduce((acc: any, record) => {
    const existing = acc.find((v: any) => v.village === record.village);
    const minutes = toMinutes(record.hoursWorked);
    if (existing) {
      existing.minutes += minutes;
      existing.hours = toHours(existing.minutes);
      existing.count += 1;
      if (record.villageHi || record.villageTe) {
        existing.villageLabel = displayExact(record.village, record.villageHi, record.villageTe);
      }
    } else {
      acc.push({
        village: record.village,
        villageLabel: displayExact(record.village, record.villageHi, record.villageTe),
        minutes,
        hours: toHours(minutes),
        count: 1,
      });
    }
    return acc;
  }, []);

  // Group by month for trend
  const monthlyData = harvestingData.reduce((acc: any, record) => {
    const date = new Date(record.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = formatLocalizedDate(date, language, { month: 'short', year: 'numeric' });
    const existing = acc.find((d: any) => d.month === monthKey);
    const minutes = toMinutes(record.hoursWorked);
    if (existing) {
      existing.minutes += minutes;
      existing.hours = toHours(existing.minutes);
    } else {
      acc.push({
        month: monthKey,
        monthLabel,
        minutes,
        hours: toHours(minutes),
      });
    }
    return acc;
  }, []).sort((a: any, b: any) => a.month.localeCompare(b.month)).slice(-12);

  // Cost breakdown
  const costData = [
    { name: t('Diesel'), value: totalDieselCost, color: '#f59e0b' },
    { name: t('Services'), value: totalServiceCost, color: '#ef4444' },
  ];

  if (loading) {
    return <div className="text-center py-12">{t('Loading dashboard...')}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-100">{t('Total Hours')}</CardTitle>
            <Clock className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatTimeWithColon(totalHours)}</div>
            <p className="text-xs text-slate-400 mt-1">{t('Harvesting hours')}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-100">{t('Diesel Cost')}</CardTitle>
            <Droplet className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">₹{totalDieselCost.toFixed(0)}</div>
            <p className="text-xs text-slate-400 mt-1">{t('Total spent')}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-100">{t('Service Cost')}</CardTitle>
            <Wrench className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">₹{totalServiceCost.toFixed(0)}</div>
            <p className="text-xs text-slate-400 mt-1">{t('Repairs & maintenance')}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-100">{t('Total Expenses')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">₹{(totalDieselCost + totalServiceCost).toFixed(0)}</div>
            <p className="text-xs text-slate-400 mt-1">{t('Diesel + Services')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Harvesting by Village */}
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-500 rounded"></div>
              <CardTitle className="text-white text-lg">{t('Hours by Village')}</CardTitle>
            </div>
            <p className="text-xs text-slate-400 mt-2">{t('Total harvesting hours per location')}</p>
          </CardHeader>
          <CardContent>
            {villageHarvesting.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={villageHarvesting} margin={{ top: 10, right: 30, left: 0, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="villageLabel" stroke="#cbd5e1" angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#cbd5e1" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #0ea5e9', borderRadius: '8px' }}
                    formatter={(_: any, __: any, item: any) => [formatTime(item.payload.hours), t('Hours')]}
                    labelFormatter={(_: any, payload: any[]) => payload?.[0]?.payload?.villageLabel || ''}
                  />
                  <Bar dataKey="hours" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 text-center py-12 text-sm">{t('No harvesting data yet')}</p>
            )}
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-emerald-500 rounded"></div>
              <CardTitle className="text-white text-lg">{t('Monthly Trend')}</CardTitle>
            </div>
            <p className="text-xs text-slate-400 mt-2">{t('Harvesting activity over time')}</p>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="monthLabel" stroke="#cbd5e1" angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#cbd5e1" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #10b981', borderRadius: '8px' }}
                    formatter={(_: any, __: any, item: any) => [formatTime(item.payload.hours), t('Hours')]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="hours" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 text-center py-12 text-sm">{t('No monthly data yet')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cost Breakdown */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-amber-500 rounded"></div>
            <CardTitle className="text-white text-lg">{t('Cost Breakdown')}</CardTitle>
          </div>
          <p className="text-xs text-slate-400 mt-2">{t('Expense distribution')}</p>
        </CardHeader>
        <CardContent>
          {costData.some(d => d.value > 0) ? (
            <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={costData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}\n${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {costData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                    formatter={(value: any) => [`₹${value.toFixed(0)}`, t('Cost')]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {costData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-200">{item.name}</span>
                      <span className="text-xs text-slate-400">₹{item.value.toFixed(0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-center py-12 text-sm">{t('No cost data yet')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
