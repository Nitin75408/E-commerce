"use client";

import { useRouter } from "next/navigation";
import { selectCartCount, selectCartAmount } from "@/app/redux/selectors/cartselecters";
import { selectAllProducts } from "@/app/redux/selectors/productSelectors";
import { setCartItem } from "@/app/redux/slices/CartSlice";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAuth, useUser } from "@clerk/nextjs"; // ✅ Correct for Next.js
import axios from "axios";
import toast from "react-hot-toast";
import FullScreenLoader from "./FullScreenLoader";


const OrderSummary = () => {
  const currency = process.env.NEXT_PUBLIC_CURRENCY || "$";
  const router = useRouter();
  
  // Using memoized selectors for better performance
  const products = useSelector(selectAllProducts);
  const getCartCount = useSelector(selectCartCount);
  const getCartAmount = useSelector(selectCartAmount);
  const cartItems = useSelector((state) => state.cart.items);

  const dispatch = useDispatch();
  const { getToken } = useAuth(); // ✅ needed for backend API auth
  const { user, isLoaded } = useUser(); // ✅ replaces Redux user

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userAddresses, setUserAddresses] = useState([]);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const fetchUserAddresses = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/user/get-address", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setUserAddresses(data.addresses);
        if (data.addresses.length > 0) {
          setSelectedAddress(data.addresses[0]);
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to load addresses");
    }
  };

  useEffect(() => {
    if (user && isLoaded) {
      console.log("✅ Fetching user addresses...");
      fetchUserAddresses();
    }
  }, [user, isLoaded]);

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    setIsDropdownOpen(false);
  };

 
  const createOrder = async () => {
    if (isPlacingOrder) return;
  
    setIsPlacingOrder(true);
  
    try {
      if (!selectedAddress) {
        toast.error("Please select an address");
        setIsPlacingOrder(false);
        return;
      }
  
      const cartItemsArray = Object.keys(cartItems)
        .map((key) => ({
          product: key,
          quantity: cartItems[key],
        }))
        .filter((item) => item.quantity > 0);
  
      if (cartItemsArray.length === 0) {
        toast.error("Cart is empty");
        setIsPlacingOrder(false);
        return;
      }
  
      const token = await getToken();
      const { data } = await axios.post(
        "/api/order/create",
        {
          address: selectedAddress._id,
          items: cartItemsArray,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      if (data.success) { 
        router.push("/order-placed");
        setTimeout(() => {
          toast.success(data.message);
          dispatch(setCartItem({}));
          setIsPlacingOrder(false);
        }, 400); // adjust if needed
      } else {
        // Handle deleted products
        if (data.deletedProducts && data.deletedProducts.length > 0) {
          // Remove deleted products from cart
          const updatedCart = { ...cartItems };
          data.deletedProducts.forEach(productId => {
            delete updatedCart[productId];
          });
          
          // Update cart in Redux
          dispatch(setCartItem(updatedCart));
          
          // Save updated cart to database
          try {
            await axios.post("/api/cart/update", 
              { cartdata: updatedCart },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          } catch (error) {
            console.error("Failed to update cart after removing deleted products:", error);
          }
          
          // Show error message
          toast.error(data.message);
        } else {
          toast.error(data.message || "Order failed");
        }
        setIsPlacingOrder(false);
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      setIsPlacingOrder(false);
    }
  };
  
  return (
    <>
    {isPlacingOrder && <FullScreenLoader message="Placing Order..." />}
      <div className="w-full md:w-96 bg-gray-500/5 p-5 relative">
        <h2 className="text-xl md:text-2xl font-medium text-gray-700">Order Summary</h2>
        <hr className="border-gray-500/30 my-5" />

        <div className="space-y-6">
          <div>
            <label className="text-base font-medium uppercase text-gray-600 block mb-2">
              Select Address
            </label>
            <div className="relative inline-block w-full text-sm border">
              <button
                className="peer w-full text-left px-4 pr-2 py-2 bg-white text-gray-700 focus:outline-none"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span>
                  {selectedAddress
                    ? `${selectedAddress.fullName}, ${selectedAddress.area}, ${selectedAddress.city}, ${selectedAddress.state}`
                    : "Select Address"}
                </span>
                <svg
                  className={`w-5 h-5 inline float-right transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-0" : "-rotate-90"
                  }`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="#6B7280"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isDropdownOpen && (
                <ul className="absolute w-full bg-white border shadow-md mt-1 z-10 py-1.5">
                  {userAddresses.map((address, index) => (
                    <li
                      key={index}
                      className="px-4 py-2 hover:bg-gray-500/10 cursor-pointer"
                      onClick={() => handleAddressSelect(address)}
                    >
                      {address.fullName}, {address.area}, {address.city}, {address.state}
                    </li>
                  ))}
                  <li
                    onClick={() => router.push("/add-address")}
                    className="px-4 py-2 hover:bg-gray-500/10 cursor-pointer text-center"
                  >
                    + Add New Address
                  </li>
                </ul>
              )}
            </div>
          </div>

          <div>
            <label className="text-base font-medium uppercase text-gray-600 block mb-2">Promo Code</label>
            <div className="flex flex-col items-start gap-3">
              <input
                type="text"
                placeholder="Enter promo code"
                className="flex-grow w-full outline-none p-2.5 text-gray-600 border"
              />
              <button className="bg-orange-600 text-white px-9 py-2 hover:bg-orange-700">Apply</button>
            </div>
          </div>

          <hr className="border-gray-500/30 my-5" />

          <div className="space-y-4">
            <div className="flex justify-between text-base font-medium">
              <p className="uppercase text-gray-600">Items {getCartCount}</p>
              <p className="text-gray-800">
                {currency}
                {getCartAmount.toFixed(2)}
              </p>
            </div>
            <div className="flex justify-between">
              <p className="text-gray-600">Shipping Fee</p>
              <p className="font-medium text-gray-800">Free</p>
            </div>
            <div className="flex justify-between">
              <p className="text-gray-600">Tax (18%)</p>
              <p className="font-medium text-gray-800">
                {currency}
                {(getCartAmount * 0.18).toFixed(2)}
              </p>
            </div>
            <div className="flex justify-between text-lg md:text-xl font-medium border-t pt-3">
              <p>Total</p>
              <p>
                {currency}
                {(getCartAmount + getCartAmount * 0.18).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={createOrder}
          disabled={!user || isPlacingOrder}
          className={`w-full py-3 mt-5 text-white ${
            !user || isPlacingOrder ? "bg-gray-400 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-700"
          }`}
        >
          {isPlacingOrder ? "Placing..." : "Place Order"}
        </button>
      </div>
    </>
  );
};

export default OrderSummary;

