# Reconix Frontend

Reconix is a modern web application built with React and TypeScript, powered by Vite and styled with Tailwind CSS and shadcn/ui.

## 🚀 Tech Stack

- **Framework:** [React 19](https://react.dev/)
- **Build Tool:** [Vite 7](https://vitejs.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS v3.4](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **State Management:** [Redux Toolkit](https://redux-toolkit.js.org/) & [React Redux](https://react-redux.js.org/)
- **Routing:** [React Router DOM v7](https://reactrouter.com/)
- **Forms:** [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Charts:** [Recharts](https://recharts.org/)

## 📂 Project Structure

```text
src/
├── components/     # Reusable UI components (shadcn/ui)
├── constants/      # Global constants
├── hooks/          # Custom React hooks
├── lib/            # Utility functions and library configurations
├── pages/          # Page components
├── sections/       # Complex page sections
├── store/          # Redux store and slices
├── types/          # TypeScript type definitions
├── App.tsx         # Root component
├── main.tsx        # Entry point
└── index.css       # Global styles
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 20 or higher
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   Copy `.env.example` to `.env` and update the values:
   ```bash
   cp .env.example .env
   ```

### Development

Run the development server:
```bash
npm run dev
```

### Build

Build the application for production:
```bash
npm run build
```

### Linting

Run ESLint to check for code quality issues:
```bash
npm run lint
```

## 🏁 Phase 1 Status - ✅ COMPLETE

- [x] UI Shells & Layout
- [x] Authentication (Login/Register/Set Password)
- [x] Connected Companies Page
- [x] Sync UI (Manual trigger + Progress polling)

## 🏁 Phase 2 Status - 🚧 IN PROGRESS

- [x] Jobs Dashboard (Shell UI)
- [x] Invoice Reversal Builder (Shell UI)
- [x] Overpayment Allocation Builder (Shell UI)
- [x] Job History & Detail (Shell UI)
- [ ] API Integration (Live fetching of data)
- [ ] Job Submission Logic
- [ ] Approval Flow Integration
- [ ] Real-time Progress Polling for Jobs

## 📄 License

This project is private and intended for internal use.
