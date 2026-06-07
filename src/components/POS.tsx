/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Product, SaleItem } from '../types';
import { PRODUCT_CATEGORIES } from '../data';
import { 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  ShoppingCart, 
  CheckCircle,
  FileText,
  AlertCircle,
  Clock,
  User,
  Heart,
  Zap,
  Printer,
  Package,
  QrCode,
  Coins,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface POSProps {
  products: Product[];
  onAddSale: (saleItems: SaleItem[], note?: string, paymentMethod?: 'cash' | 'khqr', tag?: string) => { success: boolean; saleId?: string; error?: string };
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function POS({ products, onAddSale }: POSProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ទាំងអស់'); // 'All'
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customNote, setCustomNote] = useState('');
  
  // Checkout & Payment states
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [activePaymentMethod, setActivePaymentMethod] = useState<'cash' | 'khqr'>('cash');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [khqrPaidStatus, setKhqrPaidStatus] = useState<'waiting' | 'verified' | 'failed'>('waiting');
  const [khqrTimer, setKhqrTimer] = useState<number>(300); // 5 minutes countdown
  
  // Checkout tagging states
  const [selectedTag, setSelectedTag] = useState<string>('In-store');
  const [isCustomTagSelected, setIsCustomTagSelected] = useState(false);
  
  // Checkout success details
  const [lastReceipt, setLastReceipt] = useState<{
    id: string;
    items: SaleItem[];
    total: number;
    timestamp: Date;
    note: string;
    paymentMethod?: 'cash' | 'khqr';
    tag?: string;
  } | null>(null);

  // 1. Filter products based on category and search query
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchCategory = selectedCategory === 'ទាំងអស់' || product.category === selectedCategory;
      const matchSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  // Frequently sold products list for Quick Add
  const frequentlySold = useMemo(() => {
    // Specifically pick some key items from our list that have default stock and represent common sales,
    // or fallback to the top 4 products in stock
    const preferredSkus = ['KM-KRAMA-01', 'KM-COFFEE-03', 'KM-TEA-05', 'KM-HONEY-04'];
    const preferred = products.filter(p => p.sku && preferredSkus.includes(p.sku) && p.count > 0);
    if (preferred.length > 0) {
      return preferred.slice(0, 4);
    }
    return products.filter(p => p.count > 0).slice(0, 4);
  }, [products]);

  // 2. Add product to cart helper
  const handleAddToCart = (product: Product) => {
    // Check if item is already in cart
    const existingIndex = cart.findIndex(item => item.product.id === product.id);
    
    // Check if we have enough stock
    const currentCartQty = existingIndex >= 0 ? cart[existingIndex].quantity : 0;
    if (currentCartQty >= product.count) {
      alert(`សោកស្ដាយ! មិនមានស្តុកគ្រប់គ្រាន់សម្រាប់ការបញ្ជាទិញឡើយ។ ស្តុកបច្ចុប្បន្ន៖ ${product.count}`);
      return;
    }

    if (existingIndex >= 0) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  // 3. Update quantity helper
  const handleUpdateQuantity = (productId: string, delta: number) => {
    const existingIndex = cart.findIndex(item => item.product.id === productId);
    if (existingIndex === -1) return;

    const item = cart[existingIndex];
    const newQuantity = item.quantity + delta;

    if (newQuantity <= 0) {
      // Remove from cart
      setCart(cart.filter(item => item.product.id !== productId));
      return;
    }

    // Check stock limit
    if (delta > 0 && newQuantity > item.product.count) {
      alert(`សោកស្ដាយ! មិនមានស្តុកគ្រប់គ្រាន់សម្រាប់បញ្ជាទិញទេ។ ស្តុកបច្ចុប្បន្ន៖ ${item.product.count}`);
      return;
    }

    const updatedCart = [...cart];
    updatedCart[existingIndex].quantity = newQuantity;
    setCart(updatedCart);
  };

  // 4. Remove item from cart
  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  // 5. Calculate Cart Calculations
  const totals = useMemo(() => {
    const subtotal = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
    return {
      subtotal,
      discount: 0, // Option for discount in the future
      total: subtotal
    };
  }, [cart]);

  // KHQR payment timer countdown
  useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (isCheckoutModalOpen && activePaymentMethod === 'khqr' && khqrTimer > 0 && khqrPaidStatus === 'waiting') {
      timerId = setInterval(() => {
        setKhqrTimer(prev => prev - 1);
      }, 1000);
    } else if (khqrTimer === 0 && khqrPaidStatus === 'waiting') {
      setKhqrPaidStatus('failed');
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [isCheckoutModalOpen, activePaymentMethod, khqrTimer, khqrPaidStatus]);

  // 6. Initiate checkout modal flow
  const handleInitiateCheckout = () => {
    if (cart.length === 0) return;
    setActivePaymentMethod('cash');
    setCashReceived('');
    setKhqrPaidStatus('waiting');
    setKhqrTimer(300); // Reset to 5 mins
    setSelectedTag('In-store');
    setIsCustomTagSelected(false);
    setIsCheckoutModalOpen(true);
  };

  // 7. Complete Transaction on payment resolved
  const handleProcessPayment = (method: 'cash' | 'khqr') => {
    if (cart.length === 0) return;

    // Build sale item format
    const saleItems: SaleItem[] = cart.map(item => ({
      productId: item.product.id,
      name: item.product.name,
      price: item.product.price,
      cost: item.product.cost,
      quantity: item.quantity
    }));

    // Trigger state change in parent with correct payment method parameter
    const finalTag = selectedTag.trim() || 'In-store';
    const result = onAddSale(saleItems, customNote, method, finalTag);

    if (result.success && result.saleId) {
      // Save details to show receipt
      setLastReceipt({
        id: result.saleId,
        items: saleItems,
        total: totals.total,
        timestamp: new Date(),
        note: customNote,
        paymentMethod: method,
        tag: finalTag
      });
      // Reset states
      setCart([]);
      setCustomNote('');
      setIsCheckoutModalOpen(false);
    } else {
      alert(`កំហុសក្នុងការកត់ត្រាលក់៖ ${result.error}`);
    }
  };

  const handleNextSale = () => {
    setLastReceipt(null);
  };

  // Render receipt if transaction just succeeded
  if (lastReceipt) {
    return (
      <div id="printable-receipt-wrapper" className="flex justify-center py-6 w-full">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md w-full max-w-md space-y-5 printable-receipt-card"
        >
          {/* Header section of bill (Screen only) */}
          <div className="text-center space-y-1 border-b border-dashed border-slate-200 pb-5 print:hidden">
            <div className="inline-flex h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 items-center justify-center mb-1">
              <CheckCircle size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-800">ការលក់ជោគជ័យ!</h3>
            <p className="text-xs text-slate-400">វិក្កយបត្រអេឡិចត្រូនិច (Digital Receipt)</p>
          </div>

          {/* Header section for real physical print only */}
          <div className="hidden print:block text-center space-y-1 border-b border-dashed border-black pb-4 mb-4">
            <h2 className="text-sm font-bold text-black uppercase tracking-wider">ខ្មែរ ម៉ាត (KHMER MART)</h2>
            <p className="text-[10px] text-black">អាសយដ្ឋាន៖ រាជធានីភ្នំពេញ (Phnom Penh Agency)</p>
            <p className="text-[10px] text-black">ទូរស័ព្ទ៖ 012 345 678 | 098 765 432</p>
            <p className="text-xs font-bold text-black pt-1">វិក្កយបត្រទូទាត់ប្រាក់ (Sales Receipt)</p>
          </div>

          {/* Bill metadata details (Both) */}
          <div className="space-y-2 text-xs text-slate-600 print:text-black border-b border-slate-100 print:border-black/20 pb-4">
            <div className="flex justify-between font-mono">
              <span className="print:text-black">លេខវិក្កយបត្រ (Inv No):</span>
              <span className="font-bold text-slate-900 print:text-black">#{lastReceipt.id.slice(-6).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="print:text-black">កាលបរិច្ឆេទ (Date):</span>
              <span className="print:text-black">{lastReceipt.timestamp.toLocaleDateString('km-KH')} - {lastReceipt.timestamp.toLocaleTimeString('km-KH', { hour24: true })}</span>
            </div>
            <div className="flex justify-between">
              <span className="print:text-black">វិធីទូទាត់ (Payment):</span>
              <span className="font-extrabold text-indigo-600 print:text-black">
                {lastReceipt.paymentMethod === 'khqr' ? '🔵 KHQR (បាគង)' : '💵 សាច់ប្រាក់ (Cash)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="print:text-black">ប្រភេទលក់ (Type):</span>
              <span className="font-extrabold text-indigo-600 print:text-black">
                {lastReceipt.tag === 'In-store' 
                  ? '🏬 ក្នុងហាង (In-store)' 
                  : lastReceipt.tag === 'Online' 
                  ? '🌐 អនឡាញ (Online)' 
                  : lastReceipt.tag === 'Wholesale' 
                  ? '📦 បោះដុំ (Wholesale)' 
                  : `🏷️ ${lastReceipt.tag || 'In-store'}`}
              </span>
            </div>
            {lastReceipt.note && (
              <div className="flex justify-between items-start">
                <span className="print:text-black">កំណត់សម្គាល់ (Note):</span>
                <span className="text-slate-900 print:text-black italic max-w-[200px] text-right">{lastReceipt.note}</span>
              </div>
            )}
          </div>

          {/* Bill items listing (Both) */}
          <div className="space-y-3.5 border-b border-dashed border-slate-200 print:border-black/30 pb-4">
            <h4 className="text-xs font-semibold text-slate-700 print:text-black">ទំនិញដែលបានជាវ (Items):</h4>
            <div className="space-y-2.5">
              {lastReceipt.items.map((item, index) => (
                <div key={index} className="flex justify-between items-start text-xs">
                  <div className="space-y-0.5">
                    <span className="font-medium text-slate-800 print:text-black block">{item.name}</span>
                    <span className="text-[10px] text-slate-400 print:text-black font-mono">${item.price.toFixed(2)} x {item.quantity}</span>
                  </div>
                  <span className="font-medium font-mono text-slate-800 print:text-black">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing breakdown on bill (Both) */}
          <div className="flex justify-between items-center text-sm font-semibold border-b border-slate-100 print:border-black/20 pb-4">
            <span className="text-slate-700 print:text-black">ទឹកប្រាក់សរុប (Total Amount)</span>
            <span className="text-lg font-bold font-mono text-indigo-600 print:text-black">${lastReceipt.total.toFixed(2)}</span>
          </div>

          {/* Print only checkout footer bar */}
          <div className="hidden print:flex flex-col items-center justify-center pt-4 mb-2 space-y-1">
            <div className="font-mono text-[10px] tracking-widest text-black mb-1 select-none leading-none">||||| | |||| ||| || |||| | ||</div>
            <span className="text-[9px] font-mono text-black">KM-SALE-{lastReceipt.id.slice(-6).toUpperCase()}</span>
            <p className="text-[8px] text-black text-center italic pt-2">សូមពិនិត្យអីវ៉ាន់មុននឹងចាកចេញពីហាង។ អរគុណ!</p>
          </div>

          {/* Buttons & Actions (Screen only) */}
          <div className="text-center pt-2 space-y-2.5 print:hidden no-print">
            <p className="text-[10px] text-slate-400 italic">សូមអរគុណសម្រាប់ការគាំទ្រហាងអនឡាញរបស់យើងខ្ញុំ!</p>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl cursor-pointer transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                <Printer size={15} />
                <span>បោះពុម្ព (Print Receipt)</span>
              </button>

              <button
                type="button"
                onClick={handleNextSale}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer transition-colors border border-slate-200"
              >
                លក់ទំនិញបន្ត (Next)
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
      
      {/* LEFT: PRODUCTS BROWSER AND PANEL - 2 COLUMNS ON DESKTOP */}
      <div className="lg:col-span-2 space-y-5 flex flex-col justify-between">
        
        {/* Controls, Searches, and Filters */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* Search inputs */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="ស្វែងរកទំនិញតាមឈ្មោះ ប្រភេទ ឬលេខកូដ SKU (Search products by name, category or SKU)..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:outline-hidden focus:border-indigo-400 focus:bg-white text-slate-700 font-medium"
              />
            </div>

            {/* Quick action state */}
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-slate-500 font-mono text-[10px]">
                មានបង្ហាញ៖ {filteredProducts.length} មុខ
              </span>
            </div>

          </div>

          {/* Categories Tab slider */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 select-none">
            {['ទាំងអស់', ...PRODUCT_CATEGORIES].map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors font-medium border ${
                  selectedCategory === category 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-3xs' 
                    : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Add / Frequently Sold Section */}
        {frequentlySold.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-100 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-amber-500 text-white p-1 rounded-lg flex items-center justify-center shadow-xs">
                  <Zap size={14} className="fill-white" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">បន្ថែមរហ័ស (Quick Add)</h4>
                  <p className="text-[10px] text-slate-400">ទំនិញលក់ដាច់ញឹកញាប់ (Frequently Sold Items)</p>
                </div>
              </div>
              <span className="text-[9px] text-slate-400 font-medium hidden sm:inline">ចុចលើទំនិញដើម្បីលក់ភ្លាមៗ</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {frequentlySold.map((product) => {
                const isLowStock = product.count <= product.lowStockThreshold;
                return (
                  <button
                    key={`quick-${product.id}`}
                    onClick={() => handleAddToCart(product)}
                    className="bg-white hover:bg-amber-50/10 active:scale-98 border border-slate-100 hover:border-amber-300 rounded-xl p-2.5 text-left transition-all cursor-pointer flex flex-col justify-between h-full group shadow-3xs"
                  >
                    <div className="flex gap-2 items-center w-full">
                      <div className="h-6 w-6 rounded-md bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                        {product.imageUrl ? (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name} 
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=80&auto=format&fit=crop&q=60';
                            }}
                          />
                        ) : (
                          <Package size={10} className="text-slate-300" />
                        )}
                      </div>
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors block" title={product.name}>
                          {product.name}
                        </span>
                        {product.sku && (
                          <span className="text-[8px] font-mono text-slate-400 block truncate bg-slate-50 px-1 rounded-sm w-fit">
                            {product.sku}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2.5 pt-1.5 border-t border-slate-100 w-full">
                      <span className="text-[10px] font-extrabold font-mono text-slate-900">${product.price.toFixed(2)}</span>
                      <span className={`text-[8px] font-semibold px-1 rounded-sm ${
                        isLowStock ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'
                      }`}>
                        ស្តុក: {product.count}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Dynamic Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto max-h-[500px] pr-1 pb-4">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl p-12 text-center border border-slate-100/60 flex flex-col items-center justify-center text-slate-300">
              <Search size={40} className="mb-2" />
              <span className="text-xs">មិនរកឃើញទំនិញត្រូវនឹងលក្ខខណ្ឌស្វែងរកឡើយ</span>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const isLowStock = product.count <= product.lowStockThreshold;
              const isOutOfStock = product.count === 0;

              return (
                <div 
                  key={product.id} 
                  id={`pos-prod-${product.id}`}
                  onClick={() => !isOutOfStock && handleAddToCart(product)}
                  className={`bg-white border rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-all ${
                    isOutOfStock 
                      ? 'opacity-60 border-slate-100' 
                      : 'border-slate-100 hover:border-indigo-200 hover:shadow-xs active:scale-98'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Image Thumbnail Container */}
                    <div className="h-28 w-full bg-slate-50 border border-slate-100/60 rounded-xl overflow-hidden relative flex items-center justify-center group shrink-0">
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name} 
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=80&auto=format&fit=crop&q=60';
                          }}
                        />
                      ) : (
                        <div className="text-slate-300 flex flex-col items-center gap-1.5 font-sans">
                          <Package size={22} className="text-slate-200" />
                          <span className="text-[10px] text-slate-400 font-semibold">គ្មានរូបភាព</span>
                        </div>
                      )}
                      
                      {/* Optional category tag overlay inside the image container */}
                      <span className="absolute top-2 left-2 bg-slate-900/70 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-md font-sans">
                        {product.category}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {/* Status and SKU Info Row */}
                      <div className="flex justify-between items-center text-[10px]">
                        {product.sku ? (
                          <span className="text-slate-400 font-mono text-[9px]">
                            SKU: {product.sku}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium font-sans">No SKU</span>
                        )}
                        {isOutOfStock ? (
                          <span className="text-rose-500 bg-rose-50 border border-rose-100 font-bold px-1.5 py-0.5 rounded-sm">
                            អស់ស្តុក
                          </span>
                        ) : isLowStock ? (
                          <span className="text-amber-500 bg-amber-50 border border-amber-100 font-semibold px-1.5 py-0.5 rounded-sm animate-pulse">
                            ស្តុកទាប៖ {product.count}
                          </span>
                        ) : (
                          <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 font-semibold px-1.5 py-0.5 rounded-sm">
                            ស្តុក៖ {product.count}
                          </span>
                        )}
                      </div>

                      {/* Product visual details */}
                      <h3 className="text-xs font-extrabold text-slate-800 line-clamp-2 h-8" title={product.name}>
                        {product.name}
                      </h3>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-50">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 block font-sans">តម្លៃលក់៖</span>
                      <span className="font-extrabold text-slate-900 font-mono text-sm">${product.price.toFixed(2)}</span>
                    </div>
                    
                    <button 
                      disabled={isOutOfStock}
                      className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                        isOutOfStock 
                          ? 'bg-slate-100 text-slate-300' 
                          : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'
                      }`}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT: SHOPPING CART REGISTRY - 1 COLUMN ON DESKTOP */}
      <div id="checkout-cart-container" className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-5 flex flex-col justify-between h-full min-h-[500px]">
        
        {/* Cart items list section */}
        <div className="space-y-4 flex-1 flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <ShoppingCart size={16} className="text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-800">កន្ត្រកទំនិញលក់ (Active Cart)</h3>
            </div>
            <span className="bg-indigo-50 text-indigo-600 font-bold font-mono text-[10px] px-2 py-0.5 rounded-full">
              {cart.reduce((sum, i) => sum + i.quantity, 0)} items
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[280px] flex-1 my-3 pr-1">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-300 py-16">
                <ShoppingCart size={40} className="mb-2 text-slate-200" />
                <span className="text-xs">មិនទាន់មានទំនិញក្នុងកន្ត្រកលក់ទេ</span>
                <p className="text-[10px] text-slate-400 mt-1">សូមចុចលើទំនិញនៅខាងឆ្វេងដើម្បីបន្ថែមលក់</p>
              </div>
            ) : (
              cart.map((item) => (
                <div 
                  key={item.product.id} 
                  className="flex items-center justify-between gap-2.5 p-2.5 border border-slate-50 bg-slate-50/10 rounded-xl hover:bg-slate-50/30 transition-colors"
                >
                  {/* Cart Item Thumbnail image */}
                  <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                    {item.product.imageUrl ? (
                      <img 
                        src={item.product.imageUrl} 
                        alt={item.product.name} 
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=80&auto=format&fit=crop&q=60';
                        }}
                      />
                    ) : (
                      <Package size={14} className="text-slate-300" />
                    )}
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <span className="font-bold text-xs text-slate-800 block truncate" title={item.product.name}>
                      {item.product.name}
                    </span>
                    <span className="text-[10px] font-mono text-indigo-600 font-semibold block">
                      ${item.product.price.toFixed(2)} / ឯកតា
                    </span>
                  </div>

                  {/* Quantity and Actions */}
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center bg-white border border-slate-100 rounded-lg p-1 space-x-1.5 shadow-2xs">
                      <button 
                        onClick={() => handleUpdateQuantity(item.product.id, -1)}
                        className="h-5 w-5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-md flex items-center justify-center cursor-pointer transition-colors"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="text-xs font-bold font-mono text-slate-900 w-4 text-center">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => handleUpdateQuantity(item.product.id, 1)}
                        className="h-5 w-5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-md flex items-center justify-center cursor-pointer transition-colors"
                      >
                        <Plus size={10} />
                      </button>
                    </div>

                    <button 
                      onClick={() => handleRemoveFromCart(item.product.id)}
                      className="p-1 text-slate-300 hover:text-rose-500 rounded-lg cursor-pointer transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Note, breakdowns and checkout execution buttons */}
        <div className="border-t border-slate-100 pt-3 space-y-3 bg-white">
          
          {/* Internal notes */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-400 block">កំណត់សម្គាល់ឯកជន (Private Notes / Customer name):</label>
            <input 
              type="text" 
              placeholder="ឧទាហរណ៍៖ លក់លី ផ្ញើរទៅបាត់ដំបង..."
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-100 rounded-xl bg-slate-50/50 text-slate-700 placeholder:text-slate-300 focus:outline-hidden focus:border-indigo-400 focus:bg-white"
            />
          </div>

          {/* Pricing breakdown summary */}
          <div className="space-y-1.5 text-xs text-slate-500">
            <div className="flex justify-between">
              <span>សរុបផលិតផល (Subtotal):</span>
              <span className="font-mono">${totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-800 border-t border-slate-50 pt-1 text-sm font-bold">
              <span>ទឹកប្រាក់ត្រូវទូទាត់ (Grand Total):</span>
              <span className="font-mono text-indigo-600">${totals.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Action buttons */}
          <button
            onClick={handleInitiateCheckout}
            disabled={cart.length === 0}
            className={`w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
              cart.length === 0 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-md'
            }`}
          >
            <ShoppingCart size={14} />
            <span>កត់ត្រាការលក់ (Confirm Checkout)</span>
          </button>
        </div>

      </div>

      {/* POPUP MODAL: Interactive Cash / KHQR Bakong Payment Gateway */}
      <AnimatePresence>
        {isCheckoutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.18 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden w-full max-w-2xl text-slate-700 font-sans"
            >
              {/* Header of Modal */}
              <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                    <ShoppingCart size={16} className="text-indigo-600" />
                    <span>ជ្រើសរើសវិធីសាស្ត្រទូទាត់ (Select Payment Method)</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-sans">
                    ទឹកប្រាក់សរុបមាន៖ <span className="font-bold text-slate-700 font-mono">${totals.total.toFixed(2)}</span> KHR ត្រូវបង់គឺ ៛{(totals.total * 4100).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="h-7 w-7 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 min-h-[380px]">
                {/* Left panel: Mode select & amount breakdown (5 cols) */}
                <div className="col-span-1 md:col-span-5 bg-slate-50/50 p-5 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-100">
                  <div className="space-y-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">ព័ត៌មានទឹកប្រាក់ (Amount Due)</span>
                    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-3xs space-y-2">
                      <div className="flex justify-between items-center text-xs text-slate-500">
                        <span>សរុប (Total Due)</span>
                        <span className="font-bold font-mono text-slate-800">${totals.total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-50 pb-1.5">
                        <span>ប្រាក់រៀល (~KHR)</span>
                        <span className="font-medium font-mono text-slate-600">៛{(totals.total * 4100).toLocaleString()}</span>
                      </div>
                      <div className="pt-1 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-800">ត្រូវទូទាត់សរុប</span>
                        <span className="text-base font-extrabold text-indigo-600 font-mono">${totals.total.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">វិធីសាស្ត្រទូទាត់ (Payment Modes)</span>
                      <div className="grid grid-cols-1 gap-2">
                        {/* Cash Select */}
                        <button
                          type="button"
                          onClick={() => setActivePaymentMethod('cash')}
                          className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                            activePaymentMethod === 'cash'
                              ? 'bg-indigo-50 border-indigo-200 shadow-3xs'
                              : 'bg-white border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                            activePaymentMethod === 'cash' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                          }`}>
                            <Coins size={16} />
                          </div>
                          <div>
                            <span className="text-xs font-bold block text-slate-800">សាច់ប្រាក់ (Cash)</span>
                            <span className="text-[9px] text-slate-400 block">ទូទាត់លើកសរុបផ្ទាល់</span>
                          </div>
                        </button>

                        {/* KHQR Select */}
                        <button
                          type="button"
                          onClick={() => {
                            setActivePaymentMethod('khqr');
                            setKhqrPaidStatus('waiting');
                            setKhqrTimer(300);
                          }}
                          className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                            activePaymentMethod === 'khqr'
                              ? 'bg-rose-50 border-rose-200 shadow-3xs'
                              : 'bg-white border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                            activePaymentMethod === 'khqr' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-500'
                          }`}>
                            <QrCode size={16} />
                          </div>
                          <div>
                            <span className="text-xs font-bold block text-slate-800">KHQR (បាគង)</span>
                            <span className="text-[9px] text-slate-400 block">ស្កេនគំរូទូទាត់លើទូរស័ព្ទ</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Tagging System Section */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">ស្លាកសម្គាល់នៃការលក់ (Sale Tag)</span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {['In-store', 'Online', 'Wholesale'].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              setSelectedTag(t);
                              setIsCustomTagSelected(false);
                            }}
                            className={`py-1.5 px-0.5 rounded-xl border text-center transition-all cursor-pointer text-[10px] font-bold ${
                              !isCustomTagSelected && selectedTag === t
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-3xs'
                                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800'
                            }`}
                          >
                            {t === 'In-store' ? '🏬 Retail' : t === 'Online' ? '🌐 Online' : '📦 Wholesale'}
                          </button>
                        ))}
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomTagSelected(true);
                            if (selectedTag === 'In-store' || selectedTag === 'Online' || selectedTag === 'Wholesale') {
                              setSelectedTag('');
                            }
                          }}
                          className={`w-full py-1.5 px-3 rounded-xl border text-left transition-all cursor-pointer text-[10px] font-bold flex items-center justify-between ${
                            isCustomTagSelected
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                              : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          <span>✍️ ស្លាកផ្សេងទៀត (Custom Tag)</span>
                          {isCustomTagSelected && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />}
                        </button>
                        {isCustomTagSelected && (
                          <input
                            type="text"
                            placeholder="ឧ. VIP, Gift..."
                            value={selectedTag}
                            onChange={(e) => setSelectedTag(e.target.value)}
                            className="mt-1 w-full px-3 py-1 bg-white border border-indigo-200 rounded-lg text-[10px] focus:outline-hidden focus:border-indigo-400 font-semibold text-slate-700"
                          />
                        )}
                      </div>
                    </div>

                  </div>

                  <div className="pt-4 border-t border-slate-100/40 hidden md:block">
                    <p className="text-[9px] text-slate-400 leading-normal font-light font-sans">
                      * សូមពិនិត្យរក្សាទុកឯកសារទិន្នន័យនៃការលក់នៅក្នុង POS system មុនបោះពុម្ព។
                    </p>
                  </div>
                </div>

                {/* Right panel: Active view */}
                <div className="col-span-1 md:col-span-7 p-6 flex flex-col justify-between">
                  
                  {/* CASH CHANGER COMPONENT */}
                  {activePaymentMethod === 'cash' && (
                    <div className="space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">ប្រព័ន្ធគណនាប្រាក់អាប់ (Cash Calculator)</span>
                        
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 block font-sans">ទឹកប្រាក់ទទួលបានពីអតិថិជន (Received cash in USD):</label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-2 text-xs font-extrabold font-mono text-slate-400">$</span>
                            <input
                              type="number"
                              step="any"
                              placeholder="0.00"
                              value={cashReceived}
                              onChange={(e) => setCashReceived(e.target.value)}
                              className="w-full pl-7 pr-4 py-1.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-mono font-bold focus:outline-hidden focus:border-indigo-400 focus:bg-white text-slate-800"
                              autoFocus
                            />
                          </div>
                        </div>

                        {/* Shortcuts */}
                        <div className="space-y-1">
                          <span className="text-[9px] font-extrabold text-slate-400 font-sans block">ជម្រើសទូទាត់លឿន (Quick USD Shortcuts):</span>
                          <div className="flex flex-wrap gap-1">
                            {[
                              totals.total,
                              Math.ceil(totals.total),
                              Math.ceil(totals.total / 5) * 5,
                              Math.ceil(totals.total / 10) * 10,
                              20, 50, 100
                            ]
                              .filter((v, i, arr) => v >= totals.total && arr.indexOf(v) === i)
                              .slice(0, 5)
                              .map((quickV) => (
                                <button
                                  key={quickV}
                                  type="button"
                                  onClick={() => setCashReceived(quickV.toString())}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-[10px] font-mono font-bold text-slate-700 cursor-pointer transition-all"
                                >
                                  ${quickV.toLocaleString()}
                                </button>
                              ))
                            }
                          </div>
                        </div>

                        {/* Calculated Changes */}
                        {Number(cashReceived) >= totals.total ? (
                          <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 mt-2 space-y-2">
                            <span className="text-[9px] font-extrabold text-emerald-800 uppercase tracking-widest block font-sans">ទឹកប្រាក់ត្រូវអាប់ (Returns to Customer)</span>
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="text-[9px] text-emerald-600 block font-sans">លុយដុល្លារ (USD Change)</span>
                                <span className="text-base font-extrabold font-mono text-emerald-700">${(Number(cashReceived) - totals.total).toFixed(2)}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[9px] text-emerald-600 block font-sans">ជាប្រាក់រៀល (KHR Change @4100)</span>
                                <span className="text-base font-extrabold font-mono text-emerald-600">៛{Math.round((Number(cashReceived) - totals.total) * 4100).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          cashReceived !== '' && (
                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-[10px] text-amber-700 flex items-center gap-2">
                              <AlertCircle size={14} className="shrink-0" />
                              <span>ទឹកប្រាក់មិនទាន់គ្រប់គ្រាន់ឡើយ (Required amount is unpaid).</span>
                            </div>
                          )
                        )}
                      </div>

                      {/* Cash Submit Button */}
                      <button
                        type="button"
                        onClick={() => handleProcessPayment('cash')}
                        disabled={cashReceived !== '' && Number(cashReceived) < totals.total}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          cashReceived !== '' && Number(cashReceived) < totals.total
                            ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md'
                        }`}
                      >
                        <CheckCircle size={14} />
                        <span>កត់ត្រាការទូទាត់សាច់ប្រាក់ (Confirm cash checkout)</span>
                      </button>
                    </div>
                  )}

                  {/* KHQR MOBILE PAYMENT COMPONENT */}
                  {activePaymentMethod === 'khqr' && (
                    <div className="space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-3.5 flex-1 flex flex-col justify-start">
                        
                        {/* Premium Khmer KHQR board design template with Crimson and Waves */}
                        <div className="bg-red-700 text-white rounded-2xl p-4 shadow-md leading-normal space-y-3 relative overflow-hidden select-none border border-red-800">
                          
                          <div className="absolute right-0 bottom-0 opacity-8 pointer-events-none transform translate-y-1/3 translate-x-1/3">
                            <QrCode size={160} />
                          </div>

                          <div className="flex justify-between items-center border-b border-white/20 pb-2">
                            <span className="font-extrabold text-[10px] tracking-wider font-sans">សេវាផ្ទេរប្រាក់រហ័ស (KHQR MERCHANT BIL)</span>
                            <span className="bg-white text-red-700 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest font-sans">BAKONG</span>
                          </div>

                          <div className="flex gap-4 items-center">
                            {/* Standard square block */}
                            <div className="h-28 w-28 bg-white rounded-xl p-1.5 flex items-center justify-center border border-red-900 shrink-0 relative">
                              <svg viewBox="0 0 100 100" className="h-full w-full">
                                <rect x="0" y="0" width="28" height="28" fill="#1e293b" />
                                <rect x="4" y="4" width="20" height="20" fill="#fff" />
                                <rect x="8" y="8" width="12" height="12" fill="#1e293b" />

                                <rect x="72" y="0" width="28" height="28" fill="#1e293b" />
                                <rect x="76" y="4" width="20" height="20" fill="#fff" />
                                <rect x="80" y="8" width="12" height="12" fill="#1e293b" />

                                <rect x="0" y="72" width="28" height="28" fill="#1e293b" />
                                <rect x="4" y="76" width="20" height="20" fill="#fff" />
                                <rect x="8" y="80" width="12" height="12" fill="#1e293b" />

                                {/* Middle logo overlay red container */}
                                <rect x="40" y="40" width="20" height="20" rx="5" fill="#DC2626" />
                                <circle cx="50" cy="50" r="4" fill="#FFF" />

                                {/* Interactive random scanning pixels dots */}
                                <rect x="35" y="10" width="6" height="6" fill="#1e293b" />
                                <rect x="50" y="15" width="4" height="4" fill="#000" />
                                <rect x="58" y="5" width="8" height="4" fill="#1e293b" />
                                <rect x="35" y="52" width="4" height="4" fill="#000" />
                                <rect x="65" y="52" width="6" height="4" fill="#1e293b" />
                                <rect x="44" y="30" width="8" height="4" fill="#000" />
                                <rect x="85" y="45" width="4" height="4" fill="#1e293b" />
                                <rect x="15" y="45" width="4" height="6" fill="#000" />
                                <rect x="45" y="75" width="6" height="4" fill="#1e293b" />
                                <rect x="80" y="80" width="4" height="4" fill="#000" />
                                <rect x="35" y="85" width="8" height="4" fill="#1e293b" />
                              </svg>

                              {khqrPaidStatus === 'verified' && (
                                <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-2 rounded-xl text-center">
                                  <CheckCircle size={32} className="text-emerald-500 fill-emerald-505" />
                                  <span className="text-[9px] font-black text-emerald-600 uppercase mt-1">Paid Success</span>
                                </div>
                              )}
                            </div>

                            {/* Ticket detail values */}
                            <div className="space-y-1 text-white font-sans min-w-0 flex-1">
                              <span className="text-[9px] text-red-200 block font-light uppercase tracking-wider">Merchant Store</span>
                              <span className="font-extrabold text-[12px] block truncate leading-tight">ខ្មែរ ម៉ាត (KHMER MART)</span>
                              
                              <span className="text-[9px] text-red-200 block pt-1 font-light uppercase tracking-wider">Account Number / Bill ID</span>
                              <span className="font-mono text-[10px] block font-bold text-red-100">BAKONG-ID-{(totals.total * 99).toFixed(0)}</span>

                              <span className="text-[9px] text-red-200 block pt-1 font-light uppercase tracking-wider">Total Amount due</span>
                              <span className="text-base font-extrabold font-mono text-amber-300 block">${totals.total.toFixed(2)} USD</span>
                            </div>
                          </div>

                          {/* Countdown timer footer */}
                          <div className="flex justify-between items-center text-[10px] bg-red-800/50 rounded-xl px-3 py-1.5 border border-red-600/20 font-sans">
                            <span className="font-medium">ស្កេនទូទាត់ជាមួយទូរស័ព្ទរបស់អ្នក</span>
                            <div className="flex items-center gap-1 font-mono font-bold text-amber-300">
                              <Clock size={11} />
                              <span>{Math.floor(khqrTimer / 60)}:{(khqrTimer % 60).toString().padStart(2, '0')}</span>
                            </div>
                          </div>
                        </div>

                        {/* Scan Simulator controls box */}
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 space-y-1.5 select-none">
                          <span className="text-[9px] font-extrabold text-slate-400 block uppercase tracking-wider font-sans">តេស្តការទូទាត់ភ្លាមៗ (Virtual Scan Callback)</span>
                          
                          {khqrPaidStatus === 'waiting' && (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium font-sans">
                                <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping inline-block" />
                                <span>កំពុងរង់ចាំអតិថិជនស្កេនពីកម្មវិធីទូរស័ព្ទ...</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => setKhqrPaidStatus('verified')}
                                  className="py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-150 text-emerald-700 font-bold text-[10px] rounded-lg cursor-pointer transition-colors text-center"
                                >
                                  ស្កេនជោគជ័យ (Scan Success)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setKhqrPaidStatus('failed')}
                                  className="py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-150 text-rose-700 font-bold text-[10px] rounded-lg cursor-pointer transition-colors text-center"
                                >
                                  ស្កេនបរាជ័យ (Scan Reject)
                                </button>
                              </div>
                            </div>
                          )}

                          {khqrPaidStatus === 'verified' && (
                            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 font-sans">
                              <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                              <span>ការផ្ទេរប្រាក់បានត្រូវផ្ទៀងផ្ទាត់ដោយជោគជ័យ!</span>
                            </div>
                          )}

                          {khqrPaidStatus === 'failed' && (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 text-xs font-semibold text-rose-800 font-sans">
                                <AlertCircle size={16} className="text-rose-500 shrink-0" />
                                <span>ការទូទាត់មិនបានជោគជ័យ ឬពេលវេលាបានផុតកំណត់។</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setKhqrPaidStatus('waiting');
                                  setKhqrTimer(300);
                                }}
                                className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer bg-transparent border-0"
                              >
                                បង្កើតកូដទូទាត់ឡើងវិញ (Re-generate KHQR)
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* KHQR Process payment execution trigger */}
                      <button
                        type="button"
                        onClick={() => handleProcessPayment('khqr')}
                        disabled={khqrPaidStatus !== 'verified'}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          khqrPaidStatus !== 'verified'
                            ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                            : 'bg-rose-600 text-white hover:bg-rose-700 hover:shadow-md'
                        }`}
                      >
                        <CheckCircle size={14} />
                        <span>កត់ត្រាការលក់តាម KHQR (Verify & Process billing)</span>
                      </button>
                    </div>
                  )}

                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
