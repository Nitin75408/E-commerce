import axios from "axios";

export const fetchCartFromDB = async (token) => {
  const { data } = await axios.get("/api/cart/get", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

export const saveCartToDB = async (token, cartItems) => {
  try {
    await axios.post("/api/cart/update", 
      { cartdata: cartItems }, 
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log("✅ Cart saved successfully");
  } catch (err) {
    console.error("❌ Failed to save cart:", err.message);
  }
};