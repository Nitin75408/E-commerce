'use client';
import React, { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import Footer from "@/components/seller/Footer";
import Loading from "@/components/Loading";
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

  const fetchSellerOrders = async (pageNum = 1, append = false, retryCount = 0) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("No authentication token available");
        return;
      }
      const { data } = await axios.get(`/api/order/seller-orders?page=${pageNum}&limit=${PAGE_SIZE}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        if (append) {
          setOrders((prev) => [...prev, ...data.orders]);
        } else {
          setOrders(data.orders);
        }
        setHasMore(data.hasMore);
      } else {
        setError(data.message || 'Failed to fetch orders');
        toast.error(data.message || 'Failed to fetch orders');
      }
    } catch (error) {
      if (error?.response?.status === 403 && retryCount < 3) {
        setTimeout(() => {
          fetchSellerOrders(pageNum, append, retryCount + 1);
        }, 2000);
        return;
      }
      setError(error?.response?.data?.message || error.message || 'Something went wrong');
      toast.error(error?.response?.data?.message || error.message || 'Something went wrong');
    } finally {
      if (pageNum === 1) setLoading(false);
      else setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (isLoaded && clerkUser && hasFetched && isSeller) {
      fetchSellerOrders(1, false);
      setPage(1);
    } else if (isLoaded && hasFetched && (!clerkUser || !isSeller)) {
      setLoading(false);
      setError('You are not authorized to view seller orders');
    }
  }, [clerkUser, isSeller, isLoaded, hasFetched]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchSellerOrders(nextPage, true);
  };

  return (
    <div className="flex-1 h-screen overflow-scroll flex flex-col justify-between text-sm">
      {loading ? (
        <div className="mt-8">
          {Array.from({ length: 4 }).map((_, i) => <OrderCardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="md:p-10 p-4">
          <h2 className="text-lg font-medium">Orders</h2>
          <div className="text-red-500 mt-4">{error}</div>
        </div>
      ) : (
        <div className="md:p-10 p-4 space-y-5">
          <h2 className="text-lg font-medium">Orders</h2>
          {orders.length === 0 ? (
            <div className="text-gray-500 mt-4">No orders found.</div>
          ) : (
            <div className="max-w-4xl rounded-md">
              {orders.map((order, index) => (
                <div key={index} className="flex flex-col md:flex-row gap-5 justify-between p-5 border-t border-gray-300">
                  <div className="flex-1 flex gap-5 max-w-80">
                    <Image
                      className="max-w-16 max-h-16 object-cover"
                      src={assets.box_icon}
                      alt="box_icon"
                    />
                    <p className="flex flex-col gap-3">
                      <span className="font-medium">
                        {order.items.map((item) => item.product.name + ` x ${item.quantity}`).join(", ")}
                      </span>
                      <span>Items : {order.items.length}</span>
                    </p>
                  </div>
                  <div>
                    {order.address ? (
                      <p>
                        <span className="font-medium">{order.address.fullName}</span>
                        <br />
                        <span >{order.address.area}</span>
                        <br />
                        <span>{`${order.address.city}, ${order.address.state}`}</span>
                        <br />
                        <span>{order.address.phoneNumber}</span>
                      </p>
                    ) : (
                      <p> User not exist</p>
                    )}
                  </div>
                  <p className="font-medium my-auto">{currency}{order.amount}</p>
                  <div>
                    <p className="flex flex-col">
                      <span>Method : COD</span>
                      <span>Date : {new Date(order.date).toLocaleDateString()}</span>
                      <span>Payment : Pending</span>
                    </p>
                  </div>
                </div>
              ))}
              {hasMore && (
                <div className="flex justify-center my-6">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="px-8 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-gray-400"
                  >
                    {loadingMore ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
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