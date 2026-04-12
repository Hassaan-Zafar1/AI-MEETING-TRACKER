import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

// Placeholder pages — replace with real components as you build them
const Dashboard = () => <div style={{ padding: 32, fontFamily: 'Inter, sans-serif' }}>📊 Dashboard — coming soon</div>
const Meetings = () => <div style={{ padding: 32, fontFamily: 'Inter, sans-serif' }}>📅 Meetings — coming soon</div>
const Kanban = () => <div style={{ padding: 32, fontFamily: 'Inter, sans-serif' }}>📋 Kanban Board — coming soon</div>

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/meetings" element={<Meetings />} />
        <Route path="/kanban" element={<Kanban />} />
        {/* Redirect root to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
