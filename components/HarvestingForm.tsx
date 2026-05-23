'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { calculateDuration, timeStringToDecimal, formatClock12Hour, formatTimeWithColon } from '@/lib/timeUtils';
import { useLanguage } from '@/lib/languageContext';

interface HarvestingRecord {
  _id?: string;
  village: string;
  farmerName: string;
  date: string;
  hoursWorked: number;
  startTime?: string;
  endTime?: string;
  notes?: string;
}

interface Props {
  record?: HarvestingRecord | null;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function HarvestingForm({ record, onSubmit, onCancel }: Props) {
  const { t } = useLanguage();
  const [entryType, setEntryType] = useState<'timer' | 'manual'>('manual');
  const [formData, setFormData] = useState<HarvestingRecord>({
    village: '',
    farmerName: '',
    date: new Date().toISOString().split('T')[0],
    hoursWorked: 0,
    startTime: '09:00',
    endTime: '17:00',
    notes: '',
  });

  const [timerStarted, setTimerStarted] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerStartMs, setTimerStartMs] = useState<number | null>(null);
  const [accumulatedSeconds, setAccumulatedSeconds] = useState(0);

  useEffect(() => {
    if (record) {
      setFormData({
        ...record,
        date: record.date || new Date().toISOString().split('T')[0],
      });
      if (record.startTime && record.endTime) {
        setEntryType('manual');
      }
    }
  }, [record]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (timerStarted && timerStartMs) {
      interval = setInterval(() => {
        setTimerSeconds(accumulatedSeconds + Math.floor((Date.now() - timerStartMs) / 1000));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [accumulatedSeconds, timerStarted, timerStartMs]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (updated.startTime && updated.endTime) {
        updated.hoursWorked = calculateDuration(updated.startTime, updated.endTime);
      }
      return updated;
    });
  };

  const handleTimerStart = () => {
    if (timerStarted) {
      setAccumulatedSeconds(timerSeconds);
      setTimerStarted(false);
      setTimerStartMs(null);
      return;
    }

    if (timerSeconds === 0) {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setFormData(prev => ({
        ...prev,
        startTime: `${hours}:${minutes}`,
      }));
    }

    setTimerStartMs(Date.now());
    setTimerStarted(true);
  };

  const handleTimerStop = () => {
    const finalSeconds = timerStarted && timerStartMs
      ? accumulatedSeconds + Math.floor((Date.now() - timerStartMs) / 1000)
      : timerSeconds;

    if (finalSeconds > 0) {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const endTime = `${hours}:${minutes}`;
      
      setFormData(prev => {
        const updated = {
          ...prev,
          endTime,
          hoursWorked: finalSeconds / 3600,
        };
        return updated;
      });
      setTimerSeconds(finalSeconds);
      setAccumulatedSeconds(finalSeconds);
    }
    setTimerStarted(false);
    setTimerStartMs(null);
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const method = record?._id ? 'PATCH' : 'POST';
      const url = record?._id ? `/api/harvesting/${record._id}` : '/api/harvesting';
      const runningTimerSeconds = timerStarted && timerStartMs
        ? accumulatedSeconds + Math.floor((Date.now() - timerStartMs) / 1000)
        : timerSeconds;
      const payload = entryType === 'timer' && runningTimerSeconds > 0
        ? { ...formData, hoursWorked: runningTimerSeconds / 3600 }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        onSubmit();
      } else {
        alert(t('Failed to save record'));
      }
    } catch (error) {
      console.error('Error saving record:', error);
      alert(t('Error saving record'));
    }
  };

  const formatTimerDisplay = () => {
    const hours = Math.floor(timerSeconds / 3600);
    const minutes = Math.floor((timerSeconds % 3600) / 60);
    const seconds = timerSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Village and Farmer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-200 mb-2">{t('Village')}</label>
          <input
            type="text"
            name="village"
            value={formData.village}
            onChange={handleInputChange}
            placeholder="Enter village name"
            required
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-200 mb-2">{t('Farmer Name')}</label>
          <input
            type="text"
            name="farmerName"
            value={formData.farmerName}
            onChange={handleInputChange}
            placeholder="Enter farmer name"
            required
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-slate-200 mb-2">{t('Date')}</label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleInputChange}
          required
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Time Entry */}
      <Tabs value={entryType} onValueChange={(v: any) => setEntryType(v)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-700 border border-slate-600">
          <TabsTrigger value="manual">{t('Manual Entry')}</TabsTrigger>
          <TabsTrigger value="timer">{t('Timer')}</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">{t('Start Time')}</label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime || '09:00'}
                onChange={handleTimeChange}
                required
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">{t('End Time')}</label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime || '17:00'}
                onChange={handleTimeChange}
                required
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          {formData.hoursWorked > 0 && (
            <p className="text-slate-300 text-sm text-center bg-slate-700 py-2 rounded">
              {t('Total Hours:')} <span className="font-bold">{formatTimeWithColon(formData.hoursWorked)}</span>
            </p>
          )}
        </TabsContent>

        <TabsContent value="timer" className="space-y-4">
          <div className="bg-slate-700 rounded-lg p-6 text-center">
            <div className="text-4xl font-bold text-blue-400 mb-4 font-mono">
              {formatTimerDisplay()}
            </div>
            <div className="flex gap-2 justify-center mb-4">
              <Button
                type="button"
                onClick={handleTimerStart}
                className={`${
                  timerStarted
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                } text-white`}
              >
                {timerStarted ? t('Pause') : t('Start')}
              </Button>
              <Button
                type="button"
                onClick={handleTimerStop}
                className="bg-slate-600 hover:bg-slate-500 text-white"
              >
                {t('Stop & Save')}
              </Button>
            </div>
            {formData.startTime && (
              <p className="text-slate-300 text-sm">
                {t('From')} {formatClock12Hour(formData.startTime)} {formData.endTime && `${t('to')} ${formatClock12Hour(formData.endTime)}`}
              </p>
            )}
          </div>


        </TabsContent>
      </Tabs>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-slate-200 mb-2">{t('Notes (Optional)')}</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          placeholder="Add any notes about this harvest session"
          rows={3}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          onClick={onCancel}
          className="bg-slate-700 hover:bg-slate-600 text-white"
        >
          {t('Cancel')}
        </Button>
        <Button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {record?._id ? t('Update Record') : t('Save Record')}
        </Button>
      </div>
    </form>
  );
}
