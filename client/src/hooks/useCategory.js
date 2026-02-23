import { useState, useEffect } from "react";
import axios from "axios";

export default function useCategory() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // get cat
  const getCategories = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/v1/category/get-category");
      setCategories(data?.category || []); // Fix: use default value empty array if data or category is undefined or null - Shaun Lee Xuan Wei A0252626E
    } catch (error) {
      console.log(error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCategories();
  }, []);

  return {categories, loading, error};
}
