import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  Car,
  CheckCircle2,
  ClipboardList,
  Loader2,
  MapPin,
  Pencil,
  Printer,
  Save,
  Trash2,
  User,
  X
} from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { Alert, Button, Input } from '../../components/ui'
import { getInspeccion, guardarInspeccion, confirmarInspeccion } from '../../services/inspeccionService'
import { listarTrabajadores } from '../../services/trabajadorService'
import { formatFullDate, formatTimeFromISO } from '../../lib/dates'
import { getUsuario } from '../../lib/auth'
import useDocumentTitle from '../../hooks/useDocumentTitle'

// ── Tipos de daño ────────────────────────────────────────────────────────────
const TIPOS_DANO = [
  { value: 'rayon',       label: 'Raya / rayón',  color: '#F47732' },
  { value: 'abolladura',  label: 'Abolladura',    color: '#EF4444' },
  { value: 'piquete',     label: 'Piquete',       color: '#3B82F6' },
  { value: 'otro',        label: 'Otro daño',     color: '#6B7280' }
]

const VISTAS = [
  { value: 'lateral',   label: 'Vista lateral' },
  { value: 'frontal',   label: 'Vista frontal' },
  { value: 'trasera',   label: 'Vista trasera' },
  { value: 'superior',  label: 'Vista superior' }
]

// ── SVGs del vehículo ────────────────────────────────────────────────────────
const SVG_LATERAL = (
  <svg
    viewBox="0 0 400 200"
    className="w-full h-full"
    preserveAspectRatio="xMidYMid meet"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Carrocería */}
    <path
      d="M25 145 L25 132 Q27 119 43 111 L78 94 Q101 83 136 74 L159 58 L181 28 Q185 23 194 23 L321 23 Q333 23 339 34 L351 62 L377 70 Q389 75 393 88 L397 117 L397 151 L373 157 L332 160 L67 160 L25 155 Z"
      fill="#F0F1F4"
      stroke="#2C3038"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />

    {/* Cristales */}
    <path
      d="M165 61 L184 30 Q187 26 195 26 L231 26 L237 61 Z"
      fill="#B8CDD9"
      fillOpacity="0.87"
      stroke="#2C3038"
      strokeWidth="1.5"
    />
    <path
      d="M241 26 L319 26 Q329 27 334 37 L345 62 L242 62 Z"
      fill="#B8CDD9"
      fillOpacity="0.87"
      stroke="#2C3038"
      strokeWidth="1.5"
    />
    <path
      d="M162 64 L345 64 L356 72 L159 72 Z"
      fill="#E6E8EB"
      stroke="#2C3038"
      strokeWidth="1"
    />

    {/* Pilar A, B y C */}
    <path d="M181 29 L188 62 M238 25 L242 160 M326 29 L334 62" stroke="#2C3038" strokeWidth="2.5" />

    {/* Capó y líneas de carrocería */}
    <path d="M25 132 Q52 116 78 104 L136 84 L158 72" stroke="#C4C8CE" strokeWidth="1.5" />
    <path d="M246 73 L344 73 L376 81" stroke="#C4C8CE" strokeWidth="1.3" />
    <path d="M244 75 L244 153 M336 75 L336 151" stroke="#C4C8CE" strokeWidth="1.2" />
    <path d="M30 155 L373 157" stroke="#2C3038" strokeWidth="1.8" />

    {/* Manillas */}
    <rect x="266" y="88" width="20" height="5" rx="2.5" fill="#E6E8EB" stroke="#2C3038" strokeWidth="1.2" />
    <rect x="312" y="88" width="20" height="5" rx="2.5" fill="#E6E8EB" stroke="#2C3038" strokeWidth="1.2" />

    {/* Espejo */}
    <path d="M350 69 L357 65 L366 68 L368 76 L359 80 L353 75 Z" fill="#E6E8EB" stroke="#2C3038" strokeWidth="1.5" />

    {/* Luces delanteras */}
    <path d="M386 91 L395 105 L394 116 L383 112 L380 99 Z" fill="#FDE68A" stroke="#2C3038" strokeWidth="1.3" />
    <path d="M389 97 L393 105" stroke="#FFFFFF" strokeWidth="2" />

    {/* Piloto trasero */}
    <path d="M27 119 L43 111 L49 123 L48 135 L29 141 Z" fill="#FCA5A5" stroke="#2C3038" strokeWidth="1.4" />

    {/* Pasos de rueda */}
    <path
      d="M72 159 C74 139 88 128 112 128 C136 128 150 140 152 159"
      stroke="#2C3038"
      strokeWidth="2.5"
    />
    <path
      d="M250 159 C252 139 266 128 290 128 C314 128 328 140 330 159"
      stroke="#2C3038"
      strokeWidth="2.5"
    />

    {/* Rueda trasera */}
    <circle cx="112" cy="152" r="26" fill="#454A53" stroke="#2C3038" strokeWidth="2" />
    <circle cx="112" cy="152" r="20" fill="#E6E8EB" stroke="#A8ADB5" strokeWidth="1.5" />
    <path d="M112 135 L112 169 M95 152 L129 152 M100 140 L124 164 M124 140 L100 164" stroke="#454A53" strokeWidth="3" strokeLinecap="round" />
    <circle cx="112" cy="152" r="7" fill="#454A53" />
    <circle cx="112" cy="152" r="3" fill="#D9DCE1" />

    {/* Rueda delantera */}
    <circle cx="290" cy="152" r="26" fill="#454A53" stroke="#2C3038" strokeWidth="2" />
    <circle cx="290" cy="152" r="20" fill="#E6E8EB" stroke="#A8ADB5" strokeWidth="1.5" />
    <path d="M290 135 L290 169 M273 152 L307 152 M278 140 L302 164 M302 140 L278 164" stroke="#454A53" strokeWidth="3" strokeLinecap="round" />
    <circle cx="290" cy="152" r="7" fill="#454A53" />
    <circle cx="290" cy="152" r="3" fill="#D9DCE1" />

    {/* Zócalo */}
    <path d="M140 177 L263 177 L270 181 L135 181 Z" fill="#C9CDD3" stroke="#2C3038" strokeWidth="1" />
  </svg>
)

const SVG_FRONTAL = (
  <svg
    viewBox="0 0 300 220"
    className="w-full h-full"
    preserveAspectRatio="xMidYMid meet"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <ellipse cx="150" cy="205" rx="116" ry="5" fill="#2C3038" fillOpacity="0.10" />

    {/* Espejos */}
    <path d="M43 85 L27 78 Q19 77 18 85 L21 96 L43 101 Z" fill="#E6E8EB" stroke="#2C3038" strokeWidth="2" />
    <path d="M257 85 L273 78 Q281 77 282 85 L279 96 L257 101 Z" fill="#E6E8EB" stroke="#2C3038" strokeWidth="2" />

    {/* Carrocería */}
    <path
      d="M44 177 L39 139 Q39 125 49 111 L69 84 L86 48 Q91 37 105 34 L195 34 Q209 37 214 48 L231 84 L251 111 Q261 125 261 139 L256 177 L244 189 L56 189 Z"
      fill="#F0F1F4"
      stroke="#2C3038"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />

    {/* Parabrisas */}
    <path
      d="M71 83 L88 49 Q92 40 106 39 L194 39 Q208 40 212 49 L229 83 Z"
      fill="#B8CDD9"
      fillOpacity="0.87"
      stroke="#2C3038"
      strokeWidth="1.6"
    />
    <path d="M84 53 L216 53 M73 85 L227 85" stroke="#D9E1E7" strokeWidth="1.5" />

    {/* Capó */}
    <path d="M60 100 Q150 88 240 100 L252 129 Q150 120 48 129 Z" fill="#F0F1F4" stroke="#C4C8CE" strokeWidth="1.3" />
    <path d="M73 99 L49 133 M227 99 L251 133" stroke="#D0D4DA" strokeWidth="1.3" />

    {/* Faros */}
    <path d="M45 121 Q59 110 82 116 L94 128 L85 141 L47 145 Z" fill="#E6E8EB" stroke="#2C3038" strokeWidth="1.7" />
    <path d="M255 121 Q241 110 218 116 L206 128 L215 141 L253 145 Z" fill="#E6E8EB" stroke="#2C3038" strokeWidth="1.7" />
    <path d="M52 126 L80 122 L86 129 L80 136 L51 139 Z" fill="#FFF9E8" stroke="#C7CBD1" strokeWidth="1" />
    <path d="M248 126 L220 122 L214 129 L220 136 L249 139 Z" fill="#FFF9E8" stroke="#C7CBD1" strokeWidth="1" />

    {/* Parrilla */}
    <path d="M92 145 Q150 139 208 145 L201 167 Q150 171 99 167 Z" fill="#454A53" stroke="#2C3038" strokeWidth="1.8" />
    <path d="M101 151 L199 151 M99 157 L201 157 M100 163 L200 163" stroke="#737983" strokeWidth="1.1" />

    {/* Entrada de aire inferior */}
    <path d="M91 176 Q150 181 209 176 L203 185 L97 185 Z" fill="#D9DCE1" stroke="#2C3038" strokeWidth="1.4" />

    {/* Ruedas */}
    <path d="M34 155 Q36 143 48 143 L53 190 L35 190 Z" fill="#454A53" stroke="#2C3038" strokeWidth="1.5" />
    <path d="M266 155 Q264 143 252 143 L247 190 L265 190 Z" fill="#454A53" stroke="#2C3038" strokeWidth="1.5" />

    <circle cx="62" cy="175" r="22" fill="#454A53" stroke="#2C3038" strokeWidth="2" />
    <circle cx="62" cy="175" r="16" fill="#E6E8EB" stroke="#A8ADB5" strokeWidth="1.5" />
    <path d="M62 162 L62 188 M49 175 L75 175 M53 166 L71 184 M71 166 L53 184" stroke="#454A53" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="62" cy="175" r="5" fill="#454A53" />

    <circle cx="238" cy="175" r="22" fill="#454A53" stroke="#2C3038" strokeWidth="2" />
    <circle cx="238" cy="175" r="16" fill="#E6E8EB" stroke="#A8ADB5" strokeWidth="1.5" />
    <path d="M238 162 L238 188 M225 175 L251 175 M229 166 L247 184 M247 166 L229 184" stroke="#454A53" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="238" cy="175" r="5" fill="#454A53" />

    {/* Contorno inferior */}
    <path d="M48 190 Q150 198 252 190" stroke="#2C3038" strokeWidth="1.7" />
  </svg>
)

const SVG_TRASERA = (
  <svg
    viewBox="0 0 300 220"
    className="w-full h-full"
    preserveAspectRatio="xMidYMid meet"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <ellipse cx="150" cy="205" rx="116" ry="5" fill="#2C3038" fillOpacity="0.10" />

    {/* Espejos */}
    <path d="M43 89 L27 82 Q19 81 18 89 L21 100 L43 104 Z" fill="#E6E8EB" stroke="#2C3038" strokeWidth="2" />
    <path d="M257 89 L273 82 Q281 81 282 89 L279 100 L257 104 Z" fill="#E6E8EB" stroke="#2C3038" strokeWidth="2" />

    {/* Carrocería */}
    <path
      d="M43 177 L39 137 Q39 123 49 110 L67 88 L77 57 Q82 43 98 39 L202 39 Q218 43 223 57 L233 88 L251 110 Q261 123 261 137 L257 177 L244 190 L56 190 Z"
      fill="#F0F1F4"
      stroke="#2C3038"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />

    {/* Luneta trasera */}
    <path
      d="M75 88 L85 57 Q90 46 102 45 L198 45 Q210 46 215 57 L225 88 Z"
      fill="#B8CDD9"
      fillOpacity="0.87"
      stroke="#2C3038"
      strokeWidth="1.6"
    />
    <path d="M90 57 L210 57 M82 75 L218 75" stroke="#D9E1E7" strokeWidth="1.1" />

    {/* Tercera luz de freno */}
    <rect x="119" y="41" width="62" height="4" rx="2" fill="#EF4444" />

    {/* Línea del portón */}
    <path d="M57 100 Q150 108 243 100 L235 154 Q150 164 65 154 Z" stroke="#C4C8CE" strokeWidth="1.5" />
    <path d="M67 154 Q150 163 233 154" stroke="#2C3038" strokeWidth="1.4" />

    {/* Pilotos traseros */}
    <path d="M44 108 Q58 99 72 106 L82 118 L77 139 L49 145 L42 132 Z" fill="#EF4444" stroke="#2C3038" strokeWidth="1.7" />
    <path d="M47 115 L70 111 L76 119 L72 126 L46 132 Z" fill="#FCA5A5" stroke="#B91C1C" strokeWidth="1" />
    <path d="M256 108 Q242 99 228 106 L218 118 L223 139 L251 145 L258 132 Z" fill="#EF4444" stroke="#2C3038" strokeWidth="1.7" />
    <path d="M253 115 L230 111 L224 119 L228 126 L254 132 Z" fill="#FCA5A5" stroke="#B91C1C" strokeWidth="1" />

    {/* Patente */}
    <rect x="111" y="137" width="78" height="20" rx="2" fill="#FFFFFF" stroke="#2C3038" strokeWidth="1.5" />
    <text x="150" y="150" textAnchor="middle" fontSize="9" fontWeight="600" fill="#2C3038">ABC 1234</text>

    {/* Parachoques */}
    <path d="M47 164 Q150 179 253 164 L247 184 Q150 198 53 184 Z" fill="#E6E8EB" stroke="#2C3038" strokeWidth="1.5" />
    <path d="M64 178 Q150 189 236 178" stroke="#C4C8CE" strokeWidth="1.3" />

    {/* Ruedas */}
    <path d="M34 154 L49 154 L53 190 L35 190 Z" fill="#454A53" stroke="#2C3038" strokeWidth="1.5" />
    <path d="M266 154 L251 154 L247 190 L265 190 Z" fill="#454A53" stroke="#2C3038" strokeWidth="1.5" />

    <circle cx="62" cy="175" r="22" fill="#454A53" stroke="#2C3038" strokeWidth="2" />
    <circle cx="62" cy="175" r="16" fill="#E6E8EB" stroke="#A8ADB5" strokeWidth="1.5" />
    <path d="M62 162 L62 188 M49 175 L75 175 M53 166 L71 184 M71 166 L53 184" stroke="#454A53" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="62" cy="175" r="5" fill="#454A53" />

    <circle cx="238" cy="175" r="22" fill="#454A53" stroke="#2C3038" strokeWidth="2" />
    <circle cx="238" cy="175" r="16" fill="#E6E8EB" stroke="#A8ADB5" strokeWidth="1.5" />
    <path d="M238 162 L238 188 M225 175 L251 175 M229 166 L247 184 M247 166 L229 184" stroke="#454A53" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="238" cy="175" r="5" fill="#454A53" />

    <path d="M48 190 Q150 198 252 190" stroke="#2C3038" strokeWidth="1.7" />
  </svg>
)

const SVG_SUPERIOR = (
  <svg
    viewBox="0 0 220 380"
    className="w-full h-full"
    preserveAspectRatio="xMidYMid meet"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <ellipse cx="110" cy="191" rx="91" ry="165" fill="#2C3038" fillOpacity="0.08" />

    {/* Carrocería cenital */}
    <path
      d="M74 22 Q110 10 146 22 L166 43 Q180 59 181 81 L185 112 L185 267 Q184 300 170 322 L147 351 Q110 365 73 351 L50 322 Q36 300 35 267 L35 112 L39 81 Q40 59 54 43 Z"
      fill="#F0F1F4"
      stroke="#2C3038"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />

    {/* Parabrisas */}
    <path
      d="M53 73 Q110 54 167 73 L175 109 Q110 119 45 109 Z"
      fill="#B8CDD9"
      fillOpacity="0.87"
      stroke="#2C3038"
      strokeWidth="1.5"
    />

    {/* Capó */}
    <path d="M45 110 Q110 120 175 110 L178 126 Q110 137 42 126 Z" fill="#F0F1F4" stroke="#C4C8CE" strokeWidth="1.2" />
    <path d="M52 118 L168 118" stroke="#D0D4DA" strokeWidth="1.2" />

    {/* Espejos laterales */}
    <path d="M36 112 L20 105 Q13 103 12 111 L16 128 L35 132 Z" fill="#E6E8EB" stroke="#2C3038" strokeWidth="1.7" />
    <path d="M184 112 L200 105 Q207 103 208 111 L204 128 L185 132 Z" fill="#E6E8EB" stroke="#2C3038" strokeWidth="1.7" />

    {/* Ruedas delanteras */}
    <path d="M29 113 L43 113 L44 151 L31 151 Z" fill="#454A53" stroke="#2C3038" strokeWidth="1.5" />
    <path d="M191 113 L177 113 L176 151 L189 151 Z" fill="#454A53" stroke="#2C3038" strokeWidth="1.5" />

    {/* Techo y cristales laterales */}
    <path
      d="M48 137 Q110 145 172 137 L172 246 Q110 254 48 246 Z"
      fill="#E6E8EB"
      stroke="#2C3038"
      strokeWidth="1.5"
    />
    <path
      d="M49 140 Q60 145 71 145 L71 239 Q60 240 49 243 Z"
      fill="#B8CDD9"
      fillOpacity="0.87"
      stroke="#2C3038"
      strokeWidth="1.2"
    />
    <path
      d="M149 145 Q160 145 171 140 L171 243 Q160 240 149 239 Z"
      fill="#B8CDD9"
      fillOpacity="0.87"
      stroke="#2C3038"
      strokeWidth="1.2"
    />

    {/* Techo */}
    <path d="M74 145 Q110 151 146 145 L146 239 Q110 245 74 239 Z" fill="#F0F1F4" stroke="#C4C8CE" strokeWidth="1.2" />
    <path d="M74 192 L146 192" stroke="#C4C8CE" strokeWidth="1.2" />

    {/* Portón y luneta */}
    <path d="M45 251 Q110 260 175 251 L170 296 Q110 313 50 296 Z" fill="#F0F1F4" stroke="#C4C8CE" strokeWidth="1.3" />
    <path
      d="M51 268 Q110 279 169 268 L164 292 Q110 306 56 292 Z"
      fill="#B8CDD9"
      fillOpacity="0.87"
      stroke="#2C3038"
      strokeWidth="1.5"
    />

    {/* Ruedas traseras */}
    <path d="M29 231 L43 231 L44 269 L31 269 Z" fill="#454A53" stroke="#2C3038" strokeWidth="1.5" />
    <path d="M191 231 L177 231 L176 269 L189 269 Z" fill="#454A53" stroke="#2C3038" strokeWidth="1.5" />

    {/* Rines delanteros */}
    <circle cx="28" cy="132" r="11" fill="#454A53" stroke="#2C3038" strokeWidth="1.5" />
    <circle cx="28" cy="132" r="7" fill="#E6E8EB" stroke="#A8ADB5" strokeWidth="1" />
    <path d="M28 126 L28 138 M22 132 L34 132 M24 128 L32 136 M32 128 L24 136" stroke="#454A53" strokeWidth="1.5" />
    <circle cx="28" cy="132" r="2" fill="#454A53" />

    <circle cx="192" cy="132" r="11" fill="#454A53" stroke="#2C3038" strokeWidth="1.5" />
    <circle cx="192" cy="132" r="7" fill="#E6E8EB" stroke="#A8ADB5" strokeWidth="1" />
    <path d="M192 126 L192 138 M186 132 L198 132 M188 128 L196 136 M196 128 L188 136" stroke="#454A53" strokeWidth="1.5" />
    <circle cx="192" cy="132" r="2" fill="#454A53" />

    {/* Rines traseros */}
    <circle cx="28" cy="250" r="11" fill="#454A53" stroke="#2C3038" strokeWidth="1.5" />
    <circle cx="28" cy="250" r="7" fill="#E6E8EB" stroke="#A8ADB5" strokeWidth="1" />
    <path d="M28 244 L28 256 M22 250 L34 250 M24 246 L32 254 M32 246 L24 254" stroke="#454A53" strokeWidth="1.5" />
    <circle cx="28" cy="250" r="2" fill="#454A53" />

    <circle cx="192" cy="250" r="11" fill="#454A53" stroke="#2C3038" strokeWidth="1.5" />
    <circle cx="192" cy="250" r="7" fill="#E6E8EB" stroke="#A8ADB5" strokeWidth="1" />
    <path d="M192 244 L192 256 M186 250 L198 250 M188 246 L196 254 M196 246 L188 254" stroke="#454A53" strokeWidth="1.5" />
    <circle cx="192" cy="250" r="2" fill="#454A53" />

    {/* Luces delanteras y traseras */}
    <path d="M52 28 L72 20 L77 25 L59 35 Z" fill="#FFF9E8" stroke="#2C3038" strokeWidth="1.2" />
    <path d="M168 28 L148 20 L143 25 L161 35 Z" fill="#FFF9E8" stroke="#2C3038" strokeWidth="1.2" />
    <path d="M54 339 L74 350 L80 345 L61 334 Z" fill="#EF4444" stroke="#2C3038" strokeWidth="1.2" />
    <path d="M166 339 L146 350 L140 345 L159 334 Z" fill="#EF4444" stroke="#2C3038" strokeWidth="1.2" />
  </svg>
)

const SVG_MAP = {
  lateral:  SVG_LATERAL,
  frontal:  SVG_FRONTAL,
  trasera:  SVG_TRASERA,
  superior: SVG_SUPERIOR
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function Inspeccion() {
  const { reservaId } = useParams()
  const navigate = useNavigate()
  useDocumentTitle('Inspección previa')

  const svgRef = useRef(null)
  const usuario = getUsuario()

  const [loading, setLoading]         = useState(true)
  const [guardando, setGuardando]     = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [error, setError]             = useState('')
  const [exito, setExito]             = useState('')

  const [reserva, setReserva]           = useState(null)
  const [inspeccion, setInspeccion]     = useState(null)
  const [trabajadores, setTrabajadores] = useState([])

  // Estado del formulario
  const [vistaActiva, setVistaActiva]         = useState('lateral')
  const [tipoActivo, setTipoActivo]           = useState('rayon')
  const [danos, setDanos]                     = useState([])
  const [observaciones, setObservaciones]     = useState('')
  const [trabajadorId, setTrabajadorId]       = useState('')
  const [editandoIdx, setEditandoIdx]         = useState(null)
  const [danoForm, setDanoForm]             = useState({ ubicacion: '', descripcion: '' })
  const [clienteConfirmo, setClienteConfirmo] = useState(false)

  // Carga inicial
  useEffect(() => {
    const cargar = async () => {
      try {
        const [{ reserva: r, inspeccion: ins }, trabs] = await Promise.all([
          getInspeccion(reservaId),
          listarTrabajadores().catch(() => [])
        ])
        setReserva(r)
        setTrabajadores(trabs.filter(t => t.activo))
        if (ins) {
          setInspeccion(ins)
          setDanos(ins.danos || [])
          setObservaciones(ins.observaciones || '')
          setTrabajadorId(ins.trabajadorId ? String(ins.trabajadorId) : '')
          setClienteConfirmo(ins.clienteConfirmo || false)
        }
      } catch (e) {
        setError(e?.message || 'No se pudo cargar la información de la reserva.')
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [reservaId])

  // Agregar daño al hacer clic en el SVG
  const handleSvgClick = useCallback((e) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const posX = ((e.clientX - rect.left) / rect.width) * 100
    const posY = ((e.clientY - rect.top) / rect.height) * 100
    const nuevo = {
      tipo: tipoActivo,
      vista: vistaActiva,
      posX: Math.round(posX * 10) / 10,
      posY: Math.round(posY * 10) / 10,
      ubicacion: '',
      descripcion: '',
      _tempId: Date.now()
    }
    setDanos(prev => [...prev, nuevo])
    // Abrir el form de descripción para el nuevo daño
    setEditandoIdx(danos.length)
    setDanoForm({ ubicacion: '', descripcion: '' })
  }, [tipoActivo, vistaActiva, danos.length])

  const eliminarDano = (idx) => {
    setDanos(prev => prev.filter((_, i) => i !== idx))
    if (editandoIdx === idx) setEditandoIdx(null)
  }

  const guardarDescripcionDano = () => {
    if (editandoIdx === null) return
    setDanos(prev => prev.map((d, i) =>
      i === editandoIdx ? { ...d, ubicacion: danoForm.ubicacion, descripcion: danoForm.descripcion } : d
    ))
    setEditandoIdx(null)
  }

  const abrirEdicion = (idx) => {
    setEditandoIdx(idx)
    setDanoForm({ ubicacion: danos[idx].ubicacion || '', descripcion: danos[idx].descripcion || '' })
  }

  const danosDeLaVista = danos
    .map((d, i) => ({ ...d, idx: i }))
    .filter(d => d.vista === vistaActiva)

  // Guardar inspección
  const handleGuardar = async () => {
    setGuardando(true)
    setError('')
    try {
      const resultado = await guardarInspeccion(reservaId, {
        observaciones,
        trabajadorId: trabajadorId ? parseInt(trabajadorId) : null,
        danos
      })
      setInspeccion(resultado)
      setExito('Inspección guardada correctamente.')
      setTimeout(() => setExito(''), 3000)
    } catch {
      setError('Error al guardar la inspección.')
    } finally {
      setGuardando(false)
    }
  }

  // Confirmar que el cliente revisó
  const handleConfirmar = async () => {
    if (!inspeccion) return
    setConfirmando(true)
    setError('')
    try {
      const resultado = await confirmarInspeccion(reservaId)
      setInspeccion(resultado)
      setClienteConfirmo(true)
      setExito('Confirmación del cliente registrada.')
      setTimeout(() => setExito(''), 3000)
    } catch {
      setError('Error al registrar confirmación.')
    } finally {
      setConfirmando(false)
    }
  }

  const handleImprimir = () => window.print()

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-ink-muted" />
      </div>
    </AdminLayout>
  )

  if (!reserva) return (
    <AdminLayout>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Alert variant="error">{error || 'No se encontró la reserva.'}</Alert>
      </div>
    </AdminLayout>
  )

  const nombreVehiculo = [reserva.vehiculo?.marca, reserva.vehiculo?.modelo, reserva.vehiculo?.anio]
    .filter(Boolean).join(' ') || 'Vehículo sin datos'

  const yaInspeccionado = !!inspeccion

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-6 print:px-0 print:py-0 print:space-y-4">

        {/* Cabecera */}
        <div className="print:hidden flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/agenda')}
            className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Agenda
          </button>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-ink flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-accent-600" aria-hidden="true" />
              Inspección previa del vehículo
            </h1>
            <p className="text-sm text-ink-muted mt-0.5">Registra el estado visible del vehículo antes del servicio.</p>
          </div>
          <div className="print:hidden flex gap-2">
            {yaInspeccionado && (
              <Button variant="outline" size="sm" onClick={handleImprimir}>
                <Printer className="h-4 w-4 mr-1.5" />
                Imprimir
              </Button>
            )}
          </div>
        </div>

        {error && <Alert variant="error" onDismiss={() => setError('')}>{error}</Alert>}
        {exito && <Alert variant="success">{exito}</Alert>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Columna izquierda: datos de la reserva ── */}
          <div className="space-y-4">
            <div className="rounded-xl border border-line bg-surface p-4 space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted flex items-center gap-1.5">
                <Car className="h-3.5 w-3.5" />
                Datos de la reserva
                <span className="ml-auto text-accent-600 font-bold">#{reserva.id}</span>
              </h2>
              <dl className="space-y-2 text-sm">
                <div><dt className="text-ink-muted">Cliente</dt><dd className="font-medium text-ink">{reserva.nombre}</dd></div>
                <div><dt className="text-ink-muted">Teléfono</dt><dd className="text-ink">{reserva.telefono}</dd></div>
                <div><dt className="text-ink-muted">Patente</dt><dd className="font-mono font-bold text-ink">{reserva.patente}</dd></div>
                <div><dt className="text-ink-muted">Vehículo</dt><dd className="text-ink">{nombreVehiculo}</dd></div>
                <div><dt className="text-ink-muted">Servicio</dt><dd className="text-ink">{reserva.servicio?.nombre}</dd></div>
                <div><dt className="text-ink-muted">Fecha</dt><dd className="text-ink">{formatFullDate(new Date(reserva.fecha))}</dd></div>
                <div><dt className="text-ink-muted">Hora</dt><dd className="text-ink">{formatTimeFromISO(reserva.fecha)}</dd></div>
              </dl>
            </div>

            {/* Selector de responsable */}
            <div className="rounded-xl border border-line bg-surface p-4 space-y-2 print:hidden">
              <label className="text-xs font-semibold uppercase tracking-wide text-ink-muted flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                Responsable de la inspección
              </label>
              {trabajadores.length === 0 ? (
                <p className="text-xs text-ink-muted italic">
                  No hay trabajadores registrados.{' '}
                  <a href="/admin/trabajadores" className="text-accent-600 hover:underline">Agregar uno</a>.
                </p>
              ) : (
                <select
                  value={trabajadorId}
                  onChange={e => setTrabajadorId(e.target.value)}
                  className="w-full rounded-lg border border-line bg-background px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent-500"
                >
                  <option value="">Sin asignar</option>
                  {trabajadores.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}{t.cargo ? ` — ${t.cargo}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Estado de inspección */}
            {yaInspeccionado && (
              <div className="rounded-xl border border-line bg-surface p-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Estado</h3>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  <span className="text-ink">Inspección registrada</span>
                </div>
                {inspeccion?.trabajador && (
                  <p className="text-xs text-ink-muted">
                    Por: {inspeccion.trabajador.nombre}
                    {inspeccion.trabajador.cargo ? ` (${inspeccion.trabajador.cargo})` : ''}
                  </p>
                )}
                {inspeccion?.clienteConfirmo ? (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    Copia entregada al cliente
                  </div>
                ) : (
                  <div className="space-y-2 print:hidden">
                    <label className="flex items-start gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={clienteConfirmo}
                        onChange={e => {
                          setClienteConfirmo(e.target.checked)
                          if (e.target.checked) handleConfirmar()
                        }}
                        className="mt-0.5 h-4 w-4 rounded border-line accent-accent-600"
                      />
                      <span className="text-ink-muted">Se entregó resumen impreso al cliente</span>
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Columna central + derecha: diagrama + daños ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Selector de vistas */}
            <div className="print:hidden flex flex-wrap gap-2">
              {VISTAS.map(v => (
                <button
                  key={v.value}
                  onClick={() => setVistaActiva(v.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                    vistaActiva === v.value
                      ? 'bg-accent-600 text-white border-accent-600'
                      : 'bg-surface text-ink-muted border-line hover:border-accent-400'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>

            {/* Tipos de daño */}
            <div className="print:hidden flex flex-wrap gap-2 items-center">
              <span className="text-xs text-ink-muted">Tipo de marca:</span>
              {TIPOS_DANO.map(t => (
                <button
                  key={t.value}
                  onClick={() => setTipoActivo(t.value)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                    tipoActivo === t.value
                      ? 'shadow-sm scale-105 border-transparent text-white'
                      : 'bg-surface border-line text-ink-muted hover:border-gray-300'
                  }`}
                  style={tipoActivo === t.value ? { backgroundColor: t.color } : {}}
                >
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Diagrama SVG */}
            <div className="rounded-xl border border-line bg-surface overflow-hidden">
              <div className="px-4 py-2 border-b border-line bg-surface-raised print:hidden">
                <p className="text-xs text-ink-muted">Haz clic sobre el diagrama para marcar un daño visible</p>
              </div>
              {/* Vista de impresión: mostrar las 4 vistas */}
              <div className="hidden print:grid print:grid-cols-2 print:gap-4 print:p-4">
                {VISTAS.map(v => {
                  const danosDeLaVistaImp = danos.filter(d => d.vista === v.value)
                  return (
                    <div key={v.value} className="space-y-1">
                      <p className="text-xs font-semibold text-ink-muted uppercase">{v.label}</p>
                      <div className="relative border border-line rounded-lg overflow-hidden" style={{ aspectRatio: v.value === 'superior' ? '220/380' : '400/200' }}>
                        {SVG_MAP[v.value]}
                        {danosDeLaVistaImp.map((d, i) => {
                          const tipo = TIPOS_DANO.find(t => t.value === d.tipo)
                          return (
                            <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center" style={{ left: `${d.posX}%`, top: `${d.posY}%` }}>
                              <div className="h-5 w-5 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-sm" style={{ backgroundColor: tipo?.color || '#6B7280', fontSize: '9px' }}>
                                {d.idx !== undefined ? d.idx + 1 : i + 1}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
              {/* Vista normal: una vista activa */}
              <div
                className="print:hidden relative cursor-crosshair select-none"
                style={{ aspectRatio: vistaActiva === 'superior' ? '220/380' : '400/200' }}
                ref={svgRef}
                onClick={handleSvgClick}
              >
                {SVG_MAP[vistaActiva]}
                {/* Marcadores de daño */}
                {danosDeLaVista.map((d, i) => {
                  const tipo = TIPOS_DANO.find(t => t.value === d.tipo)
                  const numeral = danos.filter(x => x.vista === vistaActiva).indexOf(d) + 1
                  return (
                    <div
                      key={d._tempId || d.id || i}
                      className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                      style={{ left: `${d.posX}%`, top: `${d.posY}%` }}
                      onClick={e => { e.stopPropagation(); abrirEdicion(d.idx) }}
                      title={tipo?.label}
                    >
                      <div
                        className="h-6 w-6 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-md"
                        style={{ backgroundColor: tipo?.color || '#6B7280' }}
                      >
                        {numeral}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Modal edición de daño */}
            {editandoIdx !== null && (
              <div className="rounded-xl border border-accent-200 bg-accent-50 p-4 space-y-3 print:hidden">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">
                    Daño #{editandoIdx + 1} — {TIPOS_DANO.find(t => t.value === danos[editandoIdx]?.tipo)?.label}
                  </p>
                  <button onClick={() => setEditandoIdx(null)} className="text-ink-muted hover:text-ink">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-ink-muted mb-1">Zona del vehículo</label>
                    <Input
                      value={danoForm.ubicacion}
                      onChange={e => setDanoForm(f => ({ ...f, ubicacion: e.target.value }))}
                      placeholder="Ej: Puerta trasera derecha"
                      maxLength={80}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-muted mb-1">Descripción (opcional)</label>
                    <Input
                      value={danoForm.descripcion}
                      onChange={e => setDanoForm(f => ({ ...f, descripcion: e.target.value }))}
                      placeholder="Ej: Raya superficial"
                      maxLength={120}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={guardarDescripcionDano}>
                    <Save className="h-3.5 w-3.5 mr-1" />
                    Guardar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { eliminarDano(editandoIdx); setEditandoIdx(null) }} className="text-red-600 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Eliminar este daño
                  </Button>
                </div>
              </div>
            )}

            {/* Tabla de todos los daños */}
            {danos.length > 0 && (
              <div className="rounded-xl border border-line bg-surface overflow-hidden">
                <div className="px-4 py-2.5 border-b border-line">
                  <h3 className="text-sm font-semibold text-ink">Daños registrados ({danos.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-line bg-surface-raised">
                        <th className="px-4 py-2 text-left text-xs text-ink-muted font-medium">#</th>
                        <th className="px-4 py-2 text-left text-xs text-ink-muted font-medium">Tipo</th>
                        <th className="px-4 py-2 text-left text-xs text-ink-muted font-medium">Vista</th>
                        <th className="px-4 py-2 text-left text-xs text-ink-muted font-medium">Zona</th>
                        <th className="px-4 py-2 text-left text-xs text-ink-muted font-medium">Descripción</th>
                        <th className="px-4 py-2 print:hidden" />
                      </tr>
                    </thead>
                    <tbody>
                      {danos.map((d, i) => {
                        const tipo = TIPOS_DANO.find(t => t.value === d.tipo)
                        return (
                          <tr key={d._tempId || d.id || i} className="border-b border-line last:border-0 hover:bg-surface-raised">
                            <td className="px-4 py-2.5">
                              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full text-white text-xs font-bold" style={{ backgroundColor: tipo?.color }}>
                                {i + 1}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-ink">{tipo?.label}</td>
                            <td className="px-4 py-2.5 text-ink-muted capitalize">{d.vista}</td>
                            <td className="px-4 py-2.5 text-ink">{d.ubicacion || <span className="text-ink-soft italic">—</span>}</td>
                            <td className="px-4 py-2.5 text-ink-muted">{d.descripcion || <span className="italic">—</span>}</td>
                            <td className="px-4 py-2.5 print:hidden">
                              <div className="flex gap-1.5">
                                <button onClick={() => abrirEdicion(i)} className="p-1 rounded hover:bg-surface-raised text-ink-muted hover:text-ink">
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => eliminarDano(i)} className="p-1 rounded hover:bg-red-50 text-ink-muted hover:text-red-600">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Observaciones generales */}
            <div className="rounded-xl border border-line bg-surface p-4 space-y-2">
              <label className="block text-sm font-semibold text-ink">Observaciones generales</label>
              <textarea
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                placeholder="Ej: Pequeñas marcas de uso en pintura. Sin daños relevantes."
                maxLength={500}
                rows={3}
                className="w-full rounded-lg border border-line bg-background px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none print:border-0 print:p-0 print:focus:ring-0"
              />
              <p className="text-xs text-ink-muted text-right print:hidden">{observaciones.length}/500</p>
            </div>

            {/* Botones de acción */}
            <div className="print:hidden flex flex-col sm:flex-row gap-3 justify-end">
              <Button variant="outline" onClick={() => navigate('/admin/agenda')}>
                Cancelar
              </Button>
              <Button onClick={handleGuardar} disabled={guardando} className="bg-accent-600 hover:bg-accent-700 text-white">
                {guardando
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando...</>
                  : <><Save className="h-4 w-4 mr-2" />{yaInspeccionado ? 'Actualizar inspección' : 'Guardar inspección'}</>
                }
              </Button>
            </div>
          </div>
        </div>

        {/* Sección de impresión — firma */}
        <div className="hidden print:block mt-8 pt-6 border-t border-line">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-1">
              <p className="text-xs text-ink-muted">Responsable de la inspección</p>
              <div className="h-12 border-b border-ink-muted" />
              <p className="text-xs text-ink-muted">
                {inspeccion?.trabajador?.nombre || ''}
                {inspeccion?.trabajador?.cargo ? ` · ${inspeccion.trabajador.cargo}` : ''}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-ink-muted">Firma del cliente — He revisado el estado del vehículo</p>
              <div className="h-12 border-b border-ink-muted" />
              <p className="text-xs text-ink-muted">{reserva?.nombre}</p>
            </div>
          </div>
          <p className="text-xs text-ink-muted mt-4 text-center">
            AgendaCar · Inspección previa registrada el {new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

      </div>

      {/* Estilos de impresión */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .mx-auto, .mx-auto * { visibility: visible; }
          .mx-auto { position: absolute; left: 0; top: 0; width: 100%; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </AdminLayout>
  )
}
