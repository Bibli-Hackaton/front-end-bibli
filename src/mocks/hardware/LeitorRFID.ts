// Mock do leitor RFID. No hardware real (ESP32), substitui-se esta implementação
// por uma que abre uma conexão serial/WebSocket e aguarda uma tag.
// FUTURO HARDWARE: Serial.readline() ou WebSocket /ws/rfid

import { create } from 'zustand'

type EstadoRFID = 'idle' | 'aguardando' | 'lido' | 'erro'

interface LeitorRFIDState {
  estado: EstadoRFID
  tagLida: string | null
  // Resolve a Promise pendente quando a tag for definida via simularLeitura()
  _resolver: ((tag: string) => void) | null
  _rejeitor: ((err: Error) => void) | null
}

export const useLeitorRFIDStore = create<
  LeitorRFIDState & {
    iniciarLeitura: () => void
    simularLeitura: (tag: string) => void
    cancelar: () => void
    resetar: () => void
  }
>((set, get) => ({
  estado: 'idle',
  tagLida: null,
  _resolver: null,
  _rejeitor: null,

  iniciarLeitura: () => set({ estado: 'aguardando', tagLida: null }),

  simularLeitura: (tag) => {
    const { _resolver } = get()
    set({ estado: 'lido', tagLida: tag, _resolver: null, _rejeitor: null })
    _resolver?.(tag)
  },

  cancelar: () => {
    const { _rejeitor } = get()
    set({ estado: 'idle', tagLida: null, _resolver: null, _rejeitor: null })
    _rejeitor?.(new Error('Leitura RFID cancelada'))
  },

  resetar: () => set({ estado: 'idle', tagLida: null, _resolver: null, _rejeitor: null }),
}))

export const LeitorRFID = {
  /** Retorna uma Promise que resolve com a tag quando o usuário clicar em "Simular RFID" na UI. */
  ler(): Promise<string> {
    return new Promise((resolve, reject) => {
      useLeitorRFIDStore.setState({
        estado: 'aguardando',
        tagLida: null,
        _resolver: resolve,
        _rejeitor: reject,
      })
    })
  },

  simularLeitura(tag: string) {
    useLeitorRFIDStore.getState().simularLeitura(tag)
  },

  cancelar() {
    useLeitorRFIDStore.getState().cancelar()
  },
}
