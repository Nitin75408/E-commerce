"use client";

import { useState, useEffect } from "react";
import { assets } from "@/assets/assets";
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { addToCart } from "@/app/redux/slices/CartSlice";
import { useAuth } from "@clerk/nextjs";
import toast from "react-hot-toast";
import { saveCartToDB } from "@/app/redux/api_integration/cartapi";
import ReviewSection from "@/components/ReviewSection";
import ProductDetailSkeleton from "@/components/ProductDetailSkeleton";
import ImageZoom from "@/components/ImageZoom";

const ProductClient = ({ productData, reviewSummary }) => {
  const dispatch = useDispatch();
  const { getToken } = useAuth();
  const router = useRouter();
  const currency = process.env.NEXT_PUBLIC_CURRENCY;

  const products = useSelector((state) => state.products.items);
  const rawCartData = useSelector((state) => state.cart.items);

  const [cartData, setCartData] = useState({});
  const [mainImage, setMainImage] = useState(null);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCartData(rawCartData);
    }, 100);
    return () => clearTimeout(timer);
  }, [rawCartData]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const updateCartInDB = async (product, updatedCart) => {
    try {
      const token = await getToken();
      if (!token) return;
      await saveCartToDB(token, updatedCart);
      toast.success("Item added to cart");
      console.log("🛒 Cart synced to DB");
    } catch (err) {
      console.error("❌ Failed to update cart in DB:", err.message);
    }
  };

  const handleCartButton = async (product) => {
    const token = await getToken();
    if (!token) {
      toast.error("Please log in to add items to your cart.", {
        duration: 1500,
      });
      return;
    }
    dispatch(addToCart(product));
    const updatedCart = {
      ...rawCartData,
      [product._id]: (rawCartData[product._id] || 0) + 1,
    };
    updateCartInDB(product, updatedCart);
  };

  const handleBuyNow = async (product) => {
    const token = await getToken();
    if (!token) {
      toast.error("Please log in to continue with purchase.", {
        duration: 1500,
      });
      return;
    }
    dispatch(addToCart(product));
    const updatedCart = {
      ...rawCartData,
      [product._id]: (rawCartData[product._id] || 0) + 1,
    };
    await updateCartInDB(product, updatedCart);
    router.push("/cart");
  };

  const handleNotifyMe = async () => {
    setNotifyLoading(true);
    try {
      const res = await fetch("/api/notify-me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: productData._id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "You will be notified!");
        setNotifySuccess(true);
      } else {
        toast.error(data.message || "Failed to subscribe for notification.");
      }
    } catch (error) {
      toast.error("Something went wrong.");
    } finally {
      setNotifyLoading(false);
    }
  };

  // Responsive image size
  let mainImgSize = 400;
  if (windowWidth < 1024) mainImgSize = 280;
  if (windowWidth < 640) mainImgSize = 180;
  let thumbSize = 48;
  if (windowWidth < 1024) thumbSize = 36;
  if (windowWidth < 640) thumbSize = 28;

  if (!productData) {
    return <ProductDetailSkeleton />;
  }

  return (
    <>
      <Navbar />
      <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 md:px-8 pt-8 space-y-8">
        <div className="flex flex-col md:flex-col lg:flex-row items-center lg:items-start">
          {/* Thumbnails and main image */}
          <div className="flex flex-col items-center mb-6 lg:mb-0">
            {/* Main image */}
            <div className="flex flex-col items-center">
              <ImageZoom
                src={mainImage || productData.image[0]}
                alt="Product image"
                width={mainImgSize}
                height={mainImgSize}
                zoom={2}
              />
            </div>
            {/* Thumbnails below main image */}
            <div className="flex flex-row space-x-2 items-center justify-center mt-4">
              {productData.image.map((image, index) => (
                <div
                  key={index}
                  onClick={() => setMainImage(image)}
                  className={`cursor-pointer rounded-lg overflow-hidden border-2 ${mainImage === image ? 'border-orange-500' : 'border-transparent'}`}
                  style={{ width: thumbSize, height: thumbSize }}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              ))}
            </div>
          </div>
          {/* Product info */}
          <div className="w-full mt-6 lg:mt-0 flex-1">
            <h1 className="text-3xl font-medium text-gray-800/90 mb-4">
              {productData.name}
            </h1>
            {reviewSummary && reviewSummary.reviewCount > 0 && (
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                  {reviewSummary.avgRating}
                  <Image className="h-4 w-4" src={assets.star_icon} alt="star_icon" style={{ filter: 'brightness(0) invert(1)' }} />
                </span>
                <span className="text-base text-gray-600 font-medium">
                  {reviewSummary.reviewCount} Ratings & {reviewSummary.reviewCount} Reviews
                </span>
              </div>
            )}
            <p className="text-gray-600 mt-3">{productData.description}</p>
            <p className="text-3xl font-medium mt-6">
              {currency}{productData.offerPrice}
              <span className="text-base font-normal text-gray-800/60 line-through ml-2">
                {currency}{productData.price}
              </span>
            </p>
            <hr className="bg-gray-600 my-6" />
            <div className="overflow-x-auto">
              <table className="table-auto border-collapse w-full max-w-72">
                <tbody>
                  <tr>
                    <td className="text-gray-600 font-medium">Brand</td>
                    <td className="text-gray-800/50 ">Generic</td>
                  </tr>
                  <tr>
                    <td className="text-gray-600 font-medium">Color</td>
                    <td className="text-gray-800/50 ">Multi</td>
                  </tr>
                  <tr>
                    <td className="text-gray-600 font-medium">Category</td>
                    <td className="text-gray-800/50">{productData.category}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {productData.status === 'inactive' ? (
              <div className="flex items-center mt-10 gap-4">
                <button
                  className="w-full py-3.5 bg-gray-100 text-gray-400 cursor-not-allowed"
                  disabled
                >
                  Add to Cart
                </button>
                <button
                  className={`w-full py-3.5 ${notifySuccess ? "bg-green-500" : "bg-blue-500"} text-white hover:bg-blue-600 transition`}
                  onClick={handleNotifyMe}
                  disabled={notifyLoading || notifySuccess}
                >
                  {notifySuccess ? "Subscribed!" : notifyLoading ? "Please wait..." : "Notify Me"}
                </button>
              </div>
            ) : (
              <div className="flex items-center mt-10 gap-4">
                <button
                  onClick={() => handleCartButton(productData)}
                  className="w-full py-3.5 bg-gray-100 text-gray-800/80 hover:bg-gray-200 transition"
                >
                  Add to Cart
                </button>
                <button
                  onClick={() => handleBuyNow(productData)}
                  className="w-full py-3.5 bg-orange-500 text-white hover:bg-orange-600 transition"
                >
                  Buy now
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Reviews Section */}
        <hr className="my-12 border-gray-300" />
        <ReviewSection productId={productData._id} />
        {/* Featured Products Section */}
        <div className="flex flex-col items-center">
          <div className="flex flex-col items-center mb-4 mt-16">
            <p className="text-3xl font-medium">
              Featured <span className="font-medium text-orange-600">Products</span>
            </p>
            <div className="w-28 h-0.5 bg-orange-600 mt-2"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-6 pb-14 w-full">
            {products.slice(0, 5).map((product, index) => (
              <ProductCard key={index} product={product} />
            ))}
          </div>
          <button className="px-8 py-2 mb-16 border rounded text-gray-500/70 hover:bg-slate-50/90 transition">
            See more
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ProductClient; 