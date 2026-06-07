/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, Sale, Expense } from './types';

export const PRODUCT_CATEGORIES = [
  'សំលៀកបំពាក់',         // Clothing
  'គ្រឿងទេស',            // Spices / Cooking
  'ភេសជ្ជៈ',              // Beverages
  'អាហារសុខភាព',         // Health Foods
  'គ្រឿងអេឡិចត្រូនិក'      // Electronics
];

export const EXPENSE_CATEGORIES = [
  'Supplies / ការវេចខ្ចប់ និងការផ្គត់ផ្គង់',
  'Rent / ថ្លៃជួលទីតាំង',
  'Marketing / ការផ្សព្វផ្សាយ',
  'Delivery / ការដឹកជញ្ជូន',
  'Utilities / ទឹកភ្លើងនិងសេវាកម្ម',
  'Others / ផ្សេងៗ'
];

// Seed initial products (some have low stock to trigger alarms)
export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'ក្រមាខ្មែរដៃប្រណីត (Khmer Premium Krama)',
    cost: 5.50,
    price: 12.00,
    count: 32,
    lowStockThreshold: 10,
    category: 'សំលៀកបំពាក់',
    sku: 'KM-KRAMA-01',
    imageUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&auto=format&fit=crop&q=60'
  },
  {
    id: 'prod-2',
    name: 'ម្រេចកំពតសរីរាង្គ (Organic Kampot Pepper - 150g)',
    cost: 4.00,
    price: 8.50,
    count: 3, // Low stock!
    lowStockThreshold: 5,
    category: 'គ្រឿងទេស',
    sku: 'KM-PEPPER-02',
    imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&auto=format&fit=crop&q=60'
  },
  {
    id: 'prod-3',
    name: 'កាហ្វេម៉នឌូលគិរីលីង (Mondulkiri Roasted Coffee - 250g)',
    cost: 6.00,
    price: 11.00,
    count: 24,
    lowStockThreshold: 8,
    category: 'ភេសជ្ជៈ',
    sku: 'KM-COFFEE-03',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=60'
  },
  {
    id: 'prod-4',
    name: 'ទឹកឃ្មុំព្រៃធម្មជាតិ (Wild Forest Honey - 500ml)',
    cost: 12.00,
    price: 25.00,
    count: 2, // Low stock!
    lowStockThreshold: 5,
    category: 'អាហារសុខភាព',
    sku: 'KM-HONEY-04',
    imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&auto=format&fit=crop&q=60'
  },
  {
    id: 'prod-5',
    name: 'តែសរីរាង្គផ្កាម្លិះ (Premium Organic Jasmine Tea - 100g)',
    cost: 3.50,
    price: 7.90,
    count: 18,
    lowStockThreshold: 6,
    category: 'ភេសជ្ជៈ',
    sku: 'KM-TEA-05',
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=60'
  },
  {
    id: 'prod-6',
    name: 'កាបូបយួរស្ពាយចរបាប់ដៃ (Handmade Silk Shoulder Bag)',
    cost: 15.00,
    price: 35.00,
    count: 8,
    lowStockThreshold: 3,
    category: 'សំលៀកបំពាក់',
    sku: 'KM-BAG-06',
    imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&auto=format&fit=crop&q=60'
  }
];

// Realistic Sales History spread across May and June 2026
export const INITIAL_SALES: Sale[] = [
  {
    id: 'sale-1',
    timestamp: '2026-05-10T11:30:00Z',
    items: [
      { productId: 'prod-1', name: 'ក្រមាខ្មែរដៃប្រណីត (Khmer Premium Krama)', price: 12.00, cost: 5.50, quantity: 2 },
      { productId: 'prod-3', name: 'កាហ្វេម៉នឌូលគិរីលីង (Mondulkiri Roasted Coffee - 250g)', price: 11.00, cost: 6.00, quantity: 1 }
    ],
    total: 35.00,
    note: 'ការលក់ជូនអតិថិជនដំបូង'
  },
  {
    id: 'sale-2',
    timestamp: '2026-05-15T15:20:00Z',
    items: [
      { productId: 'prod-2', name: 'ម្រេចកំពតសរីរាង្គ (Organic Kampot Pepper - 150g)', price: 8.50, cost: 4.00, quantity: 4 },
      { productId: 'prod-4', name: 'ទឹកឃ្មុំព្រៃធម្មជាតិ (Wild Forest Honey - 500ml)', price: 25.00, cost: 12.00, quantity: 1 }
    ],
    total: 59.00,
    note: 'ផ្ញើទៅភ្នំពេញ'
  },
  {
    id: 'sale-3',
    timestamp: '2026-05-22T09:15:00Z',
    items: [
      { productId: 'prod-5', name: 'តែសរីរាង្គផ្កាម្លិះ (Premium Organic Jasmine Tea - 100g)', price: 7.90, cost: 3.50, quantity: 3 },
      { productId: 'prod-6', name: 'កាបូបយួរស្ពាយចរបាប់ដៃ (Handmade Silk Shoulder Bag)', price: 35.00, cost: 15.00, quantity: 1 }
    ],
    total: 58.70,
    note: ''
  },
  {
    id: 'sale-4',
    timestamp: '2026-05-28T16:45:00Z',
    items: [
      { productId: 'prod-1', name: 'ក្រមាខ្មែរដៃប្រណីត (Khmer Premium Krama)', price: 12.00, cost: 5.50, quantity: 5 }
    ],
    total: 60.00,
    note: 'ទិញធ្វើជាកាដូទៅបរទេស'
  },
  {
    id: 'sale-5',
    timestamp: '2026-06-01T10:10:00Z',
    items: [
      { productId: 'prod-3', name: 'កាហ្វេម៉នឌូលគិរីលីង (Mondulkiri Roasted Coffee - 250g)', price: 11.00, cost: 6.00, quantity: 3 },
      { productId: 'prod-5', name: 'តែសរីរាង្គផ្កាម្លិះ (Premium Organic Jasmine Tea - 100g)', price: 7.90, cost: 3.50, quantity: 2 }
    ],
    total: 48.80,
    note: 'អតិថិជនប្រចាំរឿង'
  },
  {
    id: 'sale-6',
    timestamp: '2026-06-03T14:30:00Z',
    items: [
      { productId: 'prod-1', name: 'ក្រមាខ្មែរដៃប្រណីត (Khmer Premium Krama)', price: 12.00, cost: 5.50, quantity: 1 },
      { productId: 'prod-4', name: 'ទឹកឃ្មុំព្រៃធម្មជាតិ (Wild Forest Honey - 500ml)', price: 25.00, cost: 12.00, quantity: 2 },
      { productId: 'prod-6', name: 'កាបូបយួរស្ពាយចរបាប់ដៃ (Handmade Silk Shoulder Bag)', price: 35.00, cost: 15.00, quantity: 1 }
    ],
    total: 97.00,
    note: 'ការលក់ធំ'
  },
  {
    id: 'sale-7',
    timestamp: '2026-06-05T17:00:00Z',
    items: [
      { productId: 'prod-2', name: 'ម្រេចកំពតសរីរាង្គ (Organic Kampot Pepper - 150g)', price: 8.50, cost: 4.00, quantity: 3 }
    ],
    total: 25.50,
    note: ''
  },
  {
    id: 'sale-8',
    timestamp: '2026-06-06T11:40:00Z',
    items: [
      { productId: 'prod-3', name: 'កាហ្វេម៉នឌូលគិរីលីង (Mondulkiri Roasted Coffee - 250g)', price: 11.00, cost: 6.00, quantity: 2 },
      { productId: 'prod-5', name: 'តែសរីរាង្គផ្កាម្លិះ (Premium Organic Jasmine Tea - 100g)', price: 7.90, cost: 3.50, quantity: 1 }
    ],
    total: 29.90,
    note: 'ទូទាត់តាមទូរស័ព្ទ'
  }
];

// Realistic Expense logs for May and June 2026
export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    title: 'ការផ្សព្វផ្សាយលើហ្វេសប៊ុក (Facebook Ads)',
    amount: 15.00,
    category: 'Marketing / ការផ្សព្វផ្សាយ',
    date: '2026-05-05',
    note: 'ម៉ាឃីតធីងសាកល្បង'
  },
  {
    id: 'exp-2',
    title: 'ប្រអប់កាតុងក្រាស់និងស្កុត (Boxes & Tapes)',
    amount: 12.50,
    category: 'Supplies / ការវេចខ្ចប់ និងការផ្គត់ផ្គង់',
    date: '2026-05-12',
    note: 'ទិញពីផ្សារធំថ្មី'
  },
  {
    id: 'exp-3',
    title: 'សេវាដឹកជញ្ជូនរហ័ស (Express Delivery Fees)',
    amount: 8.00,
    category: 'Delivery / ការដឹកជញ្ជូន',
    date: '2026-05-16',
    note: 'ផ្ញើទំនិញ៣កញ្ចប់'
  },
  {
    id: 'exp-4',
    title: 'ជួលតូបលក់ផ្ទាល់ខ្លួន (Shop Rent Share)',
    amount: 50.00,
    category: 'Rent / ថ្លៃជួលទីតាំង',
    date: '2026-05-30',
    note: 'ចំណែកជួលតូបប្រចាំខែឧសភា'
  },
  {
    id: 'exp-5',
    title: 'រត់ការ Ads ដើមខែ៦ (Facebook Boost)',
    amount: 20.00,
    category: 'Marketing / ការផ្សព្វផ្សាយ',
    date: '2026-06-02',
    note: 'ផ្សព្វផ្សាយកាដូក្រមា'
  },
  {
    id: 'exp-6',
    title: 'ទិញសម្ភារៈខ្ចប់បន្ថែម (Bubble Wraps)',
    amount: 6.50,
    category: 'Supplies / ការវេចខ្ចប់ និងការផ្គត់ផ្គង់',
    date: '2026-06-04',
    note: 'ការពារដបទឹកឃ្មុំពេលដឹក'
  }
];
