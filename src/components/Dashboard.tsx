/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { Product, Sale, Expense, SystemNotification } from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle, 
  ShoppingCart, 
  ArrowRight, 
  Package, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  notifications: SystemNotification[];
  onNavigate: (view: 'dashboard' | 'pos' | 'inventory' | 'expenses' | 'reports') => void;
  onClearNotification: (id: string) => void;
}

export default function Dashboard({
  products,
  sales,
  expenses,
  notifications,
  onNavigate,
  onClearNotification
}: DashboardProps) {
  const [timeframe, setTimeframe] = useState<'month' | 'all'>('month');

  // 1. Calculate General Financial Stats
  const financials = useMemo(() => {
    // Current month is 2026-06 (June 2026 based on mock data & current date)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentMonthPrefix = `${currentYear}-${currentMonth}`; // e.g. "2026-06"

    const filteredSales = timeframe === 'month' 
      ? sales.filter(s => s.timestamp.startsWith(currentMonthPrefix))
      : sales;

    const filteredExpenses = timeframe === 'month'
      ? expenses.filter(e => e.date.startsWith(currentMonthPrefix))
      : expenses;

    const totalSales = filteredSales.reduce((acc, sale) => acc + sale.total, 0);
    const totalExpense = filteredExpenses.reduce((acc, exp) => acc + exp.amount, 0);
    
    // Cost of Goods Sold (COGS)
    const totalCOGS = filteredSales.reduce((acc, sale) => {
      const saleCOGS = sale.items.reduce((itemAcc, item) => itemAcc + (item.cost * item.quantity), 0);
      return acc + saleCOGS;
    }, 0);

    const netProfit = totalSales - totalExpense - totalCOGS;
    const lowStockCount = products.filter(p => p.count <= p.lowStockThreshold).length;

    return {
      totalSales,
      totalExpense,
      netProfit,
      lowStockCount,
      totalCOGS,
      monthLabel: currentMonthPrefix === '2026-06' ? 'ខែមិថុនា ២០២៦' : `${currentMonth}/${currentYear}`
    };
  }, [products, sales, expenses, timeframe]);

  // 2. Filter low stock products directly for action block
  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.count <= p.lowStockThreshold);
  }, [products]);

  // 3. Generate Chart Data for June 2026 (Days 1 to 7)
  const chartData = useMemo(() => {
    const days = [1, 2, 3, 4, 5, 6, 7];
    return days.map(day => {
      const dateStr = `2026-06-0${day}`;
      
      // Calculate sales for this day
      const daySalesSum = sales
        .filter(s => s.timestamp.startsWith(dateStr))
        .reduce((sum, s) => sum + s.total, 0);

      // Calculate expenses for this day
      const dayExpensesSum = expenses
        .filter(e => e.date === dateStr)
        .reduce((sum, e) => sum + e.amount, 0);

      return {
        label: `ថ្ងៃទី ០${day}`,
        sales: daySalesSum,
        expenses: dayExpensesSum
      };
    });
  }, [sales, expenses]);

  // SVG Chart Dimensions & Computations
  const chartHeight = 200;
  const chartWidth = 500;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const maxVal = useMemo(() => {
    const allVals = chartData.flatMap(d => [d.sales, d.expenses]);
    const max = Math.max(...allVals, 50); // Minimum scale of $50
    return Math.ceil(max / 50) * 50; // Round up to nearest 50
  }, [chartData]);

  // Compute graph coordinates
  const points = useMemo(() => {
    const usableWidth = chartWidth - paddingLeft - paddingRight;
    const usableHeight = chartHeight - paddingTop - paddingBottom;

    const salesPoints: string[] = [];
    const expensesPoints: string[] = [];

    chartData.forEach((d, i) => {
      const x = paddingLeft + (i / (chartData.length - 1)) * usableWidth;
      
      // Sales Y
      const salesY = paddingTop + usableHeight - (d.sales / maxVal) * usableHeight;
      salesPoints.push(`${x},${salesY}`);

      // Expenses Y
      const expensesY = paddingTop + usableHeight - (d.expenses / maxVal) * usableHeight;
      expensesPoints.push(`${x},${expensesY}`);
    });

    return {
      sales: salesPoints.join(' '),
      expenses: expensesPoints.join(' '),
      salesRaw: salesPoints,
      expensesRaw: expensesPoints
    };
  }, [chartData, maxVal, chartWidth, chartHeight]);

  return (
    <div className="space-y-6">
      {/* 1. Header and Timeframe selection controls */}
      <div id="dashboard-header" className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-sm font-extrabold text-slate-800">
            ផ្ទាំងគ្រប់គ្រងរាយការណ៍ (Dashboard Overview)
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">
            សង្ខេបហិរញ្ញវត្ថុ និងកម្រិតស្តុកលក់ទូទៅក្នុងហាង (Real-time store ledger & analytics summaries)
          </p>
        </div>
        
        {/* Switch Selector */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-155 text-[11px] font-bold shadow-3xs">
          <button
            type="button"
            onClick={() => setTimeframe('month')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              timeframe === 'month' 
                ? 'bg-white text-indigo-600 shadow-3xs' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Calendar size={13} />
            <span>ខែនេះ ({financials.monthLabel})</span>
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('all')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              timeframe === 'all' 
                ? 'bg-white text-indigo-600 shadow-3xs' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <TrendingUp size={13} />
            <span>សរុបរួម (All-Time)</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        
        {/* Metric Card 1: Total Revenue */}
        <div id="stat-sales" className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
              {timeframe === 'month' ? 'Total Revenue (ចំណូលខែនេះ)' : 'Total Revenue (ចំណូលសរុប)'}
            </span>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-extrabold font-mono text-emerald-600">${financials.totalSales.toFixed(2)}</span>
            </div>
            <p className="text-[10px] text-slate-400">
              {timeframe === 'month' ? `ចំណូលសរុបពីការលក់ក្នុងខែ ${financials.monthLabel}` : 'គិតរួមទាំងប្រាក់ចំណូលលក់ទាំងអស់'}
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <TrendingUp size={24} />
          </div>
        </div>

        {/* Metric Card 2: Total Expenses */}
        <div id="stat-expenses" className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
              {timeframe === 'month' ? 'Total Expenses (ចំណាយខែនេះ)' : 'Total Expenses (ចំណាយសរុប)'}
            </span>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-extrabold font-mono text-rose-600">${financials.totalExpense.toFixed(2)}</span>
            </div>
            <p className="text-[10px] text-slate-400">
              {timeframe === 'month' ? `ចំណាយប្រតិបត្តិការក្នុងខែ ${financials.monthLabel}` : 'ការចំណាយប្រតិបត្តិការទូទៅ'}
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
            <TrendingDown size={24} />
          </div>
        </div>

        {/* Metric Card 3: Net Profit */}
        <div id="stat-profit" className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
              {timeframe === 'month' ? 'Net Profit (ចំណេញខែនេះ)' : 'Net Profit (ចំណេញសុទ្ធ)'}
            </span>
            <div className="flex items-baseline space-x-1">
              <span className={`text-2xl font-extrabold font-mono ${financials.netProfit >= 0 ? 'text-indigo-600' : 'text-amber-600'}`}>
                ${financials.netProfit.toFixed(2)}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              {timeframe === 'month' ? `ចំណេញដកដើមនិងការចំណាយលម្អិត` : 'ដកការចំណាយនិងតម្លៃដើមទំនិញ'}
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <DollarSign size={24} />
          </div>
        </div>

        {/* Metric Card 4: Low Stock Warnings */}
        <div 
          id="stat-low-stock" 
          onClick={() => onNavigate('inventory')}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center justify-between cursor-pointer hover:border-amber-300 transition-colors"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
              Low Stock (ទំនិញស្តុកទាប)
            </span>
            <div className="flex items-baseline space-x-1">
              <span className={`text-2xl font-extrabold font-mono ${financials.lowStockCount > 0 ? 'text-amber-500 animate-pulse' : 'text-slate-500'}`}>
                {financials.lowStockCount} មុខ
              </span>
            </div>
            <p className="text-[10px] text-slate-400">ទាមទារការបញ្ជាទិញបន្ថែម</p>
          </div>
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${financials.lowStockCount > 0 ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-400'}`}>
            <AlertTriangle size={24} />
          </div>
        </div>

      </div>

      {/* 3. Live Notification & Alerts Section */}
      {notifications.length > 0 && (
        <div id="stock-notifications-section" className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-5">
          <div className="flex items-center space-x-2 text-amber-800 font-semibold mb-3">
            <AlertCircle size={20} className="text-amber-600" />
            <h3 className="text-sm">បញ្ជីជូនដំណឹងបន្ទាន់៖ ស្តុកទំនិញជិតកំណត់អស់ (Low Stock Alert)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {notifications.slice(0, 4).map(notification => (
              <div 
                key={notification.id} 
                className="bg-white/80 backdrop-blur-xs border border-amber-100/80 rounded-xl p-3 flex justify-between items-center text-xs shadow-2xs"
              >
                <div className="flex items-center space-x-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                  <span className="text-slate-700 font-medium">{notification.message}</span>
                </div>
                <button 
                  onClick={() => onNavigate('inventory')}
                  className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg transition-colors font-medium cursor-pointer"
                >
                  បំពេញស្តុក
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Monthly Analytics Trend & Active Stock Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: SVG Interactive Graph */}
        <div id="financial-trend-card" className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs lg:col-span-2">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">និន្នាការហិរញ្ញវត្ថុប្រចាំសប្តាហ៍ទី១ ខែមិថុនា ២០២៦</h3>
              <p className="text-[11px] text-slate-400">ប្រៀបធៀបចំណូលលក់ និងការចំណាយប្រតិបត្តិការប្រចាំថ្ងៃ</p>
            </div>
            <div className="flex space-x-3 text-xs">
              <div className="flex items-center space-x-1.5">
                <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block" />
                <span className="text-slate-500 text-[11px]">ចំណូលលក់</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="h-3 w-3 rounded-full bg-rose-500 inline-block" />
                <span className="text-slate-500 text-[11px]">ការចំណាយ</span>
              </div>
            </div>
          </div>

          {/* Render Vector Graph */}
          <div className="relative w-full overflow-x-auto select-none">
            <svg 
              viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
              className="w-full min-w-[450px]"
              height={chartHeight}
            >
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.2"/>
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0"/>
                </linearGradient>
                <linearGradient id="expensesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.2"/>
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0"/>
                </linearGradient>
              </defs>

              {/* Grid Y lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                const y = paddingTop + ratio * (chartHeight - paddingTop - paddingBottom);
                const labelVal = maxVal - ratio * maxVal;
                return (
                  <g key={index}>
                    <line 
                      x1={paddingLeft} 
                      y1={y} 
                      x2={chartWidth - paddingRight} 
                      y2={y} 
                      stroke="#f1f5f9" 
                      strokeWidth="1"
                    />
                    <text 
                      x={paddingLeft - 8} 
                      y={y + 4} 
                      textAnchor="end" 
                      className="font-mono text-[9px] fill-slate-400"
                    >
                      ${labelVal.toFixed(0)}
                    </text>
                  </g>
                );
              })}

              {/* Grid X Grid lines & texts */}
              {chartData.map((d, i) => {
                const usableWidth = chartWidth - paddingLeft - paddingRight;
                const x = paddingLeft + (i / (chartData.length - 1)) * usableWidth;
                return (
                  <g key={i}>
                    <line 
                      x1={x} 
                      y1={paddingTop} 
                      x2={x} 
                      y2={chartHeight - paddingBottom} 
                      stroke="#f8fafc" 
                      strokeWidth="1.5"
                    />
                    <text 
                      x={x} 
                      y={chartHeight - paddingBottom + 16} 
                      textAnchor="middle" 
                      className="text-[9px] fill-slate-500 font-medium"
                    >
                      {d.label}
                    </text>
                  </g>
                );
              })}

              {/* Fill area graphs path */}
              {points.salesRaw.length > 0 && (
                <path 
                  d={`M ${paddingLeft} ${chartHeight - paddingBottom} L ${points.sales} L ${chartWidth - paddingRight} ${chartHeight - paddingBottom} Z`}
                  fill="url(#salesGrad)"
                />
              )}
              {points.expensesRaw.length > 0 && (
                <path 
                  d={`M ${paddingLeft} ${chartHeight - paddingBottom} L ${points.expenses} L ${chartWidth - paddingRight} ${chartHeight - paddingBottom} Z`}
                  fill="url(#expensesGrad)"
                />
              )}

              {/* Draw line paths */}
              <polyline 
                fill="none" 
                stroke="#10b981" 
                strokeWidth="2.5" 
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points.sales}
              />
              <polyline 
                fill="none" 
                stroke="#f43f5e" 
                strokeWidth="2.5" 
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points.expenses}
              />

              {/* Dots on line intersections */}
              {chartData.map((d, i) => {
                const usableWidth = chartWidth - paddingLeft - paddingRight;
                const usableHeight = chartHeight - paddingTop - paddingBottom;
                const x = paddingLeft + (i / (chartData.length - 1)) * usableWidth;
                const sy = paddingTop + usableHeight - (d.sales / maxVal) * usableHeight;
                const ey = paddingTop + usableHeight - (d.expenses / maxVal) * usableHeight;

                return (
                  <g key={i}>
                    {/* Sales Dots */}
                    {d.sales > 0 && (
                      <circle 
                        cx={x} 
                        cy={sy} 
                        r="3.5" 
                        fill="#white" 
                        stroke="#10b981" 
                        strokeWidth="2"
                      />
                    )}
                    {/* Expenses Dots */}
                    {d.expenses > 0 && (
                      <circle 
                        cx={x} 
                        cy={ey} 
                        r="3.5" 
                        fill="#white" 
                        stroke="#f43f5e" 
                        strokeWidth="2"
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Right Side: Quick stock warning list */}
        <div id="low-stock-checklist-card" className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">ស្ទង់ទំនិញត្រូវការស្តុក</h3>
              <p className="text-[11px] text-slate-400">ទំនិញដែលនៅសល់ក្នុងស្តុកតិចជាងចំណុចកំណត់បង្គោល</p>
            </div>
            
            <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
              {lowStockProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center text-slate-300">
                  <Package size={36} className="mb-1" />
                  <span className="text-xs">មិនមានទំនិញស្តុកទាបឡើយ!</span>
                </div>
              ) : (
                lowStockProducts.map(product => (
                  <div key={product.id} className="flex justify-between items-center text-xs p-2.5 rounded-xl border border-rose-50/50 bg-slate-50/40">
                    <div className="space-y-0.5">
                      <span className="font-medium text-slate-700 block line-clamp-1">{product.name}</span>
                      <span className="text-[10px] text-slate-400">កម្រិតជូនដំណឹងទាប៖ {product.lowStockThreshold} {product.category === 'ភេសជ្ជៈ' ? 'ដប' : 'ភក'}</span>
                    </div>
                    <div className="text-right pl-3">
                      <span className="text-slate-900 font-bold text-xs block font-mono text-red-500">
                        នៅសល់៖ {product.count}
                      </span>
                      <span className="text-[9px] text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-sm inline-block mt-0.5">
                        {product.count === 0 ? 'អស់ស្តុក' : 'ស្តុកទាប'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button 
            onClick={() => onNavigate('inventory')}
            className="w-full mt-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>គ្រប់គ្រងស្តុកទាំងមូល</span>
            <ArrowRight size={14} />
          </button>
        </div>

      </div>

      {/* 5. Dual split listing for recent sales and recent expenses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Segment 1: Recent Sales (កត់ត្រាលក់ចុងក្រោយ) */}
        <div id="recent-sales-card" className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <ShoppingCart size={16} />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">ការលក់ប្រចាំថ្ងៃចុងក្រោយ</h3>
            </div>
            <button 
              onClick={() => onNavigate('pos')}
              className="text-indigo-600 hover:text-indigo-700 text-xs font-semibold cursor-pointer"
            >
              + បន្ថែមលក់ថ្មី
            </button>
          </div>

          <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
            {sales.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-300">មិនទាន់មានទិន្នន័យលក់ជួបឡើយ</div>
            ) : (
              [...sales].reverse().slice(0, 4).map(sale => {
                const date = new Date(sale.timestamp);
                const formatTime = date.toLocaleTimeString('km-KH', { hour12: false, hour: '2-digit', minute: '2-digit' });
                const formatDate = date.toLocaleDateString('km-KH', { day: '2-digit', month: 'short' });
                
                return (
                  <div key={sale.id} className="border border-slate-50 rounded-xl p-3 bg-slate-50/20 hover:bg-slate-50/60 transition-colors flex justify-between items-center text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="font-semibold text-slate-800 font-mono">#{sale.id.slice(-5)}</span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Calendar size={10} />
                          {formatDate} - {formatTime}
                        </span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-md ${
                          sale.paymentMethod === 'khqr' 
                            ? 'text-rose-600 bg-rose-50 border border-rose-100' 
                            : 'text-indigo-600 bg-indigo-50 border border-indigo-100'
                        }`}>
                          {sale.paymentMethod === 'khqr' ? 'KHQR' : 'សាច់ប្រាក់'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[200px]">
                        {sale.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-600 text-xs font-mono">+${sale.total.toFixed(2)}</span>
                      {sale.note && (
                        <div className="text-[10px] text-slate-400 italic font-light truncate max-w-[120px]" title={sale.note}>
                          {sale.note}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Segment 2: Recent Expenses (កត់ត្រាចំណាយចុងក្រោយ) */}
        <div id="recent-expenses-card" className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <TrendingDown size={16} />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">ការចំណាយប្រតិបត្តិការចុងក្រោយ</h3>
            </div>
            <button 
              onClick={() => onNavigate('expenses')}
              className="text-indigo-600 hover:text-indigo-700 text-xs font-semibold cursor-pointer"
            >
              + បន្ថែមចំណាយថ្មី
            </button>
          </div>

          <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
            {expenses.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-300">មិនទាន់មានកត់ត្រាចំណាយឡើយ</div>
            ) : (
              [...expenses].reverse().slice(0, 4).map(exp => {
                const parts = exp.date.split('-');
                const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : exp.date;
                return (
                  <div key={exp.id} className="border border-slate-50 rounded-xl p-3 bg-slate-50/20 hover:bg-slate-50/60 transition-colors flex justify-between items-center text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-semibold text-slate-700">{exp.title}</span>
                        <span className="text-[10px] bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.2 rounded-sm">
                          {exp.category}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Calendar size={10} />
                        {formattedDate}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-rose-500 font-mono">-${exp.amount.toFixed(2)}</span>
                      {exp.note && (
                        <div className="text-[10px] text-slate-400 italic truncate max-w-[120px]" title={exp.note}>
                          {exp.note}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
