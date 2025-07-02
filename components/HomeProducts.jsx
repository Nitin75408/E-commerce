import React, { useEffect, useState, useRef } from "react";
import ProductCard from "./ProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";
import axios from "axios";

const FALLBACK_PAGE_SIZE = 10;

const HomeProducts = () => {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [reviewSummaries, setReviewSummaries] = useState({});
  const [cardHeight, setCardHeight] = useState(null);
  const [pageSize, setPageSize] = useState(FALLBACK_PAGE_SIZE);
  const observer = useRef();
  const sentinelRef = useRef();
  const firstCardRef = useRef(null);
  const [gridHeight, setGridHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 800);

  // Helper: get column count based on screen width
  const getColumnCount = () => {
    const width = window.innerWidth;
    if (width >= 1280) return 5;
    if (width >= 1024) return 4;
    if (width >= 768) return 3;
    return 2;
  };
  useEffect(() => {
    function updateGridHeight() {
      const navbar = document.querySelector('header');
      const banner = document.querySelector('.banner, [data-banner]');
      const footer = document.querySelector('footer');
      let total = 0;
      if (navbar) total += navbar.offsetHeight;
      if (banner) total += banner.offsetHeight;
      if (footer) total += footer.offsetHeight;
      setGridHeight(window.innerHeight - total);
    }
    updateGridHeight();
    window.addEventListener('resize', updateGridHeight);
    return () => window.removeEventListener('resize', updateGridHeight);
  }, []);

  // Helper: get row count based on card height
  const getRowCount = (cardHeight) => {
    const availableHeight = gridHeight; // adjust for header/footer
    return Math.max(1, Math.floor(availableHeight / cardHeight));
  };

  // Fetch products
  const fetchProducts = async (pageNum = 1, pageSizeOverride = pageSize) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/product/list?page=${pageNum}&limit=${pageSizeOverride}`);
      if (data.success) {
        if (pageNum === 1) {
          setProducts(data.products);
        } else {
          setProducts((prev) => [...prev, ...data.products]);
        }
        setHasMore(data.hasMore);

        const productIds = data.products.map((p) => p._id);
        if (productIds.length > 0) {
          const { data: reviewData } = await axios.post("/api/review/summary", { productIds });
          if (reviewData.success) {
            setReviewSummaries((prev) => ({ ...prev, ...reviewData.summary }));
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchProducts(1);
  }, []);

  // Measure the first card's height
  useEffect(() => {
    if (firstCardRef.current && !cardHeight) {
      setCardHeight(firstCardRef.current.offsetHeight);
    }
  }, [products, loading]);

  // Recalculate page size based on card height and screen width
  useEffect(() => {
    const recalculatePageSize = () => {
      if (cardHeight) {
        const columns = getColumnCount();
        const rows = getRowCount(cardHeight);
        const calculatedPageSize = rows * columns;

        if (calculatedPageSize !== pageSize) {
          setPageSize(calculatedPageSize);
          fetchProducts(1, calculatedPageSize); // Refetch with new size
        }
      }
    };

    recalculatePageSize();

    const handleResize = () => {
      recalculatePageSize();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [cardHeight]);

  // Infinite scroll
  useEffect(() => {
    if (loading || !hasMore) return;

    const currentSentinel = sentinelRef.current;
    if (!currentSentinel) return;

    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        setPage((prev) => prev + 1);
      }
    });

    observer.current.observe(currentSentinel);
    return () => observer.current && observer.current.disconnect();
  }, [loading, hasMore, products]);

  // Fetch next page on scroll
  useEffect(() => {
    if (page === 1) return;
    fetchProducts(page);
  }, [page]);

  // Show skeletons on initial load
  if (loading && products.length === 0) {
    return (
      <div className="flex flex-col items-center pt-14">
        <p className="text-2xl font-medium text-left w-full">Popular products</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-6 pb-14 w-full">
          {Array.from({ length: FALLBACK_PAGE_SIZE * 2 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // No products state
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

  // Render products
  return (
    <div className="flex flex-col items-center pt-14">
      <p className="text-2xl font-medium text-left w-full">Popular products</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-6 pb-14 w-full">
        {products.map((product, index) => (
          <div ref={index === 0 ? firstCardRef : null} key={product._id || index}>
            <ProductCard product={product} reviewSummary={reviewSummaries[product._id]} />
          </div>
        ))}
        {loading && products.length > 0 &&
          Array.from({ length: pageSize }).map((_, i) => (
            <ProductCardSkeleton key={`loadmore-${i}`} />
          ))}
      </div>
      <div ref={sentinelRef} style={{ height: 1 }} />
      {!hasMore && <p className="text-gray-400 mt-4">No more products to load.</p>}
    </div>
  );
};

export default HomeProducts;

