# Findora

> Community-powered Lost & Found platform for colleges, events, campuses, and student communities.

## 🌐 Live Website

https://findora.live

---

## 📖 About

Findora is a modern Lost & Found platform designed to help students, event organizers, and communities quickly reconnect people with their lost belongings.

Instead of relying on scattered WhatsApp groups, Instagram stories, or manual announcements, Findora provides a centralized system where users can report lost and found items, search existing reports, and recover belongings efficiently.

---

## ✨ Features

### 🔍 Lost Item Reporting
- Report lost items instantly
- Upload item images
- Add detailed descriptions
- Specify location and date
- Track report status

### 🤝 Found Item Reporting
- Report found items
- Upload photos
- Add collection details
- Help owners recover belongings

### 🎯 Smart Discovery
- Browse similar reports
- Search across lost and found listings
- Improve recovery chances

### 🔎 Search & Filtering
Filter reports by:
- Category
- Location
- Date
- Status
- Keywords

### 👤 Authentication
- Secure user accounts
- Protected dashboards
- Student-friendly onboarding

### 🛡️ Admin Dashboard
- Content moderation
- Report management
- User management
- Analytics and insights

### ⚡ Real-Time Updates
- Faster report visibility
- Updated status tracking
- Improved community engagement

---

## 🏗️ Tech Stack

### Frontend
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui

### Backend
- Supabase
- PostgreSQL
- Row Level Security (RLS)

### Deployment
- Vercel

### Payments
- Razorpay

---

## 📂 Project Structure

```text
src/
├── app/
├── components/
├── hooks/
├── lib/
├── services/
├── types/
├── styles/
└── utils/

public/
supabase/
```

---

## 🚀 Getting Started

### 1. Clone Repository

```bash
git clone https://github.com/RohitPulamarasetty/Findora.git
cd Findora
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create:

```bash
.env.local
```

Example:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

---

### 4. Run Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 🏭 Production Build

```bash
npm run build
npm start
```

---

## 🔒 Security

- Row Level Security (RLS)
- Secure authentication
- Input validation
- Protected APIs
- Environment variable protection
- Rate limiting

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push the branch
5. Open a Pull Request

---

## 🎯 Mission

Every year thousands of students lose valuable items during festivals, workshops, hackathons, conferences, and campus events.

Findora aims to create a trusted, centralized platform that makes recovering lost items simple, fast, and community-driven.

---

## 📈 Future Roadmap

- AI-powered item matching
- QR-based item recovery
- Event-specific lost & found hubs
- Mobile application
- Advanced notifications
- Analytics dashboard for organizers

---

## 📄 License

MIT License

---

Built with ❤️ for students and communities.
