import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import useCategory from "../hooks/useCategory";
import Layout from "../components/Layout";
import toast from "react-hot-toast";

const Categories = () => {
  const { categories, error } = useCategory();
  useEffect(() => {
    if (error) {
      toast.error(error.message ?? "Something went wrong while fetching categories"); // Bug fix: show error toast when useCategory fails to fetch - Shaun Lee Xuan Wei A0252626E
    }
  }, [error]);
  return (
    <Layout title={"All Categories"}>
      <div className="container">
        <div className="row">
          {categories?.map((c) => ( // Fix: guard against categories being undefined or null - Shaun Lee Xuan Wei A0252626E
            <div className="col-md-6 mt-5 mb-3 gx-3 gy-3" key={c._id}>
              <Link to={`/category/${c.slug}`} className="btn btn-primary">
                {c.name}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Categories;
