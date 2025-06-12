import { inngest } from "@/config/inngest";
import Product from "@/models/Product";
import { User } from "@/models/user";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const { address, items } = await request.json();

    if (!address || !items || items.length === 0) {
      return NextResponse.json({ success: false, message: "Invalid data" });
    }

    // ✅ Calculate amount correctly using Promise.all
    const prices = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findById(item.product);
        if (!product) throw new Error("Product not found");
        return product.offerPrice * item.quantity;
      })
    );
    const amount = prices.reduce((acc, curr) => acc + curr, 0);
    const totalAmount = amount + Math.floor(amount * 0.02); // e.g., 2% fee

    // ✅ Trigger Inngest
    await inngest.send({
      name: "order/created",
      data: {
        userId,
        address,
        items,
        amount: totalAmount,
        date: Date.now(),
      },
    });

    // ✅ Clear user cart (if using Clerk ID as _id)
    const user = await User.findById(userId) // or .findById(userId) if clerkId is _id
    if (user) {
      user.cartItems = {};
      await user.save();
    }

    return NextResponse.json({ success: true, message: "Order placed successfully" });

  } catch (error) {
    console.error("Order error:", error);
    return NextResponse.json({ success: false, message: error.message });
  }
}
