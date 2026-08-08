import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Table, type ColumnDef } from './Table'

/**
 * La selección se añadió como prop **opcional** porque `Table` lo consumen ocho
 * pantallas. La prueba que más importa es la primera: sin las props, ni una columna
 * de más.
 */

interface Row { id: number; name: string }

const ROWS: Row[] = [
  { id: 1, name: 'Frankly Bautista' },
  { id: 2, name: 'Ana Pérez' },
]

const COLUMNS: ColumnDef<Row>[] = [{ key: 'name', header: 'Nombre' }]

describe('Table — selección de filas', () => {
  it('sin las props de selección no renderiza la columna de casillas', () => {
    render(<Table<Row> columns={COLUMNS} rows={ROWS} keyField="id" />)

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    // Una sola columna: la de siempre.
    expect(screen.getAllByRole('columnheader')).toHaveLength(1)
  })

  it('con las props aparece una casilla por fila más la de cabecera', () => {
    render(
      <Table<Row>
        columns={COLUMNS}
        rows={ROWS}
        keyField="id"
        selectedKeys={[]}
        onSelectionChange={vi.fn()}
      />,
    )

    expect(screen.getAllByRole('checkbox')).toHaveLength(3)
    expect(screen.getAllByRole('columnheader')).toHaveLength(2)
  })

  it('la cabecera notifica todas las claves visibles', async () => {
    const onSelectionChange = vi.fn()
    const user = userEvent.setup()
    render(
      <Table<Row>
        columns={COLUMNS}
        rows={ROWS}
        keyField="id"
        selectedKeys={[]}
        onSelectionChange={onSelectionChange}
      />,
    )

    await user.click(screen.getByLabelText('Seleccionar todas las filas visibles'))

    expect(onSelectionChange).toHaveBeenCalledWith([1, 2])
  })

  it('la cabecera queda indeterminada con selección parcial', () => {
    render(
      <Table<Row>
        columns={COLUMNS}
        rows={ROWS}
        keyField="id"
        selectedKeys={[1]}
        onSelectionChange={vi.fn()}
      />,
    )

    const header = screen.getByLabelText(
      'Seleccionar todas las filas visibles',
    ) as HTMLInputElement
    expect(header.indeterminate).toBe(true)
    expect(header.checked).toBe(false)
  })

  it('marcar una fila no dispara el clic de fila', async () => {
    const onRowClick = vi.fn()
    const onSelectionChange = vi.fn()
    const user = userEvent.setup()
    render(
      <Table<Row>
        columns={COLUMNS}
        rows={ROWS}
        keyField="id"
        onRowClick={onRowClick}
        selectedKeys={[]}
        onSelectionChange={onSelectionChange}
        selectionLabel={(row) => row.name}
      />,
    )

    await user.click(screen.getByLabelText('Seleccionar Frankly Bautista'))

    expect(onSelectionChange).toHaveBeenCalledWith([1])
    // En una tabla con detalle, marcar abriría además la ficha de esa fila.
    expect(onRowClick).not.toHaveBeenCalled()
  })

  it('el padre es el dueño del estado: sin devolverlo, la fila no queda marcada', async () => {
    const user = userEvent.setup()
    render(
      <Table<Row>
        columns={COLUMNS}
        rows={ROWS}
        keyField="id"
        selectedKeys={[]}
        onSelectionChange={vi.fn()}
        selectionLabel={(row) => row.name}
      />,
    )

    await user.click(screen.getByLabelText('Seleccionar Frankly Bautista'))

    expect(screen.getByLabelText('Seleccionar Frankly Bautista')).not.toBeChecked()
  })

  it('las casillas de fila se identifican por su contenido', () => {
    render(
      <Table<Row>
        columns={COLUMNS}
        rows={ROWS}
        keyField="id"
        selectedKeys={[]}
        onSelectionChange={vi.fn()}
        selectionLabel={(row) => row.name}
      />,
    )

    // Cincuenta casillas llamadas todas "Seleccionar" son inservibles con lector.
    expect(screen.getByLabelText('Seleccionar Frankly Bautista')).toBeInTheDocument()
    expect(screen.getByLabelText('Seleccionar Ana Pérez')).toBeInTheDocument()
  })
})
