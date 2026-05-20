import { useEffect, useState } from 'react'
import { auditApi } from '../api/audit'
import type { LoginAuditEntry } from '../types/audit'

const PAGE_SIZE = 50

function formatDate(iso: string): string {
    return new Date(iso).toLocaleString('es-VE', {
        dateStyle: 'short',
        timeStyle: 'medium',
    })
}

function roleLabel(role: string): string {
    const map: Record<string, string> = {
        SUPER_ADMIN: 'Super Admin',
        ADMIN: 'Admin',
        TAQUILLERO: 'Taquillero',
    }
    return map[role] ?? role
}

export function LoginAuditPage() {
    const [rows, setRows] = useState<LoginAuditEntry[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        setLoading(true)
        auditApi
            .getLogs(page * PAGE_SIZE, PAGE_SIZE)
            .then((data) => {
                setRows(data.items)
                setTotal(data.total)
            })
            .catch((err: any) => setError(err.message ?? 'Error al cargar los registros'))
            .finally(() => setLoading(false))
    }, [page])

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

    return (
        <div className="p-4">
            <h2 className="text-xl font-semibold mb-1">Auditoría de Inicio de Sesión</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                {total} registro{total !== 1 ? 's' : ''} en total
            </p>

            {loading && <p className="text-sm text-slate-300">Cargando registros...</p>}
            {error && <p className="text-sm text-red-400">Error: {error}</p>}

            {!loading && !error && (
                <>
                    <section className="overflow-x-auto">
                        <table className="min-w-full bg-white dark:bg-slate-800 rounded-lg text-sm">
                            <thead>
                                <tr className="text-left border-b border-slate-200 dark:border-slate-700">
                                    <th className="px-4 py-3 font-medium">Usuario</th>
                                    <th className="px-4 py-3 font-medium">Correo</th>
                                    <th className="px-4 py-3 font-medium">Rol</th>
                                    <th className="px-4 py-3 font-medium">IP</th>
                                    <th className="px-4 py-3 font-medium">Dispositivo / Navegador</th>
                                    <th className="px-4 py-3 font-medium">Fecha y Hora</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r) => (
                                    <tr
                                        key={r.id}
                                        className="border-b border-slate-100 dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700"
                                    >
                                        <td className="px-4 py-3 font-medium">{r.user_name}</td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.user_email}</td>
                                        <td className="px-4 py-3">
                                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                                {roleLabel(r.user_role)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                                            {r.ip_address ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 max-w-xs truncate text-xs text-slate-500 dark:text-slate-400" title={r.user_agent ?? ''}>
                                            {r.user_agent ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-slate-700 dark:text-slate-200">
                                            {formatDate(r.logged_at)}
                                        </td>
                                    </tr>
                                ))}
                                {rows.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                                            No hay registros de inicio de sesión.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </section>

                    {totalPages > 1 && (
                        <div className="mt-4 flex items-center gap-3">
                            <button
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
                            >
                                Anterior
                            </button>
                            <span className="text-sm text-slate-500">
                                Página {page + 1} de {totalPages}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
                            >
                                Siguiente
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
