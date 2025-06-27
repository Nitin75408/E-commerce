import connectDB from '@/config/db';
import Product from '@/models/Product';
import { NextResponse } from 'next/server';
import { inngest } from '@/config/inngest';

export async function PUT(request) {
  try {
    const { productId, status } = await request.json();
    if (!productId || !status) {
      return NextResponse.json({ success: false, message: 'Product ID and status are required.' }, { status: 400 });
    }

    await connectDB();
    const updatedProduct = await Product.findByIdAndUpdate(
         {_id:productId},
        { status } ,
        { new: true }
      );
      

      console.log('Updated product:', updatedProduct);

    if (!updatedProduct) {
      return NextResponse.json({ success: false, message: 'Product not found.' }, { status: 404 });
    }

     // Trigger Inngest event if product is now active
    if (updatedProduct.status === 'active') {
      await inngest.send({
        name: 'product.activated',
        data: { productId: updatedProduct._id.toString() }
      });
    }

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error('Update product status error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
} 