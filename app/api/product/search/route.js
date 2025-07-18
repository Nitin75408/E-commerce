import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Product from "@/models/Product";

// This API endpoint handles product search requests by keyword (q)
export async function GET(req) {
  // 1. Connect to MongoDB database
  await connectDB();

  // 2. Parse query parameters from the request URL
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || ""; // The search keyword
  const limit = parseInt(searchParams.get("limit")) || 10;

  // 3. Build the MongoDB query object
  //    - $or: matches if the keyword appears in name, brand, or description (case-insensitive, partial match)
  const query = {
    $or: [
      { name: { $regex: q, $options: "i" } }, // Match in product name
      { brand: { $regex: q, $options: "i" } }, // Match in brand
      { description: { $regex: q, $options: "i" } }, // Match in description
    ],
  };

  try {
    // 4. Query the Product collection in MongoDB, limit results, sort by relevance (name match first)
    const products = await Product.find(query)
      .sort({
        // Prioritize name matches, then brand, then description
        name: { $regex: q, $options: "i" } ? -1 : 0,
        brand: { $regex: q, $options: "i" } ? -1 : 0,
        // fallback: newest first
        date: -1,
      })
      .limit(limit)
      .lean();
    // 5. Return the matching products as JSON
    return NextResponse.json(products);
  } catch (error) {
    // 6. Handle errors and return a JSON error message
    return NextResponse.json({ success: false, message: error.message });
  }
} 