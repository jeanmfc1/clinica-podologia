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
import { ProcedimentosPage } from './pages/ProcedimentosPage'
import { ProcedimentoFormPage } from './pages/ProcedimentoFormPage'
import { AgendaPage } from './pages/AgendaPage'
import { AgendamentoFormPage } from './pages/AgendamentoFormPage'

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
              <Route path="/agenda" element={<AgendaPage />} />
              <Route path="/agenda/novo" element={<AgendamentoFormPage />} />
              <Route path="/agenda/:id" element={<AgendamentoFormPage />} />
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
              <Route path="/procedimentos" element={<ProcedimentosPage />} />
              <Route path="/procedimentos/novo" element={<ProcedimentoFormPage />} />
              <Route path="/procedimentos/:id" element={<ProcedimentoFormPage />} />
              <Route path="/mais" element={<MaisPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/agenda" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
