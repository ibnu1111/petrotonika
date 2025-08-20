'use client';

import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button, Card, Input, Select } from '@/components/ui';
import { finishedProductsApi } from '@/services/api';
import { FinishedProduct } from '@/types/inventory';

export default function FinishedProductsPage() {
  const [finishedProducts, setFinishedProducts] = useState<FinishedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<FinishedProduct | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    unit: '',
    currentStock: 0,
    minimumStock: 0,
    price: 0,
    productionCost: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Try to fetch real data from backend
      try {
        const response = await finishedProductsApi.getAll();
        if (response.data.success) {
          setFinishedProducts(response.data.data);
          console.log('Successfully loaded finished products from backend');
          return;
        }
      } catch (apiError) {
        console.warn('Backend API not available, using mock data:', apiError);
      }
      
      // Fallback to mock data for PT Petronika products
      const mockFinishedProducts: FinishedProduct[] = [
        {
          id: 1,
          name: 'Dioctyl Phthalate (DOP)',
          code: 'FP001',
          description: 'Primary plasticizer for PVC applications',
          unit: 'drum',
          currentStock: 45,
          minimumStock: 10,
          price: 125000,
          productionCost: 95000,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          name: 'Diisononyl Phthalate (DINP)',
          code: 'FP002',
          description: 'High molecular weight plasticizer',
          unit: 'drum',
          currentStock: 32,
          minimumStock: 8,
          price: 135000,
          productionCost: 105000,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 3,
          name: 'Dioctyl Terephthalate (DOTP)',
          code: 'FP003',
          description: 'Non-phthalate plasticizer alternative',
          unit: 'drum',
          currentStock: 28,
          minimumStock: 5,
          price: 145000,
          productionCost: 115000,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      setFinishedProducts(mockFinishedProducts);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        console.log('Update finished product:', formData);
      } else {
        console.log('Create finished product:', formData);
      }
      
      setShowAddForm(false);
      setEditingItem(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to save finished product:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      unit: '',
      currentStock: 0,
      minimumStock: 0,
      price: 0,
      productionCost: 0
    });
  };

  const handleEdit = (item: FinishedProduct) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      code: item.code,
      description: item.description || '',
      unit: item.unit,
      currentStock: item.currentStock,
      minimumStock: item.minimumStock,
      price: item.price,
      productionCost: item.productionCost || 0
    });
    setShowAddForm(true);
  };

  const getStockStatus = (current: number, minimum: number) => {
    if (current <= minimum) return 'low';
    if (current <= minimum * 1.5) return 'warning';
    return 'good';
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'low': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  const calculateMargin = (price: number, cost: number) => {
    if (cost === 0) return 0;
    return ((price - cost) / price * 100);
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
            <h1 className="text-3xl font-bold text-gray-900">Finished Products</h1>
            <p className="text-gray-600">Manage DOP, DINP, DOTP production inventory</p>
          </div>
          <Button
            onClick={() => {
              setShowAddForm(true);
              setEditingItem(null);
              resetForm();
            }}
          >
            Add Product
          </Button>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <Card title={editingItem ? 'Edit Finished Product' : 'Add New Finished Product'}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Product Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Dioctyl Phthalate (DOP)"
                  required
                />
                <Input
                  label="Product Code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., FP001"
                  required
                />
                <Input
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Product description and applications"
                />
                <Select
                  label="Unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  options={[
                    { value: 'drum', label: 'Drum' },
                    { value: 'ton', label: 'Ton' },
                    { value: 'kg', label: 'Kilogram (kg)' },
                    { value: 'liter', label: 'Liter' }
                  ]}
                  required
                />
                <Input
                  label="Minimum Stock"
                  type="number"
                  value={formData.minimumStock}
                  onChange={(e) => setFormData({ ...formData, minimumStock: Number(e.target.value) })}
                  required
                />
                <Input
                  label="Production Cost (Rp)"
                  type="number"
                  value={formData.productionCost}
                  onChange={(e) => setFormData({ ...formData, productionCost: Number(e.target.value) })}
                />
                <Input
                  label="Selling Price (Rp)"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  required
                />
                <div className="flex items-center justify-center p-4 bg-gray-50 rounded-md">
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Profit Margin</div>
                    <div className="text-lg font-semibold text-green-600">
                      {calculateMargin(formData.price, formData.productionCost).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex space-x-4">
                <Button type="submit">
                  {editingItem ? 'Update' : 'Create'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingItem(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Finished Products List */}
        <Card title="Finished Products List">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Min Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Production Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Selling Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Margin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {finishedProducts.map((item) => {
                  const status = getStockStatus(item.currentStock, item.minimumStock);
                  const margin = calculateMargin(item.price, item.productionCost || 0);
                  return (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500">{item.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.currentStock.toLocaleString()} {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.minimumStock.toLocaleString()} {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStockStatusColor(status)}`}>
                          {status === 'low' ? 'Low Stock' : status === 'warning' ? 'Warning' : 'Good'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Rp {(item.productionCost || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Rp {item.price.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`font-medium ${margin > 20 ? 'text-green-600' : margin > 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {margin.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => console.log('Delete:', item.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {finishedProducts.map((item) => {
              const isLowStock = item.currentStock <= item.minimumStock;
              return (
                <div key={item.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{item.name}</h3>
                      <p className="text-xs text-gray-500">{item.code}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      isLowStock 
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {isLowStock ? 'Low Stock' : 'In Stock'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gray-500">Current Stock:</span>
                      <p className="font-medium">{item.currentStock} {item.unit}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Min Stock:</span>
                      <p className="font-medium">{item.minimumStock} {item.unit}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">Price:</span>
                      <p className="font-medium">Rp {item.price.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 mt-3 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => console.log('Delete:', item.id)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
