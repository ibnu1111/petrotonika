'use client';

import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button, Card, Input } from '@/components/ui';
import { suppliersApi } from '@/services/api';
import { Supplier } from '@/types/inventory';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    contact: '',
    phone: '',
    email: '',
    address: '',
    isActive: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Try to fetch real data from backend
      try {
        const response = await suppliersApi.getAll();
        if (response.data.success) {
          // Process suppliers data to ensure dates are proper Date objects
          const processedSuppliers = response.data.data.map((supplier: unknown) => {
            const s = supplier as Record<string, unknown>;
            return {
              ...s,
              createdAt: s.createdAt ? new Date(s.createdAt as string) : new Date(),
              updatedAt: s.updatedAt ? new Date(s.updatedAt as string) : new Date()
            } as Supplier;
          });
          setSuppliers(processedSuppliers);
          console.log('Successfully loaded suppliers from backend');
          return;
        }
      } catch (apiError) {
        console.warn('Backend API not available, using mock data:', apiError);
      }
      
      // Fallback to mock data for PT Petronika suppliers
      const mockSuppliers: Supplier[] = [
        {
          id: 1,
          name: 'PT Chemicals Indonesia',
          code: 'SUP001',
          contact: 'John Doe',
          phone: '+62211234567',
          email: 'john@chemicals.co.id',
          address: 'Jakarta Industrial Estate, Block A No. 15, Jakarta Timur',
          isActive: true,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-12-01')
        },
        {
          id: 2,
          name: 'CV Bahan Kimia Nusantara',
          code: 'SUP002',
          contact: 'Jane Smith',
          phone: '+62217654321',
          email: 'jane@bahankimia.co.id',
          address: 'Surabaya Chemical Complex, Jl. Industri No. 88, Surabaya',
          isActive: true,
          createdAt: new Date('2024-02-20'),
          updatedAt: new Date('2024-11-15')
        },
        {
          id: 3,
          name: 'PT Global Chemical Supply',
          code: 'SUP003',
          contact: 'Robert Wilson',
          phone: '+62218888999',
          email: 'robert@globalchem.co.id',
          address: 'Medan Industrial Park, Zone B-12, Medan',
          isActive: true,
          createdAt: new Date('2024-03-10'),
          updatedAt: new Date('2024-10-30')
        },
        {
          id: 4,
          name: 'PT Chemical Distributor Asia',
          code: 'SUP004',
          contact: 'Maria Garcia',
          phone: '+62215555111',
          email: 'maria@chemasia.co.id',
          address: 'Tangerang Chemical Hub, Jl. Raya Serpong No. 45, Tangerang',
          isActive: false,
          createdAt: new Date('2024-01-05'),
          updatedAt: new Date('2024-09-20')
        }
      ];

      setSuppliers(mockSuppliers);
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
        console.log('Update supplier:', formData);
      } else {
        console.log('Create supplier:', formData);
      }
      
      setShowAddForm(false);
      setEditingItem(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to save supplier:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      contact: '',
      phone: '',
      email: '',
      address: '',
      isActive: true
    });
  };

  const handleEdit = (item: Supplier) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      code: item.code,
      contact: item.contact,
      phone: item.phone || '',
      email: item.email || '',
      address: item.address || '',
      isActive: item.isActive
    });
    setShowAddForm(true);
  };

  const toggleStatus = async (supplier: Supplier) => {
    try {
      console.log('Toggle status for supplier:', supplier.id);
      // Here you would call the API to update the status
      loadData();
    } catch (error) {
      console.error('Failed to toggle supplier status:', error);
    }
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
            <h1 className="text-3xl font-bold text-gray-900">Suppliers</h1>
            <p className="text-gray-600">Manage chemical suppliers and vendors</p>
          </div>
          <Button
            onClick={() => {
              setShowAddForm(true);
              setEditingItem(null);
              resetForm();
            }}
          >
            Add Supplier
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="text-sm font-medium text-gray-600">Total Suppliers</div>
            <div className="text-2xl font-bold text-gray-900">{suppliers.length}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="text-sm font-medium text-gray-600">Active Suppliers</div>
            <div className="text-2xl font-bold text-green-600">
              {suppliers.filter(s => s.isActive).length}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="text-sm font-medium text-gray-600">Inactive Suppliers</div>
            <div className="text-2xl font-bold text-red-600">
              {suppliers.filter(s => !s.isActive).length}
            </div>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <Card title={editingItem ? 'Edit Supplier' : 'Add New Supplier'}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Company Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., PT Chemicals Indonesia"
                  required
                />
                <Input
                  label="Supplier Code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., SUP001"
                  required
                />
                <Input
                  label="Contact Person"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="e.g., John Doe"
                  required
                />
                <Input
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g., +62211234567"
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g., contact@supplier.com"
                />
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    Active Supplier
                  </label>
                </div>
              </div>
              <Input
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Complete address including city and postal code"
              />
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

        {/* Suppliers List */}
        <Card title="Suppliers List">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone & Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className={!supplier.isActive ? 'bg-gray-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                        <div className="text-sm text-gray-500">{supplier.address}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {supplier.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {supplier.contact}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{supplier.phone}</div>
                      <div className="text-sm text-gray-500">{supplier.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleStatus(supplier)}
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer ${
                          supplier.isActive
                            ? 'text-green-800 bg-green-100 hover:bg-green-200'
                            : 'text-red-800 bg-red-100 hover:bg-red-200'
                        }`}
                      >
                        {supplier.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {supplier.updatedAt ? 
                        new Date(supplier.updatedAt).toLocaleDateString('id-ID') : 
                        'N/A'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(supplier)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => console.log('View details:', supplier.id)}
                        className="text-green-600 hover:text-green-900 mr-4"
                      >
                        View
                      </button>
                      <button
                        onClick={() => console.log('Delete:', supplier.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {suppliers.map((supplier) => (
              <div key={supplier.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">{supplier.name}</h3>
                    <p className="text-xs text-gray-500">{supplier.code}</p>
                  </div>
                  <button
                    onClick={() => console.log('Toggle status:', supplier.id)}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                      supplier.isActive
                        ? 'text-green-800 bg-green-100 hover:bg-green-200'
                        : 'text-red-800 bg-red-100 hover:bg-red-200'
                    }`}
                  >
                    {supplier.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
                
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-gray-500">Contact:</span>
                    <p className="font-medium">{supplier.contact}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Updated:</span>
                    <p className="font-medium">
                      {supplier.updatedAt ? 
                        new Date(supplier.updatedAt).toLocaleDateString('id-ID') : 
                        'N/A'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => handleEdit(supplier)}
                    className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => console.log('View details:', supplier.id)}
                    className="text-green-600 hover:text-green-900 text-sm font-medium"
                  >
                    View
                  </button>
                  <button
                    onClick={() => console.log('Delete:', supplier.id)}
                    className="text-red-600 hover:text-red-900 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
