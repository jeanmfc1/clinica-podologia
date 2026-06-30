import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { AppLayout } from './components/AppLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { MaisPage } from './pages/MaisPage'
import { PacientesPage } from './pages/PacientesPage'
import { PacienteFormPage } from './pages/PacienteFormPage'
import { PacienteDetalhePage } from './pages/PacienteDetalhePage'
import { ProcedimentosPage } from './pages/ProcedimentosPage'
import { ProcedimentoFormPage } from './pages/ProcedimentoFormPage'
import { AgendaPage } from './pages/AgendaPage'
import { AgendamentoFormPage } from './pages/AgendamentoFormPage'
import { GoogleAgendaPage } from './pages/GoogleAgendaPage'
import { AtenderPage } from './pages/AtenderPage'
import { AtendimentoFormPage } from './pages/AtendimentoFormPage'
import { AnamneseFormPage } from './pages/AnamneseFormPage'
import { AgendarPublicoPage } from './pages/AgendarPublicoPage'
import { FinanceiroPage } from './pages/FinanceiroPage'
import { PagamentoFormPage } from './pages/PagamentoFormPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          {/* Agendamento online — página pública, sem login. */}
          <Route path="/agendar" element={<AgendarPublicoPage />} />

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
              <Route path="/pacientes/:id/anamnese" element={<AnamneseFormPage />} />
              <Route
                path="/pacientes/:id/atendimentos/novo"
                element={<AtendimentoFormPage />}
              />
              <Route
                path="/pacientes/:id/atendimentos/:atId"
                element={<AtendimentoFormPage />}
              />
              <Route path="/atender" element={<AtenderPage />} />
              <Route path="/financeiro" element={<FinanceiroPage />} />
              <Route path="/financeiro/novo" element={<PagamentoFormPage />} />
              <Route path="/financeiro/:id" element={<PagamentoFormPage />} />
              <Route path="/procedimentos" element={<ProcedimentosPage />} />
              <Route path="/procedimentos/novo" element={<ProcedimentoFormPage />} />
              <Route path="/procedimentos/:id" element={<ProcedimentoFormPage />} />
              <Route path="/google" element={<GoogleAgendaPage />} />
              <Route path="/mais" element={<MaisPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/agenda" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
