import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";
import Address from "@/models/address";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { userId } = getAuth(request);

    const isSeller = await authSeller(userId);
    if (!isSeller) {
      return NextResponse.json({ success: false, message: "Not authorized" }, { status: 403 });
    }

    await connectDB();

    // First, get all products created by this seller
    const sellerProducts = await Product.find({ userId: userId });
    const sellerProductIds = sellerProducts.map(product => product._id.toString());

    // Then, find orders that contain any of the seller's products
    const orders = await Order.find({
      'items.product': { $in: sellerProductIds }
    }).populate('address items.product');

    // Filter out deleted products from order items
    const filteredOrders = orders
      .map(order => {
        const filteredItems = order.items.filter(item => item.product !== null);
        return { ...order.toObject(), items: filteredItems };
      })
      .filter(order => order.items.length > 0);

    console.log(`Found ${filteredOrders.length} orders for seller ${userId} with ${sellerProductIds.length} products`);

    return NextResponse.json({ success: true, orders: filteredOrders });
  } catch (error) {
    console.error("Seller orders API error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}