import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Loader2, BookOpen, Library } from 'lucide-react'
import { acervoService } from '@/services'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { ChipLivro } from '@/components/shared/StatusChip'
import { toast } from 'sonner'
import type { Livro } from '@/types'
import type { CriarLivroDados } from '@/services/AcervoService'

const livroVazio: CriarLivroDados = { titulo: '', autor: '', tagRfid: '', localizacao: '', isbn: '' }

export function AdminAcervo() {
  const [livros, setLivros] = useState<Livro[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogAberto, setDialogAberto] = useState(false)
  const [editando, setEditando] = useState<Livro | null>(null)
  const [form, setForm] = useState<CriarLivroDados>(livroVazio)
  const [salvando, setSalvando] = useState(false)
  const [confirmarRemover, setConfirmarRemover] = useState<Livro | null>(null)

  async function carregar() {
    const lista = await acervoService.listarLivros()
    setLivros(lista)
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  function abrirCriar() {
    setEditando(null)
    setForm(livroVazio)
    setDialogAberto(true)
  }

  function abrirEditar(livro: Livro) {
    setEditando(livro)
    setForm({
      titulo: livro.titulo,
      autor: livro.autor,
      tagRfid: livro.tagRfid,
      localizacao: livro.localizacao,
      isbn: livro.isbn ?? '',
    })
    setDialogAberto(true)
  }

  async function salvar() {
    if (!form.titulo || !form.autor || !form.tagRfid || !form.localizacao) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }
    setSalvando(true)
    try {
      if (editando) {
        await acervoService.atualizarLivro(editando.id, form)
        toast.success('Livro atualizado!')
      } else {
        await acervoService.criarLivro(form)
        toast.success('Livro adicionado ao acervo!')
      }
      setDialogAberto(false)
      await carregar()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar livro')
    } finally {
      setSalvando(false)
    }
  }

  async function remover(livro: Livro) {
    try {
      await acervoService.removerLivro(livro.id)
      setConfirmarRemover(null)
      await carregar()
      toast.success(`"${livro.titulo}" removido do acervo`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover livro')
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-[#fef2f2] flex items-center justify-center">
            <Library className="w-5 h-5 text-[#9b1b22]" />
          </div>
          <div>
            <h1 className="headline-lg">Acervo</h1>
            <p className="body-sm text-[var(--muted-foreground)]">{livros.length} livro(s) cadastrado(s)</p>
          </div>
        </div>
        <Button onClick={abrirCriar} className="gap-2">
          <Plus className="w-4 h-4" />
          Adicionar livro
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#9b1b22]" />
        </div>
      ) : livros.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <BookOpen className="w-12 h-12 text-[var(--muted-foreground)]" />
          <p className="body-sm text-[var(--muted-foreground)]">Nenhum livro no acervo</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {livros.map((livro) => (
            <Card key={livro.id}>
              <CardContent className="py-4 px-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded bg-[#fef2f2] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BookOpen className="w-4 h-4 text-[#9b1b22]" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{livro.titulo}</p>
                      <p className="body-sm text-[var(--muted-foreground)]">{livro.autor}</p>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        <ChipLivro disponivel={livro.disponivel} />
                        <span className="label-md text-[var(--muted-foreground)] self-center">{livro.localizacao}</span>
                        <span className="label-md text-[var(--muted-foreground)] self-center">{livro.tagRfid}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => abrirEditar(livro)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setConfirmarRemover(livro)}
                      disabled={!livro.disponivel}
                      title={!livro.disponivel ? 'Livro emprestado — não pode remover' : 'Remover'}
                    >
                      <Trash2 className="w-4 h-4 text-[#9b1b22]" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog criar/editar */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar livro' : 'Adicionar livro'}</DialogTitle>
            <DialogDescription>
              {editando ? 'Altere os dados do livro' : 'Preencha os dados para cadastrar no acervo'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ex.: Algoritmos: Teoria e Prática"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="autor">Autor *</Label>
              <Input
                id="autor"
                value={form.autor}
                onChange={(e) => setForm({ ...form, autor: e.target.value })}
                placeholder="Ex.: Thomas H. Cormen"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rfid">Tag RFID *</Label>
              <Input
                id="rfid"
                value={form.tagRfid}
                onChange={(e) => setForm({ ...form, tagRfid: e.target.value })}
                placeholder="Ex.: RFID-006"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="local">Localização *</Label>
              <Input
                id="local"
                value={form.localizacao}
                onChange={(e) => setForm({ ...form, localizacao: e.target.value })}
                placeholder="Ex.: Estante A3"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="isbn">ISBN (opcional)</Label>
              <Input
                id="isbn"
                value={form.isbn}
                onChange={(e) => setForm({ ...form, isbn: e.target.value })}
                placeholder="Ex.: 978-85-352-3988-6"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAberto(false)}>Cancelar</Button>
            <Button onClick={salvar} disabled={salvando}>
              {salvando ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editando ? 'Salvar alterações' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog confirmar remoção */}
      <Dialog open={!!confirmarRemover} onOpenChange={() => setConfirmarRemover(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover livro</DialogTitle>
            <DialogDescription>
              Deseja remover <strong>"{confirmarRemover?.titulo}"</strong> do acervo? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmarRemover(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => confirmarRemover && remover(confirmarRemover)}>
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
