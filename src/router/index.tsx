import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useBibliotecaStore } from '@/store/bibliotecaStore'
import { AppShell } from '@/components/layout/AppShell'
import { Login } from '@/pages/Login'
import { AlunoHome } from '@/pages/aluno/AlunoHome'
import { TotemSessao } from '@/pages/aluno/TotemSessao'
import { ColaboradorDashboard } from '@/pages/colaborador/ColaboradorDashboard'
import { AdminConfig } from '@/pages/admin/AdminConfig'
import { AdminAcervo } from '@/pages/admin/AdminAcervo'
import { AdminInventario } from '@/pages/admin/AdminInventario'

function AuthGuard({ papelRequerido, children }: { papelRequerido?: string; children: React.ReactNode }) {
  const store = useBibliotecaStore()
  const location = useLocation()
  const usuario = store.usuarios.find((u) => u.id === store.ui.usuarioLogadoId)

  if (!usuario) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (papelRequerido && usuario.papel !== papelRequerido) {
    const destino =
      usuario.papel === 'aluno' ? '/aluno' :
      usuario.papel === 'colaborador' ? '/colaborador' :
      '/admin/config'
    return <Navigate to={destino} replace />
  }

  return <>{children}</>
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Aluno */}
      <Route element={<AuthGuard papelRequerido="aluno"><AppShell /></AuthGuard>}>
        <Route path="/aluno" element={<AlunoHome />} />
        <Route path="/aluno/sessao" element={<TotemSessao />} />
      </Route>

      {/* Colaborador */}
      <Route element={<AuthGuard papelRequerido="colaborador"><AppShell /></AuthGuard>}>
        <Route path="/colaborador" element={<ColaboradorDashboard />} />
      </Route>

      {/* Admin */}
      <Route element={<AuthGuard papelRequerido="admin"><AppShell /></AuthGuard>}>
        <Route path="/admin/config" element={<AdminConfig />} />
        <Route path="/admin/acervo" element={<AdminAcervo />} />
        <Route path="/admin/inventario" element={<AdminInventario />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
