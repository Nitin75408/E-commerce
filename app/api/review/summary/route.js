import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Review from '@/models/Review';

export async function POST(request) {
  try {
    const { productIds } = await request.json();
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ success: false, message: 'productIds array is required' }, { status: 400 });
    }

    await connectDB();

    // Aggregate reviews for all productIds
    const summaries = await Review.aggregate([
      { $match: { product: { $in: productIds } } },
      {
        $group: {
          _id: '$product',
          avgRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 }
        }
      }
    ]);

    // Convert to { productId: { avgRating, reviewCount } }
    const summaryMap = {};
    for (const s of summaries) {
      summaryMap[s._id] = {
        avgRating: Number(s.avgRating.toFixed(2)),
        reviewCount: s.reviewCount
      };
    }

    return NextResponse.json({ success: true, summary: summaryMap });
  } catch (error) {
    console.error('Error in review summary:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
} 