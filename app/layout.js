import { Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import {
  ClerkProvider
} from '@clerk/nextjs'
import { ReduxProvider } from '@/app/redux/ReduxProvider';


const outfit = Outfit({ subsets: ['latin'], weight: ["300", "400", "500"] })

export const metadata = {
  title: "QuickCart - GreatStack",
  description: "E-Commerce with Next.js ",
};

export default function RootLayout({ children }) {
  return (
        <ClerkProvider>
      <html lang="en">
        <body className={`${outfit.className} antialiased text-gray-700`} >
          <Toaster />
           <ReduxProvider>
            {children}
          </ReduxProvider>
        </body>
      </html>
            </ClerkProvider>
      
  );
}
