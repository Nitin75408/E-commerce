'use client';
import React, { useEffect, useState } from "react";
import { assets, orderDummyData } from "@/assets/assets";
import Image from "next/image";
import Footer from "@/components/seller/Footer";
import FullScreenLoader from "@/components/FullScreenLoader";
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";

const Orders = () => {

     const currency = process.env.NEXT_PUBLIC_CURRENCY;

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const {getToken} = useAuth();
    const { isLoaded, user: clerkUser } = useUser();
    const isSeller = useSelector((state)=>state.user.isSeller);
    const user  = useSelector((state)=>state.user.user);
    const hasFetched = useSelector((state)=>state.user.hasFetched);
    
    console.log('clerkUser from order summary' ,clerkUser)
    console.log('isSeller from order summary' ,isSeller)
    console.log('isLoaded from order summary' ,isLoaded)
    console.log('hasFetched from order summary' ,hasFetched)

  const fetchSellerOrders = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getToken();
      if (!token) {
        setError("No authentication token available");
        return;
      }

      console.log('Fetching seller orders...');
      const { data } = await axios.get('/api/order/seller-orders', {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('data from order summary' ,data)

      if (data.success) {
          setOrders(data.orders.reverse()); 
          console.log('Orders set:', data.orders.length);
      } else {
        setError(data.message || 'Failed to fetch orders');
        toast.error(data.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      
      // If it's an authorization error and we haven't retried too many times, retry after a delay
      if (error?.response?.status === 403 && retryCount < 3) {
        console.log(`Authorization error, retrying in 2 seconds... (attempt ${retryCount + 1})`);
        setTimeout(() => {
          fetchSellerOrders(retryCount + 1);
        }, 2000);
        return;
      }
      
      setError(error?.response?.data?.message || error.message || 'Something went wrong');
      toast.error(error?.response?.data?.message || error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

   useEffect(()=>{
       console.log('useEffect triggered - clerkUser:', !!clerkUser, 'isSeller:', isSeller, 'isLoaded:', isLoaded, 'hasFetched:', hasFetched);
       
       // Wait for both Clerk user to be loaded and Redux user data to be fetched
       if(isLoaded && clerkUser && hasFetched && isSeller){
        console.log('All conditions met, fetching orders...');
        fetchSellerOrders();
       } else if (isLoaded && hasFetched && (!clerkUser || !isSeller)) {
         console.log('User not loaded or not a seller');
         setLoading(false);
         setError('You are not authorized to view seller orders');
       }
   },[clerkUser, isSeller, isLoaded, hasFetched])

    return (
        <div className="flex-1 h-screen overflow-scroll flex flex-col justify-between text-sm">
            {loading ? (
              <FullScreenLoader message="Loading Order details.."/>
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
                               {
                                  order.address ? ( <p>
                                    <span className="font-medium">{order.address.fullName}</span>
                                    <br />
                                    <span >{order.address.area}</span>
                                    <br />
                                    <span>{`${order.address.city}, ${order.address.state}`}</span>
                                    <br />
                                    <span>{order.address.phoneNumber}</span>
                                </p>) : (
                                    <p> User not exist</p>
                                )
                               }
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
                  </div>
                )}
              </div>
            )}
            <Footer />
        </div>
    );
};

export default Orders;