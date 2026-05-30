import { Wifi, Lock, LockOpen, Camera, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTrancaStore } from '@/mocks/hardware/Tranca'
import { useLeitorRFIDStore } from '@/mocks/hardware/LeitorRFID'
import { useWebcamStore } from '@/mocks/hardware/Webcam'

export function HardwareStatusBar() {
  const tranca = useTrancaStore((s) => s.estado)
  const rfid = useLeitorRFIDStore((s) => s.estado)
  const webcam = useWebcamStore((s) => s.estado)

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-[var(--secondary)] rounded border border-[var(--border)] text-xs font-medium">
      {/* Tranca */}
      <div className="flex items-center gap-1.5">
        {tranca === 'aberta' ? (
          <LockOpen className="w-3.5 h-3.5 text-green-600" />
        ) : tranca === 'abrindo' || tranca === 'fechando' ? (
          <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin" />
        ) : (
          <Lock className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
        )}
        <span
          className={cn(
            'label-md',
            tranca === 'aberta' ? 'text-green-700' : 'text-[var(--muted-foreground)]'
          )}
        >
          TRANCA {tranca.toUpperCase()}
        </span>
      </div>

      <span className="text-[var(--border)]">|</span>

      {/* RFID */}
      <div className="flex items-center gap-1.5">
        {rfid === 'aguardando' ? (
          <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin" />
        ) : rfid === 'lido' ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
        ) : (
          <Wifi className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
        )}
        <span
          className={cn(
            'label-md',
            rfid === 'lido' ? 'text-green-700' : rfid === 'aguardando' ? 'text-amber-700' : 'text-[var(--muted-foreground)]'
          )}
        >
          RFID {rfid.toUpperCase()}
        </span>
      </div>

      <span className="text-[var(--border)]">|</span>

      {/* Webcam */}
      <div className="flex items-center gap-1.5">
        {webcam === 'analisando' ? (
          <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin" />
        ) : webcam === 'confirmado' ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
        ) : webcam === 'nao_confirmado' ? (
          <XCircle className="w-3.5 h-3.5 text-[#9b1b22]" />
        ) : (
          <Camera className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
        )}
        <span
          className={cn(
            'label-md',
            webcam === 'confirmado' ? 'text-green-700' : webcam === 'nao_confirmado' ? 'text-[#9b1b22]' : 'text-[var(--muted-foreground)]'
          )}
        >
          CAM {webcam.toUpperCase()}
        </span>
      </div>
    </div>
  )
}
