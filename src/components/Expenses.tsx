/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Expense } from '../types';
import { EXPENSE_CATEGORIES } from '../data';
import { 
  Plus, 
  Trash2, 
  DollarSign, 
  Calendar, 
  Tag, 
  Search, 
  HelpCircle,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ExpensesProps {
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
}

export default function Expenses({
  expenses,
  onAddExpense,
  onDeleteExpense
}: ExpensesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ទាំងអស់');
  
  // New Expense Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [date, setDate] = useState(() => {
    const today = new Date();
    // Format to YYYY-MM-DD
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [note, setNote] = useState('');

  // Handle addition
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || amount <= 0) return;

    onAddExpense({
      title: title.trim(),
      amount: Number(amount),
      category,
      date,
      note: note.trim()
    });

    // Reset fields except date and category for sequential logging
    setTitle('');
    setAmount(0);
    setNote('');
  };

  // Delete wrapping
  const handleDelete = (id: string, name: string) => {
    if (confirm(`តើអ្នកពិតជាចង់លុបការចំណាយ "${name}" នេះចេញពីបញ្ជីមែនទេ?`)) {
      onDeleteExpense(id);
    }
  };

  // Filter and compute total
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const matchSearch = exp.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = selectedCategory === 'ទាំងអស់' || exp.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [expenses, searchTerm, selectedCategory]);

  const totalFilteredAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + item.amount, 0);
  }, [filteredExpenses]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      
      {/* LEFT: ADD NEW EXPENSE FORM PANEL (1 Column) */}
      <div id="add-expense-form-container" className="bg-white border border-slate-100 rounded-2xl p-5 shadow-3xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-800">កត់ត្រាការចំណាយថ្មី (Record Daily Expense)</h2>
          <p className="text-[11px] text-slate-400">បញ្ចូលការចំណាយផ្សេងៗដូចជា កញ្ចប់ ដឹកជញ្ជូន ផ្សព្វផ្សាយ ជាដើម</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Expense title */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 block">ចំណងជើងការចំណាយ (Expense item):</label>
            <input 
              type="text" 
              required
              placeholder="ឧទាហរណ៍៖ ទិញប្រអប់កាតុងខ្ចប់ឥវ៉ាន់បន្ថែម..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 border border-slate-100 rounded-xl bg-slate-50 placeholder:text-slate-300 focus:outline-hidden focus:border-indigo-400 focus:bg-white text-slate-700 font-medium"
            />
          </div>

          {/* Amount in USD */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 block flex items-center gap-1">
              <DollarSign size={10} />
              <span>ទឹកប្រាក់ចំណាយ (Amount in USD):</span>
            </label>
            <input 
              type="number" 
              step="0.01"
              min="0.01"
              required
              placeholder="15.00"
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full text-xs px-3.5 py-2.5 border border-slate-100 rounded-xl bg-slate-50 text-slate-700 font-mono focus:outline-hidden focus:border-indigo-400 focus:bg-white font-medium"
            />
          </div>

          {/* Category selection */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 block flex items-center gap-1">
              <Tag size={10} />
              <span>ប្រភេទការចំណាយ (Category):</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-100 rounded-xl bg-slate-50 text-xs focus:outline-hidden focus:border-indigo-400 focus:bg-white text-slate-700 font-medium cursor-pointer"
            >
              {EXPENSE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Date selection */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 block flex items-center gap-1">
              <Calendar size={10} />
              <span>កាលបរិច្ឆេទចំណាយ (Expense Date):</span>
            </label>
            <input 
              type="date" 
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 border border-slate-100 rounded-xl bg-slate-50 text-slate-700 font-mono focus:outline-hidden focus:border-indigo-400 focus:bg-white"
            />
          </div>

          {/* Optional notes */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 block">សម្គាល់លម្អិតបន្ថែម (Optional Notes):</label>
            <input 
              type="text" 
              placeholder="ឧទាហរណ៍៖ ដឹកឥវ៉ាន់ឱ្យម៉ូយ កុងត្រាដឹកជញ្ជូនរហ័ស..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 border border-slate-100 rounded-xl bg-slate-50 placeholder:text-slate-300 focus:outline-hidden focus:border-indigo-400 focus:bg-white text-slate-700 font-medium"
            />
          </div>

          {/* Record button */}
          <button 
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl cursor-pointer transition-colors shadow-xs flex items-center justify-center gap-1"
          >
            <Plus size={14} />
            <span>កត់ត្រាការចំណាយ (Record Expense)</span>
          </button>

        </form>
      </div>

      {/* RIGHT: EXPENSE HISTORY GRID AND FILTER (2 Columns) */}
      <div className="lg:col-span-2 space-y-4">
        
        {/* Statistics highlights bar */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-3xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-slate-400">សរុបការចំណាយដែលបានចម្រោះ៖</h3>
            <span className="text-2xl font-bold font-mono text-rose-500">${totalFilteredAmount.toFixed(2)}</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 select-none">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={13} />
              <input 
                type="text" 
                placeholder="ស្វែងរកចំណាយ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-slate-100 rounded-lg bg-slate-50 focus:bg-white focus:outline-hidden text-xs text-slate-700 font-medium"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2 py-1.5 border border-slate-100 rounded-lg bg-slate-50 text-xs text-slate-700 font-medium cursor-pointer focus:outline-hidden"
            >
              <option value="ទាំងអស់">គ្រប់ប្រភេទការចំណាយ</option>
              {EXPENSE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Expense History Table card */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-3xs overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/20 flex items-center gap-1.5">
            <FileText size={15} className="text-rose-500" />
            <h3 className="text-xs font-bold text-slate-700">តារាងបញ្ជីចំណាយលម្អិត (Expense Registry)</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-400">
                <tr>
                  <th className="py-2.5 px-4 font-bold text-[10px] uppercase">កាលបរិច្ឆេទ</th>
                  <th className="py-2.5 px-4 font-bold text-[10px] uppercase">ព័ត៌មានចំណាយ</th>
                  <th className="py-2.5 px-4 font-bold text-[10px] uppercase">ប្រភេទចំណាយ</th>
                  <th className="py-2.5 px-4 font-bold text-[10px] uppercase">កំណត់សម្គាល់</th>
                  <th className="py-2.5 px-4 font-bold text-[10px] uppercase">ទឹកប្រាក់</th>
                  <th className="py-2.5 px-4 font-bold text-[10px] uppercase text-right">លុប</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-300">
                      <HelpCircle size={36} className="mx-auto mb-1 text-slate-200" />
                      <span>មិនមានការកត់ត្រាការចំណាយត្រូវនឹងការចម្រោះឡើយ</span>
                    </td>
                  </tr>
                ) : (
                  [...filteredExpenses].reverse().map((exp) => {
                    // Prettify date format values
                    const parts = exp.date.split('-');
                    const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : exp.date;

                    return (
                      <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                          {formattedDate}
                        </td>
                        
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {exp.title}
                        </td>

                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold whitespace-nowrap ${
                            exp.category.startsWith('Supplies') 
                              ? 'bg-teal-50 text-teal-700 border-teal-200/50'
                              : exp.category.startsWith('Rent')
                              ? 'bg-amber-50 text-amber-700 border-amber-200/50'
                              : exp.category.startsWith('Marketing')
                              ? 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200/50'
                              : exp.category.startsWith('Delivery')
                              ? 'bg-blue-50 text-blue-700 border-blue-200/50'
                              : exp.category.startsWith('Utilities')
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
                              : 'bg-slate-50 text-slate-600 border-slate-200/50'
                          }`}>
                            {exp.category}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-400 italic font-light truncate max-w-[150px]" title={exp.note || 'គ្មាមកំណត់សំគាល់ខ្លី'}>
                          {exp.note || '-'}
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-rose-500 whitespace-nowrap">
                          -${exp.amount.toFixed(2)}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button 
                            onClick={() => handleDelete(exp.id, exp.title)}
                            className="p-1 text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
