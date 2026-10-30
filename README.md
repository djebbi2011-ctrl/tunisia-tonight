# 🌙 Tunisia Tonight — Plateforme de Réservation Hôtelière

Plateforme B2C de courts séjours hôteliers dédiée au marché tunisien.
**Contrats en TND · Extranet temps réel · Commission transparente**

---

## 📁 Structure du projet

```
tunisiatonight/
├── backend/          ← API NestJS + PostgreSQL + Prisma
│   ├── src/
│   │   ├── auth/         ← Authentification JWT (3 rôles)
│   │   ├── hotels/       ← Recherche + fiche hôtel
│   │   ├── reservations/ ← Tunnel de réservation
│   │   ├── hotelier/     ← Extranet hôtelier (temps réel)
│   │   ├── admin/        ← Back-office admin + journal remises
│   │   ├── notifications/← WebSocket Gateway (Socket.io)
│   │   └── prisma/       ← Service Prisma
│   └── prisma/
│       ├── schema.prisma ← Modèle de données complet
│       └── seed.ts       ← Données de test (1 hôtel pilote)
│
└── frontend/         ← Next.js 14 + Tailwind CSS
    └── src/
        ├── app/
        │   ├── page.tsx          ← Accueil + moteur de recherche
        │   ├── hotels/           ← Résultats de recherche
        │   ├── hotels/[id]/      ← Fiche hôtel + sélection chambre
        │   ├── reservation/      ← Tunnel réservation (3 étapes)
        │   ├── login/            ← Connexion
        │   ├── account/          ← Espace client (mes dossiers)
        │   └── extranet/         ← Extranet hôtelier (temps réel)
        ├── components/
        │   ├── layout/Navbar.tsx
        │   ├── search/SearchBox.tsx
        │   └── hotel/HotelCard.tsx
        ├── lib/api.ts            ← Client Axios + auto-refresh JWT
        ├── store/auth.store.ts   ← Zustand (auth + search state)
        └── types/index.ts        ← Types TypeScript partagés
```

---

## 🚀 Démarrage rapide

### Prérequis
- Node.js 18+
- PostgreSQL 15+
- npm ou yarn

### 1. Base de données
```bash
# Créer la base
psql -U postgres -c "CREATE DATABASE tunisiatonight_db;"
psql -U postgres -c "CREATE USER tunisian_user WITH PASSWORD 'your_password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE tunisiatonight_db TO tunisian_user;"
```

### 2. Backend
```bash
cd backend
cp .env.example .env
# Éditer .env avec vos valeurs (DATABASE_URL, JWT secrets...)

npm install
npx prisma generate
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts   # Données de test

npm run start:dev   # → http://localhost:3001
# Swagger docs → http://localhost:3001/api/docs
```

### 3. Frontend
```bash
cd frontend
npm install
# Créer .env.local :
echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" > .env.local
echo "NEXT_PUBLIC_WS_URL=http://localhost:3001" >> .env.local

npm run dev   # → http://localhost:3000
```

---

## 🔑 Comptes de test (après seed)

| Rôle       | Email                            | Mot de passe    | Accès          |
|------------|----------------------------------|-----------------|----------------|
| Super Admin | admin@tunisiatonight.com        | Admin@2026!     | /admin         |
| Hôtelier   | barcelo@tunisiatonight.com      | Hotelier@2026!  | /extranet      |
| Client     | sonia@test.tn                   | Client@2026!    | /account       |

---

## 🏗️ Architecture

```
Client (Next.js)  ←→  API REST (NestJS)  ←→  PostgreSQL (Prisma)
       ↕                      ↕
  WebSocket (Socket.io) ← temps réel extranet hôtelier
```

### Flux réservation
1. Client cherche → `/api/hotels/search` (disponibilités en temps réel)
2. Client réserve → `POST /api/reservations` (calcul commission)
3. Client paie la commission → passerelle TND (Paymee/Konnect)
4. Hôtelier valide + applique remise → `PATCH /api/hotelier/reservations/:id/validate`
5. Remise tracée automatiquement dans le journal admin → `GET /api/admin/discounts`
6. Client notifié en temps réel via WebSocket

---

## 📡 Endpoints API principaux

| Méthode | Endpoint                                   | Rôle      |
|---------|--------------------------------------------|-----------|
| GET     | /api/hotels/search?city=&checkin=&checkout= | Public   |
| GET     | /api/hotels/:id                            | Public    |
| POST    | /api/reservations                          | Client    |
| PATCH   | /api/hotelier/reservations/:id/validate    | Hôtelier  |
| GET     | /api/admin/discounts                       | Admin     |
| POST    | /api/admin/contracts/:id/activate          | Admin     |

---

## 📅 Roadmap

- **Phase 1 (MVP)** — Ce dépôt : 3 interfaces, paiement commission, remises tracées
- **Phase 2** — WebSocket complet, calendrier hôtelier live, analytics admin
- **Phase 3** — App mobile React Native (iOS + Android → Google Play + App Store)
- **Phase 4** — API B2B, channel manager, 100+ hôtels
