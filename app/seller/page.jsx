'use client'
import React, { useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import { fetchProducts } from "../redux/slices/ProductSlice";
import FullScreenLoader from "@/components/FullScreenLoader";

const AddProduct = () => {
  const { getToken } = useAuth();
  const [files, setFiles] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Earphone');
  const [price, setPrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false); // Re-adding state

  // Function to generate AI description using OpenAI API
  const generateAIDescription = async () => {
    // STEP 1: VALIDATE REQUIRED FIELDS
    // Check if user has filled in the necessary information
    if (!name || !category || !price) {
      toast.error("Please fill in product name, category, and price first");
      return;
    }

    // STEP 2: SET LOADING STATE
    // Show loading indicator and disable button
    setGeneratingDescription(true);
    
    try {
      // STEP 3: GET AUTH TOKEN
      // Get authentication token from Clerk
      const token = await getToken();
      
      // STEP 4: PREPARE DATA FOR API
      // Create the data object to send to our backend API
      const requestData = {
        name,           // Product name from form
        category,       // Selected category
        price: Number(price),        // Convert to number
        offerPrice: Number(offerPrice) // Convert to number (optional)
      };

      // STEP 5: CALL OUR BACKEND API
      // Send POST request to /api/product/generate-description
      const { data } = await axios.post('/api/product/generate-description', requestData, {
        headers: { 
          Authorization: `Bearer ${token}` // Include auth token
        }
      });

      // STEP 6: HANDLE API RESPONSE
      if (data.success) {
        // If successful, update the description field with AI-generated text
        setDescription(data.description);
        toast.success("AI description generated successfully!");
      } else {
        // If API returns an error, show error message
        toast.error(data.message || "Failed to generate description");
      }
    } catch (error) {
      // STEP 7: HANDLE NETWORK/OTHER ERRORS
      // If request fails (network error, server error, etc.)
       console.error('Frontend Error Details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      toast.error("Failed to generate AI description. Please try again.");
    } finally {
      // STEP 8: CLEANUP
      // Always reset loading state, regardless of success/failure
      setGeneratingDescription(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('price', price);
    formData.append('offerPrice', offerPrice);

    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    try {
      setLoading(true);
      const token = await getToken();
      const { data } = await axios.post('/api/product/add', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        toast.success(data.message);
        dispatch(fetchProducts(token));
        // Reset form
        setFiles([]);
        setName('');
        setDescription('');
        setCategory('Earphone');
        setPrice('');
        setOfferPrice('');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen flex flex-col justify-between">
      {loading && <FullScreenLoader message="Adding Product..." />}
      <form onSubmit={handleSubmit} className="md:p-10 p-4 space-y-5 max-w-lg">
        <div>
          <p className="text-base font-medium">Product Image</p>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {[...Array(4)].map((_, index) => (
              <label key={index} htmlFor={`image${index}`}>
                <input
                  onChange={(e) => {
                    const updatedFiles = [...files];
                    updatedFiles[index] = e.target.files[0];
                    setFiles(updatedFiles);
                  }}
                  type="file"
                  id={`image${index}`}
                  hidden
                />
                <Image
                  className="max-w-24 cursor-pointer"
                  src={files[index] ? URL.createObjectURL(files[index]) : assets.upload_area}
                  alt=""
                  width={100}
                  height={100}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1 max-w-md">
          <label className="text-base font-medium" htmlFor="product-name">
            Product Name
          </label>
          <input
            id="product-name"
            type="text"
            placeholder="Type here"
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
            onChange={(e) => setName(e.target.value)}
            value={name}
            required
          />
        </div>

        <div className="flex flex-col gap-1 max-w-md">
          <div className="flex items-center justify-between">
            <label className="text-base font-medium" htmlFor="product-description">
              Product Description
            </label>
            <button
              type="button"
              onClick={generateAIDescription}
              disabled={generatingDescription || !name || !category || !price}
              className={`px-3 py-1 text-sm font-medium rounded text-white ${
                generatingDescription || !name || !category || !price
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {generatingDescription ? "Generating..." : "Generate AI"}
            </button>
          </div>
          <textarea
            id="product-description"
            rows={4}
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 resize-none"
            placeholder="Type here or click 'Generate AI' to create a description"
            onChange={(e) => setDescription(e.target.value)}
            value={description}
            required
          ></textarea>
        </div>

        <div className="flex items-center gap-5 flex-wrap">
          <div className="flex flex-col gap-1 w-32">
            <label className="text-base font-medium" htmlFor="category">
              Category
            </label>
            <select
              id="category"
              className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
              onChange={(e) => setCategory(e.target.value)}
              value={category}
            >
              <option value="Earphone">Earphone</option>
              <option value="Headphone">Headphone</option>
              <option value="Watch">Watch</option>
              <option value="Smartphone">Smartphone</option>
              <option value="Laptop">Laptop</option>
              <option value="Camera">Camera</option>
              <option value="Accessories">Accessories</option>
            </select>
          </div>

          <div className="flex flex-col gap-1 w-32">
            <label className="text-base font-medium" htmlFor="product-price">
              Product Price
            </label>
            <input
              id="product-price"
              type="number"
              placeholder="0"
              className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
              onChange={(e) => setPrice(e.target.value)}
              value={price}
              required
            />
          </div>

          <div className="flex flex-col gap-1 w-32">
            <label className="text-base font-medium" htmlFor="offer-price">
              Offer Price
            </label>
            <input
              id="offer-price"
              type="number"
              placeholder="0"
              className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
              onChange={(e) => setOfferPrice(e.target.value)}
              value={offerPrice}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`px-8 py-2.5 text-white font-medium rounded ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-700"
          }`}
        >
          {loading ? "Adding..." : "ADD"}
        </button>
      </form>
    </div>
  );
};

export default AddProduct;
