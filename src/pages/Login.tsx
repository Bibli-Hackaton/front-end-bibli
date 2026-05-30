import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, GraduationCap, Users, ShieldCheck } from 'lucide-react'
import { authService } from '@/services'
import { useBibliotecaStore } from '@/store/bibliotecaStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ResetButton } from '@/components/shared/ResetButton'
import { toast } from 'sonner'
import type { Papel, Usuario } from '@/types'

interface OpcaoLogin {
  papel: Papel
  label: string
  descricao: string
  icone: React.ReactNode
  cor: string
}

const opcoes: OpcaoLogin[] = [
  {
    papel: 'aluno',
    label: 'Aluno',
    descricao: 'Solicitar acesso, pegar e devolver livros',
    icone: <GraduationCap className="w-8 h-8" />,
    cor: '#9b1b22',
  },
  {
    papel: 'colaborador',
    label: 'Colaborador',
    descricao: 'Confirmar entrada e saída presencialmente',
    icone: <Users className="w-8 h-8" />,
    cor: '#1e40af',
  },
  {
    papel: 'admin',
    label: 'Administrador',
    descricao: 'Gerenciar acervo, regras e relatórios',
    icone: <ShieldCheck className="w-8 h-8" />,
    cor: '#166534',
  },
]

export function Login() {
  const navigate = useNavigate()
  const store = useBibliotecaStore()
  const [papelSelecionado, setPapelSelecionado] = useState<Papel | null>(null)
  const [loading, setLoading] = useState(false)

  const usuariosDoPapel = (papel: Papel): Usuario[] =>
    store.usuarios.filter((u) => u.papel === papel)

  async function handleLogin(usuarioId: string) {
    setLoading(true)
    try {
      const usuario = await authService.login(usuarioId)
      const destino =
        usuario.papel === 'aluno' ? '/aluno' :
        usuario.papel === 'colaborador' ? '/colaborador' :
        '/admin/config'
      navigate(destino)
      toast.success(`Bem-vindo(a), ${usuario.nome}!`)
    } catch (e) {
      toast.error('Erro ao entrar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center px-5">
      {/* Logo */}
      <div className="flex flex-col items-center gap-4 mb-10">
        <div className="w-16 h-16 bg-[#9b1b22] rounded-lg flex items-center justify-center shadow-md">
          <BookOpen className="w-9 h-9 text-white" />
        </div>
        <div className="text-center">
          <h1 className="headline-lg text-[var(--foreground)]">Biblioteca Universitária</h1>
          <p className="body-sm text-[var(--muted-foreground)] mt-1">Sistema de gestão autônoma</p>
        </div>
      </div>

      {!papelSelecionado ? (
        /* Seleção de papel */
        <div className="w-full max-w-2xl">
          <p className="text-center body-sm text-[var(--muted-foreground)] mb-6">
            Selecione seu perfil de acesso para continuar
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {opcoes.map((opcao) => (
              <button
                key={opcao.papel}
                onClick={() => setPapelSelecionado(opcao.papel)}
                className="group flex flex-col items-center gap-4 p-6 rounded-lg border-2 border-[var(--border)] bg-[var(--card)] hover:border-[#9b1b22] hover:shadow-md transition-all duration-150 cursor-pointer text-left"
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white transition-transform group-hover:scale-110"
                  style={{ backgroundColor: opcao.cor }}
                >
                  {opcao.icone}
                </div>
                <div className="text-center">
                  <p className="font-semibold text-[var(--foreground)]">{opcao.label}</p>
                  <p className="body-sm text-[var(--muted-foreground)] mt-1">{opcao.descricao}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Seleção de usuário */
        <div className="w-full max-w-sm">
          <button
            onClick={() => setPapelSelecionado(null)}
            className="mb-6 flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            ← Voltar
          </button>
          <h2 className="headline-md mb-2">
            Entrar como {opcoes.find((o) => o.papel === papelSelecionado)?.label}
          </h2>
          <p className="body-sm text-[var(--muted-foreground)] mb-6">Escolha o usuário para a demo</p>

          <div className="flex flex-col gap-3">
            {usuariosDoPapel(papelSelecionado).map((u) => (
              <Card key={u.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <button
                    onClick={() => handleLogin(u.id)}
                    disabled={loading}
                    className="w-full flex items-center gap-4 p-4 hover:bg-[var(--secondary)] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{
                        backgroundColor: opcoes.find((o) => o.papel === papelSelecionado)?.cor,
                      }}
                    >
                      {u.avatarInicial}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-[var(--foreground)]">{u.nome}</p>
                      <p className="label-md text-[var(--muted-foreground)]">{u.id}</p>
                    </div>
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Reset discreto */}
      <div className="mt-10 flex items-center gap-3">
        <ResetButton />
        <span className="text-xs text-[var(--muted-foreground)]">Demo MVP — estado em memória</span>
      </div>
    </div>
  )
}
