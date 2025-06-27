import React, { useEffect,useState } from "react";
import ProductCard from "./ProductCard";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { fetchProducts } from "@/app/redux/slices/ProductSlice";
import axios from 'axios';

const HomeProducts = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const STALE_TIME = 60 * 1000; // 1 minute - same as all-products page
 const { items: products, status, hasFetched, lastFetched } = useSelector((state) => state.products);
  const loading = status === 'loading';
  const [reviewSummaries, setReviewSummaries] = useState({});

   
  
   // Fetch products if not already fetched, or if cache is stale, or if products are empty
  useEffect(() => {
    const now = Date.now();
 const isStale = !lastFetched || (now - lastFetched > STALE_TIME);
    
    if (!hasFetched || isStale || !products || products.length === 0) {
     
      dispatch(fetchProducts());
    }
  }, [dispatch, hasFetched, lastFetched, products]);

  // Fetch review summaries after products are loaded
  useEffect(() => {
    if (products && products.length > 0) {
      const fetchReviewSummaries = async () => {
        try {
          const productIds = products.map(p => p._id);
          const { data } = await axios.post('/api/review/summary', { productIds });
          if (data.success) {
            setReviewSummaries(data.summary);
          }
        } catch (error) {
          console.error('Failed to fetch review summaries', error);
        }
      };
      fetchReviewSummaries();
    }
  }, [products]);

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
        {products.map((product, index) => (
          <ProductCard
            key={index}
            product={product}
            reviewSummary={reviewSummaries[product._id]}
          />
        ))}
      </div>
      <button onClick={() => { router.push('/all-products') }} className="px-12 py-2.5 border rounded text-gray-500/70 hover:bg-slate-50/90 transition">
        See more
      </button>
    </div>
  );
};

export default HomeProducts;

