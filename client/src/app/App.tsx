import { useState } from 'react'
import reactLogo from '../assets/react.svg'
import viteLogo from '../assets/vite.svg'
import heroImg from '../assets/hero.png'
import './App.css'
import CategoryForm from '../features/categories/components/CategoryForm'
import CategoryTable from '../features/categories/components/CategoryTable'
function App() {
 

  return (
    <div  >
      <p className='text-white'>Hii</p>
      <CategoryForm/>
      <CategoryTable />
    </div>

  )
}

export default App
