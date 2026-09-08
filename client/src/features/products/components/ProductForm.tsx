import axios from "axios";
import { useEffect, useState } from "react";

const ProductForm = () => {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState<number>();
  const [sku, setSku] = useState("");
  const [categories, setCategories] = useState();

  useEffect(() => {
    try {
      const fetchCategories = async () => {
        const response = await axios.get("http://localhost/categories");
        setCategories(response.data);
      };
    } catch (error) {
      console.error(error);
    }
  });

  return (
    <div>
      <div>
        <input type="text" onChange={(e) => setName(e.target.value)} />
      </div>
    </div>
  );
};

export default ProductForm;
