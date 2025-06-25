'use client'
import Navbar from '@/components/seller/Navbar'
import Sidebar from '@/components/seller/Sidebar'
import React from 'react'
import { useFetchUserData } from '@/app/customhooks/useFetchUserdata'

const Layout = ({ children }) => {
  // Ensure user data is fetched for all seller pages
  useFetchUserData();
  return (
    <div>
      <Navbar />
      <div className='flex w-full'>
        <Sidebar />
        {children}
      </div>
    </div>
  )
}

export default Layout