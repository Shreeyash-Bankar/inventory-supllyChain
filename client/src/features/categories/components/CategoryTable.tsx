import axios from "axios";
import { useState, useEffect } from "react";

interface Category {
  id: number;
  name: string;
}

const CategoryTable = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [openEditModel, setOpenEditModel] = useState(false);
  const [updatedCategoryName, setUpdatedCategoryName] = useState("");
  const [categoryToUpdate, setCategoryToUpdate] = useState(Number);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get("http://localhost:5000/categories");
      console.log(response.data);
      setCategories(response.data);
    } catch (error) {
      console.error("Error in Fetching Categories", error);
    }
  };

  const handleEdit = async (id: number) => {
    try {
      setOpenEditModel(true);
      const response = await axios.put(
        `http://localhost:5000/categories/${id}`,
      );
      console.log(response.data);
      console.log("into handleEdit");
    } catch (error) {
      console.warn("Problem Editing category", error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await axios.delete(
        `http://localhost:5000/categories/${id}`,
      );
      console.log("into handleDelete");
      console.log(response.data);
    } catch (error) {
      console.warn("Problem deleting category", error);
    }
  };

  const renderEditModel = () => {
    openEditModel;
    return (
      <div className="max-w-100 bg-cyan-500 max-h-96">
        <div>
          <h3>Edit Category</h3>
        </div>
        <input
          type="text"
          value={updatedCategoryName}
          onChange={(e) => setUpdatedCategoryName(e.target.value)}
        />
        <div>
          <button
            onClick={() => {
              setOpenEditModel(false);
              setUpdatedCategoryName("");
            }}
          >
            Cancel
          </button>
          <button>Save</button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <table className="pl-3 ml-3">
        <thead>
          <tr>
            <th>Category</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody className="pl-3">
          {categories.map((cat) => {
            return (
              <tr key={cat.id} className="px-2">
                <td className="border">{cat.name}</td>
                <td>
                  <p
                    onClick={() => {
                      setCategoryToUpdate(cat.id);
                      setOpenEditModel(true);
                    }}
                  >
                    Edit
                  </p>
                  <p onClick={() => handleDelete(cat.id)}>Delete</p>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {openEditModel && renderEditModel()}
    </div>
  );
};

export default CategoryTable;
