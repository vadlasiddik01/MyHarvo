'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Edit2, Plus } from 'lucide-react';
import { formatLocalizedDate, useLanguage } from '@/lib/languageContext';

interface ServiceRecord {
  _id: string;
  date: string;
  description: string;
  descriptionHi?: string;
  descriptionTe?: string;
  cost: number;
  notes?: string;
}

export default function ServiceRepairs() {
  const { language, t, displayText, displayExact } = useLanguage();
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ServiceRecord | null>(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    descriptionHi: '',
    descriptionTe: '',
    cost: 0,
    notes: '',
  });

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/service');
      const data = await res.json();
      setRecords(data);
    } catch (error) {
      console.error('Failed to fetch records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numValue = name === 'cost' ? parseFloat(value) || 0 : value;
    setFormData(prev => ({
      ...prev,
      [name]: numValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const method = editingRecord ? 'PATCH' : 'POST';
      const url = editingRecord ? `/api/service/${editingRecord._id}` : '/api/service';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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

  const handleEdit = (record: ServiceRecord) => {
    setEditingRecord(record);
    setFormData({
      date: record.date.split('T')[0],
      description: record.description,
      descriptionHi: record.descriptionHi || '',
      descriptionTe: record.descriptionTe || '',
      cost: record.cost,
      notes: record.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('Are you sure you want to delete this record?'))) {
      try {
        const res = await fetch(`/api/service/${id}`, { method: 'DELETE' });
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
      date: new Date().toISOString().split('T')[0],
      description: '',
      descriptionHi: '',
      descriptionTe: '',
      cost: 0,
      notes: '',
    });
  };

  const totalCost = records.reduce((sum, r) => sum + r.cost, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{t('Services & Repairs')}</h2>
          <p className="text-slate-400 text-sm mt-1">{t('Track maintenance, repairs, and service costs')}</p>
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
          {t('Add Service')}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">
              {editingRecord ? t('Edit Service Entry') : t('New Service Entry')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  {t('Description')}
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="e.g., Engine oil change, Spark plug replacement"
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">{t('Description')} Hindi</label>
                  <input
                    type="text"
                    name="descriptionHi"
                    value={formData.descriptionHi || ''}
                    onChange={handleInputChange}
                    placeholder="सही हिंदी विवरण"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">{t('Description')} Telugu</label>
                  <input
                    type="text"
                    name="descriptionTe"
                    value={formData.descriptionTe || ''}
                    onChange={handleInputChange}
                    placeholder="సరైన తెలుగు వివరణ"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">{t('Cost (₹)')}</label>
                <input
                  type="number"
                  name="cost"
                  value={formData.cost || ''}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  placeholder="0"
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">{t('Notes')}</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Any additional details..."
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

      {/* Total Cost Card */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-300">{t('Total Service Cost')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-400">₹{totalCost.toFixed(0)}</div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">{t('Service Entries')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-slate-400 text-center py-8">{t('Loading records...')}</p>
          ) : records.length === 0 ? (
            <p className="text-slate-400 text-center py-8">{t('No service records found')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-slate-300 font-semibold">{t('Date')}</th>
                    <th className="px-4 py-3 text-left text-slate-300 font-semibold">{t('Description')}</th>
                    <th className="px-4 py-3 text-right text-slate-300 font-semibold">{t('Cost (₹)')}</th>
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
                      <td className="px-4 py-3 text-slate-200">{displayExact(record.description, record.descriptionHi, record.descriptionTe)}</td>
                      <td className="px-4 py-3 text-right text-red-400 font-semibold">
                        ₹{record.cost.toFixed(0)}
                      </td>
                      <td className="px-4 py-3 text-slate-400 truncate max-w-[200px]">
                        {record.notes ? displayText(record.notes) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(record)}
                            className="border-indigo-600 hover:bg-indigo-950 text-indigo-400"
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
