// Mock da tranca eletrônica. No hardware real (ESP32), substitui-se por
// uma chamada HTTP/MQTT ao microcontrolador.
// FUTURO HARDWARE: POST /hw/tranca/abrir | /hw/tranca/fechar

import { create } from 'zustand'

type EstadoTranca = 'fechada' | 'abrindo' | 'aberta' | 'fechando'

interface TrancaState {
  estado: EstadoTranca
}

export const useTrancaStore = create<TrancaState & {
  setEstado: (e: EstadoTranca) => void
}>((set) => ({
  estado: 'fechada',
  setEstado: (estado) => set({ estado }),
}))

export const Tranca = {
  async abrir(): Promise<void> {
    useTrancaStore.getState().setEstado('abrindo')
    await delay(800)
    useTrancaStore.getState().setEstado('aberta')
  },

  async fechar(): Promise<void> {
    useTrancaStore.getState().setEstado('fechando')
    await delay(600)
    useTrancaStore.getState().setEstado('fechada')
  },

  getEstado(): EstadoTranca {
    return useTrancaStore.getState().estado
  },
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
