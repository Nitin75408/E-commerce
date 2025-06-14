'use client';
import React, { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import OrderSummary from "@/components/OrderSummary";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { selectCartCount } from '@/app/redux/selectors/cartselecters';
import { useSelector, useDispatch } from "react-redux";
import { updateCartQuantity } from "@/app/redux/slices/CartSlice";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { saveCartToDB } from "@/app/redux/api_integration/cartapi";
import { useAuth } from "@clerk/nextjs";
import toast from "react-hot-toast";
import { debounce } from "lodash";

const Cart = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { getToken } = useAuth();

  const products = useSelector(state => state.products.items || []);
  const cartItems = useSelector(state => state.cart.items || {});
  const getCartCount = useSelector(selectCartCount);

  const [isLoading, setIsLoading] = useState(true);
  const [hasMounted, setHasMounted] = useState(false); // 🟡 prevent initial sync

  // Delay rendering until after hydration
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 50);
    return () => clearTimeout(timer);
  }, []);

  // Debounced function
  const debouncedUpdateCartInDB = debounce(async (token, cartData) => {
    try {
      await saveCartToDB(token, cartData);
      console.log("🛒 Debounced Cart synced to DB");
    } catch (err) {
      console.error("❌ Failed to update cart in DB:", err.message);
    }
  }, 500);

//   Imagine you're typing a message in WhatsApp, and WhatsApp tries to save your draft to the cloud every single keystroke — that’s inefficient.

// So instead, it waits until you stop typing for 500ms — then it syncs.

// That’s debouncing.

  // Sync cart to DB (but avoid initial hydration trigger)
  useEffect(() => {
    if (!hasMounted) {
      setHasMounted(true);
      return;
    }

    const syncCart = async () => {
      const token = await getToken();
      if (!token) return;
      debouncedUpdateCartInDB(token, cartItems);
    };

    if (Object.keys(cartItems).length > 0) {
      syncCart();
    }
  }, [cartItems]);

  const handleQuantityChange = (id, qty) => {
    dispatch(updateCartQuantity({ id: id, quantity: qty }));
  };

  if (isLoading) return null;

  return (
    <>
      <Navbar />
      <div className="flex flex-col md:flex-row gap-10 px-6 md:px-16 lg:px-32 pt-14 mb-20">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-8 border-b border-gray-500/30 pb-6">
            <p className="text-2xl md:text-3xl text-gray-500">
              Your <span className="font-medium text-orange-600">Cart</span>
            </p>
            <p className="text-lg md:text-xl text-gray-500/80">{getCartCount} Items</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="text-left">
                <tr>
                  <th className="text-nowrap pb-6 md:px-4 px-1 text-gray-600 font-medium">Product Details</th>
                  <th className="pb-6 md:px-4 px-1 text-gray-600 font-medium">Price</th>
                  <th className="pb-6 md:px-4 px-1 text-gray-600 font-medium">Quantity</th>
                  <th className="pb-6 md:px-4 px-1 text-gray-600 font-medium">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(cartItems).map((itemId) => {
                  const product = products.find(p => p._id === itemId);
                  if (!product || cartItems[itemId] <= 0) return null;

                  return (
                    <tr key={itemId}>
                      <td className="flex items-center gap-4 py-4 md:px-4 px-1">
                        <div>
                          <div className="rounded-lg overflow-hidden bg-gray-500/10 p-2">
                            <Image
                              src={product.image[0]}
                              alt={product.name}
                              className="w-16 h-auto object-cover mix-blend-multiply"
                              width={1280}
                              height={720}
                            />
                          </div>
                          <button
                            className="md:hidden text-xs text-orange-600 mt-1"
                            onClick={() => handleQuantityChange(product._id, 0)}
                          >
                            Remove
                          </button>
                        </div>
                        <div className="text-sm hidden md:block">
                          <p className="text-gray-800">{product.name}</p>
                          <button
                            className="text-xs text-orange-600 mt-1"
                            onClick={() => handleQuantityChange(product._id, 0)}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                      <td className="py-4 md:px-4 px-1 text-gray-600">${product.offerPrice}</td>
                      <td className="py-4 md:px-4 px-1">
                        <div className="flex items-center md:gap-2 gap-1">
                          <button
                            onClick={() => handleQuantityChange(product._id, cartItems[product._id] - 1)}
                          >
                            <Image src={assets.decrease_arrow} alt="decrease_arrow" className="w-4 h-4" />
                          </button>
                          <input
                            type="number"
                            value={cartItems[itemId]}
                            onChange={(e) =>
                              handleQuantityChange(product._id, Number(e.target.value))
                            }
                            className="w-8 border text-center appearance-none"
                          />
                          <button
                            onClick={() => handleQuantityChange(product._id, cartItems[product._id] + 1)}
                          >
                            <Image src={assets.increase_arrow} alt="increase_arrow" className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="py-4 md:px-4 px-1 text-gray-600">
                        ${(product.offerPrice * cartItems[itemId]).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button
            onClick={() => router.push("/all-products")}
            className="group flex items-center mt-6 gap-2 text-orange-600"
          >
            <Image
              className="group-hover:-translate-x-1 transition"
              src={assets.arrow_right_icon_colored}
              alt="arrow_right_icon_colored"
            />
            Continue Shopping
          </button>
        </div>
        <OrderSummary />
      </div>
    </>
  );
};

export default dynamic(() => Promise.resolve(Cart), { ssr: false });


