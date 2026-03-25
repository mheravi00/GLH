import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider }   from './context/AuthContext'
import { BasketProvider } from './context/BasketContext'
import { ToastProvider }  from './context/ToastContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <BasketProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </BasketProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
