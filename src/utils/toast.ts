import { toast } from 'sonner'
import type { ApiError } from '../types/auth'

function extractMessage(err: unknown): string {
  if (typeof err === 'string') return err
  if (err && typeof err === 'object' && 'message' in err) return String((err as ApiError).message)
  return 'Error inesperado'
}

export const notify = {
  success: (msg: string) => toast.success(msg),
  error: (err: unknown) => toast.error(extractMessage(err)),
  info: (msg: string) => toast.info(msg),
  loading: (msg: string) => toast.loading(msg),
  dismiss: (id?: string | number) => toast.dismiss(id),
}
