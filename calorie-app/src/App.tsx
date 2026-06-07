import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import LoginPage from './components/auth/LoginPage'
import AppLayout from './components/layout/AppLayout'
import DayView from './components/meals/DayView'
import FoodCatalog from './components/food/FoodCatalog'
import WeeklyChart from './components/reports/WeeklyChart'
import MonthlyChart from './components/reports/MonthlyChart'
import ReportsPage from './components/reports/ReportsPage'
import UserManagement from './components/admin/UserManagement'
import MealConfig from './components/admin/MealConfig'
import SharedDayView from './components/sharing/SharedDayView'
import LinkedMembersPanel from './components/members/LinkedMembersPanel'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const currentUser = useAuthStore((s) => s.currentUser)
  if (!currentUser) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const currentUser = useAuthStore((s) => s.currentUser)
  if (!currentUser) return <Navigate to="/login" replace />
  if (currentUser.role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/shared/:token" element={<RequireAuth><SharedDayView /></RequireAuth>} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<DayView />} />
          <Route path="food" element={<RequireAdmin><FoodCatalog /></RequireAdmin>} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="reports/weekly" element={<WeeklyChart />} />
          <Route path="reports/monthly" element={<MonthlyChart />} />
          <Route path="members" element={<LinkedMembersPanel />} />
          <Route path="admin/users" element={<RequireAdmin><UserManagement /></RequireAdmin>} />
          <Route path="admin/meal-config" element={<RequireAdmin><MealConfig /></RequireAdmin>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
