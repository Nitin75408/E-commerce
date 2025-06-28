import connectDB from "@/config/db";
import Address from "@/models/address";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET(request) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;

    await connectDB();
    let orders = await Order.find({ userId })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    // Filter out orders with invalid address or items.product
    orders = orders.filter(order => {
      // Address must be a valid ObjectId string
      if (!order.address || !mongoose.Types.ObjectId.isValid(order.address)) return false;
      // All items.product must be valid ObjectId strings
      if (!order.items.every(item => mongoose.Types.ObjectId.isValid(item.product))) return false;
      return true;
    });
    
    // Now safely populate
    orders = await Order.populate(orders, { path: 'address items.product' });
    
    // ...rest of your filtering logic...
    const filteredOrders = orders
      .map(order => {
        const filteredItems = order.items.filter(item => item.product !== null);
        return { ...order.toObject(), items: filteredItems };
      })
      .filter(order => order.items.length > 0);
    
    // Get total count for pagination
    const total = await Order.countDocuments({ userId });
    const hasMore = skip + filteredOrders.length < total;

    return NextResponse.json({ 
      success: true, 
      orders: filteredOrders, 
      total, 
      hasMore, 
      currentPage: page 
    });
  } catch (error) {
    console.error("Fetch orders error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
