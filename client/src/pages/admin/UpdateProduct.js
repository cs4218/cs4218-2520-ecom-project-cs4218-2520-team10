import React, { useState, useEffect } from "react";
import Layout from "./../../components/Layout";
import AdminMenu from "./../../components/AdminMenu";
import toast from "react-hot-toast";
import axios from "axios";
import { Select } from "antd";
import { useNavigate, useParams } from "react-router-dom";
const { Option } = Select;

const UpdateProduct = () => {
  const navigate = useNavigate();
  const params = useParams();
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [shipping, setShipping] = useState(false);
  const [photo, setPhoto] = useState("");
  const [id, setId] = useState("");

  //get single product
  const getSingleProduct = async () => {
    try {
      const { data } = await axios.get(
        `/api/v1/product/get-product/${params.slug}`
      );
      setName(data.product.name);
      setId(data.product._id);
      setDescription(data.product.description);
      setPrice(data.product.price);
      // Bug fix: Removed duplicate setPrice call - Ong Chang Heng Bertrand A0253013X
      setQuantity(data.product.quantity);
      setShipping(Boolean(data.product.shipping));
      setCategory(data.product.category._id);
    } catch (error) {
      console.log(error);
      // Bug fix: Added toast error message - Ong Chang Heng Bertrand A0253013X
      toast.error("Failed to load product details");
    }
  };
  useEffect(() => {
    getSingleProduct();
    //eslint-disable-next-line
  }, []);
  //get all category
  const getAllCategory = async () => {
    try {
      const { data } = await axios.get("/api/v1/category/get-category");
      if (data?.success) {
        setCategories(data?.category);
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong in getting categories");
    }
  };

  useEffect(() => {
    getAllCategory();
  }, []);

  //create product function
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const productData = new FormData();
      productData.append("name", name);
      productData.append("description", description);
      productData.append("price", price);
      productData.append("quantity", quantity);
      photo && productData.append("photo", photo);
      productData.append("category", category);
      // Bug fix: Added 'shipping' to FormData to ensure it is included in the request - Ong Chang Heng Bertrand A0253013X
      productData.append("shipping", shipping ? "1" : "0");
      // Bug fix: Added 'await' to axios.put call - Ong Chang Heng Bertrand A0253013X
      const { data } = await axios.put(
        `/api/v1/product/update-product/${id}`,
        productData
      );
      // Bug fix: data?.success logic was inverted, changed to accurately reflect success and failure cases - Ong Chang Heng Bertrand A0253013X
      if (data?.success) {
        toast.success(data?.message || "Product Updated Successfully");
        navigate("/dashboard/admin/products");
      } else {
        toast.error(data?.message || "Failed to update product");
      }
    } catch (error) {
      console.log(error);
      // Bug fix: Added error message from backend in response - Ong Chang Heng Bertrand A0253013X
      toast.error(error?.response?.data?.error || "Something went wrong while updating product");
    }
  };

  //delete a product
  const handleDelete = async () => {
    try {
      // Bug fix: Changed from window.prompt to window.confirm - Ong Chang Heng Bertrand A0253013X
      let answer = window.confirm("Are you sure want to delete this product?");
      if (!answer) return;
      const { data } = await axios.delete(
        `/api/v1/product/delete-product/${id}`
      );
      toast.success("Product Deleted Successfully");
      navigate("/dashboard/admin/products");
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong while deleting product");
    }
  };
  return (
    <Layout title={"Dashboard - Create Product"}>
      <div className="container-fluid m-3 p-3">
        <div className="row">
          <div className="col-md-3">
            <AdminMenu />
          </div>
          <div className="col-md-9">
            <h1>Update Product</h1>
            <div className="m-1 w-75">
              {/* Added data-testid to relevant elements for testing - Ong Chang Heng Bertrand A0253013X */}
              <Select
                data-testid="category-select"
                bordered={false}
                placeholder="Select a category"
                size="large"
                showSearch
                className="form-select mb-3"
                onChange={(value) => {
                  setCategory(value);
                }}
                value={category}
              >
                {categories?.map((c) => (
                  <Option key={c._id} value={c._id}>
                    {c.name}
                  </Option>
                ))}
              </Select>
              <div className="mb-3">
                <label className="btn btn-outline-secondary col-md-12" data-testid="upload-photo-button">
                  {photo ? photo.name : "Upload Photo"}
                  <input
                    type="file"
                    name="photo"
                    accept="image/*"
                    onChange={(e) => setPhoto(e.target.files[0])}
                    hidden
                  />
                </label>
              </div>
              <div className="mb-3">
                {photo ? (
                  <div className="text-center">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt="product_photo"
                      height={"200px"}
                      className="img img-responsive"
                    />
                  </div>
                ) : (
                  <div className="text-center">
                    <img
                      src={`/api/v1/product/product-photo/${id}`}
                      alt="product_photo"
                      height={"200px"}
                      className="img img-responsive"
                    />
                  </div>
                )}
              </div>
              <div className="mb-3">
                <input
                  data-testid="name-input"
                  type="text"
                  value={name}
                  placeholder="Write a name"
                  className="form-control"
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <textarea
                  data-testid="description-input"
                  type="text"
                  value={description}
                  placeholder="Write a description"
                  className="form-control"
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <input
                  data-testid="price-input"
                  min="0"
                  type="number"
                  value={price}
                  placeholder="Write a price"
                  className="form-control"
                  onChange={(e) => {
                    // Bug fix: Added validation to prevent negative price values - Ong Chang Heng Bertrand A0253013X
                    const value = e.target.value;
                    if (value === "" || parseFloat(value) >= 0) {
                      setPrice(value);
                    }
                  }}
                />
              </div>
              <div className="mb-3">
                <input
                  data-testid="quantity-input"
                  type="number"
                  value={quantity}
                  placeholder="Write a quantity"
                  className="form-control"
                  onChange={(e) => {
                    // Bug fix: Added validation to prevent negative quantity values - Ong Chang Heng Bertrand A0253013X
                    const value = e.target.value;
                    if (value === "" || parseFloat(value) >= 0) {
                      setQuantity(value);
                    }
                  }}
                />
              </div>
              <div className="mb-3">
                <Select
                  data-testid="shipping-select"
                  bordered={false}
                  placeholder="Select shipping"
                  size="large"
                  showSearch
                  className="form-select mb-3"
                  onChange={(value) => {
                    // Bug fix: Handle shipping value check correctly after changing to boolean - Ong Chang Heng Bertrand A0253013X
                    setShipping(value === "1");
                  }}
                  value={shipping ? "1" : "0"}
                >
                  <Option value="0">No</Option>
                  <Option value="1">Yes</Option>
                </Select>
              </div>
              <div className="mb-3">
                <button className="btn btn-primary" data-testid="update-button" onClick={handleUpdate}>
                  UPDATE PRODUCT
                </button>
              </div>
              <div className="mb-3">
                <button className="btn btn-danger" data-testid="delete-button" onClick={handleDelete}>
                  DELETE PRODUCT
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UpdateProduct;