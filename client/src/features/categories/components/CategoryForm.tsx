import React from "react";

const CategoryForm = () => {
  return (
    <div className="bg-amber-200 max-w-100 ">
      <div>
        <div>
          <p>Create New Category</p>
        </div>
        <div className=" w-full mb-4">
          <div>
            <input type="text" className="bg-white rounded-md mb-4 w-full px-6 py-1" />
          </div>
          <div className="flex gap-3 mb-4">
            <div>
              <button className="bg-green-500 px-8 py-2 rounded-md mb-4">
                Save
              </button>
            </div>
            <div>
              <button className="bg-red-500 px-8 py-2 rounded-md">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryForm;
