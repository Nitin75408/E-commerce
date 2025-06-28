import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";
import Address from "@/models/address";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET(request) {
  try {
    const { userId } = getAuth(request);

    const isSeller = await authSeller(userId);
    if (!isSeller) {
      return NextResponse.json({ success: false, message: "Not authorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;

    await connectDB();

    // First, get all products created by this seller
    const sellerProducts = await Product.find({ userId: userId });
    const sellerProductIds = sellerProducts.map(product => product._id.toString());

    // Then, find orders that contain any of the seller's products
    let orders = await Order.find({
      'items.product': { $in: sellerProductIds }
    })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    // Filter out orders with invalid address or items.product
    orders = orders.filter(order => {
      if (!order.address || !mongoose.Types.ObjectId.isValid(order.address)) return false;
      if (!order.items.every(item => mongoose.Types.ObjectId.isValid(item.product))) return false;
      return true;
    });

    // Now safely populate
    orders = await Order.populate(orders, { path: 'address items.product' });

    // Filter out deleted products from order items
    const filteredOrders = orders
      .map(order => {
        const filteredItems = order.items.filter(item => item.product !== null);
        return { ...order.toObject(), items: filteredItems };
      })
      .filter(order => order.items.length > 0);

    // Get total count for pagination
    const total = await Order.countDocuments({ 'items.product': { $in: sellerProductIds } });
    const hasMore = skip + filteredOrders.length < total;

    console.log(`Found ${filteredOrders.length} orders for seller ${userId} with ${sellerProductIds.length} products`);

    return NextResponse.json({ 
      success: true, 
      orders: filteredOrders, 
      total, 
      hasMore, 
      currentPage: page 
    });
  } catch (error) {
    console.error("Seller orders API error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}