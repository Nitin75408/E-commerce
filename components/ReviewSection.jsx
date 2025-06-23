'use client';
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import RateProductForm from './RateProductForm';

// Helper component for a single review
const ReviewCard = ({ review }) => (
  <div className="border-t py-4">
    <div className="flex items-center mb-2">
      <Image src={review.user.image} alt={review.user.name} width={32} height={32} className="rounded-full" />
      <div className="ml-3">
        <p className="font-semibold">{review.user.name}</p>
        <div className="flex items-center text-sm text-gray-500">
          {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
        </div>
      </div>
    </div>
    <h4 className="font-semibold text-gray-800">{review.title}</h4>
    <p className="text-gray-600 mt-1">{review.description}</p>
    {review.images && review.images.length > 0 && (
      <div className="flex gap-2 mt-2">
        {review.images.map(img => <Image key={img} src={img} alt="review image" width={80} height={80} className="rounded-md object-cover" />)}
      </div>
    )}
    <p className="text-xs text-gray-400 mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
  </div>
);

const ReviewSection = ({ productId }) => {
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data } = await axios.get(`/api/review/list?productId=${productId}`);
        if (data.success) {
          setReviews(data.reviews);
        }
      } catch (error) {
        console.error("Failed to fetch reviews", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReviews();
  }, [productId]);
  
  // This function will be passed to the form so it can update the list upon submission
  const handleReviewSubmitted = (newReview) => {
    setReviews(prev => [newReview, ...prev]);
    setShowReviewForm(false);
  };

  const handleRateProductClick = async () => {
    if (!isSignedIn) {
      toast.error("Please sign in to rate a product.");
      return;
    }
    // Simple check to see if user has purchased the item. 
    // The robust check is on the server-side API endpoint.
    try {
        const token = await getToken();
        const { data } = await axios.post('/api/review/add', { product: productId, rating: 5 }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        // This is a dummy request to check purchase status. It will fail on the backend if not purchased.
    } catch (error) {
        if (error.response?.status === 403) {
            router.push('/not-purchased');
            return;
        }
    }
    setShowReviewForm(true);
  };

  const ratingSummary = useMemo(() => {
    if (reviews.length === 0) return { average: 0, total: 0, counts: {} };
    const total = reviews.length;
    const average = reviews.reduce((acc, r) => acc + r.rating, 0) / total;
    const counts = reviews.reduce((acc, r) => {
      acc[r.rating] = (acc[r.rating] || 0) + 1;
      return acc;
    }, {});
    return { average: average.toFixed(1), total, counts };
  }, [reviews]);

  if (isLoading) return <p>Loading reviews...</p>;

  return (
    <div className="mt-12">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Ratings & Reviews</h2>
        {!showReviewForm && (
          <button 
            onClick={handleRateProductClick}
            className="border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50"
          >
            Rate Product
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Ratings Summary */}
        <div className="md:col-span-1">
          <div className="flex items-center space-x-2">
            <p className="text-4xl font-bold">{ratingSummary.average}</p>
            <span className="text-2xl">★</span>
          </div>
          <p className="text-gray-500">{ratingSummary.total} Ratings</p>
          <div className="mt-4 space-y-1">
            {[5, 4, 3, 2, 1].map(star => (
              <div key={star} className="flex items-center">
                <span className="text-xs">{star}★</span>
                <div className="w-full bg-gray-200 rounded-full h-2 mx-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${((ratingSummary.counts[star] || 0) / ratingSummary.total) * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500">{ratingSummary.counts[star] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        <div className="md:col-span-2">
          {reviews.length > 0 ? (
            reviews.map(review => <ReviewCard key={review._id} review={review} />)
          ) : (
            <p>No reviews yet. Be the first to review this product!</p>
          )}
        </div>
      </div>
      
      {showReviewForm && (
        <RateProductForm productId={productId} onReviewSubmitted={handleReviewSubmitted} />
      )}
    </div>
  );
};

export default ReviewSection;
