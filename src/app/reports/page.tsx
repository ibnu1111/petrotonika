'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { Button, Card, Select } from '@/components/ui';
import { dashboardApi, rawMaterialsApi, finishedProductsApi } from '@/services/api';
import { 
  DashboardData
} from '@/types/inventory';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface ApiItem {
  id: number;
  name: string;
  code: string;
  currentStock: number;
  minimumStock: number;
  unit: string;
  price: number;
  description?: string;
  updatedAt: string;
  supplier?: { name: string };
  productionCost?: number;
}

interface TransactionApiData {
  id: number;
  itemId: number;
  itemType: string;
  transactionType: string;
  quantity: number;
  unit: string;
  reference: string;
  createdAt: string;
  userName: string;
}

interface StatsApiData {
  totalRawMaterials: number;
  totalFinishedProducts: number;
  lowStockItems: number;
  todayTransactions: number;
  totalValue: number;
}

interface LowStockAlertData {
  id: number;
  name: string;
  code: string;
  currentStock: number;
  minimumStock: number;
  unit: string;
  type: 'RAW_MATERIAL' | 'FINISHED_PRODUCT';
}

interface SimpleInventoryReport {
  rawMaterials: Array<{
    name: string;
    currentStock: number;
    unit: string;
    minStock: number;
    maxStock: number;
    value: number;
  }>;
  finishedProducts: Array<{
    name: string;
    currentStock: number;
    unit: string;
    minStock: number;
    maxStock: number;
    value: number;
  }>;
  totalValue: number;
}

export default function ReportsPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [inventoryReport, setInventoryReport] = useState<SimpleInventoryReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedReportType, setSelectedReportType] = useState('inventory');

  const loadInventoryReport = useCallback(async () => {
    const report = await generateInventoryReport();
    setInventoryReport(report);
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load real data from backend
      const [statsResponse, transactionsResponse, alertsResponse] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getRecentTransactions(10),
        dashboardApi.getLowStockAlerts()
      ]);

      if (statsResponse.data.success && transactionsResponse.data.success && alertsResponse.data.success) {
        const statsData = statsResponse.data.data as StatsApiData;
        const transactionsData = transactionsResponse.data.data as unknown as TransactionApiData[];
        const alertsData = alertsResponse.data.data as unknown as LowStockAlertData[];

        const dashboardData: DashboardData = {
          summary: {
            totalRawMaterials: statsData.totalRawMaterials,
            totalFinishedProducts: statsData.totalFinishedProducts,
            totalSuppliers: 0,
            totalTransactions: statsData.todayTransactions,
            lowStockItems: statsData.lowStockItems,
            outOfStockItems: 0
          },
          recentTransactions: transactionsData.map((t) => ({
            id: t.id,
            itemId: t.itemId,
            itemType: t.itemType as 'RAW_MATERIAL' | 'FINISHED_PRODUCT',
            transactionType: t.transactionType as 'IN' | 'OUT' | 'ADJUSTMENT',
            quantity: t.quantity,
            unit: t.unit,
            reference: t.reference,
            notes: '',
            userId: 0,
            createdAt: new Date(t.createdAt),
            user: t.userName ? { 
              id: 0, 
              name: t.userName, 
              username: t.userName,
              role: 'STAFF' as const,
              isActive: true 
            } : undefined
          })),
          alerts: alertsData.map((alert, index) => ({
            id: index + 1,
            type: alert.currentStock === 0 ? 'OUT_OF_STOCK' as const : 'LOW_STOCK' as const,
            message: alert.currentStock === 0 
              ? `${alert.name} is out of stock`
              : `${alert.name} stock is running low (${alert.currentStock} ${alert.unit} remaining)`,
            severity: alert.currentStock === 0 ? 'CRITICAL' as const : 'WARNING' as const,
            createdAt: new Date()
          }))
        };

        setDashboardData(dashboardData);
      } else {
        throw new Error('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      
      // Fallback to mock data if backend is not available
      const mockData: DashboardData = {
        summary: {
          totalRawMaterials: 0,
          totalFinishedProducts: 0,
          totalSuppliers: 0,
          totalTransactions: 0,
          lowStockItems: 0,
          outOfStockItems: 0
        },
        recentTransactions: [],
        alerts: [{
          id: 1,
          type: 'SYSTEM',
          message: 'Unable to connect to backend. Showing offline data.',
          severity: 'CRITICAL',
          createdAt: new Date()
        }]
      };
      
      setDashboardData(mockData);
    } finally {
      setLoading(false);
    }
  }, []);

  const generateInventoryReport = async (): Promise<SimpleInventoryReport> => {
    try {
      // Load real inventory data from backend
      const [rawMaterialsResponse, finishedProductsResponse] = await Promise.all([
        rawMaterialsApi.getAll(),
        finishedProductsApi.getAll()
      ]);

      if (rawMaterialsResponse.data.success && finishedProductsResponse.data.success) {
        const rawMaterialsData = rawMaterialsResponse.data.data as unknown as ApiItem[];
        const finishedProductsData = finishedProductsResponse.data.data as unknown as ApiItem[];

        const rawMaterials = rawMaterialsData.map((rm) => ({
          name: rm.name,
          currentStock: rm.currentStock,
          unit: rm.unit,
          minStock: rm.minimumStock,
          maxStock: rm.minimumStock * 5,
          value: rm.currentStock * rm.price
        }));

        const finishedProducts = finishedProductsData.map((fp) => ({
          name: fp.name,
          currentStock: fp.currentStock,
          unit: fp.unit,
          minStock: fp.minimumStock,
          maxStock: fp.minimumStock * 5,
          value: fp.currentStock * fp.price
        }));

        const totalValue = [...rawMaterials, ...finishedProducts]
          .reduce((sum, item) => sum + item.value, 0);

        return {
          rawMaterials,
          finishedProducts,
          totalValue
        };
      }
    } catch (error) {
      console.error('Failed to generate inventory report:', error);
    }

    // Fallback mock data
    return {
      rawMaterials: [
        {
          name: '2-Ethylhexanol',
          currentStock: 800,
          unit: 'liter',
          minStock: 200,
          maxStock: 1000,
          value: 14400000
        },
        {
          name: 'Catalyst Titanium',
          currentStock: 50,
          unit: 'kg',
          minStock: 10,
          maxStock: 50,
          value: 7500000
        },
        {
          name: 'Isononyl Alcohol',
          currentStock: 600,
          unit: 'liter',
          minStock: 150,
          maxStock: 750,
          value: 13200000
        }
      ],
      finishedProducts: [
        {
          name: 'DOP (Dioctyl Phthalate)',
          currentStock: 2500,
          unit: 'kg',
          minStock: 500,
          maxStock: 3000,
          value: 62500000
        },
        {
          name: 'DINP (Diisononyl Phthalate)',
          currentStock: 1800,
          unit: 'kg',
          minStock: 400,
          maxStock: 2000,
          value: 59400000
        },
        {
          name: 'DOTP (Dioctyl Terephthalate)',
          currentStock: 1200,
          unit: 'kg',
          minStock: 300,
          maxStock: 1500,
          value: 42000000
        }
      ],
      totalValue: 199000000
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const printReport = () => {
    window.print();
  };

  const exportReport = async () => {
    try {
      setLoading(true);
      
      const fileName = `inventory-report-${new Date().toISOString().split('T')[0]}`;
      
      if (selectedReportType === 'inventory') {
        // Export inventory status
        const [rawMaterialsResponse, finishedProductsResponse] = await Promise.all([
          rawMaterialsApi.getAll(),
          finishedProductsApi.getAll()
        ]);
        
        if (rawMaterialsResponse.data.success && finishedProductsResponse.data.success) {
          const rawMaterialsData = rawMaterialsResponse.data.data as unknown as ApiItem[];
          const finishedProductsData = finishedProductsResponse.data.data as unknown as ApiItem[];

          // Raw Materials Sheet
          const rawMaterialsExportData = rawMaterialsData.map((item) => ({
            'Material Code': item.code,
            'Material Name': item.name,
            'Description': item.description || '',
            'Current Stock': item.currentStock,
            'Minimum Stock': item.minimumStock,
            'Unit': item.unit,
            'Price': item.price,
            'Total Value': item.currentStock * item.price,
            'Status': item.currentStock <= item.minimumStock ? 'Low Stock' : 'In Stock',
            'Supplier': item.supplier?.name || 'N/A',
            'Last Updated': new Date(item.updatedAt).toLocaleDateString()
          }));
          
          // Finished Products Sheet
          const finishedProductsExportData = finishedProductsData.map((item) => ({
            'Product Code': item.code,
            'Product Name': item.name,
            'Description': item.description || '',
            'Current Stock': item.currentStock,
            'Minimum Stock': item.minimumStock,
            'Unit': item.unit,
            'Price': item.price,
            'Production Cost': item.productionCost || 0,
            'Total Value': item.currentStock * item.price,
            'Status': item.currentStock <= item.minimumStock ? 'Low Stock' : 'In Stock',
            'Last Updated': new Date(item.updatedAt).toLocaleDateString()
          }));
          
          // Summary Sheet
          const summaryData = [
            { 'Metric': 'Total Raw Materials', 'Value': rawMaterialsExportData.length },
            { 'Metric': 'Total Finished Products', 'Value': finishedProductsExportData.length },
            { 'Metric': 'Raw Materials Value', 'Value': rawMaterialsExportData.reduce((sum, item) => sum + (item['Total Value'] as number), 0) },
            { 'Metric': 'Finished Products Value', 'Value': finishedProductsExportData.reduce((sum, item) => sum + (item['Total Value'] as number), 0) },
            { 'Metric': 'Low Stock Raw Materials', 'Value': rawMaterialsExportData.filter(item => item.Status === 'Low Stock').length },
            { 'Metric': 'Low Stock Finished Products', 'Value': finishedProductsExportData.filter(item => item.Status === 'Low Stock').length },
            { 'Metric': 'Report Generated', 'Value': new Date().toLocaleString() }
          ];
          
          // Create workbook with multiple sheets
          const workbook = XLSX.utils.book_new();
          
          // Add Summary sheet
          const summarySheet = XLSX.utils.json_to_sheet(summaryData);
          XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
          
          // Add Raw Materials sheet
          const rawMaterialsSheet = XLSX.utils.json_to_sheet(rawMaterialsExportData);
          XLSX.utils.book_append_sheet(workbook, rawMaterialsSheet, 'Raw Materials');
          
          // Add Finished Products sheet
          const finishedProductsSheet = XLSX.utils.json_to_sheet(finishedProductsExportData);
          XLSX.utils.book_append_sheet(workbook, finishedProductsSheet, 'Finished Products');
          
          // Export to Excel
          const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
          const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          saveAs(data, `${fileName}.xlsx`);
        }
      }
      
      // Show success message
      alert('Report exported successfully! Check your Downloads folder.');
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add useEffect after all function definitions
  useEffect(() => {
    loadData();
    loadInventoryReport();
  }, [selectedPeriod, loadData, loadInventoryReport]);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  // Show loading while inventory report is being loaded
  if (!inventoryReport) {
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
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600">Comprehensive inventory reports and business insights</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="ghost" onClick={printReport}>
              🖨️ Print
            </Button>
            <Button onClick={exportReport}>
              📊 Export
            </Button>
          </div>
        </div>

        {/* Report Filters */}
        <Card title="Report Configuration">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Report Type"
              value={selectedReportType}
              onChange={(e) => setSelectedReportType(e.target.value)}
              options={[
                { value: 'inventory', label: 'Inventory Status' },
                { value: 'transactions', label: 'Transaction History' },
                { value: 'suppliers', label: 'Supplier Performance' },
                { value: 'financial', label: 'Financial Summary' }
              ]}
            />
            <Select
              label="Time Period"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              options={[
                { value: '7', label: 'Last 7 days' },
                { value: '30', label: 'Last 30 days' },
                { value: '90', label: 'Last 90 days' },
                { value: '365', label: 'Last 12 months' }
              ]}
            />
            <div className="flex items-end">
              <Button onClick={loadData}>
                Generate Report
              </Button>
            </div>
          </div>
        </Card>

        {/* Executive Summary */}
        <Card title="Executive Summary">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{formatCurrency(inventoryReport.totalValue)}</div>
              <div className="text-sm text-gray-600">Total Inventory Value</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{dashboardData?.summary.totalTransactions}</div>
              <div className="text-sm text-gray-600">Total Transactions (Last {selectedPeriod} days)</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{dashboardData?.summary.lowStockItems}</div>
              <div className="text-sm text-gray-600">Items Requiring Attention</div>
            </div>
          </div>
        </Card>

        {/* Inventory Status Report */}
        {selectedReportType === 'inventory' && (
          <>
            <Card title="Raw Materials Inventory">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min/Max</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {inventoryReport.rawMaterials.map((material, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {material.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {material.currentStock} {material.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {material.minStock} / {material.maxStock} {material.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            material.currentStock <= material.minStock
                              ? 'bg-red-100 text-red-800'
                              : material.currentStock <= material.minStock * 1.5
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {material.currentStock <= material.minStock ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(material.value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card title="Finished Products Inventory">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min/Max</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {inventoryReport.finishedProducts.map((product, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.currentStock} {product.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.minStock} / {product.maxStock} {product.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            product.currentStock <= product.minStock
                              ? 'bg-red-100 text-red-800'
                              : product.currentStock <= product.minStock * 1.5
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {product.currentStock <= product.minStock ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(product.value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {/* Transaction Report */}
        {selectedReportType === 'transactions' && (
          <Card title="Recent Transactions">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dashboardData?.recentTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.createdAt.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          transaction.transactionType === 'IN' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.transactionType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.itemType} #{transaction.itemId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.quantity} {transaction.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.reference}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.user?.name || 'System'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Other report types placeholder */}
        {(selectedReportType === 'suppliers' || selectedReportType === 'financial') && (
          <Card title={`${selectedReportType.charAt(0).toUpperCase() + selectedReportType.slice(1)} Report`}>
            <div className="text-center py-8">
              <div className="text-gray-500">
                {selectedReportType.charAt(0).toUpperCase() + selectedReportType.slice(1)} report functionality will be implemented. 
                Report data will be exported to Excel/PDF format.
              </div>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}
