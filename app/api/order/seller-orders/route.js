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

    const orders = await Order.find({ }).populate('address items.product');

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error("Seller orders API error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}