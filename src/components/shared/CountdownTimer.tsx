import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface CountdownTimerProps {
  inicioIso: string
  duracaoMin: number
  onExpired?: () => void
  className?: string
}

export function CountdownTimer({ inicioIso, duracaoMin, onExpired, className }: CountdownTimerProps) {
  const [restanteMs, setRestanteMs] = useState(0)

  useEffect(() => {
    const fimMs = new Date(inicioIso).getTime() + duracaoMin * 60 * 1000

    const tick = () => {
      const diff = fimMs - Date.now()
      setRestanteMs(Math.max(0, diff))
      if (diff <= 0) onExpired?.()
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [inicioIso, duracaoMin, onExpired])

  const totalSec = Math.floor(restanteMs / 1000)
  const horas = Math.floor(totalSec / 3600)
  const minutos = Math.floor((totalSec % 3600) / 60)
  const segundos = totalSec % 60

  const percentual = Math.max(0, Math.min(100, (restanteMs / (duracaoMin * 60 * 1000)) * 100))
  const critico = percentual < 20

  const formatParte = (n: number) => n.toString().padStart(2, '0')

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div
        className={cn(
          'font-bold tabular-nums transition-colors',
          critico ? 'text-[#9b1b22]' : 'text-[var(--foreground)]',
          'text-5xl'
        )}
        aria-label={`Tempo restante: ${horas ? formatParte(horas) + ':' : ''}${formatParte(minutos)}:${formatParte(segundos)}`}
      >
        {horas > 0 && <span>{formatParte(horas)}:</span>}
        <span>{formatParte(minutos)}</span>
        <span className="opacity-70">:</span>
        <span>{formatParte(segundos)}</span>
      </div>

      {/* Barra de progresso */}
      <div className="w-full h-2 bg-[var(--secondary)] rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-1000',
            critico ? 'bg-[#9b1b22]' : 'bg-green-500'
          )}
          style={{ width: `${percentual}%` }}
        />
      </div>

      {critico && restanteMs > 0 && (
        <p className="label-md text-[#9b1b22] text-center">Tempo quase esgotado!</p>
      )}
      {restanteMs === 0 && (
        <p className="label-md text-[#9b1b22] text-center">Tempo esgotado — por favor, encerre sua sessão</p>
      )}
    </div>
  )
}
