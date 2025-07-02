'use client';
import React, { useEffect, useState, useRef } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { setRefreshOrders } from "@/app/redux/slices/userSlice";
import OrderCardSkeleton from '@/components/OrderCardSkeleton';

const PAGE_SIZE = 10;

const MyOrders = () => {
     const currency = process.env.NEXT_PUBLIC_CURRENCY; 
  const { getToken } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const { isLoaded } = useUser();
  const user = useSelector((state) => state.user.user);
    const refreshOrders = useSelector((state) => state.user.refreshOrders);
  const dispatch = useDispatch();
    const sentinelRef = useRef();
    const observer = useRef();
    const firstCardRef = useRef(null);
   
  const fetchOrders = async (pageNum = 1, append = false, customPageSize = PAGE_SIZE) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
  try {
    const token = await getToken();
      const { data } = await axios.get(`/api/order/list?page=${pageNum}&limit=${customPageSize}`, {
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
      toast.error(data.message);
    }
  } catch (error) {
    toast.error(error.message);
  } finally {
      if (pageNum === 1) setLoading(false);
      else setLoadingMore(false);
  }
};

useEffect(() => {
  if (user && isLoaded) {
      fetchOrders(1, false);
      setPage(1);
    if (refreshOrders) {
        dispatch(setRefreshOrders(false));
    }
  }
}, [user, isLoaded]);

useEffect(() => {
  if (user && isLoaded && refreshOrders) {
      fetchOrders(1, false);
      setPage(1);
      dispatch(setRefreshOrders(false));
  }
}, [refreshOrders]);


// Infinite scroll: observe sentinel
useEffect(() => {
  if (loadingMore) return;
  if (!hasMore) return;
  const currentSentinel = sentinelRef.current;
  if (!currentSentinel) return;
  if (observer.current) observer.current.disconnect();
  observer.current = new window.IntersectionObserver(entries => {
    if (entries[0].isIntersecting && hasMore && !loadingMore) {
      setPage(prev => prev + 1);
    }
  });
  observer.current.observe(currentSentinel);
  return () => observer.current && observer.current.disconnect();
}, [loadingMore, hasMore, orders]);

// Fetch next page when page changes (but not on initial mount)
useEffect(() => {
  if (page === 1) return;
  fetchOrders(page, true, PAGE_SIZE);
}, [page]);

  return (
        <>
            <Navbar />
            <div className="flex flex-col justify-between px-6 md:px-16 lg:px-32 py-6 min-h-screen">
                <div className="space-y-5">
                    <h2 className="text-lg font-medium mt-6">My Orders</h2>
          {loading ? (
            <div className="mt-8">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => <OrderCardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="max-w-5xl border-t border-gray-300 text-sm">
                        {orders.filter(order => order.items && order.items.length > 0).map((order, index) => (
                            <div
                                key={index}
                                ref={index === 0 ? firstCardRef : null}
                                className="flex flex-col md:flex-row gap-5 justify-between p-5 border-b border-gray-300"
                            >
                                <div className="flex-1 flex gap-5 max-w-80">
                                    <Image
                                        className="max-w-16 max-h-16 object-cover"
                                        src={assets.box_icon}
                                        alt="box_icon"
                                    />
                                    <p className="flex flex-col gap-3">
                                        <span className="font-medium text-base line-clamp-2">
                                            {order.items.map((item) => item.product.name + ` x ${item.quantity}`).join(", ")}
                                        </span>
                                        <span>Items : {order.items.length}</span>
                                    </p>
                                </div>
                                <div>
                                    <p>
                                        <span className="font-medium">{order.address.fullName}</span>
                                        <br />
                                        <span >{order.address.area}</span>
                                        <br />
                                        <span>{`${order.address.city}, ${order.address.state}`}</span>
                                        <br />
                                        <span>{order.address.phoneNumber}</span>
                                    </p>
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
              {/* Show skeletons at the end if loading more */}
              {loadingMore && orders.length > 0 &&
                Array.from({ length: PAGE_SIZE }).map((_, i) => <OrderCardSkeleton key={`loadmore-${i}`} />)
              }
              {/* Sentinel div for infinite scroll */}
              <div ref={sentinelRef} style={{ height: 1 }} />
              {!hasMore && orders.length > 0 && (
                <div className="flex justify-center my-6 text-gray-400">No more orders to load.</div>
              )}
            </div>
          )}
                </div>
            </div>
            <Footer />
        </>
    );
};

export default MyOrders;