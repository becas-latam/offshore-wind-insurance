import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { SignupPage } from '@/pages/SignupPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { QAPage } from '@/pages/QAPage'
import { ContractsPage } from '@/pages/ContractsPage'
import { ClausesPage } from '@/pages/ClausesPage'
import { BookPage } from '@/pages/BookPage'
import { CorpusPage } from '@/pages/CorpusPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { RiskAnalyzerPage } from '@/pages/RiskAnalyzerPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<AppLayout />}>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Protected */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/qa" element={<ProtectedRoute><QAPage /></ProtectedRoute>} />
            <Route path="/contracts" element={<ProtectedRoute><ContractsPage /></ProtectedRoute>} />
            <Route path="/clauses" element={<ProtectedRoute><ClausesPage /></ProtectedRoute>} />
            <Route path="/book" element={<ProtectedRoute><BookPage /></ProtectedRoute>} />
            <Route path="/risk-analyzer" element={<ProtectedRoute><RiskAnalyzerPage /></ProtectedRoute>} />
            <Route path="/corpus" element={<ProtectedRoute><CorpusPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
