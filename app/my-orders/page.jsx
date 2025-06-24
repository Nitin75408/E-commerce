'use client';
import React, { useEffect, useState } from "react";
import { assets, orderDummyData } from "@/assets/assets";
import Image from "next/image";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import FullScreenLoader from "@/components/FullScreenLoader";
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import {setRefreshOrders} from "@/app/redux/slices/userSlice";



const MyOrders = () => {

     const currency = process.env.NEXT_PUBLIC_CURRENCY; 
     const {getToken} = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { isLoaded} = useUser();
    const user = useSelector((state)=>state.user.user);
    const refreshOrders = useSelector((state) => state.user.refreshOrders);
    const dispatch =  useDispatch();
   

   const fetchOrders = async () => {
  try {
    const token = await getToken();
    const { data } = await axios.get('/api/order/list', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (data.success) {
      setOrders(data.orders.reverse());
    } else {
      toast.error(data.message);
    }
  } catch (error) {
    toast.error(error.message);
  } finally {
    setLoading(false); // hide loader
  }
};

useEffect(() => {
  if (user && isLoaded) {
    fetchOrders(); // ✅ Always fetch on direct visit

    if (refreshOrders) {
      dispatch(setRefreshOrders(false)); // ✅ Reset flag
    }
  }
}, [user, isLoaded]);

useEffect(() => {
  if (user && isLoaded && refreshOrders) {
    fetchOrders(); // ✅ Re-fetch if we came via Order placed flow
    dispatch(setRefreshOrders(false)); // ✅ Reset after using
  }
}, [refreshOrders]);

    return (
        <>
            <Navbar />
            <div className="flex flex-col justify-between px-6 md:px-16 lg:px-32 py-6 min-h-screen">
                <div className="space-y-5">
                    <h2 className="text-lg font-medium mt-6">My Orders</h2>
                    {loading ? <FullScreenLoader message="Loading Orders..." /> : (<div className="max-w-5xl border-t border-gray-300 text-sm">
                        {orders.map((order, index) => (
                            <div key={index} className="flex flex-col md:flex-row gap-5 justify-between p-5 border-b border-gray-300">
                                <div className="flex-1 flex gap-5 max-w-80">
                                    <Image
                                        className="max-w-16 max-h-16 object-cover"
                                        src={assets.box_icon}
                                        alt="box_icon"
                                    />
                                    <p className="flex flex-col gap-3">
                                        <span className="font-medium text-base">
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
                    </div>)}
                </div>
            </div>
            <Footer />
        </>
    );
};

export default MyOrders;