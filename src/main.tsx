import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    {/* Último recurso: cubre lo que queda fuera del área de contenido —cabecera,
        menú, login— para que un fallo ahí no deje la página en blanco. */}
    <ErrorBoundary scope="app">
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
