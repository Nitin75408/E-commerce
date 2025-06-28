import React, { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import axios from 'axios';

const HomeProducts = () => {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [reviewSummaries, setReviewSummaries] = useState({});

  // Fetch products for the current page
  const fetchProducts = async (pageNum = 1) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/product/list?page=${pageNum}`);
      if (data.success) {
        if (pageNum === 1) {
          setProducts(data.products);
        } else {
          setProducts(prev => [...prev, ...data.products]);
        }
        setHasMore(data.hasMore);
        // Fetch review summaries for new products
        const productIds = data.products.map(p => p._id);
        if (productIds.length > 0) {
          const { data: reviewData } = await axios.post('/api/review/summary', { productIds });
          if (reviewData.success) {
            setReviewSummaries(prev => ({ ...prev, ...reviewData.summary }));
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchProducts(1);
  }, []);

  // Load more handler
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(nextPage);
  };

  if (loading && products.length === 0) {
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
            key={product._id || index}
            product={product}
            reviewSummary={reviewSummaries[product._id]}
          />
        ))}
      </div>
      {hasMore ? (
        <button
          onClick={handleLoadMore}
          className="px-12 py-2.5 border rounded text-gray-500/70 hover:bg-slate-50/90 transition mt-4"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Load More'}
        </button>
      ) : (
        <p className="text-gray-400 mt-4">No more products to load.</p>
      )}
    </div>
  );
};

export default HomeProducts;
