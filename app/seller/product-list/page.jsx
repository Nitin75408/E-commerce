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
import { useSelector, useDispatch } from "react-redux";
import UpdateProductModal from "@/components/seller/UpdateProductModal";
import { removeProduct } from "@/app/redux/slices/ProductSlice";

const ProductList = () => {

   const [openMenu, setOpenMenu] = useState(null);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [selectedProduct, setSelectedProduct] = useState(null);
   const router = useRouter();
   const {getToken}  = useAuth();
   const user = useSelector((state)=>state.user.user);
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const isSeller = useSelector((state)=>state.user.isSeller);
  const { isLoaded  } = useUser();
  const dispatch = useDispatch();

const fetchSellerProduct = async (page = 1) => {
  try {
    if (!isLoaded || !user || !isSeller) return;

    setLoading(true);

    const token = await getToken();
    if (!token) {
      toast.error("Token not available.");
      setLoading(false);
      return;
    }

    const { data } = await axios.get(`/api/product/seller-list?page=${page}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (data.success) {
      setProducts(data.products);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
    } else {
      toast.error(data.message || "Failed to fetch seller products.");
    }
  } catch (error) {
    toast.error(error.message || "Something went wrong.");
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchSellerProduct(currentPage);
}, [user, isLoaded, isSeller, currentPage]);

const handleDelete = async (productId) => {
  if (window.confirm("Are you sure you want to delete this product?")) {
    try {
      const token = await getToken();
      const { data } = await axios.delete("/api/product/delete", {
        headers: { Authorization: `Bearer ${token}` },
        data: { productId },
      });

      if (data.success) {
        toast.success(data.message);
        dispatch(removeProduct(productId));
        fetchSellerProduct(currentPage);
        setOpenMenu(null);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred.");
    }
  }
};

const handleUpdate = async (productId, updatedData, imageFiles) => {
  const formData = new FormData();
  formData.append('productId', productId);
  
  // Append all text data
  for (const key in updatedData) {
    formData.append(key, updatedData[key]);
  }

  // Append new image files
  for (let i = 0; i < imageFiles.length; i++) {
    if (imageFiles[i]) {
      formData.append('images', imageFiles[i]);
    }
  }

  try {
    const token = await getToken();
    const { data } = await axios.put('/api/product/update', formData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      }
    });

    if (data.success) {
      toast.success(data.message);
      fetchSellerProduct(); // Refresh the list
      setIsModalOpen(false); // Close the modal
      setSelectedProduct(null);
    } else {
      toast.error(data.message);
    }
  } catch (error) {
    toast.error(error.response?.data?.message || "An error occurred.");
  }
};

const openUpdateModal = (product) => {
  setSelectedProduct(product);
  setIsModalOpen(true);
  setOpenMenu(null);
};

  return (
    <div className="w-full min-h-screen">
      {loading ? <Loading /> : (
        <>
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Product Listing</h1>
                <p className="text-sm text-gray-500 mt-1">Manage and review all products in your e-commerce store.</p>
              </div>
              <button 
                onClick={() => router.push('/seller')} // Navigates to the add product page
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition mt-4 sm:mt-0 flex items-center gap-2"
              >
                <span>Add New Product</span>
              </button>
            </div>

            {/* TODO: Add Stat Cards Here */}

            {/* Main Content: Filters and Product Table */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">All Products</h2>
              <p className="text-sm text-gray-500 mt-1 mb-4">Detailed list of all products in your inventory.</p>
              
              {/* TODO: Add Search and Filter Controls Here */}

              {/* Product Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 text-left text-sm font-semibold text-gray-700">Product</th>
                      <th className="p-3 text-left text-sm font-semibold text-gray-700">Category</th>
                      <th className="p-3 text-left text-sm font-semibold text-gray-700">Price</th>
                      <th className="p-3 text-left text-sm font-semibold text-gray-700">Units Sold</th>
                      <th className="p-3 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="p-3 text-left text-sm font-semibold text-gray-700">Last Updated</th>
                      <th className="p-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product._id} className="hover:bg-gray-50">
                        <td className="p-3 flex items-center gap-3">
                          <Image
                            src={product.image[0]}
                            alt={product.name}
                            width={64}
                            height={64}
                            className="w-16 h-16 object-cover rounded-md"
                          />
                           <span className="font-medium text-gray-800">{product.name}</span>
                        </td>
                        <td className="p-3 text-sm text-gray-600">{product.category}</td>
                        <td className="p-3 text-sm text-gray-600">₹{product.offerPrice}</td>
                        <td className="p-3 text-sm text-gray-800 font-medium">{product.unitsSold}</td>
                        <td className="p-3">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        </td>
                        <td className="p-3 text-sm text-gray-600">
                          {new Date(product.date).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-center relative">
                           <button 
                             onClick={() => setOpenMenu(openMenu === product._id ? null : product._id)}
                             className="p-2 rounded-full hover:bg-gray-100 transition"
                           >
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gray-500"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                           </button>
                           {openMenu === product._id && (
                             <div className="absolute right-4 mt-2 w-32 bg-white rounded-md shadow-lg z-20 border border-gray-100">
                               <div className="py-1">
                                 <button 
                                   onClick={() => openUpdateModal(product)}
                                   className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                 >
                                    Update
                                 </button>
                                 <button 
                                   onClick={() => handleDelete(product._id)}
                                   className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                 >
                                    Delete
                                 </button>
                               </div>
                             </div>
                           )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>

            </div>
          </div>
        </div>
        {isModalOpen && (
          <UpdateProductModal 
            product={selectedProduct}
            onClose={() => setIsModalOpen(false)}
            onUpdate={handleUpdate}
          />
        )}
        </>
      )}
      <Footer />
    </div>
  );
};

export default ProductList;