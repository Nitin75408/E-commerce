import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import Order from '@/models/Order';
import Product from '@/models/Product'; // Import Product model
import connectDB from '@/config/db';
import mongoose from 'mongoose';

/**
 * GET /api/seller/analytics
 * 
 * This API endpoint calculates and returns a comprehensive set of analytics
 * for the seller dashboard. It performs several database aggregations to compute
 * metrics like total sales, order counts, sales trends, and top products.
 * 
 * It ensures the user is authenticated before returning any data.
 */
export async function GET(request) {
  try {
    // Establish a connection to the database.
    console.log('Connecting to database...');
    await connectDB();
    console.log('Database connected successfully');
    
    // Get the authenticated user's ID from the request.
    const { userId } = getAuth(request);
    

    // Block access if the user is not authenticated.
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }

    // --- Time Period Setup ---
    // Define the date ranges for our calculations (this month, last month, etc.).
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());

    console.log('Fetching order statistics...');

    // --- Pre-computation Check ---
    // First, check if there are any orders at all to avoid unnecessary calculations.
    const totalOrdersCount = await Order.countDocuments();
    console.log('Total orders in database:', totalOrdersCount);

    // If there are no orders, return a default "empty" state for the dashboard.
    if (totalOrdersCount === 0) {
      console.log('No orders found, returning empty data');
      const emptyResponseData = {
        totalSales: { value: "₹0.00", percentageChange: "0.0", changeType: "positive" },
        totalOrders: { value: 0, percentageChange: "0.0", changeType: "positive" },
        conversionRate: { value: "0.0%", percentageChange: "0", changeType: "positive" },
        weeklySales: { labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], data: [0, 0, 0, 0, 0, 0, 0] },
        categorySales: { labels: [], data: [] },
        monthlyRevenue: { labels: [], data: [] },
        topProducts: []
      };
      return NextResponse.json({ success: true, data: emptyResponseData });
    }

    // --- 1. Total Sales and Orders This Month ---
    // Aggregate orders within the last month to get total sales and order count.
    const thisMonthStats = await Order.aggregate([
      { $match: { date: { $gte: oneMonthAgo.getTime() } } },
      { $group: { _id: null, totalSales: { $sum: '$amount' }, totalOrders: { $sum: 1 } } },
    ]);

    // --- 2. Total Sales and Orders Last Month (for comparison) ---
    // Do the same for the previous month to calculate percentage change.
    const lastMonthStats = await Order.aggregate([
      { $match: { date: { $gte: twoMonthsAgo.getTime(), $lt: oneMonthAgo.getTime() } } },
      { $group: { _id: null, totalSales: { $sum: '$amount' }, totalOrders: { $sum: 1 } } },
    ]);

    // Extract the results, providing default values if no data exists.
    const salesData = thisMonthStats[0] || { totalSales: 0, totalOrders: 0 };
    const lastMonthSalesData = lastMonthStats[0] || { totalSales: 0, totalOrders: 0 };

    // --- 3. Calculate Percentage Changes ---
    // Calculate the percentage increase or decrease in sales and orders compared to last month.
    const salesChange = lastMonthSalesData.totalSales > 0 ? ((salesData.totalSales - lastMonthSalesData.totalSales) / lastMonthSalesData.totalSales) * 100 : salesData.totalSales > 0 ? 100 : 0;
    const ordersChange = lastMonthSalesData.totalOrders > 0 ? ((salesData.totalOrders - lastMonthSalesData.totalOrders) / lastMonthSalesData.totalOrders) * 100 : salesData.totalOrders > 0 ? 100 : 0;
      
    // --- 4. Product Conversion Rate ---
    // Calculate what percentage of the total products have been sold at least once.
    const totalProducts = await Product.countDocuments();
    const soldProductStats = await Order.aggregate([
        { $unwind: '$items' },
        { $group: { _id: '$items.product' } }, // Find unique products sold
        { $group: { _id: null, count: { $sum: 1 } } } // Count them
    ]);
    const uniqueSoldProducts = soldProductStats[0]?.count || 0;
    const conversionRateValue = totalProducts > 0 ? (uniqueSoldProducts / totalProducts) * 100 : 0;

    // --- 5. Weekly Sales Trends (Last 7 Days) ---
    // Aggregate sales data grouped by the day of the week for the last 7 days.
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    const weeklySales = await Order.aggregate([
        { $match: { date: { $gte: sevenDaysAgo.getTime() } } },
        { $group: { _id: { $dayOfWeek: { $toDate: "$date" } }, dailySales: { $sum: '$amount' } } },
        { $sort: { '_id': 1 } }
    ]);
    // Format the data for the bar chart.
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklySalesData = daysOfWeek.map((day, index) => {
        const sale = weeklySales.find(s => s._id === index + 1);
        return sale ? sale.dailySales : 0;
    });

    // --- 6. Category Sales Distribution ---
    // Calculate the total sales for each product category.
    const categorySales = await Order.aggregate([
        { $unwind: '$items' }, // Deconstruct the items array
        // Join with the 'products' collection to get product details.
        {
            $lookup: {
                from: 'products',
                // Convert the product ID string from the order to an ObjectId for matching.
                let: { productId: { $toObjectId: '$items.product' } },
                pipeline: [ { $match: { $expr: { $eq: ['$_id', '$$productId'] } } } ],
                as: 'productDetails'
            }
        },
        { $unwind: '$productDetails' },
        {
            // Group by category and sum the sales for each item.
            // This is calculated as quantity * price for accuracy.
            $group: {
                _id: '$productDetails.category',
                totalSales: { $sum: { $multiply: [ '$items.quantity', '$productDetails.offerPrice' ] } }
            }
        },
        { $project: { category: '$_id', totalSales: 1, _id: 0 } }
    ]);

    // --- 7. Monthly Revenue Progression (Last 6 Months) ---
    // Aggregate sales data grouped by month for the last 6 months.
    const sixMonthsAgoEnd = new Date();
    sixMonthsAgoEnd.setMonth(now.getMonth() - 6);
    const monthlyRevenueRaw = await Order.aggregate([
        { $match: { date: { $gte: sixMonthsAgoEnd.getTime() } } },
        { $group: { _id: { year: { $year: { $toDate: "$date" } }, month: { $month: { $toDate: "$date" } } }, monthlySales: { $sum: '$amount' } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    // Format the data for the line chart, ensuring all 6 months are present, even with 0 sales.
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyRevenueData = { labels: [], data: [] };
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const monthName = monthNames[d.getMonth()];
        monthlyRevenueData.labels.push(monthName);
        const saleData = monthlyRevenueRaw.find(item => item._id.year === year && item._id.month === month);
        monthlyRevenueData.data.push(saleData ? saleData.monthlySales : 0);
    }
    
    // --- 8. Top Selling Products ---
    // Find the top 3 most frequently sold products.
    const topProducts = await Order.aggregate([
        { $unwind: '$items' },
        { $group: { _id: '$items.product', count: { $sum: '$items.quantity' } } }, // Sum quantities for each product
        { $sort: { count: -1 } }, // Sort by most sold
        { $limit: 3 }, // Take the top 3
        // Join with 'products' to get full product details.
        {
            $lookup: {
                from: 'products',
                let: { productId: { $toObjectId: '$_id' } },
                pipeline: [ { $match: { $expr: { $eq: ['$_id', '$$productId'] } } } ],
                as: 'productDetails'
            }
        },
        { $unwind: '$productDetails' },
        { $project: { _id: '$productDetails._id', name: '$productDetails.name', image: '$productDetails.image' } }
    ]);

    // --- Final Response ---
    // Assemble all the calculated data into a single response object.
    const responseData = {
      totalSales: { value: `₹${salesData.totalSales.toFixed(2)}`, percentageChange: salesChange.toFixed(1), changeType: salesChange >= 0 ? 'positive' : 'negative' },
      totalOrders: { value: salesData.totalOrders, percentageChange: ordersChange.toFixed(1), changeType: ordersChange >= 0 ? 'positive' : 'negative' },
      conversionRate: { value: `${conversionRateValue.toFixed(1)}%`, percentageChange: "0", changeType: "positive" },
      weeklySales: { labels: daysOfWeek, data: weeklySalesData },
      categorySales: { labels: categorySales.map(c => c.category), data: categorySales.map(c => c.totalSales) },
      monthlyRevenue: monthlyRevenueData,
      topProducts: topProducts
    };

    // Return the successful response.
    console.log('Sending response:', responseData);
    return NextResponse.json({ success: true, data: responseData });

  } catch (error) {
    // If any error occurs, log it and return a server error response.
    console.error('Error fetching seller analytics:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
} 