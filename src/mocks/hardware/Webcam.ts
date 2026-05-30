// Mock da webcam de confirmação de devolução. No hardware real, substitui-se
// por uma chamada à API de visão computacional que analisa a imagem da câmera.
// FUTURO HARDWARE: POST /hw/webcam/confirmar-livro → { confirmado: boolean, confianca: number }

import { create } from 'zustand'

type EstadoWebcam = 'idle' | 'analisando' | 'confirmado' | 'nao_confirmado'

interface WebcamState {
  estado: EstadoWebcam
  _resolver: ((confirmado: boolean) => void) | null
}

export const useWebcamStore = create<WebcamState & {
  iniciarAnalise: () => void
  simularResultado: (confirmado: boolean) => void
  resetar: () => void
}>((set, get) => ({
  estado: 'idle',
  _resolver: null,

  iniciarAnalise: () => set({ estado: 'analisando' }),

  simularResultado: (confirmado) => {
    const { _resolver } = get()
    set({ estado: confirmado ? 'confirmado' : 'nao_confirmado', _resolver: null })
    _resolver?.(confirmado)
  },

  resetar: () => set({ estado: 'idle', _resolver: null }),
}))

export const Webcam = {
  /** Retorna Promise<boolean>: true = livro detectado, false = livro não detectado */
  confirmarLivro(): Promise<boolean> {
    return new Promise((resolve) => {
      useWebcamStore.setState({ estado: 'analisando', _resolver: resolve })
    })
  },

  simularResultado(confirmado: boolean) {
    useWebcamStore.getState().simularResultado(confirmado)
  },
}
