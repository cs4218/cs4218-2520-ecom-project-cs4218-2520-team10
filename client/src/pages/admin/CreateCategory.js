import React, { useEffect, useState } from "react";
import Layout from "./../../components/Layout";
import AdminMenu from "./../../components/AdminMenu";
import toast from "react-hot-toast";
import axios from "axios";
import CategoryForm from "../../components/Form/CategoryForm";
import { Modal } from "antd";

const CreateCategory = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState(null);
  const [updatedName, setUpdatedName] = useState("");
  // handle Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Fix: Add validation for empty name - Shaun Lee Xuan Wei A0252626E
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      const { data } = await axios.post("/api/v1/category/create-category", {
        name,
      });
      if (data?.success) {
        toast.success(`${name} is created`);
        getAllCategory();
      } else {
        toast.error(data?.message || "Something went wrong in creating category"); // Fix: guard against data being undefined or null - Shaun Lee Xuan Wei A0252626E
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong in input form"); // Minor fix: typo - Shaun Lee Xuan Wei A0252626E
    }
  };

  // get all cat
  const getAllCategory = async () => {
    try {
      const { data } = await axios.get("/api/v1/category/get-category");
      if (data?.success) { // Fix: guard against data being undefined or null - Shaun Lee Xuan Wei A0252626E
        setCategories(data.category);
      } else {
        toast.error("Something went wrong in getting category");
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong in getting category"); // Minor fix: typo - Shaun Lee Xuan Wei A0252626E
    }
  };

  useEffect(() => {
    getAllCategory();
  }, []);

  // update category
  const handleUpdate = async (e) => {
    e.preventDefault();
    // Fix: Add validation for empty name - Shaun Lee Xuan Wei A0252626E
    if (!updatedName.trim()) {
      toast.error("Name is required");
      return;
    }
    // Fix: Add validation for duplicate name - Shaun Lee Xuan Wei A0252626E
    if (categories?.map(c => c.name).includes(updatedName)) {
      toast.error(`${updatedName} already exists`);
      return;
    }
    try {
      const { data } = await axios.put(
        `/api/v1/category/update-category/${selected._id}`,
        { name: updatedName }
      );
      if (data?.success) { // Fix: guard against data being undefined or null  - Shaun Lee Xuan Wei A0252626E
        toast.success(`${updatedName} is updated`);
        setSelected(null);
        setUpdatedName("");
        setVisible(false);
        getAllCategory();
      } else {
        toast.error(data?.message || "Error updating name"); // Fix: guard against data being undefined or null  - Shaun Lee Xuan Wei A0252626E
      }
    } catch (error) {
      toast.error("Something went wrong"); // Minor fix: typo - Shaun Lee Xuan Wei A0252626E
    }
  };

  // delete category
  const handleDelete = async (pId, name) => {
    try {
      const { data } = await axios.delete(
        `/api/v1/category/delete-category/${pId}`
      );
      if (data?.success) { // Fix: guard against data being undefined or null
        toast.success(`${name} is deleted`); // Fix: output deleted name - Shaun Lee Xuan Wei A0252626E
        getAllCategory();
      } else {
        toast.error(data?.message || "Something went wrong"); // Fix: guard against data being undefined or null
      }
    } catch (error) {
      toast.error("Something went wrong"); // Minor fix: typo - Shaun Lee Xuan Wei A0252626E
    }
  };

  return (
    <Layout title={"Dashboard - Create Category"}>
      <div className="container-fluid m-3 p-3">
        <div className="row">
          <div className="col-md-3">
            <AdminMenu />
          </div>
          <div className="col-md-9">
            <h1>Manage Category</h1>
            <div className="p-3 w-50">
              <CategoryForm
                handleSubmit={handleSubmit}
                value={name}
                setValue={setName}
              />
            </div>
            <div className="w-75">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories?.map((c) => (
                    // Fix: Add key to top level element of map - Shaun Lee Xuan Wei A0252626E
                    <tr key={c._id}>
                      <td>{c.name}</td>
                      <td>
                        <button
                          className="btn btn-primary ms-2"
                          onClick={() => {
                            setVisible(true);
                            setUpdatedName(c.name);
                            setSelected(c);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger ms-2"
                          onClick={() => {
                            handleDelete(c._id, c.name);
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Modal
              onCancel={() => setVisible(false)}
              footer={null}
              open={visible} // Fix: change deprecated visible field to open - Shaun Lee Xuan Wei A0252626E
            >
              <CategoryForm
                value={updatedName}
                setValue={setUpdatedName}
                handleSubmit={handleUpdate}
              />
            </Modal>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreateCategory;
