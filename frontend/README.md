# Budgivee Frontend

Modern financial management application built with React, TypeScript, and Vite.

## Features

### User Features
- **Authentication**: Login, Register, Profile Management
- **Financial Spaces**: Personal and Family financial management
- **Transactions**: Income and expense tracking with categories
- **Budget Management**: Set monthly budgets by category with alerts
- **Savings Goals**: Track progress towards financial goals
- **Dashboard**: Visual analytics with charts and insights
- **Reports**: Financial reports and category analysis

### Admin Features
- **Dashboard**: System overview with user statistics
- **User Management**: View, activate/deactivate users
- **Category Management**: Manage system categories
- **Audit Logs**: Track admin activities

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Routing
- **Zustand** - State management
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **React Hot Toast** - Notifications

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

## Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable components
│   ├── layouts/          # Layout components
│   ├── pages/            # Page components
│   │   ├── auth/         # Authentication pages
│   │   ├── user/         # User pages
│   │   └── admin/        # Admin pages
│   ├── store/            # Zustand stores
│   ├── types/            # TypeScript types
│   ├── lib/              # Utilities and configs
│   ├── App.tsx           # Main app component
│   └── main.tsx          # Entry point
├── public/               # Static assets
└── package.json
```

## Environment Variables

Create `.env` file:

```env
VITE_API_URL=http://localhost:8080/api/v1
```

## API Integration

The frontend connects to the Spring Boot backend API. Make sure the backend is running on port 8080.

API endpoints are proxied through Vite config:
- Development: `http://localhost:3000/api` → `http://localhost:8080/api`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Design System

### Colors
- **Primary**: `#5B4FFF` - Main brand color
- **Success**: `#2DD4BF` - Success states, income
- **Danger**: `#EF4444` - Error states, expenses
- **Warning**: `#F59E0B` - Warning states

### Components
- Custom button variants: `btn-primary`, `btn-secondary`, `btn-success`, `btn-danger`
- Badge components for status indicators
- Card components for content containers
- Form inputs with consistent styling

## License

MIT
