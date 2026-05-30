import { Link, Outlet, useNavigate } from 'react-router-dom'
import { BookOpen, LogOut, LayoutDashboard, Settings, Library } from 'lucide-react'
import { useBibliotecaStore } from '@/store/bibliotecaStore'
import { authService } from '@/services'
import { DigitalIdCard } from '@/components/shared/DigitalIdCard'
import { ResetButton } from '@/components/shared/ResetButton'
import { HardwareStatusBar } from '@/components/shared/HardwareStatus'
import { cn } from '@/lib/utils'
import type { Usuario } from '@/types'

interface NavItem {
  label: string
  to: string
  icon: React.ReactNode
}

function navItems(papel: Usuario['papel']): NavItem[] {
  if (papel === 'aluno') {
    return [
      { label: 'Início', to: '/aluno', icon: <BookOpen className="w-4 h-4" /> },
    ]
  }
  if (papel === 'colaborador') {
    return [
      { label: 'Painel', to: '/colaborador', icon: <LayoutDashboard className="w-4 h-4" /> },
    ]
  }
  return [
    { label: 'Configurações', to: '/admin/config', icon: <Settings className="w-4 h-4" /> },
    { label: 'Acervo', to: '/admin/acervo', icon: <Library className="w-4 h-4" /> },
    { label: 'Inventário', to: '/admin/inventario', icon: <LayoutDashboard className="w-4 h-4" /> },
  ]
}

export function AppShell() {
  const store = useBibliotecaStore()
  const navigate = useNavigate()
  const usuario = store.usuarios.find((u) => u.id === store.ui.usuarioLogadoId)

  async function handleLogout() {
    await authService.logout()
    navigate('/login')
  }

  if (!usuario) return null

  const items = navItems(usuario.papel)

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--card)] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between gap-4">
          {/* Marca */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 bg-[#9b1b22] rounded flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-[var(--foreground)] text-sm hidden sm:block">
              Bibli
            </span>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors',
                  'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]'
                )}
              >
                {item.icon}
                <span className="hidden sm:block">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Direita: usuário + reset + logout */}
          <div className="flex items-center gap-2">
            <DigitalIdCard usuario={usuario} compact />
            <ResetButton />
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Status hardware (apenas em dev/demo) */}
      <div className="max-w-6xl mx-auto px-5 py-2 w-full">
        <HardwareStatusBar />
      </div>

      {/* Conteúdo */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-5 py-6">
        <Outlet />
      </main>
    </div>
  )
}
