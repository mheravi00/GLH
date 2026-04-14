import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar        from './components/Navbar'
import BasketDrawer  from './components/BasketDrawer'
import { useAuth }   from './context/useAuth'

import Home          from './pages/public/Home'
import Catalogue     from './pages/public/Catalogue'
import ProductDetail from './pages/public/ProductDetail'
import AuthGateway   from './pages/public/AuthGateway'
import Login         from './pages/public/Login'
import Register      from './pages/public/Register'
import RegisterProducer from './pages/public/RegisterProducer'
import Producers     from './pages/public/Producers'
import LocallyGrown  from './pages/public/LocallyGrown'
import FullyTraceable from './pages/public/FullyTraceable'
import About         from './pages/public/About'

import MyOrders      from './pages/customer/MyOrders'
import Checkout      from './pages/customer/Checkout'
import OrderConfirmation from './pages/customer/OrderConfirmation'
import AccountSettings from './pages/account/AccountSettings'

import ProducerDashboard from './pages/producer/ProducerDashboard'
import AdminPanel    from './pages/admin/AdminPanel'

function RequireAuth({ children, role }) {
  const { user, isAuth } = useAuth()
  if (!isAuth) return <Navigate to="/auth" replace />
  if (role && user?.role !== role) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <>
      <Navbar />
      <BasketDrawer />
      <Routes>
        <Route path="/"            element={<Home />} />
        <Route path="/catalogue"   element={<Catalogue />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/auth"               element={<AuthGateway />} />
        <Route path="/login"              element={<Login />} />
        <Route path="/register"           element={<Register />} />
        <Route path="/register/producer"  element={<RegisterProducer />} />
        <Route path="/producers"          element={<Producers />} />
        <Route path="/feature/locally-grown" element={<LocallyGrown />} />
        <Route path="/feature/fully-traceable" element={<FullyTraceable />} />
        <Route path="/checkout"    element={<Checkout />} />
        <Route path="/order-confirmation/:ref" element={<OrderConfirmation />} />
        <Route path="/account"     element={<RequireAuth><AccountSettings /></RequireAuth>} />
        <Route path="/orders"      element={<RequireAuth><MyOrders /></RequireAuth>} />
        <Route path="/producer"    element={<RequireAuth role="producer"><ProducerDashboard /></RequireAuth>} />
        <Route path="/admin"       element={<RequireAuth><AdminPanel /></RequireAuth>} />
        <Route path="/about"       element={<About />} />
        <Route path="*"            element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
