'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Edit2, Plus } from 'lucide-react';
import { formatTime, formatTimeRange12Hour, timeStringToDecimal, calculateDuration } from '@/lib/timeUtils';
import HarvestingForm from './HarvestingForm';
import { formatLocalizedDate, useLanguage } from '@/lib/languageContext';

interface HarvestingRecord {
  _id: string;
  village: string;
  villageHi?: string;
  villageTe?: string;
  farmerName: string;
  farmerNameHi?: string;
  farmerNameTe?: string;
  date: string;
  hoursWorked: number;
  startTime?: string;
  endTime?: string;
  notes?: string;
}

export default function HarvestingRecords() {
  const { language, t, displayText, displayExact } = useLanguage();
  const [records, setRecords] = useState<HarvestingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HarvestingRecord | null>(null);
  const [filterVillage, setFilterVillage] = useState('');
  const [villages, setVillages] = useState<string[]>([]);

  useEffect(() => {
    fetchRecords();
  }, [filterVillage]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const url = filterVillage
        ? `/api/harvesting?village=${encodeURIComponent(filterVillage)}`
        : '/api/harvesting';
      const res = await fetch(url);
      const data = await res.json();
      setRecords(data);

      // Extract unique villages
      const uniqueVillages = [...new Set<string>(data.map((r: HarvestingRecord) => r.village))];
      setVillages(uniqueVillages);
    } catch (error) {
      console.error('Failed to fetch records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('Are you sure you want to delete this record?'))) {
      try {
        const res = await fetch(`/api/harvesting/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setRecords(records.filter(r => r._id !== id));
        }
      } catch (error) {
        console.error('Failed to delete record:', error);
      }
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingRecord(null);
    fetchRecords();
  };
  const getVillageLabel = (village: string) => {
    const record = records.find((item) => item.village === village);
    return displayExact(village, record?.villageHi, record?.villageTe);
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{t('Harvesting Records')}</h2>
          <p className="text-slate-400 text-sm mt-1">{t('Track your harvesting sessions by village and farmer')}</p>
        </div>
        <Button
          onClick={() => {
            setEditingRecord(null);
            setShowForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('Add Harvest')}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">
              {editingRecord ? t('Edit Harvest Record') : t('New Harvest Record')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HarvestingForm
              record={editingRecord}
              onSubmit={handleFormClose}
              onCancel={handleFormClose}
            />
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={!filterVillage ? 'default' : 'outline'}
          onClick={() => setFilterVillage('')}
          className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
        >
          {t('All Villages')}
        </Button>
        {villages.map(village => (
          <Button
            key={village}
            variant={filterVillage === village ? 'default' : 'outline'}
            onClick={() => setFilterVillage(village)}
            className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
          >
            {getVillageLabel(village)}
          </Button>
        ))}
      </div>

      {/* Records Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">
            {filterVillage ? `${getVillageLabel(filterVillage)} - ` : ''}{t('Harvest Sessions')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-slate-400 text-center py-8">{t('Loading records...')}</p>
          ) : records.length === 0 ? (
            <p className="text-slate-400 text-center py-8">{t('No harvesting records found')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-slate-300 font-semibold">{t('Date')}</th>
                    <th className="px-4 py-3 text-left text-slate-300 font-semibold">{t('Village')}</th>
                    <th className="px-4 py-3 text-left text-slate-300 font-semibold">{t('Farmer')}</th>
                    <th className="px-4 py-3 text-left text-slate-300 font-semibold">{t('Hours')}</th>
                    <th className="px-4 py-3 text-left text-slate-300 font-semibold">{t('Time Range')}</th>
                    <th className="px-4 py-3 text-left text-slate-300 font-semibold">{t('Notes')}</th>
                    <th className="px-4 py-3 text-right text-slate-300 font-semibold">{t('Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {records.map(record => (
                    <tr key={record._id} className="hover:bg-slate-700 transition">
                      <td className="px-4 py-3 text-slate-200">
                        {formatLocalizedDate(record.date, language)}
                      </td>
                      <td className="px-4 py-3 text-slate-200">{displayExact(record.village, record.villageHi, record.villageTe)}</td>
                      <td className="px-4 py-3 text-slate-200">{displayExact(record.farmerName, record.farmerNameHi, record.farmerNameTe)}</td>
                      <td className="px-4 py-3 text-blue-400 font-semibold">
                        {formatTime(record.hoursWorked)}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {record.startTime && record.endTime
                          ? formatTimeRange12Hour(record.startTime, record.endTime)
                          : t('Manual entry')}
                      </td>
                      <td className="px-4 py-3 text-slate-400 truncate max-w-[200px]">
                        {record.notes ? displayText(record.notes) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingRecord(record);
                              setShowForm(true);
                            }}
                            className="border-blue-600 hover:bg-blue-950 text-blue-400"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(record._id)}
                            className="border-red-600 hover:bg-red-950 text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
