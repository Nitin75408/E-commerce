import React from 'react'
import { assets } from '@/assets/assets'
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const ProductCard = React.memo(({ product = {}, reviewSummary = {} }) => {
    const router  = useRouter();
    const currency = process.env.NEXT_PUBLIC_CURRENCY

    // Defensive: fallback for missing fields
    const name = product?.name || 'Product';
    const images = product?.image || [];
    const image = images[0] || '/fallback-image.png'; // Use a fallback image path
    const offerPrice = product?.offerPrice ?? product?.price ?? '';
    const description = product?.description || '';
    const productId = product?._id || '';
    
    // Helper to render stars based on avgRating
    const renderStars = (avgRating) => {
        const fullStars = Math.floor(avgRating);
        const halfStar = avgRating - fullStars >= 0.5;
        return Array.from({ length: 5 }).map((_, index) => {
            if (index < fullStars) {
                return (
                    <Image
                        key={index}
                        className="h-3 w-3"
                        src={assets.star_icon}
                        alt="star_icon"
                    />
                );
            } else if (index === fullStars && halfStar) {
                return (
                    <Image
                        key={index}
                        className="h-3 w-3 opacity-50"
                        src={assets.star_icon}
                        alt="star_icon"
                    />
                );
            } else {
                return (
                    <Image
                        key={index}
                        className="h-3 w-3"
                        src={assets.star_dull_icon}
                        alt="star_icon"
                    />
                );
            }
        });
    };

    return (
        <div
            onClick={() => { if (productId) { router.push('/product/' + productId); scrollTo(0, 0); } }}
            className="flex flex-col items-start gap-1 w-full cursor-pointer group"
        >
            <div className="cursor-pointer relative bg-gray-500/10 rounded-lg w-full h-48 sm:h-52 flex items-center justify-center overflow-hidden">
                <Image
                    src={image}
                    alt={name}
                    className="group-hover:scale-105 transition object-cover w-4/5 h-4/5 sm:w-full sm:h-full"
                    width={800}
                    height={800}
                />
                <button className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md hover:bg-gray-50 transition">
                    <Image
                        className="h-3 w-3"
                        src={assets.heart_icon}
                        alt="heart_icon"
                    />
                </button>
            </div>

            <div className="w-full space-y-1">
                <p className="text-sm sm:text-base font-medium leading-tight overflow-hidden" style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    lineHeight: '1.25rem'
                }}>
                    {name}
                </p>
                <p className="text-xs text-gray-500/70 hidden sm:block overflow-hidden" style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                }}>
                    {description}
                </p>
                {/* Review summary: green box with avg rating and one star, then review count */}
                {reviewSummary && reviewSummary.reviewCount > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                        <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                            {reviewSummary.avgRating}
                            <Image className="h-3 w-3" src={assets.star_icon} alt="star_icon" style={{ filter: 'brightness(0) invert(1)' }} />
                        </span>
                        <span className="text-xs text-gray-600 font-medium">({reviewSummary.reviewCount})</span>
                    </div>
                )}
                {/* End review summary */}
                <div className="flex items-end justify-between w-full pt-1">
                    <p className="text-sm sm:text-base font-medium">{currency}{offerPrice}</p>
                    <button className="hidden sm:block px-3 py-1 text-gray-500 border border-gray-500/20 rounded-full text-xs hover:bg-slate-50 transition">
                    Buy now
                </button>
                </div>
            </div>
        </div>
    )
});

// Add display name for better debugging
ProductCard.displayName = 'ProductCard';

export default ProductCard