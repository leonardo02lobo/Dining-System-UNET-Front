import { useEffect, useState } from 'react'
import { Row } from '../types/user'
import { getData } from '../api/user'

export function ListUser() {
    const [rows, setRows] = useState<Row[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedGender, setSelectedGender] = useState('all')
    const [selectedCareer, setSelectedCareer] = useState('all')

    useEffect(() => {
        const loadData = async () => {
            try {
                const dataRows = await getData()
                setRows(dataRows)
            } catch (err: any) {
                console.error(err)
                setError(err.message ?? 'Error desconocido')
            } finally {
                setLoading(false)
            }
        }

        void loadData()
    }, [])

    if (loading) return <p className="text-sm text-slate-300">Cargando usuarios...</p>
    if (error) return <p className="text-sm text-red-400">Error: {error}</p>

    const careerOptions = [...new Set(rows.map((row) => row.career))].sort()

    const filteredRows = rows.filter((row) => {
        const genderMatch = selectedGender === 'all' || row.gender === selectedGender
        const careerMatch = selectedCareer === 'all' || row.career === selectedCareer

        return genderMatch && careerMatch
    })

    return (
        <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Listado de usuarios</h2>
            <section>
                <h3 className="text-xl font-semibold mb-4">Grupo de Filtros</h3>
                <div className="grid gap-4 md:grid-cols-2 mb-4">
                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                        Filtrar por sexo
                        <select
                            value={selectedGender}
                            onChange={(event) => setSelectedGender(event.target.value)}
                            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        >
                            <option value="all">Todos</option>
                            <option value="male">Masculino</option>
                            <option value="female">Femenino</option>
                        </select>
                    </label>

                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                        Filtrar por carrera
                        <select
                            value={selectedCareer}
                            onChange={(event) => setSelectedCareer(event.target.value)}
                            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        >
                            <option value="all">Todas</option>
                            {careerOptions.map((career) => (
                                <option key={career} value={career}>
                                    {career}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            </section>
            <section className="overflow-x-auto">
                <table className="min-w-full bg-white dark:bg-slate-800 rounded-lg">
                    <thead>
                        <tr className="text-left border-b">
                            <th className="px-4 py-2">Nombre</th>
                            <th className="px-4 py-2">Carrera</th>
                            <th className="px-4 py-2">Correo</th>
                            <th className="px-4 py-2">Sexo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRows.map((r, idx) => (
                            <tr key={idx} className="border-b last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700">
                                <td className="px-4 py-3 flex flex-row items-center gap-4">
                                    <img src={r.picture} alt={r.name} className="w-10 h-10 rounded-full" />
                                    {r.name}
                                </td>
                                <td className="px-4 py-3">{r.career}</td>
                                <td className="px-4 py-3 text-sm text-slate-600">{r.email}</td>
                                <td className="px-4 py-3 capitalize">{r.gender}</td>
                            </tr>
                        ))}
                        {filteredRows.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">
                                    No hay resultados para los filtros seleccionados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>
        </div>
    )
}