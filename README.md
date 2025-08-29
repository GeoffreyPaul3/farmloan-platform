# FarmLoan Platform

A modern web application designed to facilitate agricultural loans and financial services for farmers. Built with cutting-edge technologies to provide a seamless user experience.

## 🚀 Features

- User Authentication & Authorization
- Dashboard Interface
- Mobile Responsive Design
- Real-time Data Updates
- Secure Database Integration

## 🛠️ Technologies

This project is built with modern web technologies:

- [React](https://reactjs.org/) - Frontend library
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Vite](https://vitejs.dev/) - Next Generation Frontend Tooling
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful and accessible UI components
- [Supabase](https://supabase.com/) - Open source Firebase alternative

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/GeoffreyPaul3/farmloan-platform.git
cd farmloan-platform
```

2. Install dependencies:
```bash
npm install
# or
bun install
```

3. Start the development server:
```bash
npm run dev
# or
bun dev
```

## 🔧 Environment Setup

Create a `.env` file in the root directory with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🏗️ Project Structure

```
src/
├── assets/       # Static assets
├── components/   # Reusable UI components
├── hooks/        # Custom React hooks
├── integrations/ # Third-party integrations
├── layouts/      # Layout components
├── lib/          # Utility functions
└── pages/        # Application pages
```

## 🚀 Deployment

This project is configured for deployment on Vercel. Simply push to your repository and Vercel will automatically deploy your changes.

### Environment Variables

Set these variables in your Vercel project and in local `.env`:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
- `RESEND_API_KEY`: Resend API key (transactional emails)
- `RESEND_FROM_EMAIL`: Verified sender in Resend (e.g., no-reply@yourdomain.com)
- `PUBLIC_APP_URL`: Public base URL of the app

### Email Notifications (Resend)

An Edge Function `notify-user` sends onboarding emails via Resend:

- Path: `supabase/functions/notify-user/index.ts`
- Payload: `{ type: "pending" | "approved", email: string, full_name?: string }`
- Uses `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, optional `PUBLIC_APP_URL`

Client integrations:

- Signup triggers a "pending approval" email (`src/hooks/use-auth.tsx`)
- Admin approval triggers an "approved" email (`src/pages/admin.tsx`)

Deploy the function and set secrets:

```bash
supabase secrets set RESEND_API_KEY=... RESEND_FROM_EMAIL=... PUBLIC_APP_URL=...
supabase functions deploy notify-user
```

Note: UI access is gated for unapproved users with a clear message in `src/layouts/dashboard-layout.tsx`.
