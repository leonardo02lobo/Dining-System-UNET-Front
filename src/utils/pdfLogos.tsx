import { renderToStaticMarkup } from 'react-dom/server'
import { LogoUnet } from '../components/icons/LogoUnet'
import { logoDecanatoDataUri } from '../components/icons/logoDecanatoData'

function toDataUri(markup: string, width: number, height: number) {
  const svg = markup.replace('<svg', `<svg width="${width}" height="${height}"`)
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export const logoUnetDataUri = toDataUri(renderToStaticMarkup(<LogoUnet />), 242, 300)
export { logoDecanatoDataUri }
