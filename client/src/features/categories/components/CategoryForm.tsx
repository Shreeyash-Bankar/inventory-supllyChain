
import { useState } from "react";
import axios from "axios";


const CategoryForm = () => {

  const [category, setCategory] = useState("")
  const [loading , setLoading] = useState(false)
  console.log(category)

  const handleSubmit = async(e:React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if(!category.trim()){
        return
      }
    try{
    setLoading(true)
    const response = await axios.post(
      "http://localhost:5000/categories", 
      {
        name: category
      }
    )

    console.log("category created:", response.data)

    setCategory("")

    }catch(error){
      console.error("Error creating category :", error)
    }finally{
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4">
      
      {/* Card */}
      <div className="w-full max-w-md animate-[fadeIn_0.5s_ease-out] rounded-2xl border border-white/10 bg-white/10 p-1 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl">
        
        <div className="rounded-xl bg-slate-900/80 px-6 py-7">
          
          {/* Header */}
          <div className="mb-7">
            <p className="mb-1 text-3xl font-bold tracking-tight text-white">
              Create Category
            </p>

            <p className="text-sm text-slate-400">
              Add a new category to organize your content.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label
                htmlFor="category"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Category name
              </label>

              <input
              value={category}
                id="category"
                type="text"
                placeholder="e.g. Technology"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-3 text-white outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 font-medium text-slate-300 transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-700 hover:text-white active:translate-y-0"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 font-medium text-white shadow-lg shadow-indigo-600/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-indigo-500/40 active:translate-y-0"
              >
                Save Category
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CategoryForm;
