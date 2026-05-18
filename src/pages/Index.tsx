import { NavBar } from '../components/ui/NavBar'

export function Index() {
    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#1e3a8a_0%,_#0f172a_45%,_#020617_100%)] p-4 text-white md:p-8">
            <div className="mx-auto grid min-h-[calc(100vh-2rem)] gap-6 lg:grid-cols-[320px_1fr]">
                <NavBar />

                <section className="flex flex-col justify-between rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
                    <div className="space-y-6">
                    </div>
                </section>
            </div>
        </main>
    )
}