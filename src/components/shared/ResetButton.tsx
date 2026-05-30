import { RotateCcw } from 'lucide-react'
import { useBibliotecaStore } from '@/store/bibliotecaStore'
import { useNavigate } from 'react-router-dom'
import { useLeitorRFIDStore } from '@/mocks/hardware/LeitorRFID'
import { useTrancaStore } from '@/mocks/hardware/Tranca'
import { useWebcamStore } from '@/mocks/hardware/Webcam'
import { toast } from 'sonner'

export function ResetButton() {
  const reset = useBibliotecaStore((s) => s.reset)
  const navigate = useNavigate()

  function handleReset() {
    if (!confirm('Reiniciar a demo? Todo o estado será perdido.')) return

    reset()
    useLeitorRFIDStore.getState().resetar()
    useTrancaStore.getState().setEstado('fechada')
    useWebcamStore.getState().resetar()

    navigate('/login')
    toast.success('Demo reiniciada')
  }

  return (
    <button
      onClick={handleReset}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
      title="Reiniciar demo"
    >
      <RotateCcw className="w-3.5 h-3.5" />
      Reset
    </button>
  )
}
