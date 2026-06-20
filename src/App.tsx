import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { AppLayout } from './components/AppLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { MaisPage } from './pages/MaisPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { PacientesPage } from './pages/PacientesPage'
import { PacienteFormPage } from './pages/PacienteFormPage'
import { PacienteDetalhePage } from './pages/PacienteDetalhePage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Rotas internas exigem login. */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/agenda" replace />} />
              <Route
                path="/agenda"
                element={
                  <PlaceholderPage
                    titulo="Agenda"
                    descricao="Suas consultas do dia e da semana."
                  />
                }
              />
              <Route path="/pacientes" element={<PacientesPage />} />
              <Route path="/pacientes/novo" element={<PacienteFormPage />} />
              <Route path="/pacientes/:id" element={<PacienteDetalhePage />} />
              <Route path="/pacientes/:id/editar" element={<PacienteFormPage />} />
              <Route
                path="/atender"
                element={
                  <PlaceholderPage
                    titulo="Atender"
                    descricao="O atendimento de hoje, num toque."
                  />
                }
              />
              <Route
                path="/financeiro"
                element={
                  <PlaceholderPage
                    titulo="Financeiro"
                    descricao="Receitas, despesas e fluxo de caixa."
                  />
                }
              />
              <Route path="/mais" element={<MaisPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/agenda" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
