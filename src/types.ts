/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  name: string;
  cost: number;
  price: number;
  count: number;
  lowStockThreshold: number;
  category: string;
  sku?: string;
  imageUrl?: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  price: number;
  cost: number; // Stored at purchase time to calculate exact profit
  quantity: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  total: number;
  timestamp: string; // ISO date string
  note?: string;
  paymentMethod?: 'cash' | 'khqr';
  tag?: 'In-store' | 'Online' | 'Wholesale' | string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  note?: string;
}

export interface SystemNotification {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'info';
  message: string;
  productId?: string;
  timestamp: string;
  resolved: boolean;
}
