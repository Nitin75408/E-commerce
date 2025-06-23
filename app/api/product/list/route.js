import connectDB from "@/config/db";
import Product from "@/models/Product";
import { NextResponse } from "next/server";

export async function GET(request){
    try {
        const { searchParams } = new URL(request.url);
        
        // Pagination parameters
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        // Filter parameters
        const categories = searchParams.get('categories');
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');

        await connectDB();

        // Build the filter query
        let query = {};
        if (categories) {
            query.category = { $in: categories.split(',') };
        }
        if (minPrice && maxPrice) {
            query.offerPrice = { $gte: parseInt(minPrice), $lte: parseInt(maxPrice) };
        }

        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limit);
        
        const products = await Product.find(query)
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
            
        return NextResponse.json({
            success: true,
            products,
            totalPages,
            currentPage: page
        });
        
    } catch (error) {
        return NextResponse.json({success:false,message : error.message})
    }
}