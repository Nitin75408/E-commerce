'use client';
import React, { useEffect, useState,useRef } from 'react';
import { assets } from '@/assets/assets';
import OrderSummary from '@/components/OrderSummary';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import { selectCartCount, selectCartAmount, selectCartItemsArray } from '@/app/redux/selectors/cartselecters';
import { selectAllProducts } from '@/app/redux/selectors/productSelectors';
import { useSelector, useDispatch } from 'react-redux';
import { updateCartQuantity, fetchCartData, setCartItem } from '@/app/redux/slices/CartSlice';
import { useRouter } from 'next/navigation';
import { saveCartToDB } from '@/app/redux/api_integration/cartapi';
import { useAuth } from '@clerk/nextjs';
import { debounce } from 'lodash';
import FullScreenLoader from '@/components/FullScreenLoader';
import toast from 'react-hot-toast';
import axios from 'axios';

const Cart = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { getToken } = useAuth();

  // Using memoized selectors for better performance
  const products = useSelector(selectAllProducts);
  const cartItems = useSelector(state => state.cart.items || {});
  const getCartCount = useSelector(selectCartCount);
  const cartAmount = useSelector(selectCartAmount);
  const cartItemsArray = useSelector(selectCartItemsArray);
  const currency = process.env.NEXT_PUBLIC_CURRENCY || "$";
  const hasFetched = useSelector(state => state.cart.hasFetched);
const deletedToastProductsRef = useRef(new Set());



  const [hasMounted, setHasMounted] = useState(false); // 🟡 prevent initial sync
  const [hasCheckedDeletedProducts, setHasCheckedDeletedProducts] = useState(false);


  // Function to check for deleted products and remove them
  const checkForDeletedProducts = async () => {
    if (Object.keys(cartItems).length === 0 || hasCheckedDeletedProducts) return;
    try {
      const token = await getToken();
      const cartItemsArray = Object.keys(cartItems)
        .map((key) => ({
          product: key,
          quantity: cartItems[key],
        }))
        .filter((item) => item.quantity > 0);
      if (cartItemsArray.length === 0) return;
      const { data } = await axios.post(
        "/api/order/create",
        {
          address: "check-only", // Dummy address for validation
          items: cartItemsArray,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (
        !data.success &&
        data.deletedProducts &&
        data.deletedProducts.length > 0
      ) {
        // Only show toast for products not already shown (use ref for sync deduplication)
        const newDeleted = data.deletedProducts.filter(
          id => !deletedToastProductsRef.current.has(id)
        );
        if (newDeleted.length > 0) {
          toast.error("Some products are no longer available and have been removed from your cart");
          newDeleted.forEach(id => deletedToastProductsRef.current.add(id));
        }
        // Remove deleted products from cart
        const updatedCart = { ...cartItems };
        data.deletedProducts.forEach(productId => {
          delete updatedCart[productId];
        });
        // Update cart in Redux
        dispatch(setCartItem(updatedCart));
        // Save updated cart to database
        try {
          await axios.post(
            "/api/cart/update",
            { cartdata: updatedCart },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (error) {
          console.error("Failed to update cart after removing deleted products:", error);
        }
      }
      setHasCheckedDeletedProducts(true);
    } catch (error) {
      console.error("Error checking for deleted products:", error);
      setHasCheckedDeletedProducts(true);
    }
  };
  // ... existing code ...

  // Debounced function
  const debouncedUpdateCartInDB = debounce(async (token, cartData) => {
    try {
      await saveCartToDB(token, cartData);
      console.log("🛒 Debounced Cart synced to DB");
    } catch (err) {
      console.error("❌ Failed to update cart in DB:", err.message);
    }
  }, 500);

//   Imagine you're typing a message in WhatsApp, and WhatsApp tries to save your draft to the cloud every single keystroke — that's inefficient.

// So instead, it waits until you stop typing for 500ms — then it syncs.

// That's debouncing.

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

    if (Object.keys(cartItems).length >=0) {
      syncCart();
    }
  }, [cartItems]);

  useEffect(() => {
    if (!hasFetched) {
      getToken().then(token => {
        if (token) dispatch(fetchCartData(token));
      });
    } else {
      // Reset the flag when cart data is fresh
      setHasCheckedDeletedProducts(false);
    }
  }, [hasFetched, getToken, dispatch]);

  // Check for deleted products when cart loads
  useEffect(() => {
    if (hasFetched && Object.keys(cartItems).length > 0) {
      checkForDeletedProducts();
    }
  }, [hasFetched, cartItems]);

  const handleQuantityChange = (id, qty) => {
    dispatch(updateCartQuantity({ id: id, quantity: qty }));
  };

  if (!hasFetched) return <FullScreenLoader message="Loading your cart..." />;

  // If cart is empty, show a message
  if (getCartCount === 0) {
    return (
      <>
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Your Cart is Empty</h1>
          <p className="text-lg text-gray-600 mb-8">
            Looks like you haven't added anything to your cart yet.
          </p>
          <button
            onClick={() => router.push("/all-products")}
            className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </>
    );
  }


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
                      <td className="py-4 md:px-4 px-1 text-gray-600">{currency}{product.offerPrice}</td>
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
                        {currency}{(product.offerPrice * cartItems[itemId]).toFixed(2)}
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

export default Cart;


