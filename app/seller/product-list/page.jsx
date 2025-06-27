'use client'
import React, { useEffect,useState } from "react";
import { assets, productsDummyData } from "@/assets/assets";
import Image from "next/image";
import Footer from "@/components/seller/Footer";
import FullScreenLoader from "@/components/FullScreenLoader";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import toast from "react-hot-toast";
import { useSelector, useDispatch } from "react-redux";
import UpdateProductModal from "@/components/seller/UpdateProductModal";
import { removeProduct, setSellerProducts, setProducts } from "@/app/redux/slices/ProductSlice";

const ProductList = () => {

   const [openMenu, setOpenMenu] = useState(null);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [selectedProduct, setSelectedProduct] = useState(null);
   const router = useRouter();
   const {getToken}  = useAuth();
   const user = useSelector((state)=>state.user.user);
   const dispatch = useDispatch();
   
   // Get seller products and all products from Redux at the top
   const { sellerItems: products, sellerStatus: status, sellerHasFetched: hasFetched, sellerTotalPages: totalPages, currentPage, items: allProducts } = useSelector((state) => state.products);
   const loading = status === 'loading';
   
   const isSeller = useSelector((state)=>state.user.isSeller);
   const { isLoaded  } = useUser();
   const [statusLoadingId, setStatusLoadingId] = useState(null);

const fetchSellerProduct = async (page = 1) => {
  try {
    if (!isLoaded || !user || !isSeller) return;

    const token = await getToken();
    if (!token) {
      toast.error("Token not available.");
      return;
    }

    const { data } = await axios.get(`/api/product/seller-list?page=${page}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (data.success) {
      // Update seller products in Redux with complete response data
      dispatch(setSellerProducts({
        products: data.products,
        totalPages: data.totalPages,
        currentPage: data.currentPage
      }));
    } else {
      toast.error(data.message || "Failed to fetch seller products.");
    }
  } catch (error) {
    toast.error(error.message || "Something went wrong.");
  }
};

useEffect(() => {
  fetchSellerProduct(currentPage);
}, [user, isLoaded, isSeller, dispatch]);

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
        // Remove from both seller products and home page products
        dispatch(removeProduct(productId));
        setOpenMenu(null);
        // No need to refetch - the product is already removed from Redux state
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
      
      // Update the product in both seller products and home page products
      const updatedProduct = data.product; // API returns the updated product
      
      // Update in seller products
      const updatedSellerProducts = products.map(p => p._id === productId ? updatedProduct : p);
      dispatch(setSellerProducts({
        products: updatedSellerProducts,
        totalPages: totalPages,
        currentPage: currentPage
      }));
      
      // Also update in home page products (all products)
      if (allProducts && allProducts.length > 0) {
        const updatedAllProducts = allProducts.map(p => p._id === productId ? updatedProduct : p);
        dispatch(setProducts(updatedAllProducts));
      }
      
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

const handleStatusToggle = async (product) => {
  const newStatus = product.status === 'active' ? 'inactive' : 'active';
  const updatedProduct = { ...product, status: newStatus };

  // Optimistically update in Redux
  const updatedSellerProducts = products.map(p =>
    p._id === product._id ? updatedProduct : p
  );
  dispatch(setSellerProducts({
    products: updatedSellerProducts,
    totalPages: totalPages,
    currentPage: currentPage
  }));

  setStatusLoadingId(product._id);

  try {
    const token = await getToken();
    const { data } = await axios.put('/api/product/update-status', {
      productId: product._id,
      status: newStatus,
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (data.success) {
      toast.success(`Product status updated to ${newStatus}.`);
      // Use the updatedSellerProducts array to avoid reverting the UI
      const syncedProducts = updatedSellerProducts.map(p =>
        p._id === product._id ? { ...p, ...data.product } : p
      );
      dispatch(setSellerProducts({
        products: syncedProducts,
        totalPages: totalPages,
        currentPage: currentPage
      }));
    } else {
      throw new Error(data.message || 'Failed to update status');
    }
  } catch (error) {
    // Revert UI on error
    const revertedProducts = products.map(p =>
      p._id === product._id ? product : p
    );
    dispatch(setSellerProducts({
      products: revertedProducts,
      totalPages: totalPages,
      currentPage: currentPage
    }));
    toast.error(error.message || 'Failed to update status');
  } finally {
    setStatusLoadingId(null);
  }
};

  return (
    <div className="w-full min-h-screen">
      {loading ? < FullScreenLoader message="Loading product list..."/> : (
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
              <div className="overflow-x-auto sm:overflow-visible">
  <table className="w-full text-xs sm:text-sm">
    <thead className="bg-gray-50">
      <tr>
        <th className="p-2 sm:p-3 text-left font-semibold text-gray-700">Product</th>
        <th className="p-2 sm:p-3 text-left font-semibold text-gray-700">Category</th>
        <th className="p-2 sm:p-3 text-left font-semibold text-gray-700">Price</th>
        <th className="p-2 sm:p-3 text-left font-semibold text-gray-700">Units Sold</th>
        <th className="p-2 sm:p-3 text-left font-semibold text-gray-700">Status</th>
        <th className="hidden sm:table-cell p-2 sm:p-3 text-left font-semibold text-gray-700">Last Updated</th>
        <th className="p-2 sm:p-3 text-center font-semibold text-gray-700">Actions</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-200">
      {products.map((product) => (
        <tr key={product._id} className="hover:bg-gray-50">
          <td className="p-2 sm:p-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              <Image
                src={product.image[0]}
                alt={product.name}
                width={48}
                height={48}
                className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-md"
              />
              <span className="font-medium text-gray-800">{product.name}</span>
            </div>
          </td>
          <td className="p-2 sm:p-3 text-gray-600">{product.category}</td>
          <td className="p-2 sm:p-3 text-gray-600">₹{product.offerPrice}</td>
          <td className="p-2 sm:p-3 font-medium text-gray-800">{product.unitsSold}</td>
          <td className="p-2 sm:p-3">
            <button
              type="button"
              className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${
                product.status === 'active' ? 'bg-green-500' : 'bg-red-200'
              }`}
              onClick={() => handleStatusToggle(product)}
              disabled={statusLoadingId === product._id}
              aria-pressed={product.status === 'active'}
            >
              <span
                className={`inline-block w-5 h-5 transform bg-white rounded-full shadow transition-transform ${
                  product.status === 'active' ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
            <span
              className={`ml-2 text-xs font-semibold ${
                product.status === 'active' ? 'text-green-700' : 'text-red-600'
              }`}
            >
              {product.status === 'active' ? 'Active' : 'Inactive'}
            </span>
          </td>
          <td className="hidden sm:table-cell p-2 sm:p-3 text-gray-600">
            {new Date(product.date).toLocaleDateString()}
          </td>
          <td className="p-2 sm:p-3 text-center relative">
            <button 
              onClick={() => setOpenMenu(openMenu === product._id ? null : product._id)}
              className="p-1 sm:p-2 rounded-full hover:bg-gray-100 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
            </button>
            {openMenu === product._id && (
              <div className="absolute right-2 mt-2 w-32 bg-white rounded-md shadow-lg z-20 border border-gray-100">
                <div className="py-1">
                  <button 
                    onClick={() => openUpdateModal(product)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Update
                  </button>
                  <button 
                    onClick={() => handleDelete(product._id)}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
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
                  onClick={() => {
                    const newPage = Math.max(currentPage - 1, 1);
                    if (newPage !== currentPage) {
                      fetchSellerProduct(newPage);
                    }
                  }}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => {
                    const newPage = Math.min(currentPage + 1, totalPages);
                    if (newPage !== currentPage) {
                      fetchSellerProduct(newPage);
                    }
                  }}
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
            onClose={() => {
              setIsModalOpen(false);
              setSelectedProduct(null);
            }}
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