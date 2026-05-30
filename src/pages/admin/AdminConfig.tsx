import { useState, useEffect } from 'react'
import { Settings, Save, Loader2 } from 'lucide-react'
import { adminService } from '@/services'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { Config } from '@/types'

export function AdminConfig() {
  const [config, setConfig] = useState<Config | null>(null)
  const [loading, setLoading] = useState(false)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    setLoading(true)
    adminService.getConfig().then((c) => {
      setConfig(c)
      setLoading(false)
    })
  }, [])

  async function salvar() {
    if (!config) return
    setSalvando(true)
    try {
      const atualizado = await adminService.salvarConfig(config)
      setConfig(atualizado)
      toast.success('Configurações salvas!')
    } catch {
      toast.error('Erro ao salvar configurações')
    } finally {
      setSalvando(false)
    }
  }

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#9b1b22]" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded bg-[#fef2f2] flex items-center justify-center">
          <Settings className="w-5 h-5 text-[#9b1b22]" />
        </div>
        <div>
          <h1 className="headline-lg">Configurações</h1>
          <p className="body-sm text-[var(--muted-foreground)]">Regras de operação da biblioteca</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Regras de negócio</CardTitle>
          <CardDescription>Altere os parâmetros de operação do sistema</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="tempoMax">Tempo máximo de sessão (minutos)</Label>
            <Input
              id="tempoMax"
              type="number"
              min={10}
              max={480}
              value={config.tempoMaxSessaoMin}
              onChange={(e) => setConfig({ ...config, tempoMaxSessaoMin: Number(e.target.value) })}
            />
            <p className="body-sm text-[var(--muted-foreground)]">
              Teto de tempo que um aluno pode estimar ao solicitar acesso (RN3)
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="cooldown">Cooldown após saída (minutos)</Label>
            <Input
              id="cooldown"
              type="number"
              min={0}
              max={240}
              value={config.cooldownMin}
              onChange={(e) => setConfig({ ...config, cooldownMin: Number(e.target.value) })}
            />
            <p className="body-sm text-[var(--muted-foreground)]">
              Tempo que o aluno deve aguardar antes de solicitar novo acesso após sair (RN4)
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="diasEmprestimo">Dias padrão de empréstimo</Label>
            <Input
              id="diasEmprestimo"
              type="number"
              min={1}
              max={60}
              value={config.diasPadraoEmprestimo}
              onChange={(e) => setConfig({ ...config, diasPadraoEmprestimo: Number(e.target.value) })}
            />
            <p className="body-sm text-[var(--muted-foreground)]">
              Valor pré-preenchido ao registrar empréstimo de livro
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="capacidade">Capacidade da sala (pessoas)</Label>
            <Input
              id="capacidade"
              type="number"
              min={1}
              max={10}
              value={config.capacidadeSala}
              onChange={(e) => setConfig({ ...config, capacidadeSala: Number(e.target.value) })}
            />
            <p className="body-sm text-[var(--muted-foreground)]">
              Máximo de alunos simultâneos na biblioteca (RN2) — padrão: 1
            </p>
          </div>

          <Button onClick={salvar} disabled={salvando} className="mt-2">
            {salvando ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar configurações
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
