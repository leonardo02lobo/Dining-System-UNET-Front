import { Link } from 'react-router-dom'

export function NavBar() {
    return (
        <aside className="flex h-full w-full flex-col gap-6 rounded-3xl p-6 text-black shadow-2xl ring-1">
            <div className="flex items-center gap-4">
                <Link
                    to="/"
                    className="flex flex-row gap-4"
                >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl ring-1">
                        <img
                            src="/assets/Atras.png"
                            alt="Menú principal"
                            className="h-8 w-8 object-contain"
                        />
                    </div>

                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-amber-200/80">
                            Sistema
                        </p>
                        <h2 className="text-lg font-semibold leading-tight">Menú Principal</h2>
                    </div>
                </Link>
            </div>

            <nav className="flex flex-1 flex-col gap-3">
                <Link
                    to="/"
                    className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/15"
                >
                    Inicio
                </Link>
                <Link
                    to="/login"
                    className="flex flex-row gap-4 items-center"
                >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl ring-1">
                        <img
                            src="/assets/logout4.png"
                            alt="Menú principal"
                            className="h-8 w-8 object-contain"
                        />
                    </div>

                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-amber-200/80">
                            Cerrar sesión
                        </p>
                    </div>
                </Link>
            </nav>
        </aside>
    )
}