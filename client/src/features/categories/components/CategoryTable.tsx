import axios from "axios"
import { useState, useEffect } from "react"

interface Category {
    id:number
    name: string
}

const CategoryTable = () => {
    const [categories, setCategories] = useState<Category[]>([])

    useEffect(() => {
        fetchCategories();
    }, [])

    const fetchCategories = async () => {
        try {
            const response = await axios.get("http://localhost:5000/categories")
            console.log(response.data)
            setCategories(response.data)

        } catch (error) {
            console.error("Error in Fetching Categories", error)
        }
        
    }
    
    const handleEdit = async () => {
        try{
            const response = await axios.put("http://localhost:5000/categories")
            console.log(response.data)
            console.log("into handleEdit")
        }catch(error){
            console.warn("Problem Editing category", error)
        }
    }

    const handleDelete = async() => {
        try {
            const response = await axios.delete("http://localhost:5000/categories")
            console.log("into handleDelete")
            console.log(response.data)
        } catch (error) {
            console.warn("Problem deleting category", error)
        }
    }

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
                            <td><a href="" onClick={handleEdit}>Edit</a><a href="" onClick={handleDelete}>Delete</a></td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}


export default CategoryTable