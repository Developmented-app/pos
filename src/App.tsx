/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_SALES, 
  INITIAL_EXPENSES 
} from './data';
import { 
  Product, 
  Sale, 
  Expense, 
  SystemNotification, 
  SaleItem 
} from './types';

// Subcomponents
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Inventory from './components/Inventory';
import Expenses from './components/Expenses';
import Reports from './components/Reports';

// Icons
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  TrendingDown, 
  FileCheck, 
  Bell, 
  Menu, 
  X,
  AlertTriangle,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Navigation
  const [currentView, setCurrentView] = useState<'dashboard' | 'pos' | 'inventory' | 'expenses' | 'reports'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // States with Lazy Initializers from localStorage
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('kroma_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem('kroma_sales');
    return saved ? JSON.parse(saved) : INITIAL_SALES;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('kroma_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  // 1. Sync states with localStorage on changes
  useEffect(() => {
    localStorage.setItem('kroma_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('kroma_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('kroma_expenses', JSON.stringify(expenses));
  }, [expenses]);

  // 2. REACTIVE ALERTS AND WARNING GENERATOR SYSTEM (ប្រព័ន្ធជូនដំណឹងស្តុកជិតអស់!)
  // Scans product listing and populates active, unresolved alarms dynamically
  useEffect(() => {
    const activeAlerts: SystemNotification[] = [];

    products.forEach(product => {
      if (product.count <= product.lowStockThreshold) {
        if (product.count === 0) {
          activeAlerts.push({
            id: `alert-out-${product.id}`,
            type: 'out_of_stock',
            message: `ទំនិញ "${product.name}" បានអស់ពីស្តុកហើយ! (Out of stock)`,
            productId: product.id,
            timestamp: new Date().toISOString(),
            resolved: false
          });
        } else {
          activeAlerts.push({
            id: `alert-low-${product.id}`,
            type: 'low_stock',
            message: `ទំនិញ "${product.name}" នៅសល់ត្រឹមតែ ${product.count} ឯកតាប៉ុណ្ណោះក្នុងស្តុក (Low stock)`,
            productId: product.id,
            timestamp: new Date().toISOString(),
            resolved: false
          });
        }
      }
    });

    setNotifications(activeAlerts);
  }, [products]);

  // Core modification functions

  // 3. POS - Create sales, subtract stock, trigger alerts
  const handleProcessSale = (saleItems: SaleItem[], note?: string, paymentMethod?: 'cash' | 'khqr') => {
    // A. Re-verify stock quantities before locking purchase
    for (const item of saleItems) {
      const dbProduct = products.find(p => p.id === item.productId);
      if (!dbProduct) {
        return { success: false, error: `រកមិនឃើញផលិតផលក្នុងប្រព័ន្ធ!` };
      }
      if (dbProduct.count < item.quantity) {
        return { success: false, error: `ផលិតផល "${dbProduct.name}" មិនមានចំនួនស្តុកគ្រប់គ្រាន់ទេ!` };
      }
    }

    // B. Subtract stock numbers of active products
    const updatedProducts = products.map(prod => {
      const bBoughtItem = saleItems.find(item => item.productId === prod.id);
      if (bBoughtItem) {
        return {
          ...prod,
          count: Math.max(0, prod.count - bBoughtItem.quantity)
        };
      }
      return prod;
    });

    // C. Create new Sale object
    const newSaleId = `sale-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newSale: Sale = {
      id: newSaleId,
      items: saleItems,
      total: saleItems.reduce((acc, item) => acc + (item.price * item.quantity), 0),
      timestamp: new Date().toISOString(),
      note: note || '',
      paymentMethod: paymentMethod || 'cash'
    };

    // D. Update state triggers
    setProducts(updatedProducts);
    setSales(prev => [...prev, newSale]);

    return { success: true, saleId: newSaleId };
  };

  // 4. INVENTORY - Add product
  const handleAddProduct = (newProd: Omit<Product, 'id'>) => {
    const id = `prod-${Date.now()}`;
    const product: Product = {
      ...newProd,
      id
    };
    setProducts(prev => [product, ...prev]);
  };

  // 5. INVENTORY - Update product
  const handleUpdateProduct = (updatedProd: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProd.id ? updatedProd : p));
  };

  // 6. INVENTORY - Delete product
  const handleDeleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  // 7. EXPENSES - Add expense
  const handleAddExpense = (newExp: Omit<Expense, 'id'>) => {
    const id = `exp-${Date.now()}`;
    const expense: Expense = {
      ...newExp,
      id
    };
    setExpenses(prev => [...prev, expense]);
  };

  // 8. EXPENSES - Delete expense
  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  // 9. REPORTS - Backup database override import
  const handleImportDatabase = (importedData: { products: Product[]; sales: Sale[]; expenses: Expense[] }) => {
    setProducts(importedData.products);
    setSales(importedData.sales);
    setExpenses(importedData.expenses);
  };

  // Navigate view & close mobile menu drawer helper
  const handleLayoutNavigate = (view: typeof currentView) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  return (
    <div id="application-layout" className="min-h-screen flex flex-col md:flex-row text-slate-700 bg-slate-50">
      
      {/* MOBILE HEADER NAVIGATION RECEPTACLE */}
      <header className="md:hidden bg-white border-b border-slate-100 px-4 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-3xs">
        <div className="flex items-center space-x-2">
          {/* Decorative Emblem */}
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-extrabold text-sm">
            K
          </div>
          <span className="font-extrabold text-slate-800 tracking-tight text-xs">ប្រព័ន្ធគ្រប់គ្រងការលក់</span>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Notification bell badge */}
          {notifications.length > 0 && (
            <button 
              onClick={() => handleLayoutNavigate('inventory')}
              className="relative p-1.5 text-amber-500 hover:text-amber-600 bg-amber-50 rounded-lg"
            >
              <Bell size={18} className="animate-bounce" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {notifications.length}
              </span>
            </button>
          )}

          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* MOBILE NAVIGATION SIDEBAR EXPANSION */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-white border-b border-slate-200 py-3 px-4 flex flex-col space-y-1.5 absolute top-[57px] left-0 right-0 z-30 shadow-md"
          >
            <button 
              onClick={() => handleLayoutNavigate('dashboard')}
              className={`w-full py-2.5 px-3 rounded-xl text-left text-xs font-semibold flex items-center gap-2.5 transition-colors ${
                currentView === 'dashboard' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'
              }`}
            >
              <LayoutDashboard size={16} />
              <span>ផ្ទាំងគ្រប់គ្រង (Dashboard)</span>
            </button>

            <button 
              onClick={() => handleLayoutNavigate('pos')}
              className={`w-full py-2.5 px-3 rounded-xl text-left text-xs font-semibold flex items-center gap-2.5 transition-colors ${
                currentView === 'pos' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'
              }`}
            >
              <ShoppingCart size={16} />
              <span>លក់ទំនិញ (POS / Register)</span>
            </button>

            <button 
              onClick={() => handleLayoutNavigate('inventory')}
              className={`w-full py-2.5 px-3 rounded-xl text-left text-xs font-semibold flex items-center gap-2.5 transition-colors ${
                currentView === 'inventory' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'
              }`}
            >
              <Package size={16} />
              <span>ស្តុកទំនិញ (Inventory)</span>
              {notifications.length > 0 && (
                <span className="ml-auto bg-amber-100 text-amber-700 text-[9px] font-bold px-1.5 py-0.2 rounded-md animate-pulse">
                  ជិតអស់
                </span>
              )}
            </button>

            <button 
              onClick={() => handleLayoutNavigate('expenses')}
              className={`w-full py-2.5 px-3 rounded-xl text-left text-xs font-semibold flex items-center gap-2.5 transition-colors ${
                currentView === 'expenses' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'
              }`}
            >
              <TrendingDown size={16} />
              <span>ការចំណាយប្រតិបត្តិការ (Expenses)</span>
            </button>

            <button 
              onClick={() => handleLayoutNavigate('reports')}
              className={`w-full py-2.5 px-3 rounded-xl text-left text-xs font-semibold flex items-center gap-2.5 transition-colors ${
                currentView === 'reports' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'
              }`}
            >
              <FileCheck size={16} />
              <span>របាយការណ៍ស្វ័យប្រវត្ត (Reports)</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>


      {/* WINDOWS/DESKTOP FIXED MAIN SIDEBAR */}
      <aside className="hidden md:flex flex-col justify-between w-64 bg-white border-r border-slate-150/90 h-screen sticky top-0 p-5 shrink-0 shadow-2xs">
        
        <div className="space-y-6">
          {/* Logo Brand Segment */}
          <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-4">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-base shadow-xs select-none">
              KM
            </div>
            <div>
              <span className="font-extrabold text-slate-900 leading-none block text-[13px] tracking-tight">Kroma Ledger</span>
              <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 block inline-block" />
                <span>គ្រប់គ្រងលក់អនឡាញ</span>
              </p>
            </div>
          </div>

          {/* Navigation Options list with Khmer translation labels */}
          <nav className="space-y-1.5">
            
            <button 
              onClick={() => handleLayoutNavigate('dashboard')}
              className={`w-full py-2.5 px-3.5 rounded-xl text-left text-xs font-semibold flex items-center gap-3 transition-all cursor-pointer ${
                currentView === 'dashboard' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <LayoutDashboard size={16} />
              <span>ផ្ទាំងគ្រប់គ្រង (Dashboard)</span>
            </button>

            <button 
              onClick={() => handleLayoutNavigate('pos')}
              className={`w-full py-2.5 px-3.5 rounded-xl text-left text-xs font-semibold flex items-center gap-3 transition-all cursor-pointer ${
                currentView === 'pos' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <ShoppingCart size={16} />
              <span>កត់ត្រាការលក់ (POS Ledger)</span>
            </button>

            <button 
              onClick={() => handleLayoutNavigate('inventory')}
              className={`w-full py-2.5 px-3.5 rounded-xl text-left text-xs font-semibold flex items-center gap-3 justify-between transition-all cursor-pointer ${
                currentView === 'inventory' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Package size={16} />
                <span>ស្តុកទំនិញ (Inventory)</span>
              </div>
              {notifications.length > 0 && (
                <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-sm ${
                  currentView === 'inventory' ? 'bg-amber-100 text-amber-800' : 'bg-amber-50 text-amber-500 border border-amber-100 animate-pulse'
                }`}>
                  ស្តុកទាប
                </span>
              )}
            </button>

            <button 
              onClick={() => handleLayoutNavigate('expenses')}
              className={`w-full py-2.5 px-3.5 rounded-xl text-left text-xs font-semibold flex items-center gap-3 transition-all cursor-pointer ${
                currentView === 'expenses' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <TrendingDown size={16} />
              <span>កត់ត្រាចំណាយ (Expenses)</span>
            </button>

            <button 
              onClick={() => handleLayoutNavigate('reports')}
              className={`w-full py-2.5 px-3.5 rounded-xl text-left text-xs font-semibold flex items-center gap-3 transition-all cursor-pointer ${
                currentView === 'reports' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <FileCheck size={16} />
              <span>របាយការណ៍សង្ខេប (Reports)</span>
            </button>

          </nav>
        </div>

        {/* Info panel bottom of sidebar */}
        <div id="footer-branding" className="pt-3 border-t border-slate-100">
          
          {notifications.length > 0 && (
            <div className="mb-2 bg-amber-50 rounded-xl p-2.5 border border-amber-100 text-[10px] space-y-1.5">
              <span className="font-bold text-amber-800 flex items-center gap-1.5">
                <AlertTriangle size={12} className="text-amber-600" />
                <span>ទាបជាងស្តុកកម្រកំណត់៖</span>
              </span>
              <p className="text-slate-600 font-light leading-snug">
                មានទំនិញចំនួន {notifications.length} មុខជិតអស់។ សូមបន្ថែមស្តុកជាបន្ទាន់!
              </p>
            </div>
          )}

          <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 justify-center">
            <span>រក្សាសិទ្ធិគ្រប់យ៉ាង ២០២៦</span>
          </div>

        </div>

      </aside>

      {/* CORE WORK AREA / ACTIVE CONTROLS SUBPANEL */}
      <main id="main-content-flow" className="flex-1 overflow-y-auto px-4 py-6 md:p-8 space-y-6">
        
        {/* Router wrapper with slide-fade transition using framer motion */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.15 }}
          >
            {currentView === 'dashboard' && (
              <Dashboard 
                products={products}
                sales={sales}
                expenses={expenses}
                notifications={notifications}
                onNavigate={handleLayoutNavigate}
                onClearNotification={() => {}} // Dynamic alerts resolve reactively, no manual dismissal required
              />
            )}

            {currentView === 'pos' && (
              <POS 
                products={products}
                onAddSale={handleProcessSale}
              />
            )}

            {currentView === 'inventory' && (
              <Inventory 
                products={products}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
              />
            )}

            {currentView === 'expenses' && (
              <Expenses 
                expenses={expenses}
                onAddExpense={handleAddExpense}
                onDeleteExpense={handleDeleteExpense}
              />
            )}

            {currentView === 'reports' && (
              <Reports 
                products={products}
                sales={sales}
                expenses={expenses}
                onImportData={handleImportDatabase}
              />
            )}
          </motion.div>
        </AnimatePresence>

      </main>

    </div>
  );
}
