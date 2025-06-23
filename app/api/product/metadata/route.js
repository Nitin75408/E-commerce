import connectDB from "@/config/db";
import Product from "@/models/Product";
import { NextResponse } from "next/server";

export async function GET(request) {
    try {
        await connectDB();

        // Use a single, efficient aggregation query to get all metadata at once.
        const metadata = await Product.aggregate([
            {
                $group: {
                    _id: null, // Group all documents together
                    minPrice: { $min: "$offerPrice" },
                    maxPrice: { $max: "$offerPrice" },
                    categories: { $addToSet: "$category" } // Collect unique category values
                }
            }
        ]);

        if (metadata.length === 0) {
            // If there are no products, return default values.
            return NextResponse.json({
                success: true,
                data: { minPrice: 0, maxPrice: 1000, categories: [] }
            });
        }

        const { minPrice, maxPrice, categories } = metadata[0];

        // Return the calculated min/max prices and sorted categories.
        return NextResponse.json({
            success: true,
            data: {
                minPrice: Math.floor(minPrice),
                maxPrice: Math.ceil(maxPrice),
                categories: categories.sort() // Sort categories alphabetically for clean display
            }
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message });
    }
} 