'use client'
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import FilterSidebar from "@/components/FilterSidebar";
import FullScreenLoader from "@/components/FullScreenLoader";
import axios from 'axios';

const AllProducts = () => {
	const [products, setProducts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [initialLoading, setInitialLoading] = useState(true);
	
	// State for filter metadata
	const [categories, setCategories] = useState([]); 
	const [priceMetadata, setPriceMetadata] = useState({ min: 0, max: 1000 });

	// State for storing the user's selected filters
	const [selectedCategories, setSelectedCategories] = useState([]);
	const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 }); 

	// Fetch filter metadata once on page load
	useEffect(() => {
		const fetchMetadata = async () => {
			try {
				const { data } = await axios.get('/api/product/metadata');
				if (data.success) {
					setCategories(data.data.categories);
					setPriceMetadata({ min: data.data.minPrice, max: data.data.maxPrice });
					setPriceRange({ min: data.data.minPrice, max: data.data.maxPrice }); // Set initial range
				}
			} catch (error) {
				console.error("Failed to fetch metadata", error);
			}
		};
		fetchMetadata();
	}, []);

	// Fetch products when filters or page change
	useEffect(() => {
		const fetchProducts = async () => {
		  if (initialLoading) setLoading(true);
			const params = new URLSearchParams();
			params.append('page', currentPage);
			if (selectedCategories.length > 0) {
				params.append('categories', selectedCategories.join(','));
			}
			params.append('minPrice', priceRange.min);
			params.append('maxPrice', priceRange.max);

			try {
				const { data } = await axios.get(`/api/product/list?${params.toString()}`);
				if (data.success) {
					setProducts(data.products);
					setTotalPages(data.totalPages);
				}
			} catch (error) {
				console.error("Failed to fetch products", error);
			} finally {
				setLoading(false);
				 if (initialLoading) setInitialLoading(false);
			}
		};
		
		// Only fetch if metadata has been loaded
		if (priceMetadata.max > 1000) { // A check to see if metadata is loaded
			 fetchProducts();
		}
	}, [currentPage, selectedCategories, priceRange, priceMetadata]);

	
if (initialLoading) {
    return <FullScreenLoader message="Loading your products..." />;
}

	return (
		<>
			<Navbar />
			<div className="flex flex-col md:flex-row px-6 md:px-16 lg:px-32 pt-8">
				<FilterSidebar 
					categories={categories}
					onCategoryChange={setSelectedCategories}
					onPriceChange={setPriceRange}
					minPrice={priceMetadata.min} 
					maxPrice={priceMetadata.max} 
				/>

				<main className="flex-1 p-4">
					<div className="flex items-center justify-between mb-4">
						<h1 className="text-2xl font-medium">All Products</h1>
						<p className="text-gray-500">{products.length} results on this page</p>
					</div>
					<div className="w-16 h-0.5 bg-orange-600 rounded-full mb-8"></div>
					
					
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
							{products.map((product) => <ProductCard key={product._id} product={product} />)}
						</div>
					
					
					<div className="flex justify-between items-center mt-10">
						<button
							onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
							disabled={currentPage === 1}
							className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Previous
						</button>
						<span className="text-sm text-gray-700">
							Page {currentPage} of {totalPages}
						</span>
						<button
							onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
							disabled={currentPage === totalPages}
							className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Next
						</button>
					</div>
				</main>
			</div>
			<Footer />
		</>
	);
};

export default AllProducts;
