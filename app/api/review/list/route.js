import { NextResponse } from 'next/server';
import connectDB from "@/config/db";
import Review from '@/models/Review';
import { User } from "@/models/user";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ success: false, message: 'Product ID is required' });
    }

    await connectDB();

    const reviews = await Review.find({ product: productId }).sort({ createdAt: -1 });

    // Get user information for each review
    const reviewsWithUser = await Promise.all(
      reviews.map(async (review) => {
        const user = await User.findById(review.userId);
        return {
          ...review.toObject(),
          user: {
            name: user ? user.name : 'Unknown User',
            image: user ? user.imageUrl : '/default-avatar.png'
          }
        };
      })
    );

    return NextResponse.json({ 
      success: true, 
      reviews: reviewsWithUser 
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ success: false, message: error.message });
  }
} 