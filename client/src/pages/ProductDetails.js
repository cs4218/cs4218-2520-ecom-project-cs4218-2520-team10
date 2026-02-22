import React, { useState, useEffect } from "react";
import Layout from "./../components/Layout";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "../context/cart";
import toast from "react-hot-toast";
import "../styles/ProductDetailsStyles.css";

const ProductDetails = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [cart, setCart] = useCart();
  const [product, setProduct] = useState({});
  const [relatedProducts, setRelatedProducts] = useState([]);

  //initial details
  useEffect(() => {
    if (params?.slug) getProduct();
  }, [params?.slug]);

  //getProduct
  const getProduct = async () => {
    try {
      const { data } = await axios.get(
        `/api/v1/product/get-product/${params.slug}`
      );
      // Bug fix: Added check for missing product data and show error message - Ong Chang Heng Bertrand A0253013X
      if (!data?.product) {
        toast.error("Product not found");
        setProduct({});
        return;
      }
      setProduct(data?.product);
      getSimilarProduct(data?.product._id, data?.product.category._id);
    } catch (error) {
      console.log(error);
      // Bug fix: Added error handling for failed API call - Ong Chang Heng Bertrand A0253013X
      toast.error("Something went wrong while fetching product details");
      setProduct({});
    }
  };

  //get similar product
  const getSimilarProduct = async (pid, cid) => {
    try {
      const { data } = await axios.get(
        `/api/v1/product/related-product/${pid}/${cid}`
      );
      setRelatedProducts(data?.products);
    } catch (error) {
      console.log(error);
      // Bug fix: Added error handling for failed API call - Ong Chang Heng Bertrand A0253013X
      toast.error("Something went wrong while fetching related products");
      setRelatedProducts([]);
    }
  };

  return (
    <Layout>
      <div className="row container product-details">
        <div className="col-md-6">
          <img
            data-testid="main-product-image"
            src={`/api/v1/product/product-photo/${product._id}`}
            className="card-img-top"
            alt={product.name}
            height="300"
            width={"350px"}
          />
        </div>
        <div className="col-md-6 product-details-info">
          {/* Added data-testid attributes to the relevant elements for testing purposes - Ong Chang Heng Bertrand A0253013X */}
          <h1 className="text-center" data-testid="product-name">
            Product Details
          </h1>
          <hr />
          <h6 data-testid="product-title">{product?.name}</h6>
          <h6 data-testid="product-description">Description: {product?.description}</h6>
          <h6 data-testid="product-price">
            Price: {product?.price?.toLocaleString("en-US", { style: "currency", currency: "USD" })}
          </h6>
          <h6 data-testid="product-category">Category: {product?.category?.name}</h6>
          <button
            data-testid={`main-add-to-cart-button-${product._id}`}
            className="btn btn-secondary ms-1"
            // Added add to cart functionality - Ong Chang Heng Bertrand A0253013X
            // Bug fix: Changed "class" to "className" - Ong Chang Heng Bertrand A0253013X
            onClick={() => {
              setCart([...cart, product]);
              localStorage.setItem(
                "cart",
                JSON.stringify([...cart, product])
              );
              toast.success("Item Added to cart");
            }}
          >
            ADD TO CART
          </button>
        </div>
      </div>
      <hr />
      <div className="row container similar-products">
        <h4 data-testid="similar-products-title">Similar Products ➡️</h4>
        {relatedProducts.length < 1 && (
          <p className="text-center" data-testid="no-similar-products">No Similar Products found</p>
        )}
        <div className="d-flex flex-wrap">
          {relatedProducts?.map((p) => (
            <div className="card m-2" key={p._id}>
              <img
                src={`/api/v1/product/product-photo/${p._id}`}
                className="card-img-top"
                alt={p.name}
                data-testid={`similar-product-image-${p._id}`}
              />
              <div className="card-body">
                <div className="card-name-price">
                  <h5 className="card-title" data-testid={`similar-product-name-${p._id}`}>{p.name}</h5>
                  <h5 className="card-title card-price">
                    {p.price.toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                    })}
                  </h5>
                </div>
                <p className="card-text ">
                  {p.description.substring(0, 60)}...
                </p>
                <div className="card-name-price">
                  <button
                    data-testid={`similar-more-details-button-${p._id}`}
                    className="btn btn-info ms-1"
                    onClick={() => navigate(`/product/${p.slug}`)}
                  >
                    More Details
                  </button>
                  <button
                    data-testid={`similar-add-to-cart-button-${p._id}`}
                    className="btn btn-dark ms-1"
                    // Added add to cart functionality - Ong Chang Heng Bertrand A0253013X
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
    </Layout>
  );
};

export default ProductDetails;