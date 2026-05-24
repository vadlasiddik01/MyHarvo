'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Edit2, Plus } from 'lucide-react';
import { formatLocalizedDate, useLanguage } from '@/lib/languageContext';
import { normalizeName, normalizeNameFields } from '@/lib/normalize';

interface DieselRecord {
  _id: string;
  village: string;
  date: string;
  litres: number;
  costPerLitre: number;
  totalCost: number;
  notes?: string;
}

export default function DieselManagement() {
  const { language, t, displayText } = useLanguage();
  const [records, setRecords] = useState<DieselRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DieselRecord | null>(null);
  const [filterVillage, setFilterVillage] = useState('');
  const [villages, setVillages] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    village: '',
    date: new Date().toISOString().split('T')[0],
    litres: 0,
    costPerLitre: 0,
    totalCost: 0,
    notes: '',
  });

  useEffect(() => {
    fetchRecords();
  }, [filterVillage]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const url = filterVillage
        ? `/api/diesel?village=${encodeURIComponent(filterVillage)}`
        : '/api/diesel';
      const res = await fetch(url);
      const data = await res.json();
      const normalizedData = data.map((record: DieselRecord) => ({
        ...record,
        village: normalizeName(record.village),
      }));
      setRecords(normalizedData);

      const uniqueVillages = [...new Set<string>(normalizedData.map((r: DieselRecord) => r.village))];
      setVillages(uniqueVillages);
    } catch (error) {
      console.error('Failed to fetch records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numValue = ['litres', 'costPerLitre'].includes(name) ? parseFloat(value) || 0 : value;

    const newData = { ...formData, [name]: numValue };

    if ((name === 'litres' || name === 'costPerLitre') && newData.litres && newData.costPerLitre) {
      newData.totalCost = newData.litres * newData.costPerLitre;
    }

    setFormData(newData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const method = editingRecord ? 'PATCH' : 'POST';
      const url = editingRecord ? `/api/diesel/${editingRecord._id}` : '/api/diesel';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalizeNameFields(formData, ['village'])),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingRecord(null);
        resetForm();
        fetchRecords();
      } else {
        alert(t('Failed to save record'));
      }
    } catch (error) {
      console.error('Error saving record:', error);
      alert(t('Error saving record'));
    }
  };

  const handleEdit = (record: DieselRecord) => {
    setEditingRecord(record);
    setFormData({
      village: record.village,
      date: record.date.split('T')[0],
      litres: record.litres,
      costPerLitre: record.costPerLitre,
      totalCost: record.totalCost,
      notes: record.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('Are you sure you want to delete this record?'))) {
      try {
        const res = await fetch(`/api/diesel/${id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchRecords();
        }
      } catch (error) {
        console.error('Failed to delete record:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      village: '',
      date: new Date().toISOString().split('T')[0],
      litres: 0,
      costPerLitre: 0,
      totalCost: 0,
      notes: '',
    });
  };

  const totalLitres = records.reduce((sum, r) => sum + r.litres, 0);
  const totalSpent = records.reduce((sum, r) => sum + r.totalCost, 0);
  const getVillageLabel = (village: string) => {
    return displayText(village);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{t('Diesel Management')}</h2>
          <p className="text-slate-400 text-sm mt-1">{t('Track your diesel fuel purchases and costs')}</p>
        </div>
        <Button
          onClick={() => {
            setEditingRecord(null);
            resetForm();
            setShowForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('Add Diesel Entry')}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">
              {editingRecord ? t('Edit Diesel Entry') : t('New Diesel Entry')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">{t('Village')}</label>
                  <input
                    type="text"
                    name="village"
                    value={formData.village}
                    onChange={handleInputChange}
                    placeholder="Village name"
                    required
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">{t('Litres')}</label>
                  <input
                    type="number"
                    name="litres"
                    value={formData.litres || ''}
                    onChange={handleInputChange}
                    step="0.1"
                    min="0"
                    placeholder="0"
                    required
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">{t('Cost per Litre (₹)')}</label>
                  <input
                    type="number"
                    name="costPerLitre"
                    value={formData.costPerLitre || ''}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    placeholder="0"
                    required
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">{t('Total Cost (₹)')}</label>
                  <div className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-300">
                    {formData.totalCost.toFixed(2)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">{t('Notes')}</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Any notes..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingRecord(null);
                    resetForm();
                  }}
                  className="bg-slate-700 hover:bg-slate-600 text-white"
                >
                  {t('Cancel')}
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {editingRecord ? t('Update') : t('Save')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">{t('Total Litres')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-400">{totalLitres.toFixed(1)} L</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">{t('Total Spent')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-400">₹{totalSpent.toFixed(0)}</div>
          </CardContent>
        </Card>
      </div>

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
            {filterVillage ? `${getVillageLabel(filterVillage)} - ` : ''}{t('Diesel Entries')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-slate-400 text-center py-8">{t('Loading records...')}</p>
          ) : records.length === 0 ? (
            <p className="text-slate-400 text-center py-8">{t('No diesel records found')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-slate-300 font-semibold">{t('Date')}</th>
                    <th className="px-4 py-3 text-left text-slate-300 font-semibold">{t('Village')}</th>
                    <th className="px-4 py-3 text-right text-slate-300 font-semibold">{t('Litres')}</th>
                    <th className="px-4 py-3 text-right text-slate-300 font-semibold">{t('Rate (₹/L)')}</th>
                    <th className="px-4 py-3 text-right text-slate-300 font-semibold">{t('Total (₹)')}</th>
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
                      <td className="px-4 py-3 text-slate-200">{displayText(record.village)}</td>
                      <td className="px-4 py-3 text-right text-slate-200">
                        {record.litres.toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-200">
                        ₹{record.costPerLitre.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-amber-400 font-semibold">
                        ₹{record.totalCost.toFixed(0)}
                      </td>
                      <td className="px-4 py-3 text-slate-400 truncate max-w-[150px]">
                        {record.notes ? displayText(record.notes) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(record)}
                            className="border-amber-600 hover:bg-amber-950 text-amber-400"
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
