// App.jsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import AddPlan from './pages/AddPlan'
import EditPlan from './pages/EditPlan'
import PlanDetail from './pages/PlanDetail'
import Performance from './pages/Performance'
import MostTraded from './pages/MostTraded'
import Layout from './components/Layout'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen">Loading...</div>
  return user ? children : <Navigate to="/login" />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen">Loading...</div>
  return !user ? children : <Navigate to="/" />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="add" element={<AddPlan />} />
            <Route path="edit/:id" element={<EditPlan />} />
            <Route path="plan/:id" element={<PlanDetail />} />
            <Route path="performance" element={<Performance />} />
            <Route path="most-traded" element={<MostTraded />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
