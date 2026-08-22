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

    return (
        <div>
            <table>
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Actions</th>
                    </tr>
                </thead>

                <tbody>
                    {categories.map((cat) => {
                        return (
                            <tr key={cat.id}>
                            <td>{cat.name}</td>
                            <td>edit, delete</td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}


export default CategoryTable