'use client';
import React, { useEffect, useState, useRef } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import Footer from "@/components/seller/Footer";
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import OrderCardSkeleton from '@/components/OrderCardSkeleton';

const PAGE_SIZE = 10;

const Orders = () => {
  const currency = process.env.NEXT_PUBLIC_CURRENCY;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const { getToken } = useAuth();
  const { isLoaded, user: clerkUser } = useUser();
  const isSeller = useSelector((state) => state.user.isSeller);
  const hasFetched = useSelector((state) => state.user.hasFetched);

  const sentinelRef = useRef();
  const observer = useRef();
  const firstCardRef = useRef(null);

  const fetchSellerOrders = async (pageNum = 1, append = false, customPageSize = PAGE_SIZE) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      setError(null);
      const token = await getToken();
      if (!token) return setError("No authentication token available");

      const { data } = await axios.get(`/api/order/seller-orders?page=${pageNum}&limit=${customPageSize}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setOrders(prev => pageNum === 1 ? data.orders : [...prev, ...data.orders]);
        setHasMore(data.hasMore);
      } else {
        setError(data.message || 'Failed to fetch orders');
        toast.error(data.message || 'Failed to fetch orders');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      pageNum === 1 ? setLoading(false) : setLoadingMore(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (isLoaded && clerkUser && hasFetched && isSeller) {
      fetchSellerOrders(1, false);
      setPage(1);
    } else if (isLoaded && hasFetched && (!clerkUser || !isSeller)) {
      setLoading(false);
      setError('You are not authorized to view seller orders');
    }
  }, [clerkUser, isSeller, isLoaded, hasFetched]);



  // Infinite scroll
  useEffect(() => {
    if (loadingMore || !hasMore || !sentinelRef.current) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new window.IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    });
    observer.current.observe(sentinelRef.current);
    return () => observer.current.disconnect();
  }, [loadingMore, hasMore, orders]);

  // Fetch next page
  useEffect(() => {
    if (page === 1) return;
    fetchSellerOrders(page, true, PAGE_SIZE);
  }, [page]);

  return (
    <div className="flex-1 h-screen overflow-scroll flex flex-col justify-between text-sm">
      {loading ? (
        <div className="mt-8">{Array.from({ length: 4 }).map((_, i) => <OrderCardSkeleton key={i} />)}</div>
      ) : error ? (
        <div className="md:p-10 p-4">
          <h2 className="text-lg font-medium">Orders</h2>
          <div className="text-red-500 mt-4">{error}</div>
        </div>
      ) : (
        <div className="md:p-10 p-4 space-y-5">
          <h2 className="text-lg font-medium sticky top-0 bg-white z-10 py-2">Orders</h2>
          {orders.length === 0 ? (
            <div className="text-gray-500 mt-4">No orders found.</div>
          ) : (
            <div className="max-w-4xl rounded-md">
              {orders.map((order, index) => (
                <div
                  key={index}
                  ref={index === 0 ? firstCardRef : null}
                  className="flex flex-col md:flex-row gap-5 justify-between p-5 border-t border-gray-300"
                >
                  <div className="flex-1 flex gap-5 max-w-80">
                    <Image className="max-w-16 max-h-16 object-cover" src={assets.box_icon} alt="box_icon" />
                    <p className="flex flex-col gap-2">
                      <span className="font-medium line-clamp-2">
                        {order.items.map((item) => `${item.product.name} x ${item.quantity}`).join(", ")}
                      </span>
                      <span>Items : {order.items.length}</span>
                    </p>
                  </div>
                  <div>
                    {order.address ? (
                      <p className="text-sm leading-relaxed">
                        <span className="font-medium">{order.address.fullName}</span><br />
                        {order.address.area}<br />
                        {`${order.address.city}, ${order.address.state}`}<br />
                        <a href={`tel:${order.address.phoneNumber}`} className="text-blue-600 hover:underline">
                          {order.address.phoneNumber}
                        </a>
                      </p>
                    ) : (
                      <p>User not exist</p>
                    )}
                  </div>
                  <p className="font-medium my-auto">{currency}{order.amount}</p>
                  <div className="text-sm">
                    <p>Method: COD</p>
                    <p>Date: {new Date(order.date).toLocaleDateString()}</p>
                    <p>
                      Payment:
                      <span className="ml-1 px-2 py-1 text-yellow-800 bg-yellow-100 rounded text-xs">
                        Pending
                      </span>
                    </p>
                  </div>
                </div>
              ))}
              {loadingMore &&
                Array.from({ length: PAGE_SIZE }).map((_, i) => <OrderCardSkeleton key={`load-${i}`} />)
              }
              <div ref={sentinelRef} style={{ height: 1 }} />
              {!hasMore && orders.length > 0 && (
                <div className="flex justify-center my-6 text-gray-400">No more orders to load.</div>
              )}
            </div>
          )}
        </div>
      )}
      <Footer />
    </div>
  );
};

export default Orders;
