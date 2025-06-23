import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import debounce from "lodash.debounce";
import { useRouter } from "next/navigation";
import { assets } from "@/assets/assets";
import Image from "next/image";

// SearchBar component provides a real-time product search experience
// - Debounced API calls to /api/product/search
// - Shows a dropdown with results as the user types
// - Clicking a result navigates to the product detail page
const SearchBar = () => {
  // State for the search input value
  const [query, setQuery] = useState("");
  // State to store the search results
  const [results, setResults] = useState([]);
  // State to show loading indicator
  const [loading, setLoading] = useState(false);
  // State to show 'No results found' message
  const [noResults, setNoResults] = useState(false);
  // State to control dropdown visibility
  const [showDropdown, setShowDropdown] = useState(false);
  // Ref for closing dropdown on outside click
  const wrapperRef = useRef(null);
  // Next.js router for navigation
  const router = useRouter();

  // Debounced function to fetch search results from the API
  // - Only fires if the query is not empty
  // - Uses lodash.debounce to limit API calls while typing
  const fetchResults = debounce(async (q) => {
    setLoading(true);
    try {
      // If query is empty, don't search
      if (!q.trim()) {
        setResults([]);
        setNoResults(false);
        setLoading(false);
        return;
      }
      // Make GET request to the search API with query only
      const res = await axios.get(`/api/product/search?q=${q}`);
      setResults(res.data); // Store results
      setNoResults(res.data.length === 0); // Show 'No results' if empty
    } catch (err) {
      setResults([]);
      setNoResults(true);
    }
    setLoading(false);
  }, 400); // 400ms debounce

  // useEffect runs whenever 'query' changes
  // - Triggers the debounced search
  useEffect(() => {
    fetchResults(query);
    return () => fetchResults.cancel();
  }, [query]);

  // Close dropdown when clicking outside the search bar
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle clicking a search result
  // - Navigates to the product detail page
  // - Clears the search and closes the dropdown
  const handleResultClick = (id) => {
    setResults([]);
    setQuery("");
    setShowDropdown(false);
    router.push(`/product/${id}`);
  };

  return (
    <div className="w-full flex justify-center" ref={wrapperRef}>
      {/* Main search bar container with input and icon */}
      <div className="relative w-full max-w-md">
        {/* Search input with icon on the left */}
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
          <Image src={assets.search_icon} alt="search" width={18} height={18} />
        </span>
        <input
          className="w-full pl-10 pr-4 py-1.5 rounded-full border border-gray-300 bg-white shadow-sm text-sm placeholder-gray-400 focus:border-gray-400 focus:outline-none focus:ring-0"
          type="text"
          placeholder="Search for Products"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setShowDropdown(true)}
        />
        {/* Results dropdown (shows when typing and focused) */}
        {showDropdown && (
          <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded shadow-lg z-10">
            {/* Loading indicator */}
            {loading && <div className="p-2 text-gray-500">Loading...</div>}
            {/* No results message */}
            {!loading && noResults && <div className="p-2 text-red-500">No results found</div>}
            {/* Results list */}
            {!loading && results.length > 0 && (
              <ul>
                {results.map(product => (
                  <li
                    key={product._id}
                    className="p-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                    onClick={() => handleResultClick(product._id)}
                  >
                    <span className="font-semibold">{product.name}</span> - {product.brand}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar; 