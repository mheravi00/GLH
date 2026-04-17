import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Elements } from '@stripe/react-stripe-js'
import { stripePromise } from './utils/stripe'
import { AuthProvider }   from './context/AuthContext'
import { BasketProvider } from './context/BasketContext'
import { ToastProvider }  from './context/ToastContext'
import { ThemeProvider }  from './context/ThemeContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <BasketProvider>
            <ToastProvider>
              <Elements stripe={stripePromise}>
                <App />
              </Elements>
            </ToastProvider>
          </BasketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
)
