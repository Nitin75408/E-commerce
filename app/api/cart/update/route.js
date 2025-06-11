import connectDB from "@/config/db";
import { User } from "@/models/user";
import { getAuth } from "@clerk/nextjs/server";
import { connect } from "mongoose";
import { NextResponse } from "next/server";




export async function POST(request){
    try {
        const {userId} = getAuth(request);
        const {cartdata}=await request.json();
    await connectDB();
    const user = await User.findById(userId);
    user.cartItems = cartdata;
    user.save();

   return NextResponse.json({success:true});
    } catch (error) {
        
   return NextResponse.json({success:false,message:error.message});
    }
}