"use client"
import React, { useState, useEffect } from "react";
import { assets, BagIcon, BoxIcon, CartIcon, HomeIcon, search_icon } from "@/assets/assets";
import Link from "next/link"
import Image from "next/image";
import { useClerk, UserButton, useUser } from "@clerk/nextjs";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

import { useFetchUserData } from "@/app/customhooks/useFetchUserdata";
import { useFetchProductData } from "@/app/customhooks/useFetchproductDat";
import { useFetchCartData } from "@/app/customhooks/useFetchCartData";
import SearchBar from "./SearchBar";

const Navbar = () => {
  const dispatch = useDispatch();
  const isSeller = useSelector((state) => state.user.isSeller)
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  useFetchUserData();
  useFetchProductData();
  useFetchCartData();
  const router = useRouter();

  // State to manage the search bar visibility on mobile
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Close search when screen resizes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <header className="border-b border-gray-200 sticky top-0 bg-white z-50">
        <nav className="flex items-center justify-between px-6 md:px-10 py-3 text-gray-700">
          
          {/* Left Section: Logo */}
          <div className="flex-shrink-0">
            <Link href="/">
              <Image
                className="cursor-pointer w-28"
                src={assets.logo}
                alt="logo"
              />
            </Link>
          </div>

          {/* Middle Section: Desktop Nav Links and Search Bar */}
          <div className="hidden md:flex flex-1 items-center justify-center gap-6">
            <Link href="/" className="hover:text-gray-900 transition flex-shrink-0">Home</Link>
            <Link href="/all-products" className="hover:text-gray-900 transition flex-shrink-0">Shop</Link>
            <Link href="/" className="hover:text-gray-900 transition flex-shrink-0">About Us</Link>
            <Link href="/" className="hover:text-gray-900 transition flex-shrink-0">Contact</Link>
            <div className="w-full max-w-[160px]">
                <SearchBar />
            </div>
          </div>

          {/* Right Section: Search Icon (Mobile) + User Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="md:hidden p-2 rounded-full hover:bg-gray-100 transition"
            >
              <Image src={assets.search_icon} alt="Search" width={22} height={22} />
            </button>
{/* 
            {isSeller && (
                <button
                onClick={() => router.push('/seller')}
                className="hidden md:flex text-sm px-4 py-1.5 rounded-full border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium transition"
                >
                Seller Dashboard
                </button>
            )} */}

            {isSignedIn ? (
              <UserButton afterSignOutUrl="/">
                <UserButton.MenuItems>
                  {isSeller && <UserButton.Action label="Seller Dashboard" labelIcon={<BoxIcon />} onClick={() => router.push('/seller')} />}
                  <UserButton.Action label="My Cart" labelIcon={<CartIcon />} onClick={() => router.push('/cart')} />
                  <UserButton.Action label="My Orders" labelIcon={<BagIcon />} onClick={() => router.push('/my-orders')} />
                </UserButton.MenuItems>
              </UserButton>
            ) : (
              <button onClick={() => openSignIn()} className="hidden sm:flex items-center gap-2 hover:text-gray-900 transition px-3 py-1.5 rounded-full border border-gray-200 bg-white">
                <Image src={assets.user_icon} alt="user icon" />
                Account
              </button>
            )}
          </div>
        </nav>

        {/* Collapsible Search Bar for Mobile */}
        {isSearchOpen && (
          <div className="md:hidden px-6 pb-4 animate-in fade-in-20 slide-in-from-top-2 duration-300">
            <SearchBar />
          </div>
        )}
      </header>
    </>
  );
};

export default dynamic(() => Promise.resolve(Navbar), { ssr: false })