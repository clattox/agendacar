# AgendaCar

Plataforma de agendamiento online para servitecas y talleres automotrices.

## Stack

- **Frontend:** React + Tailwind CSS + Vite
- **Backend:** Node.js + Express
- **Base de datos:** MySQL + Prisma ORM
- **Email:** Nodemailer
- **Deploy:** Hostinger

## Estructura

```
agendacar/
├── client/    # Frontend React
└── server/    # Backend Node.js
```

## Instalación

### Server
```bash
cd server
npm install
cp .env.example .env  # completar variables
npx prisma db push
npm run dev
```

### Client
```bash
cd client
npm install
cp .env.example .env
npm run dev
```

## Variables de entorno

Ver `.env.example` en cada carpeta.
