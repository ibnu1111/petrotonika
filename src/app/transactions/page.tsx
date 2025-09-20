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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stock Transactions</h1>
            <p className="text-gray-600">Track all inventory movements and transactions</p>
          </div>
          <div className="flex-shrink-0">
            <Button
              onClick={() => {
                setShowAddForm(true);
                resetForm();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
            >
              <span className="text-lg">📝</span>
              <span>Add Transaction</span>
            </Button>
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🔍</span>
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              </div>
              <button
                onClick={() => {
                  setFilterType('');
                  setFilterItemType('');
                }}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <span className="text-base">🗑️</span>
                <span>Clear</span>
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Transaction Type Filter - Visual Cards */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Transaction Type</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* All Types */}
                <button
                  onClick={() => setFilterType('')}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    filterType === ''
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-2xl">📊</span>
                    <div className="text-left">
                      <div className={`font-medium ${filterType === '' ? 'text-blue-900' : 'text-gray-900'}`}>
                        All Types
                      </div>
                      <div className={`text-sm ${filterType === '' ? 'text-blue-600' : 'text-gray-500'}`}>
                        Show everything
                      </div>
                    </div>
                  </div>
                </button>

                {/* Stock In */}
                <button
                  onClick={() => setFilterType('IN')}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    filterType === 'IN'
                      ? 'border-green-500 bg-green-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-2xl">📥</span>
                    <div className="text-left">
                      <div className={`font-medium ${filterType === 'IN' ? 'text-green-900' : 'text-gray-900'}`}>
                        Stock In
                      </div>
                      <div className={`text-sm ${filterType === 'IN' ? 'text-green-600' : 'text-gray-500'}`}>
                        Incoming stock
                      </div>
                    </div>
                  </div>
                </button>

                {/* Stock Out */}
                <button
                  onClick={() => setFilterType('OUT')}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    filterType === 'OUT'
                      ? 'border-red-500 bg-red-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-2xl">📤</span>
                    <div className="text-left">
                      <div className={`font-medium ${filterType === 'OUT' ? 'text-red-900' : 'text-gray-900'}`}>
                        Stock Out
                      </div>
                      <div className={`text-sm ${filterType === 'OUT' ? 'text-red-600' : 'text-gray-500'}`}>
                        Outgoing stock
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Item Type Filter - Visual Cards */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Item Category</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* All Items */}
                <button
                  onClick={() => setFilterItemType('')}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    filterItemType === ''
                      ? 'border-purple-500 bg-purple-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-2xl">🏷️</span>
                    <div className="text-left">
                      <div className={`font-medium ${filterItemType === '' ? 'text-purple-900' : 'text-gray-900'}`}>
                        All Categories
                      </div>
                      <div className={`text-sm ${filterItemType === '' ? 'text-purple-600' : 'text-gray-500'}`}>
                        Everything
                      </div>
                    </div>
                  </div>
                </button>

                {/* Raw Materials */}
                <button
                  onClick={() => setFilterItemType('RAW_MATERIAL')}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    filterItemType === 'RAW_MATERIAL'
                      ? 'border-orange-500 bg-orange-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-2xl">🧪</span>
                    <div className="text-left">
                      <div className={`font-medium ${filterItemType === 'RAW_MATERIAL' ? 'text-orange-900' : 'text-gray-900'}`}>
                        Raw Materials
                      </div>
                      <div className={`text-sm ${filterItemType === 'RAW_MATERIAL' ? 'text-orange-600' : 'text-gray-500'}`}>
                        Chemical inputs
                      </div>
                    </div>
                  </div>
                </button>

                {/* Finished Products */}
                <button
                  onClick={() => setFilterItemType('FINISHED_PRODUCT')}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    filterItemType === 'FINISHED_PRODUCT'
                      ? 'border-indigo-500 bg-indigo-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-2xl">🛢️</span>
                    <div className="text-left">
                      <div className={`font-medium ${filterItemType === 'FINISHED_PRODUCT' ? 'text-indigo-900' : 'text-gray-900'}`}>
                        Finished Products
                      </div>
                      <div className={`text-sm ${filterItemType === 'FINISHED_PRODUCT' ? 'text-indigo-600' : 'text-gray-500'}`}>
                        Ready to sell
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Active Filters Display */}
            {(filterType || filterItemType) && (
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Active filters:</span>
                    <div className="flex space-x-2">
                      {filterType && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          filterType === 'IN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {filterType === 'IN' ? '📥 Stock In' : '📤 Stock Out'}
                        </span>
                      )}
                      {filterItemType && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          filterItemType === 'RAW_MATERIAL' ? 'bg-orange-100 text-orange-800' : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {filterItemType === 'RAW_MATERIAL' ? '🧪 Raw Materials' : '🛢️ Finished Products'}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {transactions.length} result{transactions.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

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
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
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

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.transactionType === 'IN'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.transactionType === 'IN' ? 'Stock In' : 'Stock Out'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {transaction.itemType === 'RAW_MATERIAL' ? 'Raw Material' : 'Finished Product'}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 mt-1 truncate">Item #{transaction.itemId}</h3>
                    <p className="text-xs text-gray-500">{transaction.reference}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      <span className={transaction.transactionType === 'IN' ? 'text-green-600' : 'text-red-600'}>
                        {transaction.transactionType === 'IN' ? '+' : '-'}{transaction.quantity.toLocaleString()} {transaction.unit}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">{new Date(transaction.createdAt).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-gray-500">User:</span>
                    <span className="ml-1 font-medium">{transaction.user?.username}</span>
                  </div>
                  {transaction.notes && (
                    <div>
                      <span className="text-gray-500">Notes:</span>
                      <p className="font-medium mt-1">{transaction.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
