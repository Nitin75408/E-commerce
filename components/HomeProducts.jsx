import React, { useEffect } from "react";
import ProductCard from "./ProductCard";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { fetchProducts } from "@/app/redux/slices/ProductSlice";

const HomeProducts = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const { items: products, status, hasFetched } = useSelector((state) => state.products);
  const loading = status === 'loading';
  
  console.log('HomeProducts - products:', products?.length);
  console.log('HomeProducts - hasFetched:', hasFetched);
  
  // Fetch products if not already fetched
  useEffect(() => {
    if (!hasFetched) {
      console.log('HomeProducts - Fetching products...');
      dispatch(fetchProducts());
    }
  }, [dispatch, hasFetched]);
  
  // Safety check for undefined products
  if (loading) {
    return (
      <div className="flex flex-col items-center pt-14">
        <p className="text-2xl font-medium text-left w-full">Popular products</p>
        <div className="flex justify-center items-center h-32">
          <p className="text-gray-500">Loading products...</p>
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center pt-14">
        <p className="text-2xl font-medium text-left w-full">Popular products</p>
        <div className="flex justify-center items-center h-32">
          <p className="text-gray-500">No products available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center pt-14">
      <p className="text-2xl font-medium text-left w-full">Popular products</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 flex-col items-center gap-6 mt-6 pb-14 w-full">
        {products.map((product, index) => <ProductCard key={index} product={product} />)}
      </div>
      <button onClick={() => { router.push('/all-products') }} className="px-12 py-2.5 border rounded text-gray-500/70 hover:bg-slate-50/90 transition">
        See more
      </button>
    </div>
  );
};

export default HomeProducts;
