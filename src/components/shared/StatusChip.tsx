import { cn } from '@/lib/utils'
import type { StatusSolicitacao } from '@/types'

const configStatus: Record<StatusSolicitacao, { label: string; classes: string }> = {
  pendente: {
    label: 'PENDENTE',
    classes: 'bg-amber-50 text-amber-700 border-amber-300',
  },
  reservado: {
    label: 'RESERVADO',
    classes: 'bg-blue-50 text-blue-700 border-blue-300',
  },
  aprovado: {
    label: 'APROVADO',
    classes: 'bg-green-50 text-green-700 border-green-300',
  },
  negado: {
    label: 'NEGADO',
    classes: 'bg-red-50 text-[#9b1b22] border-red-300',
  },
  expirado: {
    label: 'EXPIRADO',
    classes: 'bg-gray-50 text-gray-500 border-gray-300',
  },
}

interface StatusChipProps {
  status: StatusSolicitacao
  className?: string
}

export function StatusChip({ status, className }: StatusChipProps) {
  const cfg = configStatus[status]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded border px-2 py-0.5 label-md tracking-widest',
        cfg.classes,
        className
      )}
    >
      {cfg.label}
    </span>
  )
}

// Chips avulsos de uso geral
export function ChipSala({ ocupada }: { ocupada: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded border px-2 py-0.5 label-md',
        ocupada
          ? 'bg-red-50 text-[#9b1b22] border-red-300'
          : 'bg-green-50 text-green-700 border-green-300'
      )}
    >
      {ocupada ? 'OCUPADA' : 'LIVRE'}
    </span>
  )
}

export function ChipLivro({ disponivel }: { disponivel: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded border px-2 py-0.5 label-md',
        disponivel
          ? 'bg-green-50 text-green-700 border-green-300'
          : 'bg-red-50 text-[#9b1b22] border-red-300'
      )}
    >
      {disponivel ? 'DISPONÍVEL' : 'EMPRESTADO'}
    </span>
  )
}
