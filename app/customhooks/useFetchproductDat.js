// app/hooks/useFetchUserData.js
"use client";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { useAuth, useUser } from "@clerk/nextjs";
import { getProductDataFromApi } from "../redux/api_integration/Productapi";
import { setProducts } from "../redux/slices/ProductSlice";

export const useFetchProductData = () => {
   const { getToken } = useAuth();
    const { user } = useUser();
    const dispatch = useDispatch();

    const fetchProductData = async () => { 
       try {
            const token = await getToken();
            const data = await getProductDataFromApi(token)
            if (data.success) {
              
               dispatch(setProducts(data.products)); 
               
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    return { fetchProductData};
};