"use client"
import React from "react";
import { assets, BagIcon, BoxIcon, CartIcon, HomeIcon } from "@/assets/assets";
import Link from "next/link"
import Image from "next/image";
import { SignOutButton, useAuth, useClerk, UserButton,useUser } from "@clerk/nextjs";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useFetchUserData } from "@/app/customhooks/useFetchUserdata";
import { useFetchProductData } from "@/app/customhooks/useFetchproductDat";
const Navbar = () => {
  const [mounted, setMounted] = useState(false);
  const dispatch = useDispatch();
  const isSeller = useSelector((state) => state.user.isSeller)
  const { isSignedIn,isLoaded ,user } = useUser();
  const { openSignIn, signOut } = useClerk();
  const { fetchUserData } = useFetchUserData();
  const { fetchProductData } = useFetchProductData();

   // New Effect: Fetch user data
  const router = useRouter();

  useEffect(() => {
       if(user){
           fetchUserData();
           fetchProductData();
       }
      
    }, [user]);

    useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null; // Avoid hydration mismatch

  return (
    <nav className="flex items-center justify-between px-6 md:px-16 lg:px-32 py-3 border-b border-gray-300 text-gray-700">
      <Image
        className="cursor-pointer w-28 md:w-32"
        onClick={() => router.push('/')}
        src={assets.logo}
        alt="logo"
      />
      <div className="flex items-center gap-4 lg:gap-8 max-md:hidden">
        <Link href="/" className="hover:text-gray-900 transition">
          Home
        </Link>
        <Link href="/all-products" className="hover:text-gray-900 transition">
          Shop
        </Link>
        <Link href="/" className="hover:text-gray-900 transition">
          About Us
        </Link>
        <Link href="/" className="hover:text-gray-900 transition">
          Contact
        </Link>

        {isSeller ? <button onClick={() => router.push('/seller')} className="text-xs border px-4 py-1.5 rounded-full">Seller Dashboard</button> :null}

      </div>

      <ul className="hidden md:flex items-center gap-4 ">
        <Image className="w-4 h-4" src={assets.search_icon} alt="search icon" />
        {
          isSignedIn ?
            <>
              <UserButton
              >
                <UserButton.MenuItems>
                  <UserButton.Action label="My Cart" labelIcon={<CartIcon />} onClick={() => { router.push('/cart') }} />
                </UserButton.MenuItems>
                <UserButton.MenuItems>
                  <UserButton.Action label="My orders" labelIcon={<BagIcon />} onClick={() => { router.push('/my-orders') }} />
                </UserButton.MenuItems>
                {/* <UserButton.MenuItems>
                  <UserButton.Action label="signout" labelIcon={<HomeIcon />} onClick={async () => {
                    console.log("Signing out...");

                    // Clear client state first
                    localStorage.removeItem('cartItems');
                    dispatch(clearCartItem());

                    try {
                      // Sign out
                      await signOut();

                      // If signOut doesn't auto-redirect, navigate manually
                      router.push("/");
                    } catch (error) {
                      console.error("Error during sign out:", error);
                    }
                  }} />
                </UserButton.MenuItems> */}
              </UserButton>
            </>
            :
            <button onClick={openSignIn} className="flex items-center gap-2 hover:text-gray-900 transition">
              <Image src={assets.user_icon} alt="user icon" />
              Account
            </button>

        }
      </ul>

      <div className="flex items-center md:hidden gap-3">
        {
          isSignedIn ?
            <>
              <UserButton >
                <UserButton.MenuItems>
                  <UserButton.Action label="home" labelIcon={<HomeIcon />} onClick={() => { router.push('/') }} />
                </UserButton.MenuItems>
                <UserButton.MenuItems>
                  <UserButton.Action label="products" labelIcon={<BoxIcon />} onClick={() => { router.push('/all-products') }} />
                </UserButton.MenuItems>
                <UserButton.MenuItems>
                  <UserButton.Action label="My Cart" labelIcon={<CartIcon />} onClick={() => { router.push('/cart') }} />
                </UserButton.MenuItems>
                <UserButton.MenuItems>
                  <UserButton.Action label="My orders" labelIcon={<BagIcon />} onClick={() => { router.push('/my-orders') }} />
                </UserButton.MenuItems>
              </UserButton>
            </>
            :
            <button onClick={openSignIn} className="flex items-center gap-2 hover:text-gray-900 transition">
              <Image src={assets.user_icon} alt="user icon" />
              Account
            </button>

        }
      </div>
    </nav>
  );
};

export default dynamic(() => Promise.resolve(Navbar), { ssr: false })