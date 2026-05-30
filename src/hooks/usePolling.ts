import { useEffect, useRef } from 'react'

/**
 * Executa `fn` imediatamente e a cada `intervalMs`. Usado para refletir, nas
 * telas de fluxo, mudanças feitas por OUTRO usuário no backend (aluno vs
 * colaborador em navegadores diferentes) — onde o BroadcastChannel não alcança.
 */
export function usePolling(
  fn: () => void | Promise<void>,
  intervalMs = 4000,
  enabled = true,
) {
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(() => {
    if (!enabled) return
    let ativo = true
    const tick = async () => {
      if (ativo) await fnRef.current()
    }
    void tick() // dispara já na montagem
    const id = setInterval(tick, intervalMs)
    return () => {
      ativo = false
      clearInterval(id)
    }
  }, [intervalMs, enabled])
}
