import connectDB from "@/config/db";
import Product from "@/models/Product";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    await connectDB();

    if (id) {
      // Fetch single product
      const product = await Product.findById(id).lean();
      if (!product) {
        return NextResponse.json({ success: false, message: "Product not found", products: [] });
      }
      return NextResponse.json({ success: true, products: [product] });
    }

    // ✅ Pagination params
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 5; // ✅ Accept dynamic limit
    const skip = (page - 1) * limit;

    // ✅ Filter params
    const categories = searchParams.get("categories");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");

    let query = {};
    if (categories) {
      query.category = { $in: categories.split(",") };
    }
    if (minPrice && maxPrice) {
      query.offerPrice = {
        $gte: parseInt(minPrice),
        $lte: parseInt(maxPrice),
      };
    }

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

    const products = await Product.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const hasMore = skip + products.length < totalProducts;

    return NextResponse.json({
      success: true,
      products,
      total: totalProducts,
      totalPages,
      currentPage: page,
      hasMore,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message });
  }
}
