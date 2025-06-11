// app/redux/api_integration/userApi.js
import axios from "axios";

// This is a pure function — no React hooks here
export const getUserDataFromApi = async (token) => {
    const { data } = await axios.get('/api/user/data', {
        headers: { Authorization: `Bearer ${token}` }
    });
    return data;
};