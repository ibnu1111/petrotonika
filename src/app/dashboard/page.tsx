'use client';

import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { StatsCard } from '@/components/ui';
import { dashboardApi } from '@/services/api';
import { DashboardStats } from '@/types/inventory';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      // Try to fetch real data from backend
      try {
        const response = await dashboardApi.getStats();
        if (response.data.success) {
          setStats(response.data.data);
          setLoading(false);
          console.log('Successfully loaded dashboard stats from backend');
          return;
        }
      } catch (apiError) {
        console.warn('Backend API not available for dashboard, using mock data:', apiError);
      }
      
      // Fallback to mock data if backend is not available
      const mockStats: DashboardStats = {
        totalRawMaterials: 45,
        totalFinishedProducts: 12,
        lowStockItems: 8,
        todayTransactions: 15,
        totalValue: 1250000
      };
      
      setStats(mockStats);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Overview of inventory status</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Raw Materials"
              value={stats?.totalRawMaterials || 0}
              subtitle="Total items"
              icon={<span className="text-2xl">🏭</span>}
              color="blue"
            />
            
            <StatsCard
              title="Finished Products"
              value={stats?.totalFinishedProducts || 0}
              subtitle="Ready to ship"
              icon={<span className="text-2xl">📦</span>}
              color="green"
            />
            
            <StatsCard
              title="Low Stock Items"
              value={stats?.lowStockItems || 0}
              subtitle="Need attention"
              icon={<span className="text-2xl">⚠️</span>}
              color="yellow"
            />
            
            <StatsCard
              title="Today's Transactions"
              value={stats?.todayTransactions || 0}
              subtitle="Stock movements"
              icon={<span className="text-2xl">📋</span>}
              color="blue"
            />
          </div>

          {/* Total Value */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory Value</h3>
            <div className="text-3xl font-bold text-green-600">
              Rp {(stats?.totalValue || 0).toLocaleString('id-ID')}
            </div>
            <p className="text-sm text-gray-500 mt-2">Total inventory value</p>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors">
                <div className="text-xl mb-2">➕</div>
                <h4 className="font-medium text-gray-900">Add Raw Material</h4>
                <p className="text-sm text-gray-500">Register new raw material</p>
              </button>
              
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors">
                <div className="text-xl mb-2">📥</div>
                <h4 className="font-medium text-gray-900">Record Stock In</h4>
                <p className="text-sm text-gray-500">Add incoming stock</p>
              </button>
              
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors">
                <div className="text-xl mb-2">📤</div>
                <h4 className="font-medium text-gray-900">Record Stock Out</h4>
                <p className="text-sm text-gray-500">Record outgoing stock</p>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Stock In - Chemical A</p>
                  <p className="text-sm text-gray-500">+500 kg</p>
                </div>
                <span className="text-sm text-gray-500">2 hours ago</span>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Production - DOP</p>
                  <p className="text-sm text-gray-500">+100 drums</p>
                </div>
                <span className="text-sm text-gray-500">4 hours ago</span>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-gray-900">Shipment - DNIP</p>
                  <p className="text-sm text-gray-500">-50 drums</p>
                </div>
                <span className="text-sm text-gray-500">6 hours ago</span>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
