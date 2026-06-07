/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Product, Sale, Expense } from '../types';
import { PRODUCT_CATEGORIES, EXPENSE_CATEGORIES } from '../data';
import { 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Upload, 
  Layers, 
  PieChart, 
  BarChart,
  FileCheck,
  Sparkles,
  LineChart as LineChartIcon
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

interface ReportsProps {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  onImportData: (data: { products: Product[]; sales: Sale[]; expenses: Expense[] }) => void;
}

// Custom tooltip styling for Recharts Forecast
const CustomForecastTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-xl text-xs space-y-1.5 text-white font-sans max-w-[240px]">
        <p className="font-extrabold text-slate-200 border-b border-slate-800 pb-1.5">{data.monthLabel}</p>
        <div className="space-y-1">
          {data.actual !== undefined && (
            <div className="flex justify-between items-center gap-4">
              <span className="text-slate-400 font-medium font-sans">លក់ជាក់ស្តែង:</span>
              <span className="font-bold text-indigo-400 font-mono">${data.actual.toFixed(2)}</span>
            </div>
          )}
          {data.forecast !== undefined && (
            <div className="flex justify-between items-center gap-4">
              <span className="text-slate-400 font-medium font-sans">ទឹកប្រាក់ព្យាករណ៍:</span>
              <span className="font-bold text-amber-400 font-mono">${data.forecast.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export default function Reports({
  products,
  sales,
  expenses,
  onImportData
}: ReportsProps) {
  // Report selector states
  const [selectedMonth, setSelectedMonth] = useState('06'); // June
  const [selectedYear, setSelectedYear] = useState('2026');
  const [filterType, setFilterType] = useState<'monthly' | 'custom'>('monthly');
  const [startDate, setStartDate] = useState('2026-06-01');
  const [endDate, setEndDate] = useState('2026-06-30');

  // Forecast Scenario state ('standard' | 'conservative' | 'optimistic')
  const [forecastScenario, setForecastScenario] = useState<'standard' | 'conservative' | 'optimistic'>('standard');

  // Format Month helper for charts
  const formatMonthKhmer = (monthStr: string) => {
    const parts = monthStr.split('-');
    const year = parts[0];
    const month = parts[1];
    const khmerMonths: Record<string, string> = {
      '01': 'មករា',
      '02': 'កុម្ភៈ',
      '03': 'មីនា',
      '04': 'មេសា',
      '05': 'ឧសភា',
      '06': 'មិថុនា',
      '07': 'កក្កដា',
      '08': 'សីហា',
      '09': 'កញ្ញា',
      '10': 'តុលា',
      '11': 'វិច្ឆិកា',
      '12': 'ធ្នូ'
    };
    return `${khmerMonths[month] || month}/${year}`;
  };

  // Group historical sales by YYYY-MM
  const historicalMonthlySales = useMemo(() => {
    const totals: Record<string, number> = {};
    sales.forEach(sale => {
      if (sale.timestamp) {
        const mKey = sale.timestamp.slice(0, 7); // "YYYY-MM"
        totals[mKey] = (totals[mKey] || 0) + sale.total;
      }
    });
    
    const sortedMonths = Object.keys(totals).sort();
    
    // Ensure we have at least May & June if we're using initial data
    if (sortedMonths.length === 0) {
      return [
        { month: '2026-05', total: 212.70 },
        { month: '2026-06', total: 201.20 }
      ];
    }
    
    return sortedMonths.map(m => ({
      month: m,
      total: totals[m]
    }));
  }, [sales]);

  // Compute 3-Month Projection
  const forecastChartData = useMemo(() => {
    const history = historicalMonthlySales.map((h) => ({
      month: h.month,
      sales: h.total
    }));

    // Find linear slope (y = mx + c)
    let slope = 0;
    const lastPointVal = history[history.length - 1]?.sales || 0;

    if (history.length >= 2) {
      const n = history.length;
      let sumX = 0;
      let sumY = 0;
      let sumXY = 0;
      let sumXX = 0;
      history.forEach((h, idx) => {
        sumX += idx;
        sumY += h.sales;
        sumXY += idx * h.sales;
        sumXX += idx * idx;
      });
      const num = (n * sumXY) - (sumX * sumY);
      const den = (n * sumXX) - (sumX * sumX);
      slope = den !== 0 ? num / den : 0;
    } else {
      // Single month fallback growth estimate
      slope = lastPointVal * 0.05;
    }

    // Adjust slope according to chosen growth scenario
    const avgHistoricalVal = history.reduce((acc, h) => acc + h.sales, 0) / history.length || 1;
    let finalSlope = slope;
    if (forecastScenario === 'conservative') {
      finalSlope = slope - (avgHistoricalVal * 0.08); // downward offset
    } else if (forecastScenario === 'optimistic') {
      finalSlope = slope + (avgHistoricalVal * 0.12); // upward bonus
    }

    // Build complete sequential list
    const chartList = history.map((h, index) => {
      const isLastHistoricalPoint = index === history.length - 1;
      return {
        monthLabel: formatMonthKhmer(h.month),
        actual: h.sales,
        forecast: isLastHistoricalPoint ? h.sales : undefined, // join lines seamlessly
      };
    });

    // Project forward 3 months
    const lastMonthStr = history[history.length - 1]?.month || '2026-06';
    const [yearPart, monthPart] = lastMonthStr.split('-');
    let currentY = parseInt(yearPart, 10);
    let currentM = parseInt(monthPart, 10);
    let trackingValue = lastPointVal;

    for (let j = 1; j <= 3; j++) {
      currentM += 1;
      if (currentM > 12) {
        currentM = 1;
        currentY += 1;
      }
      const projectedMonthStr = `${currentY}-${String(currentM).padStart(2, '0')}`;
      trackingValue = Math.max(0, trackingValue + finalSlope);

      chartList.push({
        monthLabel: formatMonthKhmer(projectedMonthStr) + ' (ព្យាករណ៍)',
        actual: undefined,
        forecast: Number(trackingValue.toFixed(2))
      });
    }

    return {
      dataPoints: chartList,
      avgMonthlyChange: finalSlope,
      nextMonthEstimate: chartList[history.length]?.forecast || 0,
      threeMonthTotalForecast: chartList.slice(history.length).reduce((sum, item) => sum + (item.forecast || 0), 0)
    };
  }, [historicalMonthlySales, forecastScenario]);

  // Month options translation
  const monthsList = [
    { value: '01', label: 'មករា (Jan)' },
    { value: '02', label: 'កម្ភៈ (Feb)' },
    { value: '03', label: 'មីនា (Mar)' },
    { value: '04', label: 'មេសា (Apr)' },
    { value: '05', label: 'ឧសភា (May)' },
    { value: '06', label: 'មិថុនា (Jun)' },
    { value: '07', label: 'កក្កដា (Jul)' },
    { value: '08', label: 'សីហា (Aug)' },
    { value: '09', label: 'កញ្ញា (Sep)' },
    { value: '10', label: 'តុលា (Oct)' },
    { value: '11', label: 'វិច្ឆិកា (Nov)' },
    { value: '12', label: 'ធ្នូ (Dec)' }
  ];

  const yearRange = ['2025', '2026', '2027'];

  // Current filter representation
  const activeMonthYearStr = `${selectedYear}-${selectedMonth}`;

  // 1. Filter Sales and Expenses for Selected Month or Custom Date Range
  const filteredSalesInMonth = useMemo(() => {
    if (filterType === 'monthly') {
      return sales.filter(sale => sale.timestamp.startsWith(activeMonthYearStr));
    } else {
      return sales.filter(sale => {
        if (!sale.timestamp) return false;
        const saleDate = sale.timestamp.slice(0, 10); // "YYYY-MM-DD"
        return saleDate >= startDate && saleDate <= endDate;
      });
    }
  }, [sales, filterType, activeMonthYearStr, startDate, endDate]);

  const filteredExpensesInMonth = useMemo(() => {
    if (filterType === 'monthly') {
      return expenses.filter(exp => exp.date.startsWith(activeMonthYearStr));
    } else {
      return expenses.filter(exp => {
        if (!exp.date) return false;
        const expDate = exp.date.slice(0, 10);
        return expDate >= startDate && expDate <= endDate;
      });
    }
  }, [expenses, filterType, activeMonthYearStr, startDate, endDate]);

  // 2. Perform Financial Computations
  const monthlyMetrics = useMemo(() => {
    // Total Sales Revenue
    const revenue = filteredSalesInMonth.reduce((sum, sale) => sum + sale.total, 0);

    // Cost of Goods Sold (COGS)
    const cogs = filteredSalesInMonth.reduce((sum, sale) => {
      const itemsCost = sale.items.reduce((acc, item) => acc + (item.cost * item.quantity), 0);
      return sum + itemsCost;
    }, 0);

    // Gross Profit
    const grossProfit = revenue - cogs;

    // Total Expenses
    const operationalExpenses = filteredExpensesInMonth.reduce((sum, exp) => sum + exp.amount, 0);

    // Net Profit
    const netProfit = grossProfit - operationalExpenses;

    return {
      revenue,
      cogs,
      grossProfit,
      operationalExpenses,
      netProfit,
      salesCount: filteredSalesInMonth.length,
      expensesCount: filteredExpensesInMonth.length
    };
  }, [filteredSalesInMonth, filteredExpensesInMonth]);

  // 3. Category Sales distribution calculation
  const categorySalesShare = useMemo(() => {
    const shares: Record<string, number> = {};
    PRODUCT_CATEGORIES.forEach(cat => {
      shares[cat] = 0;
    });

    // Populate actuals
    filteredSalesInMonth.forEach(sale => {
      sale.items.forEach(item => {
        // Find category of this product from active list or default to other
        const prodMatch = products.find(p => p.id === item.productId);
        const cat = prodMatch ? prodMatch.category : 'ផ្សេងៗ';
        if (shares[cat] !== undefined) {
          shares[cat] += item.price * item.quantity;
        } else {
          shares[cat] = item.price * item.quantity;
        }
      });
    });

    const sum = Object.values(shares).reduce((a, b) => a + b, 0);

    return Object.keys(shares).map(catName => {
      const amt = shares[catName];
      return {
        category: catName,
        amount: amt,
        percentage: sum > 0 ? (amt / sum) * 100 : 0
      };
    }).sort((a, b) => b.amount - a.amount);
  }, [filteredSalesInMonth, products]);

  // 4. Category Expense share calculation
  const categoryExpensesShare = useMemo(() => {
    const shares: Record<string, number> = {};
    EXPENSE_CATEGORIES.forEach(cat => {
      shares[cat] = 0;
    });

    filteredExpensesInMonth.forEach(exp => {
      if (shares[exp.category] !== undefined) {
        shares[exp.category] += exp.amount;
      } else {
        shares[exp.category] = exp.amount;
      }
    });

    const sum = Object.values(shares).reduce((a, b) => a + b, 0);

    return Object.keys(shares).map(catName => {
      const amt = shares[catName];
      return {
        category: catName,
        amount: amt,
        percentage: sum > 0 ? (amt / sum) * 100 : 0
      };
    }).sort((a, b) => b.amount - a.amount);
  }, [filteredExpensesInMonth]);

  // 5. Build dynamic SVG charts for Category Breakdown
  const renderCategoryBarChart = (shares: { category: string, amount: number, percentage: number }[], colorTheme: 'indigo' | 'rose') => {
    const maxAmount = Math.max(...shares.map(s => s.amount), 1);
    
    return (
      <div className="space-y-3">
        {shares.map((share, idx) => {
          if (share.amount === 0) return null;
          
          return (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-700">{share.category}</span>
                <span className="font-mono text-slate-500 font-semibold">
                  ${share.amount.toFixed(2)} ({share.percentage.toFixed(0)}%)
                </span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    colorTheme === 'indigo' ? 'bg-indigo-600' : 'bg-rose-500'
                  }`}
                  style={{ width: `${share.percentage}%` }}
                />
              </div>
            </div>
          );
        })}
        {shares.every(s => s.amount === 0) && (
          <div className="text-center py-6 text-xs text-slate-400 font-light">
            មិនមានទិន្នន័យដើម្បីវិភាគទេ
          </div>
        )}
      </div>
    );
  };

  // 6. JSON Export Feature (ទាញយកទិន្នន័យបម្រុង)
  const handleExportDataForBackup = () => {
    const backupObj = {
      products,
      sales,
      expenses,
      exportVersion: '1.0',
      exportedAt: new Date().toISOString()
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    const fileSuffix = filterType === 'monthly' ? activeMonthYearStr : `${startDate}_to_${endDate}`;
    downloadAnchor.setAttribute("download", `kroma_pos_backup_${fileSuffix}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // 7. JSON Import Feature (ជួសជុលទិន្នន័យបម្រុង)
  const handleImportDataFromJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (!e.target.files || e.target.files.length === 0) return;

    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.products && parsed.sales && parsed.expenses) {
          onImportData({
            products: parsed.products,
            sales: parsed.sales,
            expenses: parsed.expenses
          });
          alert('បានបញ្ចូលទិន្នន័យបម្រុងដោយជោគជ័យ!');
        } else {
          alert('ទម្រង់ឯកសារមិនត្រឹមត្រូវទេ! សូមប្រាកដថាជាឯកសារចម្លងត្រឹមត្រូវ។');
        }
      } catch (err) {
        alert('កំហុសក្នុងការអានឯកសារ JSON នេះ៖ ' + err);
      }
    };
    fileReader.readAsText(e.target.files[0]);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header controls & Custom Date Range Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/40 p-4 rounded-2xl border border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-800 font-sans">របាយការណ៍សង្ខេបស្វ័យប្រវត្ត (Automated Summary Reports)</h2>
          <p className="text-[11px] text-slate-400">គណនាចំណូល ចំណាយ ស្តុក COGS និងប្រាក់ចំណេញសុទ្ធដោយលម្អិត</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Segmented Filter Mode Selector */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/65 text-[11px] font-bold shadow-3xs shrink-0 self-start sm:self-center">
            <button
              type="button"
              onClick={() => setFilterType('monthly')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterType === 'monthly'
                  ? 'bg-white text-indigo-600 shadow-3xs'
                  : 'text-slate-500 hover:text-slate-900 bg-transparent'
              }`}
            >
              ប្រចាំខែ (Monthly)
            </button>
            <button
              type="button"
              onClick={() => setFilterType('custom')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterType === 'custom'
                  ? 'bg-white text-indigo-600 shadow-3xs'
                  : 'text-slate-500 hover:text-slate-900 bg-transparent'
              }`}
            >
              ចន្លោះកាលបរិច្ឆេទ (Range)
            </button>
          </div>

          {/* Conditional Input UI */}
          {filterType === 'monthly' ? (
            <div className="flex items-center gap-1.5">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden text-slate-700 font-semibold cursor-pointer shadow-3xs"
              >
                {monthsList.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden text-slate-700 font-semibold cursor-pointer shadow-3xs"
              >
                {yearRange.map(y => (
                  <option key={y} value={y}>{y} ឆ្នាំ</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-3xs">
                <span className="text-[9px] font-black text-slate-400 font-sans uppercase">ចាប់ផ្តើម (Start)</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-xs font-semibold text-slate-700 focus:outline-hidden bg-transparent border-none cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-3xs">
                <span className="text-[9px] font-black text-slate-400 font-sans uppercase">បញ្ចប់ (End)</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-xs font-semibold text-slate-700 focus:outline-hidden bg-transparent border-none cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Automated financial report layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Matrix: Ledger sheet breakdowns */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-3xs p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <FileCheck size={16} className="text-indigo-600" />
              <span>
                {filterType === 'monthly' 
                  ? `សន្លឹករាយការណ៍ហិរញ្ញវត្ថុប្រចាំខែ ${selectedMonth}/${selectedYear}` 
                  : `សន្លឹករាយការណ៍ហិរញ្ញវត្ថុពី ${startDate} ដល់ ${endDate}`
                }
              </span>
            </h3>
            <span className="text-[10px] bg-indigo-50 border border-indigo-100/50 text-indigo-700 px-2 py-0.5 rounded-md font-bold">
              ផ្ទៀងផ្ទាត់រួចរាល់
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-xs">
            
            {/* Core Revenue */}
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">ចំនួនការលក់សរុប (Transaction Volume):</span>
              <span className="font-bold text-slate-800 font-mono text-sm">{monthlyMetrics.salesCount} ដង</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">ប្រាក់ចំណូលលក់បាន (Total Sales Revenue):</span>
              <span className="font-bold text-slate-800 font-mono text-sm text-emerald-600">+${monthlyMetrics.revenue.toFixed(2)}</span>
            </div>

            {/* COGS */}
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">តម្លៃដើមទំនិញលក់បាន (Cost of Goods Sold - COGS):</span>
              <span className="font-bold text-slate-500 font-mono">-${monthlyMetrics.cogs.toFixed(2)}</span>
            </div>

            {/* Gross Profit */}
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500 font-bold">ចំណេញដុល (Gross Profit Margin):</span>
              <span className="font-bold text-indigo-600 font-mono text-sm">${monthlyMetrics.grossProfit.toFixed(2)}</span>
            </div>

            {/* Expenses Count */}
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">ចំនួនការចំណាយប្រតិបត្តិការ:</span>
              <span className="font-bold text-slate-800 font-mono">{monthlyMetrics.expensesCount} ដង</span>
            </div>

            {/* Monthly Operating Expenses */}
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">ការចំណាយប្រតិបត្តិការសរុប (Ops Expenses):</span>
              <span className="font-bold text-rose-500 font-mono">-${monthlyMetrics.operationalExpenses.toFixed(2)}</span>
            </div>

          </div>

          {/* NET PROFIT GAUGE - CENTRAL METRIC CARD */}
          <div className="p-4.5 rounded-2xl bg-indigo-50/50 border border-indigo-100/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-indigo-900">ប្រាក់ចំណេញសុទ្ធពិតប្រាកដ (Net Take-home Profit)</h4>
              <p className="text-[10px] text-slate-500 max-w-[325px]">
                នេះជាប្រាក់ចំណេញពិតប្រាកដបន្ទាប់ពីដករាល់ការចំណាយប្រតិបត្តិការទាំងអស់ រួមទាំងថ្លៃដើមដើមទុនទំនិញផលិតផលជាវចូល។
              </p>
            </div>
            <div className="text-center md:text-right">
              <span className={`text-3xl font-extrabold font-mono tracking-tight block ${monthlyMetrics.netProfit >= 0 ? 'text-indigo-600' : 'text-rose-500'}`}>
                ${monthlyMetrics.netProfit.toFixed(2)}
              </span>
              <span className="text-[9px] bg-white text-indigo-700 border border-indigo-200/50 px-2 py-0.5 rounded-md font-bold mt-1 inline-block">
                {monthlyMetrics.netProfit >= 0 ? 'ប្រតិបត្តិការចំណេញ' : 'ប្រតិបត្តិការខាតបង់'}
              </span>
            </div>
          </div>
        </div>

        {/* Right share details: Exports/Imports backup options */}
        <div id="data-backup-card" className="bg-white border border-slate-100 rounded-2xl shadow-3xs p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Layers size={16} className="text-indigo-600" />
              <span>ការចម្លងទុក & ជួសជុល (Backup Ledger)</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              ដើម្បីការពារការបាត់បង់ទិន្នន័យ អ្នកអាចទាញយកឯកសារកត់ត្រាទាំងមូលចម្លងទុកសន្សំសំចៃក្នុងកុំព្យូទ័របាន។
            </p>
          </div>

          <div className="space-y-2.5">
            
            {/* Export */}
            <button
              onClick={handleExportDataForBackup}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200/40"
            >
              <Download size={14} />
              <span>ទាញយកឯកសារបម្រុង (Export DB)</span>
            </button>

            {/* Import container */}
            <div className="relative">
              <label 
                htmlFor="import-file-input"
                className="w-full py-2.5 bg-indigo-50/55 hover:bg-indigo-100/60 text-indigo-700 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-indigo-100/45 inline-block text-center"
              >
                <Upload size={14} className="inline mr-1" />
                <span>បញ្ចូលឯកសារចម្លងវិញ (Import DB)</span>
              </label>
              <input 
                id="import-file-input"
                type="file" 
                accept=".json"
                onChange={handleImportDataFromJSON}
                className="hidden"
              />
            </div>

          </div>
        </div>

      </div>

      {/* 2.5 3-Month Sales Forecast Section (Recharts integrated chart) */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-3xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 pb-4">
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500 fill-amber-100 animate-pulse" />
              <span>ការព្យាករណ៍ការលក់រយៈពេល ៣ខែខាងមុខ (3-Month Sales Forecast Model)</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              ការគណនាស្វ័យប្រវត្តិតាមរយៈនិន្នាការប្រវត្តិលក់ដើម្បីប៉ាន់ស្មានទិសដៅចំណូល (Machine predicted revenue trends based on sales history)
            </p>
          </div>

          {/* Scenario Controls */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-[11px] font-bold shadow-3xs shrink-0 self-start sm:self-center">
            <button
              type="button"
              onClick={() => setForecastScenario('conservative')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                forecastScenario === 'conservative' 
                  ? 'bg-rose-500 text-white shadow-3xs' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Conservative (-8% modifier on trend)"
            >
              អភិរក្សនិយម (Cons.)
            </button>
            <button
              type="button"
              onClick={() => setForecastScenario('standard')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                forecastScenario === 'standard' 
                  ? 'bg-white text-indigo-600 shadow-3xs' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Standard Trend Line"
            >
              និន្នាការស្ដង់ដារ
            </button>
            <button
              type="button"
              onClick={() => setForecastScenario('optimistic')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                forecastScenario === 'optimistic' 
                  ? 'bg-emerald-500 text-white shadow-3xs' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Optimistic (+12% modifier on trend)"
            >
              សុទិដ្ឋិនិយម (Opt.)
            </button>
          </div>
        </div>

        {/* Insight Analytics Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-1 font-sans">
          <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">ល្បឿនកំណើនមធ្យម (Change Velocity)</span>
              <span className={`text-lg font-bold font-mono ${forecastChartData.avgMonthlyChange >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                {forecastChartData.avgMonthlyChange >= 0 ? '+' : ''}${forecastChartData.avgMonthlyChange.toFixed(2)}/ខែ
              </span>
            </div>
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
              forecastChartData.avgMonthlyChange >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'
            }`}>
              {forecastChartData.avgMonthlyChange >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            </div>
          </div>

          <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">ការប៉ាន់ស្មានខែបន្ទាប់ (Next Month est.)</span>
              <span className="text-lg font-extrabold text-indigo-600 font-mono">${forecastChartData.nextMonthEstimate.toFixed(2)}</span>
            </div>
            <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <LineChartIcon size={18} />
            </div>
          </div>

          <div className="bg-amber-50/15 border border-amber-150 p-4 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-extrabold text-amber-700/80 block uppercase tracking-wider">ព្យាករណ៍ចំណូលសរុប ៣ខែ (3-Month Sum)</span>
              <span className="text-lg font-extrabold text-amber-600 font-mono">${forecastChartData.threeMonthTotalForecast.toFixed(2)}</span>
            </div>
            <div className="h-9 w-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <DollarSign size={18} />
            </div>
          </div>
        </div>

        {/* Dynamic Interactive Recharts Area Map */}
        <div className="h-72 w-full pr-1 select-none text-[11px] font-sans">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={forecastChartData.dataPoints} 
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis 
                dataKey="monthLabel" 
                stroke="#94a3b8" 
                fontSize={10} 
                tickLine={false} 
                className="font-sans font-medium"
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={10} 
                tickLine={false} 
                tickFormatter={(v) => `$${v}`}
                className="font-mono"
              />
              <Tooltip content={<CustomForecastTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle" 
                iconSize={8}
                className="text-[11px] font-medium text-slate-500 font-sans"
              />
              <Area 
                type="monotone" 
                dataKey="actual" 
                name="ចំណូលជាក់ស្តែង (Actual Revenue)" 
                stroke="#4f46e5" 
                strokeWidth={2.5} 
                fillOpacity={1} 
                fill="url(#colorActual)" 
                animationDuration={600}
              />
              <Area 
                type="monotone" 
                dataKey="forecast" 
                name="ការព្យាករណ៍លក់ (Projected Revenue)" 
                stroke="#d97706" 
                strokeWidth={2.5} 
                strokeDasharray="5 5"
                fillOpacity={1} 
                fill="url(#colorForecast)" 
                animationDuration={600}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Categorywise detailed analysis columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
        
        {/* Sales by product categories */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-3xs p-5">
          <div className="flex items-center space-x-2 border-b border-slate-50 pb-3 mb-4">
            <PieChart size={16} className="text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-800">ចំណែកចំណូលតាមប្រភេទផលិតផល (Sales Category Distribution)</h3>
          </div>
          {renderCategoryBarChart(categorySalesShare, 'indigo')}
        </div>

        {/* Expenses by operation categories */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-3xs p-5">
          <div className="flex items-center space-x-2 border-b border-slate-50 pb-3 mb-4">
            <BarChart size={16} className="text-rose-500" />
            <h3 className="text-xs font-bold text-slate-800">ចំណែកចំណាយប្រតិបត្តិការលម្អិត (Expense Category Breakdown)</h3>
          </div>
          {renderCategoryBarChart(categoryExpensesShare, 'rose')}
        </div>

      </div>

    </div>
  );
}
