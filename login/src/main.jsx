import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import EditProfile from './app.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <EditProfile />
  </StrictMode>,
)
