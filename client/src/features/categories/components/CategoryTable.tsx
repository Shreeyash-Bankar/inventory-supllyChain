import axios from "axios";
import { useState, useEffect } from "react";

interface Category {
  id: number;
  name: string;
}

type sortOrder = "asc" | "dsc" | "none";

const CategoryTable = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [openEditModel, setOpenEditModel] = useState(false);
  const [updatedCategoryName, setUpdatedCategoryName] = useState("");
  const [categoryToUpdate, setCategoryToUpdate] = useState(Number);
  const [currentPageCount, setCurrentPageCount] = useState(1);
  const [sorting, setSorting] = useState<sortOrder>("none");

  const rowsToShow = 8;

  const totalPages = Math.ceil(categories.length / rowsToShow);
  console.log(totalPages);
  const indexOfLastRow = currentPageCount * rowsToShow;
  const indexOfFirstRow = indexOfLastRow - rowsToShow;
  const sortedCategories = [...categories].sort((a, b) => {
    if (sorting === "asc") {
      return a.name.localeCompare(b.name); // A to Z
    }
    if (sorting === "dsc") {
      return b.name.localeCompare(a.name); // Z to A
    }
    return 0; // "none" - keep server order
  });

  const currentCategories = sortedCategories.slice(
    indexOfFirstRow,
    indexOfLastRow,
  );
  console.log(currentCategories);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (openEditModel) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
  }, [openEditModel]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get("http://localhost:5000/categories");
      console.log(response.data);
      setCategories(response.data);
    } catch (error) {
      console.error("Error in Fetching Categories", error);
    }
  };

  const handleSave = async () => {
    try {
      const id = categoryToUpdate;
      const response = await axios.put(
        `http://localhost:5000/categories/${id}`,
        { name: updatedCategoryName },
      );
      await fetchCategories();
      console.log(response.data);
      setUpdatedCategoryName("");
      setOpenEditModel(false);
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

      await fetchCategories();
      console.log("into handleDelete");
      console.log(response.data);
    } catch (error) {
      console.warn("Problem deleting category", error);
    }
  };

  const handleSortToggle = () => {
    setSorting((prev) => {
      if (prev === "none") return "asc";
      if (prev === "asc") return "dsc";
      else return "none";
    });

    setCurrentPageCount(1);
  };

  const renderEditModel = () => {
    return (
      <div
        className="bg-black/40  backdrop-blur-sm fixed inset-0 z-50 flex justify-center items-center"
        onClick={() => setOpenEditModel(false)}
      >
        <div
          className="max-w-150 min-w-80  min-h-50 px-5 py-4 rouded border-4 border-emerald-800 bg-emerald-600 hover:bg-emerald-500 transition-colors duration-100 ease-in flex flex-col gap-3 rounded-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div>
            <h2 className="text-center  text-2xl mb-2 font-semibold">
              Edit Category
            </h2>
          </div>
          <input
            type="text"
            value={updatedCategoryName}
            onChange={(e) => setUpdatedCategoryName(e.target.value)}
            className="bg-white w-full px-2 py-2 border-gray-400 rounded mb-4"
          />
          <div className="flex justify-end px-3 gap-3">
            <button
              onClick={() => {
                setOpenEditModel(false);
                setUpdatedCategoryName("");
              }}
              className="px-5 py-3 bg-red-500 rounded"
            >
              Cancel
            </button>
            <button
              className="px-5 py-3 bg-green-500 rounded"
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-w-80 max-w-100 min-h-[90vh] max-h-[80vh]  bg-emerald-700 overflow-auto  ">
      <table className="pl-3 ml-3">
        <thead>
          <tr>
            <th className="border" onClick={handleSortToggle}>
              Category{" "}
              {sorting === "asc" ? "🔼" : sorting === "dsc" ? "🔽" : "↕️"}
            </th>
            <th className="border w-full">Actions</th>
          </tr>
        </thead>

        <tbody className="pl-3">
          {currentCategories.map((cat) => {
            return (
              <tr key={cat.id} className="px-2">
                <td className="border">{cat.name}</td>
                <td className="flex border min-w-full gap-7 justify-evenly  ">
                  <p
                    onClick={() => {
                      setUpdatedCategoryName(cat.name);
                      setCategoryToUpdate(cat.id);
                      setOpenEditModel(true);
                    }}
                    className="px-2 py-1"
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
      <div>
        <button
          onClick={() => setCurrentPageCount(currentPageCount - 1)}
          disabled={currentPageCount === 1}
        >
          Previous
        </button>
        <p>{currentPageCount}</p>

        <button
          onClick={() => setCurrentPageCount(currentPageCount + 1)}
          disabled={currentPageCount === totalPages}
        >
          Next
        </button>
      </div>
      {openEditModel && renderEditModel()}
    </div>
  );
};

export default CategoryTable;
