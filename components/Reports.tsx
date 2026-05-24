'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Loader2, Printer, UploadCloud } from 'lucide-react';
import { formatTimeWithColon } from '@/lib/timeUtils';
import { useAuth } from '@/lib/authContext';
import { formatLocalizedDate, getLanguageLocale, useLanguage } from '@/lib/languageContext';
import { normalizeName } from '@/lib/normalize';
import { getGoogleAccessToken } from '@/lib/googleOAuthClient';

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

interface UploadedReport {
  fileId: string;
  fileName: string;
  googleEmail: string;
  generatedAt: string;
  webViewLink?: string;
}

const GOOGLE_SCOPE = 'openid email https://www.googleapis.com/auth/drive.file';

export default function Reports() {
  const { userId, username } = useAuth();
  const { language, t, displayText } = useLanguage();
  const [harvestingData, setHarvestingData] = useState<HarvestingRecord[]>([]);
  const [dieselData, setDieselData] = useState<DieselRecord[]>([]);
  const [serviceData, setServiceData] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [driveBusy, setDriveBusy] = useState(false);
  const [uploadedReport, setUploadedReport] = useState<UploadedReport | null>(null);
  const [selectedVillage, setSelectedVillage] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hourlyRate, setHourlyRate] = useState<number>(0);
  const [villages, setVillages] = useState<string[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const reportKey = [
    'myharvo-report',
    userId || 'guest',
    selectedVillage || 'all',
    startDate || 'start',
    endDate || 'end',
    hourlyRate || 0,
  ].join('|');

  useEffect(() => {
    if (!reportKey) return;
    try {
      const stored = localStorage.getItem(reportKey);
      const parsed = stored ? JSON.parse(stored) : null;
      setUploadedReport(parsed?.fileId && parsed?.googleEmail && parsed?.fileName ? parsed : null);
    } catch {
      localStorage.removeItem(reportKey);
      setUploadedReport(null);
    }
  }, [reportKey]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [harvestRes, dieselRes, serviceRes] = await Promise.all([
        fetch('/api/harvesting'),
        fetch('/api/diesel'),
        fetch('/api/service'),
      ]);

      const harvestData = (await harvestRes.json()).map((record: HarvestingRecord) => ({
        ...record,
        village: normalizeName(record.village),
        farmerName: normalizeName(record.farmerName),
      }));
      const dieselInfo = (await dieselRes.json()).map((record: DieselRecord) => ({
        ...record,
        village: normalizeName(record.village),
      }));
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
  const selectedVillageText = displayText(selectedVillage);

  const sanitizeFileNamePart = (value: string) =>
    value
      .trim()
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

  const formatFileDateTime = (date: Date) => {
    const pad = (value: number) => value.toString().padStart(2, '0');
    return [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate()),
      pad(date.getHours()),
      pad(date.getMinutes()),
      pad(date.getSeconds()),
    ].join('-');
  };

  const createReportFileName = (generatedAt: Date) => {
    const villageName = sanitizeFileNamePart(selectedVillage || 'All Villages') || 'All-Villages';
    return `${villageName}-${formatFileDateTime(generatedAt)}.pdf`;
  };

  const saveUploadedReport = (report: UploadedReport | null) => {
    if (report) {
      localStorage.setItem(reportKey, JSON.stringify(report));
    } else {
      localStorage.removeItem(reportKey);
    }
    setUploadedReport(report);
  };

  const getGoogleEmail = async (accessToken: string) => {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error('Could not read the selected Google account email');
    }

    const profile = await response.json();
    if (!profile.email) {
      throw new Error('The selected Google account did not return an email address');
    }

    return String(profile.email);
  };

  const pdfEscape = (value: string) =>
    value
      .normalize('NFKD')
      .replace(/[^\x20-\x7E]/g, '')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');

  const createReportPdfBlob = (generatedAt = new Date()) => {
    const pages: string[][] = [[]];
    const pageWidth = 612;
    const pageHeight = 792;
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;
    let y = 748;

    const currentPage = () => pages[pages.length - 1];
    const textWidth = (value: string, size: number) => value.length * size * 0.52;
    const fitText = (value: string, maxChars: number) =>
      value.length > maxChars ? `${value.slice(0, Math.max(0, maxChars - 3))}...` : value;

    const add = (operator: string) => currentPage().push(operator);
    const setFill = (r: number, g: number, b: number) => add(`${r} ${g} ${b} rg`);
    const setStroke = (r: number, g: number, b: number) => add(`${r} ${g} ${b} RG`);
    const rect = (x: number, top: number, width: number, height: number, mode = 'S') => {
      add(`${x} ${top - height} ${width} ${height} re ${mode}`);
    };
    const line = (x1: number, y1: number, x2: number, y2: number) => {
      add(`${x1} ${y1} m ${x2} ${y2} l S`);
    };
    const text = (
      value: string,
      x: number,
      baseline: number,
      size = 10,
      font = 'F1',
      align: 'left' | 'center' | 'right' = 'left'
    ) => {
      const offset =
        align === 'center' ? textWidth(value, size) / 2 : align === 'right' ? textWidth(value, size) : 0;
      add(`BT /${font} ${size} Tf ${Math.round((x - offset) * 100) / 100} ${baseline} Td (${pdfEscape(value)}) Tj ET`);
    };

    const ensureSpace = (height: number) => {
      if (y - height < 58) {
        pages.push([]);
        y = 748;
      }
    };

    const sectionTitle = (title: string) => {
      ensureSpace(34);
      y -= 8;
      setStroke(0.82, 0.84, 0.88);
      text(title, margin, y, 13, 'F2');
      line(margin, y - 8, pageWidth - margin, y - 8);
      y -= 26;
    };

    const emptyMessage = (message: string) => {
      ensureSpace(30);
      setFill(0.42, 0.45, 0.5);
      text(message, pageWidth / 2, y - 15, 10, 'F1', 'center');
      y -= 34;
    };

    const drawHeader = () => {
      setFill(0.1, 0.12, 0.16);
      text('Harvesting Machine Management Report', pageWidth / 2, y, 18, 'F2', 'center');
      y -= 18;
      setStroke(0.18, 0.2, 0.24);
      line(margin, y, pageWidth - margin, y);
      y -= 22;

      const metadata = [
        ['Harvester', displayText(username || 'N/A')],
        ['Village', selectedVillageText || 'All Villages'],
        [
          'Period',
          startDate && endDate ? `${formatDate(startDate)} to ${formatDate(endDate)}` : 'All Records',
        ],
        ['Generated on', formatDateTime(generatedAt)],
      ];
      const boxHeight = 74;
      setFill(0.97, 0.98, 0.99);
      setStroke(0.86, 0.88, 0.91);
      rect(margin, y, contentWidth, boxHeight, 'B');
      let rowY = y - 18;
      metadata.forEach(([label, value], index) => {
        const x = index % 2 === 0 ? margin + 18 : margin + 280;
        if (index === 2) rowY -= 28;
        setFill(0.38, 0.41, 0.46);
        text(`${label}:`, x, rowY, 9, 'F2');
        setFill(0.12, 0.14, 0.18);
        text(fitText(value, 33), x + 68, rowY, 9, 'F1');
      });
      y -= boxHeight + 18;
    };

    const drawTable = (
      columns: Array<{ label: string; x: number; width: number; align?: 'left' | 'right' }>,
      rows: string[][],
      noRowsText: string
    ) => {
      if (!rows.length) {
        emptyMessage(noRowsText);
        return;
      }

      const rowHeight = 24;
      const headerHeight = 24;

      const drawTableHeader = () => {
        setFill(0.94, 0.95, 0.96);
        setStroke(0.84, 0.86, 0.89);
        rect(margin, y, contentWidth, headerHeight, 'B');
        columns.forEach((column) => {
          setFill(0.16, 0.18, 0.22);
          const x = column.align === 'right' ? column.x + column.width - 8 : column.x + 8;
          text(column.label, x, y - 16, 9, 'F2', column.align || 'left');
        });
        y -= headerHeight;
      };

      ensureSpace(headerHeight + rowHeight);
      drawTableHeader();
      rows.forEach((row, rowIndex) => {
        ensureSpace(rowHeight + 6);
        if (y === 748) drawTableHeader();
        if (rowIndex % 2 === 0) {
          setFill(0.99, 0.99, 0.99);
          rect(margin, y, contentWidth, rowHeight, 'f');
        }
        setStroke(0.9, 0.91, 0.93);
        line(margin, y - rowHeight, pageWidth - margin, y - rowHeight);
        row.forEach((cell, cellIndex) => {
          const column = columns[cellIndex];
          setFill(0.14, 0.16, 0.2);
          const x = column.align === 'right' ? column.x + column.width - 8 : column.x + 8;
          text(fitText(cell, Math.floor(column.width / 5.2)), x, y - 16, 9, 'F1', column.align || 'left');
        });
        y -= rowHeight;
      });
      y -= 18;
    };

    const drawSummary = () => {
      sectionTitle('Financial Summary');
      const rows = [
        ['Total Hours Harvested', formatTimeWithColon(totalHours)],
        ['Hourly Rate', `INR ${hourlyRate.toFixed(0)}/hour`],
        ['Total Harvest Income', `INR ${totalHarvestIncome.toFixed(0)}`],
        ['Diesel Cost', `INR ${totalDieselCost.toFixed(0)}`],
        ['Service & Repair Cost', `INR ${totalServiceCost.toFixed(0)}`],
        ['Total Expenses', `INR ${totalExpenses.toFixed(0)}`],
        ['Net Profit', `INR ${netProfit.toFixed(0)}`],
      ];
      const rowHeight = 22;
      const boxHeight = rows.length * rowHeight + 18;
      ensureSpace(boxHeight + 8);
      setFill(0.97, 0.98, 0.99);
      setStroke(0.86, 0.88, 0.91);
      rect(margin, y, contentWidth, boxHeight, 'B');
      y -= 18;
      rows.forEach(([label, value], index) => {
        const isTotal = index === 2 || index === 5 || index === 6;
        if (isTotal) {
          setStroke(0.86, 0.88, 0.91);
          line(margin + 16, y + 8, pageWidth - margin - 16, y + 8);
        }
        setFill(index === 6 ? (netProfit >= 0 ? 0.1 : 0.8) : 0.14, index === 6 ? (netProfit >= 0 ? 0.55 : 0.15) : 0.16, index === 6 ? (netProfit >= 0 ? 0.25 : 0.15) : 0.2);
        text(label, margin + 18, y, isTotal ? 10 : 9, isTotal ? 'F2' : 'F1');
        text(value, pageWidth - margin - 18, y, isTotal ? 10 : 9, isTotal ? 'F2' : 'F1', 'right');
        y -= rowHeight;
      });
      y -= 14;
    };

    drawHeader();
    sectionTitle('Harvesting Summary');
    drawTable(
      [
        { label: 'Date', x: margin, width: 118 },
        { label: 'Farmer', x: margin + 118, width: 274 },
        { label: 'Hours', x: margin + 392, width: 140, align: 'right' },
      ],
      harvestFiltered.map((h) => [formatDate(h.date), displayText(h.farmerName), formatTimeWithColon(h.hoursWorked)]),
      'No harvesting records found'
    );

    sectionTitle('Diesel Transactions');
    drawTable(
      [
        { label: 'Date', x: margin, width: 120 },
        { label: 'Litres', x: margin + 120, width: 110, align: 'right' },
        { label: 'Rate (INR/L)', x: margin + 230, width: 150, align: 'right' },
        { label: 'Total (INR)', x: margin + 380, width: 152, align: 'right' },
      ],
      dieselFiltered.map((d) => [
        formatDate(d.date),
        d.litres.toFixed(1),
        d.costPerLitre.toFixed(2),
        d.totalCost.toFixed(0),
      ]),
      'No diesel entries'
    );

    drawSummary();

    pages.forEach((page, index) => {
      page.push('0.56 0.58 0.62 rg');
      page.push(`BT /F1 8 Tf 40 30 Td (${pdfEscape('This report was generated by Harvesting Machine Management System')}) Tj ET`);
      page.push(`BT /F1 8 Tf 540 30 Td (${index + 1}/${pages.length}) Tj ET`);
    });

    const objects: string[] = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      `<< /Type /Pages /Kids [${pages.map((_, index) => `${index + 3} 0 R`).join(' ')}] /Count ${pages.length} >>`,
    ];

    pages.forEach((page, index) => {
      const contentObjectNumber = pages.length + 3 + index;
      objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> >> >> /Contents ${contentObjectNumber} 0 R >>`);
    });

    pages.forEach((page) => {
      const stream = page.join('\n');
      objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    });

    let pdf = '%PDF-1.4\n';
    const offsets = [0];

    objects.forEach((object, index) => {
      offsets.push(pdf.length);
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });

    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach((offset) => {
      pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    return new Blob([pdf], { type: 'application/pdf' });
  };

  const uploadPdfToDrive = async (
    accessToken: string,
    googleEmail: string,
    pdfBlob: Blob,
    fileName: string,
    generatedAt: Date
  ) => {
    const metadata = {
      name: fileName,
      mimeType: 'application/pdf',
      appProperties: {
        myharvoReportKey: reportKey,
        myharvoReportFileName: fileName,
        myharvoGeneratedAt: generatedAt.toISOString(),
        myharvoVillage: selectedVillage || 'all',
        myharvoGoogleEmail: googleEmail,
      },
    };
    const boundary = `myharvo_${Date.now()}`;
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;
    const body = new Blob(
      [
        delimiter,
        'Content-Type: application/json; charset=UTF-8\r\n\r\n',
        JSON.stringify(metadata),
        delimiter,
        'Content-Type: application/pdf\r\n\r\n',
        pdfBlob,
        closeDelimiter,
      ],
      { type: `multipart/related; boundary=${boundary}` }
    );

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    });

    if (!response.ok) {
      throw new Error('Failed to upload PDF to Google Drive');
    }

    const uploaded = await response.json();
    return {
      fileId: uploaded.id,
      fileName: uploaded.name,
      googleEmail,
      generatedAt: generatedAt.toISOString(),
      webViewLink: uploaded.webViewLink,
    } as UploadedReport;
  };

  const deleteDriveReport = async (accessToken: string, fileId: string) => {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok && response.status !== 404) {
      throw new Error('Failed to delete PDF from Google Drive');
    }
  };

  const handleDriveButtonClick = async () => {
    if (!selectedVillage) {
      alert(t('Please select a village before uploading the report'));
      return;
    }

    try {
      setDriveBusy(true);
      const accessToken = await getGoogleAccessToken(GOOGLE_SCOPE);
      const googleEmail = await getGoogleEmail(accessToken);

      if (uploadedReport) {
        if (uploadedReport.googleEmail !== googleEmail) {
          alert(`This PDF was uploaded with ${uploadedReport.googleEmail}. Please choose that Google account to delete it.`);
          return;
        }

        const shouldDelete = window.confirm(`Delete this uploaded PDF?\n\n${uploadedReport.fileName}`);
        if (!shouldDelete) return;

        await deleteDriveReport(accessToken, uploadedReport.fileId);
        saveUploadedReport(null);
        alert(`${t('Uploaded PDF deleted from Google Drive')}: ${uploadedReport.fileName}`);
        return;
      }

      const generatedAt = new Date();
      const fileName = createReportFileName(generatedAt);
      const uploaded = await uploadPdfToDrive(
        accessToken,
        googleEmail,
        createReportPdfBlob(generatedAt),
        fileName,
        generatedAt
      );
      saveUploadedReport(uploaded);
      alert(`${t('Report uploaded to Google Drive')}: ${fileName}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : t('Google Drive action failed'));
    } finally {
      setDriveBusy(false);
    }
  };

  const handlePrint = () => {
    const generatedAt = new Date();
    const printFileName = createReportFileName(generatedAt);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const reportHTML = `
      <!DOCTYPE html>
      <html lang="${language}">
      <head>
        <title>${escapeHtml(printFileName)}</title>
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
            <p>${t('Village')}: <strong>${escapeHtml(selectedVillageText)}</strong></p>
            <p>${startDate && endDate ? `${t('Period')}: ${formatDate(startDate)} ${t('to')} ${formatDate(endDate)}` : t('All Records')}</p>
            <p>${t('Generated on')}: ${formatDateTime(generatedAt)}</p>
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
                  <option key={v} value={v}>
                    {displayText(v)}
                  </option>
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
        <div className="flex flex-col items-end gap-1">
          <Button
            onClick={handleDriveButtonClick}
            disabled={driveBusy || !selectedVillage}
            className={`text-white flex items-center gap-2 ${
              uploadedReport ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-700 hover:bg-slate-600'
            }`}
            title={
              uploadedReport
                ? `${t('Uploaded to Google Drive')}: ${uploadedReport.fileName}`
                : t('Upload report to Google Drive')
            }
          >
            {driveBusy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : uploadedReport ? (
              <Check className="w-4 h-4" />
            ) : (
              <UploadCloud className="w-4 h-4" />
            )}
            {uploadedReport ? t('Uploaded') : t('Upload')}
          </Button>
          {uploadedReport && (
            <span className="max-w-[260px] truncate text-xs text-slate-400" title={uploadedReport.fileName}>
              {uploadedReport.fileName}
            </span>
          )}
        </div>
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
