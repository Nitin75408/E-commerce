'use client'
import React, { useEffect,useState } from "react";
import { assets, productsDummyData } from "@/assets/assets";
import Image from "next/image";
import Footer from "@/components/seller/Footer";
import Loading from "@/components/Loading";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
const ProductList = () => {

   const router = useRouter();
   const {getToken}  = useAuth();
   const user = useSelector((state)=>state.user.user);
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const isSeller = useSelector((state)=>state.user.isSeller);
  const isFetched = useSelector(state=>state.products.hasFetched)
  const productData = useSelector(state=>state.products.items);
   const { isLoaded  } = useUser();

const fetchSellerProduct = async () => {
  try {
    if (isFetched) {
      console.log("Already fetched, skipping API call");
      setProducts(productData); // Assuming `productData` is already from Redux
      setLoading(false);
      return;
    }

    if (!isLoaded || !user || !isSeller) return;

    setLoading(true); // ✅ show loader before fetch

    const token = await getToken();
    if (!token) {
      toast.error("Token not available.");
      setLoading(false);
      return;
    }

    const { data } = await axios.get('/api/product/seller-list', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (data.success) {
      setProducts(data.products);
    } else {
      toast.error(data.message || "Failed to fetch seller products.");
    }
  } catch (error) {
    toast.error(error.message || "Something went wrong.");
  } finally {
    setLoading(false); // ✅ ensure loading stops in all cases
  }
};

useEffect(() => {
  fetchSellerProduct();
}, [user, isLoaded, isSeller, isFetched]); // ✅ add `isFetched`

  

  return (
    <div className="flex-1 min-h-screen flex flex-col justify-between">
      {loading ? <Loading /> : <div className="w-full md:p-10 p-4">
        <h2 className="pb-4 text-lg font-medium">All Product</h2>
        <div className="flex flex-col items-center max-w-4xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20">
          <table className=" table-fixed w-full overflow-hidden">
            <thead className="text-gray-900 text-sm text-left">
              <tr>
                <th className="w-2/3 md:w-2/5 px-4 py-3 font-medium truncate">Product</th>
                <th className="px-4 py-3 font-medium truncate max-sm:hidden">Category</th>
                <th className="px-4 py-3 font-medium truncate">
                  Price
                </th>
                <th className="px-4 py-3 font-medium truncate max-sm:hidden">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-500">
              {products.map((product, index) => (
                <tr key={index} className="border-t border-gray-500/20">
                  <td className="md:px-4 pl-2 md:pl-4 py-3 flex items-center space-x-3 truncate">
                    <div className="bg-gray-500/10 rounded p-2">
                      <Image
                        src={product.image[0]}
                        alt="product Image"
                        className="w-16"
                        width={1280}
                        height={720}
                      />
                    </div>
                    <span className="truncate w-full">
                      {product.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-sm:hidden">{product.category}</td>
                  <td className="px-4 py-3">${product.offerPrice}</td>
                  <td className="px-4 py-3 max-sm:hidden">
                    <button onClick={() => router.push(`/product/${product._id}`)} className="flex items-center gap-1 px-1.5 md:px-3.5 py-2 bg-orange-600 text-white rounded-md">
                      <span className="hidden md:block">Visit</span>
                      <Image
                        className="h-3.5"
                        src={assets.redirect_icon}
                        alt="redirect_icon"
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>}
      <Footer />
    </div>
  );
};

export default ProductList;