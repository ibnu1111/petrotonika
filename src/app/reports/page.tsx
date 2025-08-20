'use client';

import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button, Card, Select } from '@/components/ui';
import { dashboardApi, rawMaterialsApi, finishedProductsApi, suppliersApi } from '@/services/api';
import { DashboardData, Alert } from '@/types/inventory';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function ReportsPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [inventoryReport, setInventoryReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedReportType, setSelectedReportType] = useState('inventory');

  useEffect(() => {
    loadData();
    loadInventoryReport();
  }, [selectedPeriod]);

  const loadInventoryReport = async () => {
    const report = await generateInventoryReport();
    setInventoryReport(report);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load real data from backend
      const [statsResponse, transactionsResponse, alertsResponse] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getRecentTransactions(10),
        dashboardApi.getLowStockAlerts()
      ]);

      if (statsResponse.data.success && transactionsResponse.data.success && alertsResponse.data.success) {
        const dashboardData: DashboardData = {
          summary: {
            totalRawMaterials: statsResponse.data.data.totalRawMaterials,
            totalFinishedProducts: statsResponse.data.data.totalFinishedProducts,
            totalSuppliers: 0, // Will be loaded separately if needed
            totalTransactions: statsResponse.data.data.todayTransactions,
            lowStockItems: statsResponse.data.data.lowStockItems,
            outOfStockItems: 0 // Calculate from alerts
          },
          recentTransactions: transactionsResponse.data.data.map((t: any) => ({
            id: t.id,
            itemId: t.itemId,
            itemType: t.itemType,
            transactionType: t.transactionType,
            quantity: t.quantity,
            unit: t.unit,
            reference: t.reference,
            notes: t.notes || '',
            userId: t.userId || 0,
            createdAt: new Date(t.createdAt),
            user: t.userName ? { 
              id: 0, 
              name: t.userName, 
              username: t.userName,
              role: 'STAFF' as const,
              isActive: true 
            } : undefined
          })),
          alerts: alertsResponse.data.data.map((alert: any, index: number) => ({
            id: index + 1,
            type: alert.currentStock === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
            message: alert.currentStock === 0 
              ? `${alert.name} is out of stock`
              : `${alert.name} stock is running low (${alert.currentStock} ${alert.unit} remaining)`,
            severity: alert.currentStock === 0 ? 'CRITICAL' : 'WARNING',
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
  };

  const generateInventoryReport = async () => {
    try {
      // Load real inventory data from backend
      const [rawMaterialsResponse, finishedProductsResponse] = await Promise.all([
        rawMaterialsApi.getAll(),
        finishedProductsApi.getAll()
      ]);

      if (rawMaterialsResponse.data.success && finishedProductsResponse.data.success) {
        const rawMaterials = rawMaterialsResponse.data.data.map((rm: any) => ({
          name: rm.name,
          currentStock: rm.currentStock,
          unit: rm.unit,
          minStock: rm.minimumStock,
          maxStock: rm.minimumStock * 5, // Estimate max stock
          value: rm.currentStock * rm.price
        }));

        const finishedProducts = finishedProductsResponse.data.data.map((fp: any) => ({
          name: fp.name,
          currentStock: fp.currentStock,
          unit: fp.unit,
          minStock: fp.minimumStock,
          maxStock: fp.minimumStock * 5, // Estimate max stock
          value: fp.currentStock * fp.price
        }));

        const totalValue = [
          ...rawMaterials.map((rm: any) => rm.value),
          ...finishedProducts.map((fp: any) => fp.value)
        ].reduce((sum, value) => sum + value, 0);

        return {
          rawMaterials,
          finishedProducts,
          totalValue
        };
      } else {
        throw new Error('Failed to load inventory data');
      }
    } catch (error) {
      console.error('Failed to generate inventory report:', error);
      
      // Fallback to mock data
      return {
        rawMaterials: [
          { name: 'No data available', currentStock: 0, unit: '', minStock: 0, maxStock: 0, value: 0 }
        ],
        finishedProducts: [
          { name: 'No data available', currentStock: 0, unit: '', minStock: 0, maxStock: 0, value: 0 }
        ],
        totalValue: 0
      };
    }
  };

  const generateTransactionReport = () => {
    // Mock transaction report data for the selected period
    const transactionReport = {
      period: `Last ${selectedPeriod} days`,
      stockIn: {
        rawMaterials: { count: 8, totalQuantity: 1250, totalValue: 125000000 },
        finishedProducts: { count: 4, totalQuantity: 35, totalValue: 525000000 }
      },
      stockOut: {
        rawMaterials: { count: 12, totalQuantity: 850, totalValue: 85000000 },
        finishedProducts: { count: 6, totalQuantity: 20, totalValue: 300000000 }
      },
      netMovement: {
        rawMaterials: { quantity: 400, value: 40000000 },
        finishedProducts: { quantity: 15, value: 225000000 }
      }
    };

    return transactionReport;
  };

  const generateSupplierReport = () => {
    // Mock supplier performance report
    const supplierReport = [
      {
        name: 'PT Chemicals Indonesia',
        totalOrders: 15,
        totalValue: 450000000,
        onTimeDelivery: 93.3,
        qualityRating: 4.8,
        lastDelivery: '2025-01-25'
      },
      {
        name: 'CV Chemical Supplies',
        totalOrders: 8,
        totalValue: 240000000,
        onTimeDelivery: 87.5,
        qualityRating: 4.5,
        lastDelivery: '2025-01-22'
      },
      {
        name: 'PT Petrochemical Corp',
        totalOrders: 12,
        totalValue: 360000000,
        onTimeDelivery: 100,
        qualityRating: 4.9,
        lastDelivery: '2025-01-24'
      }
    ];

    return supplierReport;
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
      
      // Prepare export data based on selected report type
      let exportData: any[] = [];
      let fileName = `inventory-report-${new Date().toISOString().split('T')[0]}`;
      
      if (selectedReportType === 'inventory') {
        // Export inventory status
        const [rawMaterialsResponse, finishedProductsResponse] = await Promise.all([
          rawMaterialsApi.getAll(),
          finishedProductsApi.getAll()
        ]);
        
        if (rawMaterialsResponse.data.success && finishedProductsResponse.data.success) {
          // Raw Materials Sheet
          const rawMaterialsData = rawMaterialsResponse.data.data.map((item: any) => ({
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
          const finishedProductsData = finishedProductsResponse.data.data.map((item: any) => ({
            'Product Code': item.code,
            'Product Name': item.name,
            'Description': item.description || '',
            'Current Stock': item.currentStock,
            'Minimum Stock': item.minimumStock,
            'Unit': item.unit,
            'Price': item.price,
            'Production Cost': item.productionCost,
            'Total Value': item.currentStock * item.price,
            'Status': item.currentStock <= item.minimumStock ? 'Low Stock' : 'In Stock',
            'Last Updated': new Date(item.updatedAt).toLocaleDateString()
          }));
          
          // Summary Sheet
          const summaryData = [
            { 'Metric': 'Total Raw Materials', 'Value': rawMaterialsData.length },
            { 'Metric': 'Total Finished Products', 'Value': finishedProductsData.length },
            { 'Metric': 'Raw Materials Value', 'Value': rawMaterialsData.reduce((sum, item) => sum + item['Total Value'], 0) },
            { 'Metric': 'Finished Products Value', 'Value': finishedProductsData.reduce((sum, item) => sum + item['Total Value'], 0) },
            { 'Metric': 'Low Stock Raw Materials', 'Value': rawMaterialsData.filter(item => item.Status === 'Low Stock').length },
            { 'Metric': 'Low Stock Finished Products', 'Value': finishedProductsData.filter(item => item.Status === 'Low Stock').length },
            { 'Metric': 'Report Generated', 'Value': new Date().toLocaleString() }
          ];
          
          // Create workbook with multiple sheets
          const workbook = XLSX.utils.book_new();
          
          // Add Summary sheet
          const summarySheet = XLSX.utils.json_to_sheet(summaryData);
          XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
          
          // Add Raw Materials sheet
          const rawMaterialsSheet = XLSX.utils.json_to_sheet(rawMaterialsData);
          XLSX.utils.book_append_sheet(workbook, rawMaterialsSheet, 'Raw Materials');
          
          // Add Finished Products sheet
          const finishedProductsSheet = XLSX.utils.json_to_sheet(finishedProductsData);
          XLSX.utils.book_append_sheet(workbook, finishedProductsSheet, 'Finished Products');
          
          // Add Low Stock Items sheet
          const lowStockItems = [
            ...rawMaterialsData.filter(item => item.Status === 'Low Stock').map(item => ({ ...item, Type: 'Raw Material' })),
            ...finishedProductsData.filter(item => item.Status === 'Low Stock').map(item => ({ ...item, Type: 'Finished Product' }))
          ];
          const lowStockSheet = XLSX.utils.json_to_sheet(lowStockItems);
          XLSX.utils.book_append_sheet(workbook, lowStockSheet, 'Low Stock Items');
          
          // Export to Excel
          const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
          const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          saveAs(data, `${fileName}.xlsx`);
        }
      } else if (selectedReportType === 'transactions') {
        // Export transaction data
        const transactionsResponse = await dashboardApi.getRecentTransactions(1000);
        
        if (transactionsResponse.data.success) {
          const transactionsData = transactionsResponse.data.data.map((transaction: any) => ({
            'Transaction ID': transaction.id,
            'Date': new Date(transaction.createdAt).toLocaleDateString(),
            'Time': new Date(transaction.createdAt).toLocaleTimeString(),
            'Item ID': transaction.itemId,
            'Item Type': transaction.itemType,
            'Transaction Type': transaction.transactionType,
            'Quantity': transaction.quantity,
            'Unit': transaction.unit,
            'Reference': transaction.reference || '',
            'User': transaction.userName || 'System'
          }));
          
          const workbook = XLSX.utils.book_new();
          const worksheet = XLSX.utils.json_to_sheet(transactionsData);
          XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
          
          const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
          const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          saveAs(data, `transactions-report-${new Date().toISOString().split('T')[0]}.xlsx`);
        }
      } else if (selectedReportType === 'suppliers') {
        // Export supplier data
        const suppliersResponse = await suppliersApi.getAll();
        
        if (suppliersResponse.data.success) {
          const suppliersData = suppliersResponse.data.data.map((supplier: any) => ({
            'Supplier Code': supplier.code,
            'Supplier Name': supplier.name,
            'Contact Person': supplier.contact || '',
            'Phone': supplier.phone || '',
            'Email': supplier.email || '',
            'Address': supplier.address || '',
            'Status': supplier.isActive ? 'Active' : 'Inactive',
            'Created Date': new Date(supplier.createdAt).toLocaleDateString(),
            'Last Updated': new Date(supplier.updatedAt).toLocaleDateString()
          }));
          
          const workbook = XLSX.utils.book_new();
          const worksheet = XLSX.utils.json_to_sheet(suppliersData);
          XLSX.utils.book_append_sheet(workbook, worksheet, 'Suppliers');
          
          const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
          const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          saveAs(data, `suppliers-report-${new Date().toISOString().split('T')[0]}.xlsx`);
        }
      } else if (selectedReportType === 'financial') {
        // Export financial summary
        const [rawMaterialsResponse, finishedProductsResponse, statsResponse] = await Promise.all([
          rawMaterialsApi.getAll(),
          finishedProductsApi.getAll(),
          dashboardApi.getStats()
        ]);
        
        if (rawMaterialsResponse.data.success && finishedProductsResponse.data.success) {
          const rawMaterialsValue = rawMaterialsResponse.data.data.reduce((sum: number, item: any) => 
            sum + (item.currentStock * item.price), 0);
          const finishedProductsValue = finishedProductsResponse.data.data.reduce((sum: number, item: any) => 
            sum + (item.currentStock * item.price), 0);
          const totalInventoryValue = rawMaterialsValue + finishedProductsValue;
          
          const financialData = [
            { 'Category': 'Raw Materials', 'Total Items': rawMaterialsResponse.data.data.length, 'Total Value': rawMaterialsValue },
            { 'Category': 'Finished Products', 'Total Items': finishedProductsResponse.data.data.length, 'Total Value': finishedProductsValue },
            { 'Category': 'Total Inventory', 'Total Items': rawMaterialsResponse.data.data.length + finishedProductsResponse.data.data.length, 'Total Value': totalInventoryValue }
          ];
          
          // Detailed breakdown
          const detailData = [
            ...rawMaterialsResponse.data.data.map((item: any) => ({
              'Type': 'Raw Material',
              'Code': item.code,
              'Name': item.name,
              'Current Stock': item.currentStock,
              'Unit Price': item.price,
              'Total Value': item.currentStock * item.price
            })),
            ...finishedProductsResponse.data.data.map((item: any) => ({
              'Type': 'Finished Product',
              'Code': item.code,
              'Name': item.name,
              'Current Stock': item.currentStock,
              'Unit Price': item.price,
              'Total Value': item.currentStock * item.price
            }))
          ];
          
          const workbook = XLSX.utils.book_new();
          
          // Summary sheet
          const summarySheet = XLSX.utils.json_to_sheet(financialData);
          XLSX.utils.book_append_sheet(workbook, summarySheet, 'Financial Summary');
          
          // Detailed sheet
          const detailSheet = XLSX.utils.json_to_sheet(detailData);
          XLSX.utils.book_append_sheet(workbook, detailSheet, 'Detailed Breakdown');
          
          const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
          const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          saveAs(data, `financial-report-${new Date().toISOString().split('T')[0]}.xlsx`);
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

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  const transactionReport = generateTransactionReport();
  const supplierReport = generateSupplierReport();

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
                    {inventoryReport.rawMaterials.map((item: any, index: number) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.currentStock.toLocaleString()} {item.unit}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.minStock} / {item.maxStock} {item.unit}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.currentStock === 0 
                              ? 'bg-red-100 text-red-800' 
                              : item.currentStock <= item.minStock
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {item.currentStock === 0 ? 'Out of Stock' : item.currentStock <= item.minStock ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.value)}</td>
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
                    {inventoryReport.finishedProducts.map((item: any, index: number) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.currentStock.toLocaleString()} {item.unit}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.minStock} / {item.maxStock} {item.unit}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.currentStock <= item.minStock ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {item.currentStock <= item.minStock ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.value)}</td>
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
          <Card title={`Transaction Summary - ${transactionReport.period}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Inbound</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Raw Materials:</span>
                    <span className="font-medium">{transactionReport.stockIn.rawMaterials.count} transactions</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Quantity:</span>
                    <span className="font-medium">{transactionReport.stockIn.rawMaterials.totalQuantity.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Value:</span>
                    <span className="font-medium text-green-600">{formatCurrency(transactionReport.stockIn.rawMaterials.totalValue)}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between">
                    <span>Finished Products:</span>
                    <span className="font-medium">{transactionReport.stockIn.finishedProducts.count} transactions</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Quantity:</span>
                    <span className="font-medium">{transactionReport.stockIn.finishedProducts.totalQuantity.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Value:</span>
                    <span className="font-medium text-green-600">{formatCurrency(transactionReport.stockIn.finishedProducts.totalValue)}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Outbound</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Raw Materials:</span>
                    <span className="font-medium">{transactionReport.stockOut.rawMaterials.count} transactions</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Quantity:</span>
                    <span className="font-medium">{transactionReport.stockOut.rawMaterials.totalQuantity.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Value:</span>
                    <span className="font-medium text-red-600">{formatCurrency(transactionReport.stockOut.rawMaterials.totalValue)}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between">
                    <span>Finished Products:</span>
                    <span className="font-medium">{transactionReport.stockOut.finishedProducts.count} transactions</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Quantity:</span>
                    <span className="font-medium">{transactionReport.stockOut.finishedProducts.totalQuantity.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Value:</span>
                    <span className="font-medium text-red-600">{formatCurrency(transactionReport.stockOut.finishedProducts.totalValue)}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Supplier Performance Report */}
        {selectedReportType === 'suppliers' && (
          <Card title="Supplier Performance Analysis">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Orders</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">On-Time Delivery</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quality Rating</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Delivery</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {supplierReport.map((supplier, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{supplier.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{supplier.totalOrders}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(supplier.totalValue)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          supplier.onTimeDelivery >= 95 ? 'bg-green-100 text-green-800' :
                          supplier.onTimeDelivery >= 85 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {supplier.onTimeDelivery}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <span>⭐ {supplier.qualityRating}/5.0</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.lastDelivery}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Financial Summary */}
        {selectedReportType === 'financial' && (
          <Card title="Financial Summary">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{formatCurrency(inventoryReport.totalValue)}</div>
                <div className="text-sm text-gray-600">Total Inventory Value</div>
              </div>
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{formatCurrency(650000000)}</div>
                <div className="text-sm text-gray-600">Total Inbound Value</div>
                <div className="text-xs text-gray-500">Last {selectedPeriod} days</div>
              </div>
              <div className="text-center p-6 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{formatCurrency(385000000)}</div>
                <div className="text-sm text-gray-600">Total Outbound Value</div>
                <div className="text-xs text-gray-500">Last {selectedPeriod} days</div>
              </div>
              <div className="text-center p-6 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{formatCurrency(265000000)}</div>
                <div className="text-sm text-gray-600">Net Movement</div>
                <div className="text-xs text-gray-500">Last {selectedPeriod} days</div>
              </div>
            </div>
          </Card>
        )}

        {/* Alerts & Recommendations */}
        <Card title="Alerts & Recommendations">
          <div className="space-y-4">
            {dashboardData?.alerts.map((alert: Alert) => (
              <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${
                alert.severity === 'CRITICAL' ? 'bg-red-50 border-red-400' : 'bg-yellow-50 border-yellow-400'
              }`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-lg">
                      {alert.severity === 'CRITICAL' ? '🚨' : '⚠️'}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      alert.severity === 'CRITICAL' ? 'text-red-800' : 'text-yellow-800'
                    }`}>
                      {alert.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(alert.createdAt).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="p-4 rounded-lg border-l-4 bg-blue-50 border-blue-400">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-lg">💡</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-800">
                    Recommendation: Consider placing orders for low stock items to maintain production continuity.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    System Generated Recommendation
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
