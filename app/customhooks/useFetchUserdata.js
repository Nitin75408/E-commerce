// app/hooks/useFetchUserData.js
"use client";
import { useDispatch } from "react-redux";
import { setClerkUser, setIsSeller, setUserData } from "@/app/redux/slices/userSlice";
import { setCartItem } from "@/app/redux/slices/CartSlice";
import toast from "react-hot-toast";
import { useAuth, useUser } from "@clerk/nextjs";
import { getUserDataFromApi } from "@/app/redux/api_integration/userapi";

export const useFetchUserData = () => {
    const { getToken } = useAuth();
    const { user, isLoaded } = useUser(); // <-- ADD isLoaded
    const dispatch = useDispatch();

    const fetchUserData = async () => {
        try {

            if (!isLoaded || !user) return; // <-- wait until Clerk loads the user
            if (user?.publicMetadata?.role === "seller") {
                dispatch(setIsSeller(true));
            }
            const token = await getToken();
            const data = await getUserDataFromApi(token);
            if (data.success) {
                dispatch(setUserData(data.user));
                dispatch(setCartItem(data.user.cartItems));
            } else {
                    toast.error(data.message || "User not found");
                }
            
        } catch (error) {
            toast.error(error.message);
        }
    };

    return { fetchUserData };
};