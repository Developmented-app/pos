/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { PRODUCT_CATEGORIES } from '../data';
import { 
  Plus, 
  Minus, 
  Search, 
  Edit3, 
  Trash2, 
  Package, 
  AlertTriangle,
  Layers,
  ArrowUpDown,
  Tag,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InventoryProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
}

export default function Inventory({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct
}: InventoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ទាំងអស់');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  
  // Modals / Drawer State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [cost, setCost] = useState(0);
  const [price, setPrice] = useState(0);
  const [count, setCount] = useState(0);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [category, setCategory] = useState(PRODUCT_CATEGORIES[0]);
  const [imageUrl, setImageUrl] = useState('');

  // Handle opening form for Create
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setName('');
    setSku('');
    setCost(0);
    setPrice(0);
    setCount(0);
    setLowStockThreshold(5);
    setCategory(PRODUCT_CATEGORIES[0]);
    setImageUrl('');
    setIsFormOpen(true);
  };

  // Handle opening form for Edit
  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setSku(product.sku || '');
    setCost(product.cost);
    setPrice(product.price);
    setCount(product.count);
    setLowStockThreshold(product.lowStockThreshold);
    setCategory(product.category);
    setImageUrl(product.imageUrl || '');
    setIsFormOpen(true);
  };

  // Quick stock adjuster
  const handleQuickAdjustStock = (product: Product, amount: number) => {
    const updatedCount = Math.max(0, product.count + amount);
    onUpdateProduct({
      ...product,
      count: updatedCount
    });
  };

  // Delete product wrapper
  const handleDelete = (id: string, productName: string) => {
    if (confirm(`តើអ្នកពិតជាចង់លុបទំនិញ "${productName}" នេះចេញពីស្តុកមែនទេ?`)) {
      onDeleteProduct(id);
    }
  };

  // Handle submitting form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingProduct) {
      onUpdateProduct({
        id: editingProduct.id,
        name: name.trim(),
        sku: sku.trim() || undefined,
        cost: Number(cost),
        price: Number(price),
        count: Number(count),
        lowStockThreshold: Number(lowStockThreshold),
        category,
        imageUrl: imageUrl.trim() || undefined
      });
    } else {
      onAddProduct({
        name: name.trim(),
        sku: sku.trim() || undefined,
        cost: Number(cost),
        price: Number(price),
        count: Number(count),
        lowStockThreshold: Number(lowStockThreshold),
        category,
        imageUrl: imageUrl.trim() || undefined
      });
    }

    setIsFormOpen(false);
  };

  // Filter products list
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = categoryFilter === 'ទាំងអស់' || product.category === categoryFilter;
      
      let matchesStock = true;
      if (stockFilter === 'low') {
        matchesStock = product.count <= product.lowStockThreshold && product.count > 0;
      } else if (stockFilter === 'out') {
        matchesStock = product.count === 0;
      }

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchTerm, categoryFilter, stockFilter]);

  return (
    <div className="space-y-6">
      
      {/* 1. Inventory controls and headers */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800">គ្រប់គ្រងស្តុកទំនិញ (Inventory & Stock Ledger)</h2>
          <p className="text-[11px] text-slate-400">កំណត់បរិមាណស្តុក ដាក់តម្លៃលក់ តម្លៃដើម និងចំណុចកំណត់ជូនដំណឹង</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors shadow-xs"
        >
          <Plus size={15} />
          <span>+ បញ្ចូលទំនិញថ្មី</span>
        </button>
      </div>

      {/* 2. Visual Filtering Panel */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-3xs space-y-4">
        
        {/* Row 1: Search and Category Filter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-3.5 text-slate-400" size={15} />
            <input 
              type="text"
              placeholder="ស្វែងរកតាមឈ្មោះផលិតផល ឬលេខកូដ SKU (Search by product name or SKU)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:outline-hidden focus:border-indigo-400 focus:bg-white text-slate-700 font-medium"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:outline-hidden focus:border-indigo-400 focus:bg-white text-slate-700 font-medium cursor-pointer"
            >
              <option value="ទាំងអស់">គ្រប់ប្រភេទផលិតផល (All-Categories)</option>
              {PRODUCT_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Row 2: Stock Level Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-50 pt-3 select-none">
          <button 
            onClick={() => setStockFilter('all')}
            className={`text-slate-600 text-xs px-3.5 py-1.5 rounded-lg border cursor-pointer font-medium transition-colors ${
              stockFilter === 'all' 
                ? 'bg-slate-100 border-slate-200 text-slate-900 font-semibold' 
                : 'border-slate-100/60 bg-white hover:bg-slate-50'
            }`}
          >
            កាតូរីទាំងអស់ ({products.length})
          </button>
          
          <button 
            onClick={() => setStockFilter('low')}
            className={`text-xs px-3.5 py-1.5 rounded-lg border cursor-pointer font-medium transition-all flex items-center gap-1.5 ${
              stockFilter === 'low' 
                ? 'bg-amber-50 border-amber-200 text-amber-700 font-bold' 
                : 'border-slate-100/60 bg-white hover:bg-slate-50 text-slate-500'
            }`}
          >
            {/* Low stock calculation */}
            <AlertTriangle size={12} className={stockFilter === 'low' ? 'text-amber-500' : ''} />
            <span>ស្តុកទាប ({products.filter(p => p.count <= p.lowStockThreshold && p.count > 0).length})</span>
          </button>

          <button 
            onClick={() => setStockFilter('out')}
            className={`text-xs px-3.5 py-1.5 rounded-lg border cursor-pointer font-medium transition-all flex items-center gap-1.5 ${
              stockFilter === 'out' 
                ? 'bg-rose-50 border-rose-200 text-rose-700 font-bold' 
                : 'border-slate-100/60 bg-white hover:bg-slate-50 text-slate-500'
            }`}
          >
            <Package size={12} className={stockFilter === 'out' ? 'text-rose-500' : ''} />
            <span>អស់ពីស្តុក ({products.filter(p => p.count === 0).length})</span>
          </button>
        </div>

      </div>

      {/* 3. Products List Tables & Cards */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-3xs overflow-hidden">
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-400">
              <tr>
                <th className="py-3 px-4 font-bold text-[10px] uppercase">ឈ្មោះទំនិញគ្របដណ្ដប់</th>
                <th className="py-3 px-4 font-bold text-[10px] uppercase">ប្រភេទ</th>
                <th className="py-3 px-4 font-bold text-[10px] uppercase">តម្លៃដើម (Cost)</th>
                <th className="py-3 px-4 font-bold text-[10px] uppercase">តម្លៃលក់ (Price)</th>
                <th className="py-3 px-4 font-bold text-[10px] uppercase">កម្រិតស្តុកជិតអស់</th>
                <th className="py-3 px-4 font-bold text-[10px] uppercase text-center">ស្តុកបច្ចុប្បន្ន</th>
                <th className="py-3 px-4 font-bold text-[10px] uppercase text-right">សកម្មភាព</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-300">
                    <Package size={36} className="mx-auto mb-1.5 text-slate-200" />
                    <span>មិនមានផលិតផលត្រូវតាមលក្ខខណ្ឌចម្រោះឡើយ</span>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isLow = product.count <= product.lowStockThreshold && product.count > 0;
                  const isOut = product.count === 0;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
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
                              <Package size={18} className="text-slate-300" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block">{product.name}</span>
                            {product.sku && (
                              <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-slate-400 font-mono">
                                SKU: <span className="bg-slate-100 px-1.5 py-0.2 rounded-md text-slate-600 font-medium">{product.sku}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      <td className="py-3.5 px-4">
                        <span className="bg-indigo-50/60 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-sm font-medium">
                          {product.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        ${product.cost.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        ${product.price.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {product.lowStockThreshold} មុខ
                      </td>

                      {/* Stock Visuals and Quick Increments */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button 
                            onClick={() => handleQuickAdjustStock(product, -1)}
                            className="h-6 w-6 text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-md flex items-center justify-center cursor-pointer"
                            title="-1 references"
                          >
                            <Minus size={11} />
                          </button>
                          
                          <span className={`w-14 text-center font-bold font-mono py-0.5 rounded-sm inline-block ${
                            isOut 
                              ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                              : isLow 
                                ? 'bg-amber-50 text-amber-600 border border-amber-100 animate-pulse' 
                                : 'text-slate-800'
                          }`}>
                            {product.count}
                          </span>

                          <button 
                            onClick={() => handleQuickAdjustStock(product, 5)}
                            className="h-6 w-6 text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-md flex items-center justify-center cursor-pointer text-[10px]"
                            title="+5 references"
                          >
                            +5
                          </button>
                        </div>
                      </td>

                      {/* Standard Controls */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => handleOpenEdit(product)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button 
                            onClick={() => handleDelete(product.id, product.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* 4. Form Dialogue / Modal Screen Overlay */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden border border-slate-100"
            >
              
              {/* Overlay header */}
              <div className="bg-slate-50 border-b border-indigo-50/50 p-5 flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Package size={16} className="text-indigo-600" />
                  <span>{editingProduct ? 'កែប្រែព័ត៌មានទំនិញ' : 'បន្ថែមទំនិញថ្មីចូលស្តុក'}</span>
                </h3>
                <button 
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer text-xs font-semibold font-mono"
                >
                  [បិទ]
                </button>
              </div>

              {/* Form implementation */}
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 block">ឈ្មោះផលិតផល (Product Name):</label>
                  <input 
                    type="text" 
                    required
                    placeholder="ឧទាហរណ៍៖ កាហ្វេទឹកឃ្មុំម៉នឌូលគិរី..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 border border-slate-100 rounded-xl bg-slate-50 placeholder:text-slate-300 focus:outline-hidden focus:border-indigo-400 focus:bg-white text-slate-700 font-medium"
                  />
                </div>

                {/* SKU Code */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 block flex justify-between items-center">
                    <span>លេខកូដទំនិញ (SKU / Barcode): (ជម្រើស)</span>
                    <button
                      type="button"
                      onClick={() => {
                        const randomSku = 'KM-' + Math.random().toString(36).substring(2, 7).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);
                        setSku(randomSku);
                      }}
                      className="text-[9px] text-indigo-600 hover:text-indigo-800 font-semibold underline bg-transparent border-0 cursor-pointer"
                    >
                      បង្កើតលេខកូដស្វ័យប្រវត្ត (Auto Gen)
                    </button>
                  </label>
                  <input 
                    type="text" 
                    placeholder="ឧទាហរណ៍៖ KM-COFFEE-01"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 border border-slate-100 rounded-xl bg-slate-50 placeholder:text-slate-300 focus:outline-hidden focus:border-indigo-400 focus:bg-white text-slate-700 font-mono font-medium"
                  />
                </div>

                {/* Category Selection */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 block">ប្រភេទផលិតផល (Category):</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-100 rounded-xl bg-slate-50 text-xs focus:outline-hidden focus:border-indigo-400 focus:bg-white text-slate-700 font-medium cursor-pointer"
                  >
                    {PRODUCT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Product Image URL Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 block flex justify-between items-center">
                    <span>រូបភាពផលិតផល (Product Image URL): (ជម្រើស)</span>
                    <button
                      type="button"
                      onClick={() => {
                        const randomId = Math.floor(100 + Math.random() * 900);
                        let kw = 'product';
                        if (category === 'សំលៀកបំពាក់') kw = 'clothing,apparel';
                        else if (category === 'គ្រឿងទេស') kw = 'spices,pepper';
                        else if (category === 'ភេសជ្ជៈ') kw = 'coffee,tea,beverage';
                        else if (category === 'អាហារសុខភាព') kw = 'honey,organic';
                        else if (category === 'គ្រឿងអេឡិចត្រូនិក') kw = 'gadget,electronics';
                        setImageUrl(`https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&auto=format&fit=crop&q=60&sig=${randomId}&q=${kw}`);
                      }}
                      className="text-[9px] text-indigo-600 hover:text-indigo-800 font-semibold underline bg-transparent border-0 cursor-pointer"
                    >
                      ទាញយករូបសាកល្បងពី Unsplash (Auto Sample)
                    </button>
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="ឧទាហរណ៍៖ https://images.unsplash.com/... (URL)"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="flex-1 text-xs px-3.5 py-2 border border-slate-100 rounded-xl bg-slate-50 placeholder:text-slate-300 focus:outline-hidden focus:border-indigo-400 focus:bg-white text-slate-700 font-mono font-medium"
                    />
                    {imageUrl && (
                      <div className="h-9 w-9 border border-slate-200 rounded-xl overflow-hidden shrink-0 bg-slate-50">
                        <img 
                          src={imageUrl} 
                          alt="Preview" 
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=80&auto=format&fit=crop&q=60';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Costs & Prices */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block flex items-center gap-1">
                      <DollarSign size={10} />
                      <span>តម្លៃដើម (Unit Cost - USD):</span>
                    </label>
                    <input 
                      type="number" 
                      step="0.01"
                      min="0"
                      required
                      placeholder="5.50"
                      value={cost || ''}
                      onChange={(e) => setCost(Number(e.target.value))}
                      className="w-full text-xs px-3.5 py-2 border border-slate-100 rounded-xl bg-slate-50 text-slate-700 font-mono focus:outline-hidden focus:border-indigo-400 focus:bg-white font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block flex items-center gap-1">
                      <DollarSign size={10} />
                      <span>តម្លៃលក់ (Unit Price - USD):</span>
                    </label>
                    <input 
                      type="number" 
                      step="0.01"
                      min="0"
                      required
                      placeholder="12.00"
                      value={price || ''}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full text-xs px-3.5 py-2 border border-slate-100 rounded-xl bg-slate-50 text-slate-700 font-mono focus:outline-hidden focus:border-indigo-400 focus:bg-white font-medium"
                    />
                  </div>
                </div>

                {/* Stock Counts & Alert Limit */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block">ចំនួនបច្ចុប្បន្ន (Initial Stock):</label>
                    <input 
                      type="number" 
                      min="0"
                      required
                      placeholder="50"
                      value={count}
                      onChange={(e) => setCount(Number(e.target.value))}
                      className="w-full text-xs px-3.5 py-2 border border-slate-100 rounded-xl bg-slate-50 text-slate-700 font-mono focus:outline-hidden focus:border-indigo-400 focus:bg-white font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block flex items-center gap-1">
                      <AlertTriangle size={10} className="text-amber-500" />
                      <span>កំណត់ស្តុកទាប (Low Stock Limit):</span>
                    </label>
                    <input 
                      type="number" 
                      min="1"
                      required
                      placeholder="5"
                      value={lowStockThreshold}
                      onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                      className="w-full text-xs px-3.5 py-2 border border-slate-100 rounded-xl bg-slate-50 text-slate-700 font-mono focus:outline-hidden focus:border-indigo-400 focus:bg-white font-medium"
                    />
                  </div>
                </div>

                {/* Action submit buttons */}
                <div className="flex space-x-3 pt-3 border-t border-slate-50">
                  <button 
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-xl cursor-pointer transition-colors"
                  >
                    បោះបង់ (Cancel)
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl cursor-pointer transition-colors shadow-xs"
                  >
                    រក្សាទុក (Save Product)
                  </button>
                </div>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
