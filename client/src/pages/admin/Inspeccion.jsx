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
  <svg viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Sombra suelo */}
    <ellipse cx="200" cy="175" rx="162" ry="5" fill="#C8CAD0" opacity="0.35"/>

    {/* ── Carrocería principal ── */}
    {/* Silueta exterior con pasos de rueda */}
    <path d="
      M 36,148
      L 36,133 Q 38,112 52,105
      L 70,96 Q 90,87 112,82
      L 130,73
      L 148,46 Q 150,43 154,43
      L 256,43 Q 260,43 262,46
      L 267,68 L 287,74
      Q 314,80 338,95
      L 350,106 Q 358,118 358,132
      L 358,148
      L 314,152
      C 314,112 264,112 264,152
      L 132,152
      C 132,112 84,112 84,152
      L 36,148 Z
    " stroke="#2C3038" strokeWidth="2" fill="#F0F1F4"/>

    {/* Panel de techo */}
    <path d="M 154,43 L 256,43 L 262,46 L 267,68 L 130,68 L 130,73 L 148,46 Q 150,43 154,43 Z"
      stroke="#2C3038" strokeWidth="1.2" fill="#E6E8EB"/>

    {/* Panel capó */}
    <path d="M 267,68 L 287,74 Q 316,80 340,96 L 350,106 L 346,100 Q 322,86 292,78 L 270,72 Z"
      stroke="#2C3038" strokeWidth="1" fill="#ECEEF1"/>

    {/* Parachoques delantero inferior */}
    <path d="M 350,106 Q 358,118 358,132 L 358,148 L 354,148 L 354,130 Q 353,120 347,110 Z"
      fill="#DFE1E5" stroke="#2C3038" strokeWidth="1"/>

    {/* Moldura lateral sill */}
    <path d="M 84,152 L 264,152 L 264,156 L 84,156 Z"
      fill="#D8DADD" stroke="#2C3038" strokeWidth="0.8"/>

    {/* ── Cristales ── */}
    {/* Parabrisas delantero (franja A-pillar) */}
    <path d="M 256,44 L 262,46 L 267,68 L 256,68 Q 254,58 254,44 Z"
      fill="#B8CDD9" fillOpacity="0.88" stroke="#2C3038" strokeWidth="1.2"/>

    {/* Ventana puerta delantera */}
    <path d="M 206,44 L 256,44 L 256,68 L 208,68 Z"
      fill="#B8CDD9" fillOpacity="0.88" stroke="#2C3038" strokeWidth="1.2"/>

    {/* Ventana puerta trasera */}
    <path d="M 156,44 L 206,44 L 208,68 L 158,68 Z"
      fill="#B8CDD9" fillOpacity="0.88" stroke="#2C3038" strokeWidth="1.2"/>

    {/* Luneta trasera (hatchback slope) */}
    <path d="M 148,46 L 154,44 L 158,68 L 148,68 L 134,70 Z"
      fill="#B8CDD9" fillOpacity="0.85" stroke="#2C3038" strokeWidth="1.2"/>

    {/* ── Pilares y líneas de puertas ── */}
    {/* Pilar B */}
    <line x1="206" y1="44" x2="208" y2="68" stroke="#2C3038" strokeWidth="2"/>
    <line x1="208" y1="68" x2="210" y2="152" stroke="#2C3038" strokeWidth="1.5"/>

    {/* ── Manillas ── */}
    <rect x="224" y="106" width="20" height="5" rx="2.5" fill="#C4C6CA" stroke="#2C3038" strokeWidth="1"/>
    <rect x="167" y="106" width="18" height="5" rx="2.5" fill="#C4C6CA" stroke="#2C3038" strokeWidth="1"/>

    {/* ── Retrovisor lateral ── */}
    <path d="M 264,70 L 272,68 L 274,75 L 267,77 Z"
      fill="#D4D6DA" stroke="#2C3038" strokeWidth="1"/>

    {/* ── Faro delantero ── */}
    <path d="M 342,96 Q 350,102 354,112 L 356,126 Q 352,128 346,128 L 342,118 Q 340,108 342,96 Z"
      fill="#FFF8C8" stroke="#2C3038" strokeWidth="1.2"/>
    <ellipse cx="350" cy="111" rx="5" ry="4" fill="#FFE840" stroke="#2C3038" strokeWidth="0.8"/>
    <line x1="342" y1="96" x2="342" y2="128" stroke="#2C3038" strokeWidth="0.8"/>
    {/* DRL strip */}
    <path d="M 342,94 Q 352,100 355,112" stroke="#FFE060" strokeWidth="2" fill="none" strokeLinecap="round"/>

    {/* ── Piloto trasero ── */}
    <path d="M 40,112 Q 44,106 54,103 L 56,116 Q 50,120 42,122 L 40,118 Z"
      fill="#FFBCBC" stroke="#2C3038" strokeWidth="1.2"/>
    <line x1="52" y1="103" x2="52" y2="122" stroke="#2C3038" strokeWidth="0.8"/>

    {/* ── Zona parrilla delantera ── */}
    <path d="M 354,128 Q 356,136 354,144 L 350,150 L 342,152 L 338,148 L 344,146 L 348,138 L 352,128 Z"
      fill="#3A4048" stroke="#2C3038" strokeWidth="1"/>
    <line x1="342" y1="138" x2="354" y2="134" stroke="#555" strokeWidth="0.8"/>
    <line x1="340" y1="144" x2="354" y2="140" stroke="#555" strokeWidth="0.8"/>

    {/* ── Rueda delantera ── */}
    <circle cx="288" cy="148" r="24" fill="#4A5059" stroke="#2C3038" strokeWidth="2"/>
    <circle cx="288" cy="148" r="16" fill="#E6E8EB" stroke="#2C3038" strokeWidth="1.5"/>
    <circle cx="288" cy="148" r="5" fill="#2C3038"/>
    <line x1="288" y1="132" x2="288" y2="138" stroke="#2C3038" strokeWidth="1.5"/>
    <line x1="288" y1="158" x2="288" y2="164" stroke="#2C3038" strokeWidth="1.5"/>
    <line x1="272" y1="148" x2="278" y2="148" stroke="#2C3038" strokeWidth="1.5"/>
    <line x1="298" y1="148" x2="304" y2="148" stroke="#2C3038" strokeWidth="1.5"/>
    <line x1="276" y1="136" x2="280" y2="141" stroke="#2C3038" strokeWidth="1.5"/>
    <line x1="296" y1="155" x2="300" y2="160" stroke="#2C3038" strokeWidth="1.5"/>
    <line x1="300" y1="136" x2="296" y2="141" stroke="#2C3038" strokeWidth="1.5"/>
    <line x1="280" y1="155" x2="276" y2="160" stroke="#2C3038" strokeWidth="1.5"/>

    {/* ── Rueda trasera ── */}
    <circle cx="110" cy="148" r="24" fill="#4A5059" stroke="#2C3038" strokeWidth="2"/>
    <circle cx="110" cy="148" r="16" fill="#E6E8EB" stroke="#2C3038" strokeWidth="1.5"/>
    <circle cx="110" cy="148" r="5" fill="#2C3038"/>
    <line x1="110" y1="132" x2="110" y2="138" stroke="#2C3038" strokeWidth="1.5"/>
    <line x1="110" y1="158" x2="110" y2="164" stroke="#2C3038" strokeWidth="1.5"/>
    <line x1="94" y1="148" x2="100" y2="148" stroke="#2C3038" strokeWidth="1.5"/>
    <line x1="120" y1="148" x2="126" y2="148" stroke="#2C3038" strokeWidth="1.5"/>
    <line x1="98" y1="136" x2="102" y2="141" stroke="#2C3038" strokeWidth="1.5"/>
    <line x1="118" y1="155" x2="122" y2="160" stroke="#2C3038" strokeWidth="1.5"/>
    <line x1="122" y1="136" x2="118" y2="141" stroke="#2C3038" strokeWidth="1.5"/>
    <line x1="102" y1="155" x2="98" y2="160" stroke="#2C3038" strokeWidth="1.5"/>

    {/* Línea de suelo */}
    <line x1="28" y1="172" x2="372" y2="172" stroke="#D0D3D8" strokeWidth="1.5"/>
  </svg>
)

const SVG_FRONTAL = (
  <svg viewBox="0 0 300 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Sombra suelo */}
    <ellipse cx="150" cy="197" rx="115" ry="5" fill="#C8CAD0" opacity="0.35"/>

    {/* ── Carrocería exterior ── */}
    <path d="
      M 96,28 Q 150,26 204,28
      L 218,46 L 234,64
      L 248,84 L 254,102
      L 258,122 L 256,152
      Q 254,164 248,170
      L 218,178 Q 184,182 150,182
      Q 116,182 82,178
      L 52,170 Q 46,164 44,152
      L 42,122 L 46,102
      L 52,84 L 66,64
      L 82,46 L 96,28 Z
    " stroke="#2C3038" strokeWidth="2" fill="#F0F1F4"/>

    {/* Panel techo visible */}
    <path d="M 96,28 L 204,28 L 216,44 L 84,44 Z"
      fill="#E6E8EB" stroke="#2C3038" strokeWidth="1.2"/>

    {/* Parabrisas */}
    <path d="M 84,44 L 216,44 L 240,72 L 60,72 Z"
      fill="#B8CDD9" fillOpacity="0.88" stroke="#2C3038" strokeWidth="1.5"/>

    {/* Panel capó superior */}
    <path d="M 60,72 L 240,72 L 248,86 L 52,86 Z"
      fill="#ECEEF1" stroke="#2C3038" strokeWidth="1"/>

    {/* Cresta capó central */}
    <line x1="150" y1="72" x2="150" y2="88" stroke="#C0C2C6" strokeWidth="1"/>

    {/* ── Pilares A ── */}
    <line x1="84" y1="44" x2="60" y2="72" stroke="#2C3038" strokeWidth="2"/>
    <line x1="216" y1="44" x2="240" y2="72" stroke="#2C3038" strokeWidth="2"/>

    {/* ── Faros delanteros ── */}
    {/* Izquierdo */}
    <path d="M 50,88 Q 44,96 42,110 L 44,124 Q 48,130 58,130 L 82,128 Q 90,124 90,116 L 90,96 Q 88,88 80,86 Z"
      fill="#FFF8C8" stroke="#2C3038" strokeWidth="1.5"/>
    <ellipse cx="66" cy="109" rx="11" ry="9" fill="#FFE840" stroke="#2C3038" strokeWidth="1"/>
    <line x1="42" y1="109" x2="90" y2="109" stroke="#2C3038" strokeWidth="0.8"/>
    {/* DRL izquierdo */}
    <path d="M 48,124 Q 66,128 84,124" stroke="#FFE060" strokeWidth="1.5" fill="none" strokeLinecap="round"/>

    {/* Derecho */}
    <path d="M 250,88 Q 256,96 258,110 L 256,124 Q 252,130 242,130 L 218,128 Q 210,124 210,116 L 210,96 Q 212,88 220,86 Z"
      fill="#FFF8C8" stroke="#2C3038" strokeWidth="1.5"/>
    <ellipse cx="234" cy="109" rx="11" ry="9" fill="#FFE840" stroke="#2C3038" strokeWidth="1"/>
    <line x1="210" y1="109" x2="258" y2="109" stroke="#2C3038" strokeWidth="0.8"/>
    <path d="M 216,124 Q 234,128 252,124" stroke="#FFE060" strokeWidth="1.5" fill="none" strokeLinecap="round"/>

    {/* ── Parrilla central ── */}
    <path d="M 96,130 Q 96,126 102,124 L 198,124 Q 204,126 204,130 L 204,158 Q 204,164 198,166 L 102,166 Q 96,164 96,158 Z"
      fill="#3A4048" stroke="#2C3038" strokeWidth="1.5"/>
    <line x1="98" y1="136" x2="202" y2="136" stroke="#555" strokeWidth="0.8"/>
    <line x1="98" y1="146" x2="202" y2="146" stroke="#555" strokeWidth="0.8"/>
    <line x1="98" y1="156" x2="202" y2="156" stroke="#555" strokeWidth="0.8"/>
    <line x1="122" y1="124" x2="122" y2="166" stroke="#555" strokeWidth="0.8"/>
    <line x1="146" y1="124" x2="146" y2="166" stroke="#555" strokeWidth="0.8"/>
    <line x1="154" y1="124" x2="154" y2="166" stroke="#555" strokeWidth="0.8"/>
    <line x1="178" y1="124" x2="178" y2="166" stroke="#555" strokeWidth="0.8"/>

    {/* ── Parachoques delantero ── */}
    <path d="M 44,152 Q 44,162 50,168 L 80,176 Q 114,180 150,180 Q 186,180 220,176 L 250,168 Q 256,162 256,152 L 248,158 Q 202,168 150,168 Q 98,168 52,158 Z"
      fill="#DFE1E5" stroke="#2C3038" strokeWidth="1.2"/>

    {/* Matrícula */}
    <rect x="124" y="164" width="52" height="12" rx="2" fill="white" stroke="#2C3038" strokeWidth="1"/>

    {/* Costados carrocería */}
    <path d="M 44,102 Q 42,118 44,140 L 44,152" stroke="#2C3038" strokeWidth="1.2" fill="none"/>
    <path d="M 256,102 Q 258,118 256,140 L 256,152" stroke="#2C3038" strokeWidth="1.2" fill="none"/>

    {/* Pasos de rueda */}
    <path d="M 38,154 Q 38,138 58,132 Q 80,126 88,144 L 88,178 L 36,178 Z"
      fill="#D8DADD" stroke="#2C3038" strokeWidth="1.2"/>
    <path d="M 262,154 Q 262,138 242,132 Q 220,126 212,144 L 212,178 L 264,178 Z"
      fill="#D8DADD" stroke="#2C3038" strokeWidth="1.2"/>

    {/* ── Ruedas (vista frontal) ── */}
    <ellipse cx="60" cy="172" rx="24" ry="26" fill="#4A5059" stroke="#2C3038" strokeWidth="2"/>
    <ellipse cx="60" cy="172" rx="15" ry="17" fill="#E6E8EB" stroke="#2C3038" strokeWidth="1.5"/>
    <ellipse cx="60" cy="172" rx="5" ry="5" fill="#2C3038"/>
    <line x1="60" y1="155" x2="60" y2="161" stroke="#2C3038" strokeWidth="1.5"/>
    <line x1="60" y1="183" x2="60" y2="189" stroke="#2C3038" strokeWidth="1.5"/>
    <line x1="44" y1="172" x2="50" y2="172" stroke="#2C3038" strokeWidth="1.5"/>
    <line x1="70" y1="172" x2="76" y2="172" stroke="#2C3038" strokeWidth="1.5"/>

    <ellipse cx="240" cy="172" rx="24" ry="26" fill="#4A5059" stroke="#2C3038" strokeWidth="2"/>
    <ellipse cx="240" cy="172" rx="15" ry="17" fill="#E6E8EB" stroke="#2C3038" strokeWidth="1.5"/>
    <ellipse cx="240" cy="172" rx="5" ry="5" fill="#2C3038"/>
    <line x1="240" y1="155" x2="240" y2="161" stroke="#2C3038" strokeWidth="1.5"/>
    <line x1="240" y1="183" x2="240" y2="189" stroke="#2C3038" strokeWidth="1.5"/>
    <line x1="224" y1="172" x2="230" y2="172" stroke="#2C3038" strokeWidth="1.5"/>
    <line x1="250" y1="172" x2="256" y2="172" stroke="#2C3038" strokeWidth="1.5"/>

    {/* Línea de suelo */}
    <line x1="30" y1="195" x2="270" y2="195" stroke="#D0D3D8" strokeWidth="1.5"/>
  </svg>
)

const SVG_TRASERA = (
  <svg viewBox="0 0 300 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Sombra suelo */}
    <ellipse cx="150" cy="197" rx="115" ry="5" fill="#C8CAD0" opacity="0.35"/>

    {/* ── Carrocería exterior ── */}
    <path d="
      M 96,28 Q 150,26 204,28
      L 218,46 L 234,64
      L 248,84 L 254,102
      L 258,122 L 256,152
      Q 254,164 248,170
      L 218,178 Q 184,182 150,182
      Q 116,182 82,178
      L 52,170 Q 46,164 44,152
      L 42,122 L 46,102
      L 52,84 L 66,64
      L 82,46 L 96,28 Z
    " stroke="#2C3038" strokeWidth="2" fill="#F0F1F4"/>

    {/* Panel techo visible */}
    <path d="M 96,28 L 204,28 L 216,44 L 84,44 Z"
      fill="#E6E8EB" stroke="#2C3038" strokeWidth="1.2"/>

    {/* Luneta trasera */}
    <path d="M 84,44 L 216,44 L 240,72 L 60,72 Z"
      fill="#B8CDD9" fillOpacity="0.85" stroke="#2C3038" strokeWidth="1.5"/>

    {/* Panel maletero / portón */}
    <path d="M 60,72 L 240,72 L 248,86 L 52,86 Z"
      fill="#ECEEF1" stroke="#2C3038" strokeWidth="1"/>

    {/* Portón trasero line */}
    <line x1="150" y1="72" x2="150" y2="88" stroke="#C0C2C6" strokeWidth="1"/>

    {/* ── Pilares C ── */}
    <line x1="84" y1="44" x2="60" y2="72" stroke="#2C3038" strokeWidth="2"/>
    <line x1="216" y1="44" x2="240" y2="72" stroke="#2C3038" strokeWidth="2"/>

    {/* ── Pilotos traseros ── */}
    {/* Izquierdo */}
    <path d="M 50,88 Q 44,96 42,110 L 44,128 Q 48,134 58,134 L 82,132 Q 90,128 90,118 L 90,96 Q 88,88 80,86 Z"
      fill="#FFBCBC" stroke="#2C3038" strokeWidth="1.5"/>
    <ellipse cx="66" cy="111" rx="10" ry="9" fill="#FF8888" stroke="#2C3038" strokeWidth="1"/>
    <line x1="42" y1="111" x2="90" y2="111" stroke="#2C3038" strokeWidth="0.8"/>
    {/* Intermitente izquierdo */}
    <path d="M 48,128 Q 66,132 84,128" stroke="#FFA050" strokeWidth="1.5" fill="none" strokeLinecap="round"/>

    {/* Derecho */}
    <path d="M 250,88 Q 256,96 258,110 L 256,128 Q 252,134 242,134 L 218,132 Q 210,128 210,118 L 210,96 Q 212,88 220,86 Z"
      fill="#FFBCBC" stroke="#2C3038" strokeWidth="1.5"/>
    <ellipse cx="234" cy="111" rx="10" ry="9" fill="#FF8888" stroke="#2C3038" strokeWidth="1"/>
    <line x1="210" y1="111" x2="258" y2="111" stroke="#2C3038" strokeWidth="0.8"/>
    <path d="M 216,128 Q 234,132 252,128" stroke="#FFA050" strokeWidth="1.5" fill="none" strokeLinecap="round"/>

    {/* ── Parachoques trasero ── */}
    <path d="M 44,152 Q 44,162 50,168 L 80,176 Q 114,180 150,180 Q 186,180 220,176 L 250,168 Q 256,162 256,152 L 248,158 Q 202,168 150,168 Q 98,168 52,158 Z"
      fill="#DFE1E5" stroke="#2C3038" strokeWidth="1.2"/>

    {/* Matrícula */}
    <rect x="118" y="126" width="64" height="14" rx="2" fill="white" stroke="#2C3038" strokeWidth="1.2"/>
    <text x="150" y="137" textAnchor="middle" fontSize="7" fill="#2C3038" fontFamily="monospace">ABC 1234</text>

    {/* Costados carrocería */}
    <path d="M 44,102 Q 42,118 44,140 L 44,152" stroke="#2C3038" strokeWidth="1.2" fill="none"/>
    <path d="M 256,102 Q 258,118 256,140 L 256,152" stroke="#2C3038" strokeWidth="1.2" fill="none"/>

    {/* Pasos de rueda */}
    <path d="M 38,154 Q 38,138 58,132 Q 80,126 88,144 L 88,178 L 36,178 Z"
      fill="#D8DADD" stroke="#2C3038" strokeWidth="1.2"/>
    <path d="M 262,154 Q 262,138 242,132 Q 220,126 212,144 L 212,178 L 264,178 Z"
      fill="#D8DADD" stroke="#2C3038" strokeWidth="1.2"/>

    {/* ── Ruedas (vista trasera) ── */}
    <ellipse cx="60" cy="172" rx="24" ry="26" fill="#4A5059" stroke="#2C3038" strokeWidth="2"/>
    <ellipse cx="60" cy="172" rx="15" ry="17" fill="#E6E8EB" stroke="#2C3038" strokeWidth="1.5"/>
    <ellipse cx="60" cy="172" rx="5" ry="5" fill="#2C3038"/>
    <line x1="60" y1="155" x2="60" y2="161" stroke="#2C3038" strokeWidth="1.5"/>
    <line x1="60" y1="183" x2="60" y2="189" stroke="#2C3038" strokeWidth="1.5"/>
    <line x1="44" y1="172" x2="50" y2="172" stroke="#2C3038" strokeWidth="1.5"/>
    <line x1="70" y1="172" x2="76" y2="172" stroke="#2C3038" strokeWidth="1.5"/>

    <ellipse cx="240" cy="172" rx="24" ry="26" fill="#4A5059" stroke="#2C3038" strokeWidth="2"/>
    <ellipse cx="240" cy="172" rx="15" ry="17" fill="#E6E8EB" stroke="#2C3038" strokeWidth="1.5"/>
    <ellipse cx="240" cy="172" rx="5" ry="5" fill="#2C3038"/>
    <line x1="240" y1="155" x2="240" y2="161" stroke="#2C3038" strokeWidth="1.5"/>
    <line x1="240" y1="183" x2="240" y2="189" stroke="#2C3038" strokeWidth="1.5"/>
    <line x1="224" y1="172" x2="230" y2="172" stroke="#2C3038" strokeWidth="1.5"/>
    <line x1="250" y1="172" x2="256" y2="172" stroke="#2C3038" strokeWidth="1.5"/>

    {/* Línea de suelo */}
    <line x1="30" y1="195" x2="270" y2="195" stroke="#D0D3D8" strokeWidth="1.5"/>
  </svg>
)

const SVG_SUPERIOR = (
  <svg viewBox="0 0 220 380" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* ── Carrocería exterior ── */}
    {/* Silueta con pasos de rueda */}
    <path d="
      M 74,22
      Q 110,18 146,22
      L 162,30 Q 172,42 174,58
      L 178,110
      C 178,110 194,110 194,130
      C 194,150 178,150 178,150
      L 178,228
      C 178,228 194,228 194,248
      C 194,268 178,268 178,268
      L 174,318 Q 172,334 162,346
      L 146,356 Q 110,360 74,356
      L 58,346 Q 48,334 46,318
      L 42,268
      C 42,268 26,268 26,248
      C 26,228 42,228 42,228
      L 42,150
      C 42,150 26,150 26,130
      C 26,110 42,110 42,110
      L 46,58 Q 48,42 58,30
      L 74,22 Z
    " stroke="#2C3038" strokeWidth="2" fill="#F0F1F4"/>

    {/* ── Techo / habitáculo central ── */}
    <rect x="52" y="120" width="116" height="140" rx="10"
      fill="#E6E8EB" stroke="#2C3038" strokeWidth="1.5"/>

    {/* ── Parabrisas delantero ── */}
    <path d="M 55,120 Q 58,96 65,80 L 155,80 Q 162,96 165,120 Z"
      fill="#B8CDD9" fillOpacity="0.88" stroke="#2C3038" strokeWidth="1.5"/>

    {/* Capó (zona entre parabrisas y morro) */}
    <path d="M 65,80 L 155,80 Q 162,58 162,40 L 150,28 L 70,28 L 58,40 Q 58,58 65,80 Z"
      fill="#ECEEF1" stroke="#2C3038" strokeWidth="1.2"/>

    {/* Cresta central capó */}
    <line x1="110" y1="28" x2="110" y2="80" stroke="#C8CACD" strokeWidth="1"/>

    {/* ── Luneta trasera ── */}
    <path d="M 55,260 Q 58,284 65,300 L 155,300 Q 162,284 165,260 Z"
      fill="#B8CDD9" fillOpacity="0.88" stroke="#2C3038" strokeWidth="1.5"/>

    {/* Portón trasero */}
    <path d="M 65,300 L 155,300 Q 162,320 162,340 L 150,352 L 70,352 L 58,340 Q 58,320 65,300 Z"
      fill="#ECEEF1" stroke="#2C3038" strokeWidth="1.2"/>

    {/* ── Separación puertas ── */}
    {/* B-pillar izquierdo */}
    <line x1="52" y1="188" x2="168" y2="188" stroke="#2C3038" strokeWidth="1.5"/>
    {/* Líneas puertas */}
    <line x1="52" y1="156" x2="168" y2="156" stroke="#2C3038" strokeWidth="0.8" strokeDasharray="3,2"/>
    <line x1="52" y1="224" x2="168" y2="224" stroke="#2C3038" strokeWidth="0.8" strokeDasharray="3,2"/>

    {/* ── Retrovisores ── */}
    <path d="M 46,130 L 36,128 L 34,138 L 44,140 Z"
      fill="#D4D6DA" stroke="#2C3038" strokeWidth="1"/>
    <path d="M 174,130 L 184,128 L 186,138 L 176,140 Z"
      fill="#D4D6DA" stroke="#2C3038" strokeWidth="1"/>

    {/* ── Rueda delantera izquierda ── */}
    <ellipse cx="26" cy="130" rx="14" ry="22" fill="#4A5059" stroke="#2C3038" strokeWidth="2"/>
    <ellipse cx="26" cy="130" rx="8" ry="14" fill="#E6E8EB" stroke="#2C3038" strokeWidth="1.5"/>
    <ellipse cx="26" cy="130" rx="3" ry="3" fill="#2C3038"/>

    {/* ── Rueda delantera derecha ── */}
    <ellipse cx="194" cy="130" rx="14" ry="22" fill="#4A5059" stroke="#2C3038" strokeWidth="2"/>
    <ellipse cx="194" cy="130" rx="8" ry="14" fill="#E6E8EB" stroke="#2C3038" strokeWidth="1.5"/>
    <ellipse cx="194" cy="130" rx="3" ry="3" fill="#2C3038"/>

    {/* ── Rueda trasera izquierda ── */}
    <ellipse cx="26" cy="248" rx="14" ry="22" fill="#4A5059" stroke="#2C3038" strokeWidth="2"/>
    <ellipse cx="26" cy="248" rx="8" ry="14" fill="#E6E8EB" stroke="#2C3038" strokeWidth="1.5"/>
    <ellipse cx="26" cy="248" rx="3" ry="3" fill="#2C3038"/>

    {/* ── Rueda trasera derecha ── */}
    <ellipse cx="194" cy="248" rx="14" ry="22" fill="#4A5059" stroke="#2C3038" strokeWidth="2"/>
    <ellipse cx="194" cy="248" rx="8" ry="14" fill="#E6E8EB" stroke="#2C3038" strokeWidth="1.5"/>
    <ellipse cx="194" cy="248" rx="3" ry="3" fill="#2C3038"/>

    {/* ── Faros delanteros (vista superior) ── */}
    <path d="M 66,30 Q 60,38 60,48 L 78,50 L 80,32 Z"
      fill="#FFF8C8" stroke="#2C3038" strokeWidth="1"/>
    <path d="M 154,30 Q 160,38 160,48 L 142,50 L 140,32 Z"
      fill="#FFF8C8" stroke="#2C3038" strokeWidth="1"/>

    {/* ── Pilotos traseros (vista superior) ── */}
    <path d="M 66,350 Q 60,342 60,332 L 78,330 L 80,348 Z"
      fill="#FFBCBC" stroke="#2C3038" strokeWidth="1"/>
    <path d="M 154,350 Q 160,342 160,332 L 142,330 L 140,348 Z"
      fill="#FFBCBC" stroke="#2C3038" strokeWidth="1"/>
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
