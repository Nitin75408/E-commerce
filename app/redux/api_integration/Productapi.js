// app/redux/api_integration/userApi.js
import axios from "axios";

// This is a pure function — no React hooks here
export const getProductDataFromApi = async (token) => {
    const { data } = await axios.get('/api/product/list', {
        headers: { Authorization: `Bearer ${token}` }
    });
    return data;
};