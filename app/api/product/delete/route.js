import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";
import Product from "@/models/Product";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function DELETE(request) {
    try {
        const { userId } = getAuth(request);
        if (!authSeller(userId)) {
            return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
        }

        const { productId } = await request.json();

        if (!productId) {
            return NextResponse.json({ success: false, message: 'Product ID is required' }, { status: 400 });
        }

        await connectDB();

        const product = await Product.findById(productId);

        if (!product) {
            return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
        }

        if (product.userId !== userId) {
            return NextResponse.json({ success: false, message: 'You are not authorized to delete this product' }, { status: 403 });
        }

        await Product.findByIdAndDelete(productId);

        return NextResponse.json({ success: true, message: 'Product deleted successfully' });

    } catch (error) {
        console.error("Error deleting product:", error);
        return NextResponse.json({ success: false, message: "An error occurred while deleting the product." }, { status: 500 });
    }
}
