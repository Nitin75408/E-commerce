// app/hooks/useFetchUserData.js
"use client";
import { useDispatch } from "react-redux";
import { setClerkUser, setIsSeller,  setUserData } from "@/app/redux/slices/userSlice";
import { setCartItem } from "@/app/redux/slices/CartSlice";
import toast from "react-hot-toast";
import { useAuth, useUser } from "@clerk/nextjs";
import { getUserDataFromApi } from "@/app/redux/api_integration/userapi";

export const useFetchUserData = () => {
   const { getToken } = useAuth();
    const { user } = useUser();
    const dispatch = useDispatch();

    const fetchUserData = async () => {
        if (user) {
          
        }

        try {
            const token = await getToken();
            const data = await getUserDataFromApi(token);
            if (data.success) {
              
               
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    return { fetchUserData};
};