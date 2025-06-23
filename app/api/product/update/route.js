import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";
import Product from "@/models/Product";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadImage(file) {
  const fileBuffer = await file.arrayBuffer();
  var mime = file.type; 
  var encoding = 'base64'; 
  var base64Data = Buffer.from(fileBuffer).toString('base64');
  var fileUri = 'data:' + mime + ';' + encoding + ',' + base64Data;
  const result = await cloudinary.uploader.upload(fileUri, { folder: "quikart" });
  return result.secure_url;
}

export async function PUT(request) {
    try {
        const { userId } = getAuth(request);
        if (!authSeller(userId)) {
            return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const productId = formData.get('productId');
        
        const updatedData = {
            name: formData.get('name'),
            description: formData.get('description'),
            price: formData.get('price'),
            offerPrice: formData.get('offerPrice'),
            category: formData.get('category'),
        };

        const imageFiles = formData.getAll('images');

        await connectDB();

        const product = await Product.findById(productId);
        if (!product) {
            return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
        }
        if (product.userId !== userId) {
            return NextResponse.json({ success: false, message: 'Not authorized to update this product' }, { status: 403 });
        }

        if (imageFiles && imageFiles.length > 0) {
            const imageUrls = await Promise.all(imageFiles.map(uploadImage));
            updatedData.image = imageUrls.filter(url => url); // Filter out any potential nulls
        }

        const updatedProduct = await Product.findByIdAndUpdate(productId, updatedData, { new: true });

        return NextResponse.json({ success: true, message: 'Product updated successfully', product: updatedProduct });

    } catch (error) {
        console.error("Error updating product:", error);
        return NextResponse.json({ success: false, message: "An error occurred while updating the product." }, { status: 500 });
    }
}
