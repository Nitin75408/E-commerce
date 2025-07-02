import connectDB from "@/config/db";
import ProductModel from "@/models/Product";
import ReviewModel from "@/models/Review";
import ProductClient from "./ProductClient";

export const revalidate = 60; // Revalidate every 60 seconds

// Server-side fetch for product and review summary
async function fetchProductAndReview(id) {
  await connectDB();
  const product = await ProductModel.findById(id).lean();
  if (!product) return { product: null, reviewSummary: null };
  // Aggregate review summary
  const summary = await ReviewModel.aggregate([
    { $match: { product: id } },
    {
      $group: {
        _id: "$product",
        avgRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);
  let reviewSummary = null;
  if (summary.length > 0) {
    reviewSummary = {
      avgRating: Number(summary[0].avgRating.toFixed(2)),
      reviewCount: summary[0].reviewCount,
    };
  }
  // Convert _id to string and ensure plain object
  const plainProduct = {
    ...product,
    _id: product._id.toString(),
  };
  return { product: plainProduct, reviewSummary };
}

export async function generateStaticParams() {
  await connectDB();
  const products = await ProductModel.find({}, { _id: 1 }).lean();
  return products.map(product => ({ id: product._id.toString() }));
}

const Product = async ({ params }) => {
  const { id } =  await params;
  const { product: productData, reviewSummary } = await fetchProductAndReview(id);
  return <ProductClient productData={productData} reviewSummary={reviewSummary} />;
};

export default Product;
