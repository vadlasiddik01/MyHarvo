'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { formatTimeWithColon } from '@/lib/timeUtils';
import { useAuth } from '@/lib/authContext';
import { formatLocalizedDate, getLanguageLocale, useLanguage } from '@/lib/languageContext';

interface HarvestingRecord {
  _id: string;
  village: string;
  farmerName: string;
  date: string;
  hoursWorked: number;
  startTime?: string;
  endTime?: string;
}

interface DieselRecord {
  _id: string;
  village: string;
  date: string;
  litres: number;
  costPerLitre: number;
  totalCost: number;
}

interface ServiceRecord {
  _id: string;
  date: string;
  description: string;
  cost: number;
}

export default function Reports() {
  const { username } = useAuth();
  const { language, t, displayText } = useLanguage();
  const [harvestingData, setHarvestingData] = useState<HarvestingRecord[]>([]);
  const [dieselData, setDieselData] = useState<DieselRecord[]>([]);
  const [serviceData, setServiceData] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVillage, setSelectedVillage] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hourlyRate, setHourlyRate] = useState<number>(0);
  const [villages, setVillages] = useState<string[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [harvestRes, dieselRes, serviceRes] = await Promise.all([
        fetch('/api/harvesting'),
        fetch('/api/diesel'),
        fetch('/api/service'),
      ]);

      const harvestData = await harvestRes.json();
      const dieselInfo = await dieselRes.json();
      const serviceInfo = await serviceRes.json();

      setHarvestingData(harvestData);
      setDieselData(dieselInfo);
      setServiceData(serviceInfo);

      const uniqueVillages = [...new Set<string>(harvestData.map((r: HarvestingRecord) => r.village))];
      setVillages(uniqueVillages);

      if (uniqueVillages.length > 0) {
        setSelectedVillage(uniqueVillages[0]);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let harvestFiltered = harvestingData;
    let dieselFiltered = dieselData;

    if (selectedVillage) {
      harvestFiltered = harvestFiltered.filter(h => h.village === selectedVillage);
      dieselFiltered = dieselFiltered.filter(d => d.village === selectedVillage);
    }

    if (startDate) {
      const start = new Date(startDate);
      harvestFiltered = harvestFiltered.filter(h => new Date(h.date) >= start);
      dieselFiltered = dieselFiltered.filter(d => new Date(d.date) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59);
      harvestFiltered = harvestFiltered.filter(h => new Date(h.date) <= end);
      dieselFiltered = dieselFiltered.filter(d => new Date(d.date) <= end);
    }

    return { harvestFiltered, dieselFiltered };
  };

  const formatDate = (value: string | Date, withYear = true) =>
    formatLocalizedDate(
      value,
      language,
      withYear ? { month: 'short', day: '2-digit', year: 'numeric' } : { month: 'short', day: '2-digit' }
    );

  const formatDateTime = (value: Date) =>
    new Intl.DateTimeFormat(getLanguageLocale(language), {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(value);

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const { harvestFiltered, dieselFiltered } = filterData();
  const totalHours = harvestFiltered.reduce((sum, r) => sum + r.hoursWorked, 0);
  const totalHarvestIncome = totalHours * hourlyRate;
  const totalDieselCost = dieselFiltered.reduce((sum, r) => sum + r.totalCost, 0);
  const totalServiceCost = serviceData.reduce((sum, r) => sum + r.cost, 0);
  const totalExpenses = totalDieselCost + totalServiceCost;
  const netProfit = totalHarvestIncome - totalExpenses;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const reportHTML = `
      <!DOCTYPE html>
      <html lang="${language}">
      <head>
        <title>${t('Harvesting Machine Management Report')} - ${escapeHtml(displayText(selectedVillage))}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: white; }
          .container { max-width: 900px; margin: 0 auto; padding: 40px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .header h1 { font-size: 24px; margin-bottom: 10px; }
          .header p { color: #666; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 16px; font-weight: bold; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 1px solid #ddd; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f5f5f5; font-weight: bold; }
          .summary { background: #f9f9f9; padding: 20px; border-radius: 5px; }
          .summary-item { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
          .summary-item.total { font-size: 16px; font-weight: bold; border-top: 1px solid #ddd; padding-top: 10px; margin-top: 10px; }
          .summary-item.profit { color: #22c55e; }
          .summary-item.loss { color: #ef4444; }
          .text-right { text-align: right; }
          .footer { text-align: center; margin-top: 40px; color: #999; font-size: 12px; }
          @media print {
            body { margin: 0; padding: 0; }
            .container { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${t('Harvesting Machine Management Report')}</h1>
            <p>${t('Harvester')}: <strong>${escapeHtml(displayText(username || 'N/A'))}</strong></p>
            <p>${t('Village')}: <strong>${escapeHtml(displayText(selectedVillage))}</strong></p>
            <p>${startDate && endDate ? `${t('Period')}: ${formatDate(startDate)} ${t('to')} ${formatDate(endDate)}` : t('All Records')}</p>
            <p>${t('Generated on')}: ${formatDateTime(new Date())}</p>
          </div>

          <div class="section">
            <div class="section-title">${t('Harvesting Summary')}</div>
            <table>
              <thead>
                <tr>
                  <th>${t('Date')}</th>
                  <th>${t('Farmer')}</th>
                  <th class="text-right">${t('Hours')}</th>
                </tr>
              </thead>
              <tbody>
                ${harvestFiltered.map(h => `
                  <tr>
                    <td>${formatDate(h.date)}</td>
                    <td>${escapeHtml(displayText(h.farmerName))}</td>
                    <td class="text-right">${formatTimeWithColon(h.hoursWorked)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <div class="section-title">${t('Diesel Transactions')}</div>
            <table>
              <thead>
                <tr>
                  <th>${t('Date')}</th>
                  <th class="text-right">${t('Litres')}</th>
                  <th class="text-right">${t('Rate (₹/L)')}</th>
                  <th class="text-right">${t('Total (₹)')}</th>
                </tr>
              </thead>
              <tbody>
                ${dieselFiltered.map(d => `
                  <tr>
                    <td>${formatDate(d.date)}</td>
                    <td class="text-right">${d.litres.toFixed(1)}</td>
                    <td class="text-right">₹${d.costPerLitre.toFixed(2)}</td>
                    <td class="text-right">₹${d.totalCost.toFixed(0)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <div class="section-title">${t('Financial Summary')}</div>
            <div class="summary">
              <div class="summary-item"><span>${t('Total Hours Harvested:')}</span><strong>${formatTimeWithColon(totalHours)}</strong></div>
              <div class="summary-item"><span>${t('Hourly Rate:')}</span><strong>₹${hourlyRate.toFixed(0)}/${t('Hours')}</strong></div>
              <div class="summary-item total"><span>${t('Total Harvest Income:')}</span><strong>₹${totalHarvestIncome.toFixed(0)}</strong></div>
              <div class="summary-item" style="margin-top: 20px;"><span>${t('Diesel Cost:')}</span><strong>₹${totalDieselCost.toFixed(0)}</strong></div>
              <div class="summary-item"><span>${t('Service & Repair Cost:')}</span><strong>₹${totalServiceCost.toFixed(0)}</strong></div>
              <div class="summary-item total"><span>${t('Total Expenses:')}</span><strong>₹${totalExpenses.toFixed(0)}</strong></div>
              <div class="summary-item total ${netProfit >= 0 ? 'profit' : 'loss'}" style="margin-top: 20px;"><span>${t('Net Profit:')}</span><strong>₹${netProfit.toFixed(0)}</strong></div>
            </div>
          </div>

          <div class="footer">
            <p>${t('This report was generated by Harvesting Machine Management System')}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(reportHTML);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
  };

  if (loading) {
    return <div className="text-center py-12">{t('Loading reports...')}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">{t('Reports & Analysis')}</h2>
        <p className="text-slate-400 text-sm">{t('Generate detailed reports with income calculations and expense breakdowns')}</p>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">{t('Filters')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">{t('Village')}</label>
              <select
                value={selectedVillage}
                onChange={e => setSelectedVillage(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
              >
                {villages.map(v => (
                  <option key={v} value={v}>{displayText(v)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">{t('Start Date')}</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">{t('End Date')}</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">{t('Hourly Rate (₹)')}</label>
              <input
                type="number"
                value={hourlyRate || ''}
                onChange={e => setHourlyRate(parseFloat(e.target.value) || 0)}
                placeholder="0"
                step="10"
                min="0"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">{t('Total Hours')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400">{formatTimeWithColon(totalHours)}</div>
            <p className="text-xs text-slate-400 mt-1">{t('Harvesting hours')}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">{t('Harvest Income')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">₹{totalHarvestIncome.toFixed(0)}</div>
            <p className="text-xs text-slate-400 mt-1">{t('At')} ₹{hourlyRate}/{t('Hours')}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">{t('Total Expenses')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-400">₹{totalExpenses.toFixed(0)}</div>
            <p className="text-xs text-slate-400 mt-1">{t('Diesel + Services')}</p>
          </CardContent>
        </Card>

        <Card className={`border-slate-700 ${netProfit >= 0 ? 'bg-green-950' : 'bg-red-950'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">{t('Net Profit')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ₹{netProfit.toFixed(0)}
            </div>
            <p className="text-xs text-slate-400 mt-1">{t('Income - Expenses')}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">{t('Harvesting Details')}</CardTitle>
          </CardHeader>
          <CardContent>
            {harvestFiltered.length === 0 ? (
              <p className="text-slate-400 text-center py-8">{t('No harvesting records found')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-700">
                    <tr>
                      <th className="px-2 py-2 text-left text-slate-300">{t('Date')}</th>
                      <th className="px-2 py-2 text-left text-slate-300">{t('Farmer')}</th>
                      <th className="px-2 py-2 text-right text-slate-300">{t('Hours')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {harvestFiltered.map(h => (
                      <tr key={h._id} className="hover:bg-slate-700">
                        <td className="px-2 py-2 text-slate-200 text-xs">{formatDate(h.date, false)}</td>
                        <td className="px-2 py-2 text-slate-200 text-xs">{displayText(h.farmerName)}</td>
                        <td className="px-2 py-2 text-right text-blue-400 text-xs">{formatTimeWithColon(h.hoursWorked)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">{t('Expense Details')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-2">{t('Diesel Costs')}</h3>
              {dieselFiltered.length === 0 ? (
                <p className="text-slate-400 text-xs">{t('No diesel entries')}</p>
              ) : (
                <div className="space-y-1">
                  {dieselFiltered.map(d => (
                    <div key={d._id} className="flex justify-between text-xs text-slate-300">
                      <span>{formatDate(d.date, false)} - {d.litres.toFixed(1)}L</span>
                      <span className="text-amber-400">₹{d.totalCost.toFixed(0)}</span>
                    </div>
                  ))}
                  <div className="border-t border-slate-600 pt-1 mt-1 flex justify-between font-semibold text-slate-200">
                    <span>{t('Total Diesel:')}</span>
                    <span className="text-amber-400">₹{totalDieselCost.toFixed(0)}</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-2">{t('Service Costs')}</h3>
              <div className="flex justify-between text-xs font-semibold text-slate-200">
                <span>{t('Total Services:')}</span>
                <span className="text-red-400">₹{totalServiceCost.toFixed(0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 justify-end">
        <Button
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          {t('Print Report')}
        </Button>
      </div>
    </div>
  );
}
