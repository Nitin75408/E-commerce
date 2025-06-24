import connectDB from "@/config/db";
import { User } from "@/models/user";
import { getAuth } from "@clerk/nextjs/server";
import { connect } from "mongoose";
import { NextResponse } from "next/server";




export async function POST(request){
    try {
        const {userId} = getAuth(request);
        const {cartdata}=await request.json();
        console.log('Received cartdata from frontend:', cartdata);
    await connectDB();
    let user = await User.findById(userId);
    if (!user) {
        // Fallbacks for name, email, imageUrl
        const name = request.headers.get('x-user-name') || 'Unknown';
        const email = request.headers.get('x-user-email') || `${userId}@unknown.com`;
        const imageUrl = request.headers.get('x-user-image') || '';
        user = await User.create({
            _id: userId,
            name,
            email,
            imageUrl,
            cartItems: {}
        });
    }
    user.cartItems = { ...cartdata };
    console.log('Saving cartItems to MongoDB:', user.cartItems);
    await user.save();

   return NextResponse.json({success:true});
    } catch (error) {
        
   return NextResponse.json({success:false,message:error.message});
    }
}