import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { AuthProvider }   from './context/AuthContext'
import { BasketProvider } from './context/BasketContext'
import { ToastProvider }  from './context/ToastContext'
import { ThemeProvider }  from './context/ThemeContext'
import './index.css'
import App from './App.jsx'

const stripePromise = loadStripe('pk_test_51TM4CoRo0TG0ZJmSmOp2iYM19FImzOUJg9KpJTtxW9OodfLbq8qa2XOsg03qngDn4hbnJDuWdMd53gXjBYVuYYdc00uM0XNgnV')

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
