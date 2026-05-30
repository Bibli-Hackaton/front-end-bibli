import { cn } from '@/lib/utils'
import type { Usuario } from '@/types'

const papelLabel: Record<Usuario['papel'], string> = {
  aluno: 'Aluno',
  colaborador: 'Colaborador',
  admin: 'Administrador',
}

const papelCor: Record<Usuario['papel'], string> = {
  aluno: '#9b1b22',
  colaborador: '#1e40af',
  admin: '#166534',
}

interface DigitalIdCardProps {
  usuario: Usuario
  compact?: boolean
  className?: string
}

export function DigitalIdCard({ usuario, compact = false, className }: DigitalIdCardProps) {
  const cor = papelCor[usuario.papel]

  if (compact) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ backgroundColor: cor }}
        >
          {usuario.avatarInicial}
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)] leading-tight">{usuario.nome}</p>
          <p className="label-md text-[var(--muted-foreground)]">{papelLabel[usuario.papel]}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden w-full max-w-xs shadow-sm',
        className
      )}
    >
      {/* Header colorido */}
      <div className="h-2" style={{ backgroundColor: cor }} />

      <div className="p-5 flex gap-4 items-center">
        {/* Avatar */}
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
          style={{ backgroundColor: cor }}
        >
          {usuario.avatarInicial}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="headline-md truncate">{usuario.nome}</p>
          <p className="label-md text-[var(--muted-foreground)] mt-0.5">{papelLabel[usuario.papel]}</p>
          <p className="label-md text-[var(--muted-foreground)] mt-1">{usuario.id.toUpperCase()}</p>
        </div>
      </div>

      <div className="px-5 pb-4 border-t border-[var(--border)] pt-3">
        <p className="label-md text-[var(--muted-foreground)]">BIBLI • SISTEMA AUTÔNOMO</p>
      </div>
    </div>
  )
}
