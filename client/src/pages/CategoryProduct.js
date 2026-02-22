import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "../context/cart";
import toast from "react-hot-toast";
import "../styles/CategoryProductStyles.css";
import axios from "axios";

const CategoryProduct = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [cart, setCart] = useCart();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState([]);

  useEffect(() => {
    if (params?.slug) getProductsByCat();
  }, [params?.slug]);

  const getProductsByCat = async () => {
    try {
      const { data } = await axios.get(
        `/api/v1/product/product-category/${params.slug}`
      );
      setProducts(data?.products);
      setCategory(data?.category);
    } catch (error) {
      console.log(error);
      // Bug fix: Added error handling for failed API call - Ong Chang Heng Bertrand A0253013X
      toast.error("Something went wrong while fetching products by category");
    }
  };

  return (
    <Layout>
      <div className="container mt-3 category">
        {/* Add data-testid attributes for testing - Ong Chang Heng Bertrand A0253013X */}
        <h4 className="text-center" data-testid="category-name">Category - {category?.name}</h4>
        <h6 className="text-center" data-testid="product-count">{products?.length} results found </h6>
        <div className="row">
          <div className="col-md-9 offset-1">
            <div className="d-flex flex-wrap">
              {products?.map((p) => (
                <div className="card m-2" key={p._id}>
                  <img
                    src={`/api/v1/product/product-photo/${p._id}`}
                    className="card-img-top"
                    alt={p.name}
                  />
                  <div className="card-body">
                    <div className="card-name-price">
                      <h5 className="card-title" data-testid={`product-name-${p._id}`}>{p.name}</h5>
                      <h5 className="card-title card-price" data-testid={`product-price-${p._id}`}>
                        {p.price.toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
                        })}
                      </h5>
                    </div>
                    <p className="card-text" data-testid={`product-description-${p._id}`}>
                      {p.description.substring(0, 60)}...
                    </p>
                    <div className="card-name-price">
                      <button
                        data-testid={`more-details-button-${p._id}`}
                        className="btn btn-info ms-1"
                        onClick={() => navigate(`/product/${p.slug}`)}
                      >
                        More Details
                      </button>
                      <button
                        data-testid={`add-to-cart-button-${p._id}`}
                        className="btn btn-dark ms-1"
                        // Bug fix: Added add to cart functionality - Ong Chang Heng Bertrand A0253013X
                        onClick={() => {
                          setCart([...cart, p]);
                          localStorage.setItem(
                            "cart",
                            JSON.stringify([...cart, p])
                          );
                          toast.success("Item Added to cart");
                        }}
                      >
                        ADD TO CART
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CategoryProduct;