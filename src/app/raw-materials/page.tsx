'use client';

import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button, Card, Input, Select } from '@/components/ui';
import { rawMaterialsApi, suppliersApi } from '@/services/api';
import { RawMaterial, Supplier } from '@/types/inventory';

export default function RawMaterialsPage() {
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<RawMaterial | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    unit: '',
    currentStock: 0,
    minimumStock: 0,
    price: 0,
    supplierId: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Try to fetch real data from backend
      try {
        console.log('Loading raw materials and suppliers from backend...');
        
        const [rawMaterialsResponse, suppliersResponse] = await Promise.all([
          rawMaterialsApi.getAll(),
          suppliersApi.getAll()
        ]);
        
        console.log('Raw materials response:', rawMaterialsResponse.data);
        console.log('Suppliers response:', suppliersResponse.data);
        
        if (rawMaterialsResponse.data.success && suppliersResponse.data.success) {
          setRawMaterials(rawMaterialsResponse.data.data);
          setSuppliers(suppliersResponse.data.data);
          console.log('Successfully loaded data from backend');
          setLoading(false);
          return;
        } else {
          console.warn('Backend response structure invalid:', {
            rawMaterials: rawMaterialsResponse.data,
            suppliers: suppliersResponse.data
          });
        }
      } catch (apiError: unknown) {
        console.warn('Backend API not available, using mock data:', apiError);
        const error = apiError as { message?: string; response?: { data?: unknown; status?: number } };
        console.warn('API Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
      }
      
      // Fallback to mock data if backend is not available
      console.log('Using mock data as fallback');
      const mockRawMaterials: RawMaterial[] = [
        {
          id: 1,
          name: 'Phthalic Anhydride',
          code: 'RM001',
          description: 'Primary raw material for DOP production',
          unit: 'kg',
          currentStock: 1500,
          minimumStock: 500,
          price: 25000,
          supplierId: 1,
          supplier: { id: 1, name: 'PT Chemicals Indonesia', code: 'SUP001', contact: 'John Doe', isActive: true, createdAt: new Date(), updatedAt: new Date() },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          name: '2-Ethylhexanol',
          code: 'RM002',
          description: 'Alcohol component for DOP synthesis',
          unit: 'liter',
          currentStock: 800,
          minimumStock: 200,
          price: 18000,
          supplierId: 1,
          supplier: { id: 1, name: 'PT Chemicals Indonesia', code: 'SUP001', contact: 'John Doe', isActive: true, createdAt: new Date(), updatedAt: new Date() },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 3,
          name: 'Isononyl Alcohol',
          code: 'RM003',
          description: 'Alcohol for DINP production',
          unit: 'liter',
          currentStock: 600,
          minimumStock: 150,
          price: 22000,
          supplierId: 2,
          supplier: { id: 2, name: 'CV Bahan Kimia Nusantara', code: 'SUP002', contact: 'Jane Smith', isActive: true, createdAt: new Date(), updatedAt: new Date() },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const mockSuppliers: Supplier[] = [
        { id: 1, name: 'PT Chemicals Indonesia', code: 'SUP001', contact: 'John Doe', phone: '+62211234567', email: 'john@chemicals.co.id', isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { id: 2, name: 'CV Bahan Kimia Nusantara', code: 'SUP002', contact: 'Jane Smith', phone: '+62217654321', email: 'jane@bahankimia.co.id', isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { id: 3, name: 'PT Global Chemical Supply', code: 'SUP003', contact: 'Robert Wilson', phone: '+62218888999', email: 'robert@globalchem.co.id', isActive: true, createdAt: new Date(), updatedAt: new Date() }
      ];

      setRawMaterials(mockRawMaterials);
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
        // Update existing raw material
        console.log('Updating raw material:', formData);
        const response = await rawMaterialsApi.update(editingItem.id, formData);
        console.log('Update response:', response.data);
        
        if (response.data.success) {
          console.log('Raw material updated successfully');
        } else {
          throw new Error('Update failed: ' + response.data.message);
        }
      } else {
        // Create new raw material
        console.log('Creating raw material:', formData);
        const response = await rawMaterialsApi.create(formData);
        console.log('Create response:', response.data);
        
        if (response.data.success) {
          console.log('Raw material created successfully');
        } else {
          throw new Error('Create failed: ' + response.data.message);
        }
      }
      
      setShowAddForm(false);
      setEditingItem(null);
      resetForm();
      await loadData();
    } catch (error: unknown) {
      console.error('Failed to save raw material:', error);
      const errorMsg = error as { response?: { data?: { message?: string } }; message?: string };
      alert('Failed to save raw material: ' + (errorMsg.response?.data?.message || errorMsg.message));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this raw material?')) {
      return;
    }
    
    try {
      console.log('Deleting raw material:', id);
      const response = await rawMaterialsApi.delete(id);
      console.log('Delete response:', response.data);
      
      if (response.data.success) {
        console.log('Raw material deleted successfully');
        await loadData();
      } else {
        throw new Error('Delete failed: ' + response.data.message);
      }
    } catch (error: unknown) {
      console.error('Failed to delete raw material:', error);
      const errorMsg = error as { response?: { data?: { message?: string } }; message?: string };
      alert('Failed to delete raw material: ' + (errorMsg.response?.data?.message || errorMsg.message));
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
      supplierId: 0
    });
  };

  const handleEdit = (item: RawMaterial) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      code: item.code,
      description: item.description || '',
      unit: item.unit,
      currentStock: item.currentStock,
      minimumStock: item.minimumStock,
      price: item.price,
      supplierId: item.supplierId
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
            <h1 className="text-3xl font-bold text-gray-900">Raw Materials</h1>
            <p className="text-gray-600">Manage chemical raw materials inventory</p>
          </div>
          <Button
            onClick={() => {
              setShowAddForm(true);
              setEditingItem(null);
              resetForm();
            }}
          >
            Add Raw Material
          </Button>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <Card title={editingItem ? 'Edit Raw Material' : 'Add New Raw Material'}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <Input
                  label="Code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
                <Input
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                  label="Current Stock"
                  type="number"
                  value={formData.currentStock}
                  onChange={(e) => setFormData({ ...formData, currentStock: Number(e.target.value) })}
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
                  label="Price (Rp)"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  required
                />
                <Select
                  label="Supplier"
                  value={formData.supplierId}
                  onChange={(e) => setFormData({ ...formData, supplierId: Number(e.target.value) })}
                  options={suppliers.map(s => ({ value: s.id, label: s.name }))}
                  required
                />
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

        {/* Raw Materials List */}
        <Card title="Raw Materials List">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Material
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
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rawMaterials.map((item) => {
                  const status = getStockStatus(item.currentStock, item.minimumStock);
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
                        {item.supplier?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Rp {item.price.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
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
        </Card>
      </div>
    </Layout>
  );
}
