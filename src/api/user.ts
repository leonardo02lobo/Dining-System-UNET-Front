import { Row } from "../types/user"

export const getData = async () => {
    try {
        const response = await fetch('https://randomuser.me/api/?results=20')
        if (!response.ok) throw new Error('Error en la respuesta de la API')
        const data = await response.json()

        const enriched: Row[] = data.results.map((u: any, i: number) => ({
            name: `${u.name.first} ${u.name.last}`,
            career: careerSeeds[i % careerSeeds.length],
            email: u.email,
            gender: u.gender,
            picture: u.picture.thumbnail,
        }))

        return enriched
    } catch (err: any) {
        console.error(err)
        throw new Error(err.message ?? 'Error desconocido')
    }
}

const careerSeeds = [
    'Ingeniería',
    'Medicina',
    'Derecho',
    'Arquitectura',
    'Administración',
    'Biología',
    'Ciencias de la Computación',
    'Economía',
]