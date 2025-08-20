'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { Button, Card, Input, Select } from '@/components/ui';
import { stockTransactionsApi } from '@/services/api';
import { StockTransaction } from '@/types/inventory';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterItemType, setFilterItemType] = useState('');
  const [formData, setFormData] = useState({
    itemId: 0,
    itemType: '',
    transactionType: '',
    quantity: 0,
    unit: '',
    reference: '',
    notes: ''
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Try to fetch real data from backend
      try {
        const response = await stockTransactionsApi.getAll({
          type: filterType || undefined,
          // Additional filters can be added here
        });
        if (response.data.success) {
          setTransactions(response.data.data);
          console.log('Successfully loaded transactions from backend');
          return;
        }
      } catch (apiError) {
        console.warn('Backend API not available, using mock data:', apiError);
      }
      
      // Fallback to mock transaction data
      const mockTransactions: StockTransaction[] = [
        {
          id: 1,
          itemId: 1,
          itemType: 'RAW_MATERIAL',
          transactionType: 'IN',
          quantity: 500,
          unit: 'kg',
          reference: 'PO-2025-001',
          notes: 'Initial stock - Phthalic Anhydride from PT Chemicals Indonesia',
          userId: 1,
          user: { id: 1, username: 'admin', name: 'Administrator', role: 'ADMIN', isActive: true },
          createdAt: new Date('2025-01-15T08:30:00')
        },
        {
          id: 2,
          itemId: 2,
          itemType: 'RAW_MATERIAL',
          transactionType: 'IN',
          quantity: 300,
          unit: 'liter',
          reference: 'PO-2025-002',
          notes: 'Initial stock - 2-Ethylhexanol delivery',
          userId: 1,
          user: { id: 1, username: 'admin', name: 'Administrator', role: 'ADMIN', isActive: true },
          createdAt: new Date('2025-01-16T10:15:00')
        },
        {
          id: 3,
          itemId: 1,
          itemType: 'FINISHED_PRODUCT',
          transactionType: 'IN',
          quantity: 20,
          unit: 'drum',
          reference: 'PROD-2025-001',
          notes: 'Production batch #001 - DOP manufacturing completed',
          userId: 1,
          user: { id: 1, username: 'admin', name: 'Administrator', role: 'ADMIN', isActive: true },
          createdAt: new Date('2025-01-17T14:45:00')
        },
        {
          id: 4,
          itemId: 1,
          itemType: 'RAW_MATERIAL',
          transactionType: 'OUT',
          quantity: 200,
          unit: 'kg',
          reference: 'PROD-2025-001',
          notes: 'Used for DOP production - Batch #001',
          userId: 1,
          user: { id: 1, username: 'admin', name: 'Administrator', role: 'ADMIN', isActive: true },
          createdAt: new Date('2025-01-17T09:00:00')
        },
        {
          id: 5,
          itemId: 1,
          itemType: 'FINISHED_PRODUCT',
          transactionType: 'OUT',
          quantity: 5,
          unit: 'drum',
          reference: 'SO-2025-001',
          notes: 'Sales shipment to PT ABC Chemical',
          userId: 1,
          user: { id: 1, username: 'admin', name: 'Administrator', role: 'ADMIN', isActive: true },
          createdAt: new Date('2025-01-18T11:30:00')
        },
        {
          id: 6,
          itemId: 2,
          itemType: 'FINISHED_PRODUCT',
          transactionType: 'IN',
          quantity: 15,
          unit: 'drum',
          reference: 'PROD-2025-002',
          notes: 'Production batch #002 - DINP manufacturing',
          userId: 1,
          user: { id: 1, username: 'admin', name: 'Administrator', role: 'ADMIN', isActive: true },
          createdAt: new Date('2025-01-19T16:20:00')
        }
      ];

      let filteredTransactions = mockTransactions;

      if (filterType) {
        filteredTransactions = filteredTransactions.filter(t => t.transactionType === filterType);
      }

      if (filterItemType) {
        filteredTransactions = filteredTransactions.filter(t => t.itemType === filterItemType);
      }

      setTransactions(filteredTransactions);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterItemType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Create transaction:', formData);
      
      setShowAddForm(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to save transaction:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      itemId: 0,
      itemType: '',
      transactionType: '',
      quantity: 0,
      unit: '',
      reference: '',
      notes: ''
    });
  };

  const getItemName = (itemId: number, itemType: string) => {
    // Mock item names
    const rawMaterials: { [key: number]: string } = {
      1: 'Phthalic Anhydride',
      2: '2-Ethylhexanol',
      3: 'Isononyl Alcohol'
    };
    
    const finishedProducts: { [key: number]: string } = {
      1: 'DOP (Dioctyl Phthalate)',
      2: 'DINP (Diisononyl Phthalate)',
      3: 'DOTP (Dioctyl Terephthalate)'
    };

    if (itemType === 'RAW_MATERIAL') {
      return rawMaterials[itemId] || `Raw Material #${itemId}`;
    } else {
      return finishedProducts[itemId] || `Finished Product #${itemId}`;
    }
  };

  const getTransactionTypeIcon = (type: string) => {
    return type === 'IN' ? '📥' : '📤';
  };

  const getTransactionTypeColor = (type: string) => {
    return type === 'IN' 
      ? 'text-green-600 bg-green-50' 
      : 'text-red-600 bg-red-50';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stock Transactions</h1>
            <p className="text-gray-600">Track all inventory movements and transactions</p>
          </div>
          <Button
            onClick={() => {
              setShowAddForm(true);
              resetForm();
            }}
          >
            Add Transaction
          </Button>
        </div>

        {/* Filters */}
        <Card title="Filters">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Transaction Type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              options={[
                { value: '', label: 'All Types' },
                { value: 'IN', label: 'Stock In' },
                { value: 'OUT', label: 'Stock Out' }
              ]}
            />
            <Select
              label="Item Type"
              value={filterItemType}
              onChange={(e) => setFilterItemType(e.target.value)}
              options={[
                { value: '', label: 'All Items' },
                { value: 'RAW_MATERIAL', label: 'Raw Materials' },
                { value: 'FINISHED_PRODUCT', label: 'Finished Products' }
              ]}
            />
            <div className="flex items-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setFilterType('');
                  setFilterItemType('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="text-sm font-medium text-gray-600">Total Transactions</div>
            <div className="text-2xl font-bold text-gray-900">{transactions.length}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="text-sm font-medium text-gray-600">Stock In</div>
            <div className="text-2xl font-bold text-green-600">
              {transactions.filter(t => t.transactionType === 'IN').length}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="text-sm font-medium text-gray-600">Stock Out</div>
            <div className="text-2xl font-bold text-red-600">
              {transactions.filter(t => t.transactionType === 'OUT').length}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="text-sm font-medium text-gray-600">Today&apos;s Transactions</div>
            <div className="text-2xl font-bold text-blue-600">
              {transactions.filter(t => 
                new Date(t.createdAt).toDateString() === new Date().toDateString()
              ).length}
            </div>
          </div>
        </div>

        {/* Add Transaction Form */}
        {showAddForm && (
          <Card title="Add New Transaction">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Item Type"
                  value={formData.itemType}
                  onChange={(e) => setFormData({ ...formData, itemType: e.target.value })}
                  options={[
                    { value: 'RAW_MATERIAL', label: 'Raw Material' },
                    { value: 'FINISHED_PRODUCT', label: 'Finished Product' }
                  ]}
                  required
                />
                <Select
                  label="Transaction Type"
                  value={formData.transactionType}
                  onChange={(e) => setFormData({ ...formData, transactionType: e.target.value })}
                  options={[
                    { value: 'IN', label: 'Stock In' },
                    { value: 'OUT', label: 'Stock Out' }
                  ]}
                  required
                />
                <Input
                  label="Item ID"
                  type="number"
                  value={formData.itemId}
                  onChange={(e) => setFormData({ ...formData, itemId: Number(e.target.value) })}
                  placeholder="Select item from dropdown (to be implemented)"
                  required
                />
                <Input
                  label="Quantity"
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  required
                />
                <Select
                  label="Unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  options={[
                    { value: 'kg', label: 'Kilogram (kg)' },
                    { value: 'liter', label: 'Liter' },
                    { value: 'ton', label: 'Ton' },
                    { value: 'drum', label: 'Drum' }
                  ]}
                  required
                />
                <Input
                  label="Reference"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  placeholder="e.g., PO-2025-001, PROD-001"
                />
              </div>
              <Input
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional information about this transaction"
              />
              <div className="flex space-x-4">
                <Button type="submit">Create Transaction</Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Transactions List */}
        <Card title="Recent Transactions">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div>{new Date(transaction.createdAt).toLocaleDateString('id-ID')}</div>
                        <div className="text-gray-500">
                          {new Date(transaction.createdAt).toLocaleTimeString('id-ID')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getTransactionTypeColor(transaction.transactionType)}`}>
                        <span className="mr-1">{getTransactionTypeIcon(transaction.transactionType)}</span>
                        {transaction.transactionType === 'IN' ? 'Stock In' : 'Stock Out'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {getItemName(transaction.itemId, transaction.itemType)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {transaction.itemType === 'RAW_MATERIAL' ? 'Raw Material' : 'Finished Product'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={transaction.transactionType === 'IN' ? 'text-green-600' : 'text-red-600'}>
                        {transaction.transactionType === 'IN' ? '+' : '-'}{transaction.quantity.toLocaleString()} {transaction.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.reference}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.user?.username}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {transaction.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
