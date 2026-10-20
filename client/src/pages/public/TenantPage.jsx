import { useParams } from 'react-router-dom'
import Inicio from './Inicio'

// Wrapper para rutas tipo agendacar.cl/ewert
// Pasa el slug como prop al componente Inicio que lo usa como tenant
export default function TenantPage() {
  const { slug } = useParams()
  return <Inicio slugOverride={slug} />
}
