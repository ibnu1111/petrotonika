'use client';

import React, { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Layout } from '@/components/Layout';
import { Button, Card, Input, Select } from '@/components/ui';
import { finishedProductsApi } from '@/services/api';
import { FinishedProduct } from '@/types/inventory';

export default function FinishedProductsPage() {
  const [finishedProducts, setFinishedProducts] = useState<FinishedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<FinishedProduct | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    unit: '',
    currentStock: 0,
    minimumStock: '',
    price: '',
    productionCost: ''
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
          return;
        }
      } catch (apiError) {
        // Fallback to mock data if backend is not available
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
    
    // Prevent double submission
    if (submitting) {
      return;
    }
    
    // Add form validation
    if (!formData.name || !formData.code || !formData.unit || !formData.price) {
      toast.error('Please fill in all required fields', {
        duration: 3000,
        position: 'top-right',
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      if (editingItem) {
        // Update existing product
        const payload = {
          ...formData,
          minimumStock: Number(formData.minimumStock) || 0,
          price: Number(formData.price) || 0,
          productionCost: Number(formData.productionCost) || 0
        };
        const response = await finishedProductsApi.update(editingItem.id, payload);
        if (response.data.success) {
          toast.success('Product updated successfully!', {
            duration: 3000,
            position: 'top-right',
          });
        } else {
          throw new Error(response.data.message || 'Failed to update product');
        }
      } else {
        // Create new product
        const payload = {
          ...formData,
          minimumStock: Number(formData.minimumStock) || 0,
          price: Number(formData.price) || 0,
          productionCost: Number(formData.productionCost) || 0
        };
        const response = await finishedProductsApi.create(payload);
        if (response.data.success) {
          toast.success('Product created successfully!', {
            duration: 3000,
            position: 'top-right',
          });
        } else {
          throw new Error(response.data.message || 'Failed to create product');
        }
      }
      
      setShowAddForm(false);
      setEditingItem(null);
      resetForm();
      loadData(); // Reload data to show changes
    } catch (error) {
      console.error('Failed to save finished product:', error);
      
      // Handle different error types
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        if (axiosError.response?.data?.message) {
          toast.error(axiosError.response.data.message, {
            duration: 4000,
            position: 'top-right',
          });
        } else if (axiosError.response?.status) {
          toast.error(`HTTP Error ${axiosError.response.status}: ${axiosError.response.statusText || 'Request failed'}`, {
            duration: 4000,
            position: 'top-right',
          });
        } else {
          toast.error(error instanceof Error ? error.message : 'An unexpected error occurred', {
            duration: 4000,
            position: 'top-right',
          });
        }
      } else {
        toast.error(error instanceof Error ? error.message : 'An unexpected error occurred', {
          duration: 4000,
          position: 'top-right',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      unit: '',
      currentStock: 0,
      minimumStock: '',
      price: '',
      productionCost: ''
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
      minimumStock: item.minimumStock.toString(),
      price: item.price.toString(),
      productionCost: (item.productionCost || 0).toString()
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: number, name: string) => {
    // Create a custom confirmation toast
    toast((t) => (
      <div className="flex flex-col space-y-3">
        <div className="flex items-center space-x-2">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.88-.833-2.65 0L3.732 19c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Delete Product</p>
            <p className="text-sm text-gray-500">Are you sure you want to delete "{name}"?</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const response = await finishedProductsApi.delete(id);
                if (response.data.success) {
                  toast.success('Product deleted successfully!', {
                    duration: 3000,
                    position: 'top-right',
                  });
                  loadData();
                } else {
                  throw new Error(response.data.message || 'Failed to delete product');
                }
              } catch (error) {
                console.error('Failed to delete finished product:', error);
                
                if (error && typeof error === 'object' && 'response' in error) {
                  const axiosError = error as any;
                  if (axiosError.response?.data?.message) {
                    toast.error(axiosError.response.data.message, {
                      duration: 4000,
                      position: 'top-right',
                    });
                  } else if (axiosError.response?.status) {
                    toast.error(`HTTP Error ${axiosError.response.status}: ${axiosError.response.statusText || 'Request failed'}`, {
                      duration: 4000,
                      position: 'top-right',
                    });
                  } else {
                    toast.error(error instanceof Error ? error.message : 'An unexpected error occurred', {
                      duration: 4000,
                      position: 'top-right',
                    });
                  }
                } else {
                  toast.error(error instanceof Error ? error.message : 'An unexpected error occurred', {
                    duration: 4000,
                    position: 'top-right',
                  });
                }
              }
            }}
            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      position: 'top-center',
      style: {
        background: '#fff',
        color: '#000',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px',
        minWidth: '320px',
      },
    });
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
      <Toaster
        position="top-right"
        toastOptions={{
          // Default options for all toasts
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '8px',
            fontSize: '14px',
            padding: '12px 16px',
          },
          // Success toast styling
          success: {
            style: {
              background: '#10B981',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#10B981',
            },
          },
          // Error toast styling
          error: {
            style: {
              background: '#EF4444',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#EF4444',
            },
          },
        }}
      />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Finished Products</h1>
            <p className="text-gray-600">Manage DOP, DINP, DOTP production inventory</p>
          </div>
          <div className="flex-shrink-0">
            <Button
              onClick={() => {
                setShowAddForm(true);
                setEditingItem(null);
                resetForm();
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
            >
              <span className="text-lg">🛢️</span>
              <span>Add Product</span>
            </Button>
          </div>
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
                  onChange={(e) => setFormData({ ...formData, minimumStock: e.target.value })}
                  required
                />
                <Input
                  label="Production Cost (Rp)"
                  type="number"
                  value={formData.productionCost}
                  onChange={(e) => setFormData({ ...formData, productionCost: e.target.value })}
                />
                <Input
                  label="Selling Price (Rp)"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
                <div className="flex items-center justify-center p-4 bg-gray-50 rounded-md">
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Profit Margin</div>
                    <div className="text-lg font-semibold text-green-600">
                      {calculateMargin(Number(formData.price) || 0, Number(formData.productionCost) || 0).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex space-x-4">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Processing...' : (editingItem ? 'Update' : 'Create')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={submitting}
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
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    Product
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    Code
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Current
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    Min
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    Status
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Cost
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Price
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    Margin
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {finishedProducts.map((item) => {
                  const status = getStockStatus(item.currentStock, item.minimumStock);
                  const margin = calculateMargin(item.price, item.productionCost || 0);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <div className="max-w-xs">
                          <div className="text-sm font-medium text-gray-900 truncate">{item.name}</div>
                          <div className="text-xs text-gray-500 truncate">{item.description}</div>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-xs text-gray-900 font-mono">
                        {item.code}
                      </td>
                      <td className="px-2 py-2 text-xs text-gray-900">
                        <div>{item.currentStock.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{item.unit}</div>
                      </td>
                      <td className="px-2 py-2 text-xs text-gray-900">
                        <div>{item.minimumStock.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{item.unit}</div>
                      </td>
                      <td className="px-2 py-2">
                        <span className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${getStockStatusColor(status)}`}>
                          {status === 'low' ? 'Low' : status === 'warning' ? 'Warn' : 'Good'}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-xs text-gray-900">
                        <div>Rp {Math.round((item.productionCost || 0) / 1000)}K</div>
                      </td>
                      <td className="px-2 py-2 text-xs text-gray-900">
                        <div>Rp {Math.round(item.price / 1000)}K</div>
                      </td>
                      <td className="px-2 py-2 text-xs">
                        <span className={`font-medium ${margin > 20 ? 'text-green-600' : margin > 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {margin.toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-2 py-2 text-xs">
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-blue-600 hover:text-blue-900 px-1 py-0.5 rounded"
                            title="Edit"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.name)}
                            className="text-red-600 hover:text-red-900 px-1 py-0.5 rounded"
                            title="Delete"
                          >
                            Del
                          </button>
                        </div>
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
                      onClick={() => handleDelete(item.id, item.name)}
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
