'use client';
import React, { useState, useEffect } from 'react';
import StatCard from '@/components/seller/StatCard';
import { assets } from '@/assets/assets';
import WeeklySalesChart from '@/components/seller/WeeklySalesChart';
import CategorySalesChart from '@/components/seller/CategorySalesChart';
import MonthlyRevenueChart from '@/components/seller/MonthlyRevenueChart';
import TopProductsCard from '@/components/seller/TopProductsCard';
import FullScreenLoader from '@/components/FullScreenLoader'; // Assuming you have a loader

/**
 * SellerDashboard component
 * 
 * This is the main page component for the seller analytics dashboard.
 * It orchestrates the fetching of analytics data and renders the various
 * charts and statistics cards.
 */
const SellerDashboard = () => {
  // State to manage the loading status of the dashboard.
  const [loading, setLoading] = useState(true);
  // State to store the analytics data once fetched from the API.
  const [analyticsData, setAnalyticsData] = useState(null);

  // useEffect hook to fetch analytics data when the component mounts.
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/seller/analytics');
        const result = await response.json();
        
        if (result.success) {
          // If the API call is successful, store the data.
          setAnalyticsData(result.data);
        } else {
          // Log an error if the API returns a failure.
          console.error('API returned error:', result.message);
        }
      } catch (error) {
        console.error("Failed to fetch analytics data:", error);
      } finally {
        // Set loading to false once the fetch is complete (either success or fail).
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []); // The empty dependency array ensures this runs only once on mount.

  // While data is loading, display a full-screen loader.
  if (loading) {
    return <FullScreenLoader message="Loading dashboard..." />;
  }

  // If data fetching fails and analyticsData is null, show an error message.
  if (!analyticsData) {
    return <div className="p-8 text-center text-red-500">Failed to load dashboard data.</div>;
  }

  // Once data is loaded, render the main dashboard layout.
  return (
    <div className="bg-gray-50/50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Seller Analytics Dashboard</h1>
        
        {/* Stat Cards Grid: Displays key performance indicators. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard 
            title="Total Sales This Month"
            value={analyticsData.totalSales.value}
            icon={assets.dollar_icon}
            percentageChange={analyticsData.totalSales.percentageChange}
            changeType={analyticsData.totalSales.changeType}
          />
          <StatCard 
            title="Total Orders"
            value={analyticsData.totalOrders.value}
            icon={assets.orders_bag_icon}
            percentageChange={analyticsData.totalOrders.percentageChange}
            changeType={analyticsData.totalOrders.changeType}
          />
          <StatCard 
            title="Conversion Rate"
            value={analyticsData.conversionRate.value}
            icon={assets.conversion_icon}
            percentageChange={analyticsData.conversionRate.percentageChange}
            changeType={analyticsData.conversionRate.changeType}
          />
        </div>
        
        {/* Charts Section: Visual representations of sales data. */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <WeeklySalesChart chartData={analyticsData.weeklySales} />
          </div>
          <div className="lg:col-span-1">
            <CategorySalesChart chartData={analyticsData.categorySales} />
          </div>
        </div>
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <MonthlyRevenueChart chartData={analyticsData.monthlyRevenue} />
            </div>
            <div className="lg:col-span-1">
                <TopProductsCard topProducts={analyticsData.topProducts} />
            </div>
        </div>
        
      </div>
    </div>
  );
};

export default SellerDashboard; 