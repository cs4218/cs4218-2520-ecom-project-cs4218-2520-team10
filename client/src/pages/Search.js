import React from "react";
import Layout from "./../components/Layout";
import { useSearch } from "../context/search";
const Search = () => {
  const [values, setValues] = useSearch();
  return (
    <Layout title={"Search results"}>
      <div className="container">
        <div className="text-center">
          <h1 data-testid="search-results-title">Search Results</h1>
          <h6 data-testid="results-count">
            {values?.results.length < 1
              ? "No Products Found"
              : `Found ${values?.results.length}`}
          </h6>
          <div className="d-flex flex-wrap mt-4">
            {values?.results.map((p) => (
              <div className="card m-2" style={{ width: "18rem" }} key={p._id} data-testid={`search-result-card-${p._id}`}>
                <img
                  src={`/api/v1/product/product-photo/${p._id}`}
                  className="card-img-top"
                  alt={p.name}
                  data-testid={`search-result-image-${p._id}`}
                />
                <div className="card-body">
                  <h5 className="card-title" data-testid={`search-result-name-${p._id}`}>{p.name}</h5>
                  <p className="card-text" data-testid={`search-result-description-${p._id}`}>
                    {p.description.substring(0, 30)}...
                  </p>
                  <p className="card-text card-price" data-testid={`search-result-price-${p._id}`}> $ {p.price}</p>
                  <button className="btn btn-primary ms-1" data-testid={`search-result-details-${p._id}`}>More Details</button>
                  <button className="btn btn-secondary ms-1" data-testid={`search-result-cart-${p._id}`}>ADD TO CART</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Search;