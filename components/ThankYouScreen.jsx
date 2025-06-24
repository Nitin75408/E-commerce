// File: app/components/ThankYouScreen.jsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ThankYouScreen() {
  const router = useRouter();

  useEffect(() => {
    console.log("ThankYouScreen mounted");
    const timer = setTimeout(() => {
      router.push("/my-orders");
    }, 2000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[9999] text-black">
      <h1 className="text-3xl font-bold mb-4">🎉 Thank you for your order!</h1>
      <p className="text-lg text-gray-600">Redirecting to My Orders...</p>
    </div>
  );
}

