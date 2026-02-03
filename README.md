<div align="center">

# 🚀 TrackSpace Frontend

[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0.8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Material-UI](https://img.shields.io/badge/MUI-5.15.0-007FFF?style=for-the-badge&logo=mui&logoColor=white)](https://mui.com/)
[![Redux](https://img.shields.io/badge/Redux_Toolkit-2.0.1-764ABC?style=for-the-badge&logo=redux&logoColor=white)](https://redux-toolkit.js.org/)

**Enterprise-grade React frontend for TrackSpace project management platform**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📖 About TrackSpace

TrackSpace is a comprehensive project management platform designed for Software Engineering courses, helping students:
- 📊 Track project progress with **Jira integration**
- 💻 Monitor code contributions via **GitHub integration**
- 📈 Analyze team performance with **real-time analytics**
- 📝 Generate professional **SRS documents** using AI
- 👥 Manage teams and sprint workflows effectively

---

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, Lecturer, Team Leader, Team Member)
- Secure session management

### 👥 User & Team Management
- User CRUD operations (Admin)
- Class and group management (Lecturer)
- Team member assignment with roles

### 🎯 Jira Integration
- Connect to Jira Cloud projects
- Real-time sprint board (Kanban-style)
- Create, update, and track issues
- Bi-directional sync with Jira
- Sprint management (CRUD operations)

### 💻 GitHub Integration
- Repository connection with PAT
- Commit history tracking
- Contribution analysis
- Branch and file change monitoring

### 📊 Analytics Dashboard
- Team contribution metrics
- Activity heatmaps
- Issue detection (inactive members, overdue tasks)
- Performance charts and visualizations

### 📝 AI-Powered SRS Generation
- Automatic document generation from Jira data
- Rich text editor for customization
- Export to PDF/DOCX formats
- Version management

### 🔔 Notification System
- In-app notifications
- Email alerts for important events
- Real-time updates

---

## 🛠️ Tech Stack

### Core
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server

### State Management
- **Redux Toolkit** - Global state
- **RTK Query** - API calls with auto-caching

### UI Framework
- **Material-UI (MUI) v5** - Component library
- **Emotion** - CSS-in-JS styling

### Forms & Validation
- **React Hook Form** - Form state management
- **Yup** - Schema validation

### Data Visualization
- **Recharts** - Charts for analytics

### Rich Text
- **Quill.js** - WYSIWYG editor for SRS

### Utilities
- **Axios** - HTTP client
- **date-fns** - Date manipulation
- **file-saver** - File downloads
- **xlsx** - Excel export

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** >= 18.x
- **npm** >= 9.x
- **Backend API** running on `http://localhost:8080`

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/TuanHoang297/trackspace-frontend.git
   cd trackspace-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env.development
   ```

   Edit `.env.development`:
   ```env
   VITE_API_BASE_URL=http://localhost:8080/api
   VITE_APP_NAME=TrackSpace
   VITE_APP_VERSION=1.0.0
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   App runs at: **http://localhost:5173** 🎉

---

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests |
| `npm run test:ui` | Run tests with UI |

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── api/              # RTK Query API services
│   ├── components/       # Reusable components
│   │   ├── common/       # Common UI components
│   │   ├── layout/       # Layout components
│   │   └── features/     # Feature-specific components
│   ├── features/         # Feature modules (domain-driven)
│   ├── pages/            # Page components (routes)
│   ├── store/            # Redux store & slices
│   ├── routes/           # Routing configuration
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   ├── types/            # TypeScript definitions
│   └── styles/           # Global styles & theme
└── tests/                # Unit, integration, e2e tests
```

---

## 🔐 Role-Based Access

| Role | Permissions |
|------|------------|
| **Admin** | User CRUD, Class creation |
| **Lecturer** | Group management, Analytics monitoring, SRS review |
| **Team Leader** | Jira/GitHub setup, Sprint/Issue CRUD, SRS generation |
| **Team Member** | Task execution, Status updates, Personal analytics |

---

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

---

## � Deployment

### Build production bundle
```bash
npm run build
```

Output in `dist/` folder.

### Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

Or connect GitHub repo to Vercel for auto-deployment.

---

## 📚 Documentation

- [Frontend Structure](../frontend_structure.md) - Detailed architecture
- [API Documentation](docs/API.md) - API endpoints reference
- [Component Guidelines](docs/COMPONENTS.md) - Component best practices
- [State Management](docs/STATE.md) - Redux & RTK Query guide

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📝 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file.

---

## 👥 Team

Built with ❤️ by TrackSpace Team

- **Project Lead**: [TuanHoang297](https://github.com/TuanHoang297)
- **Contributors**: See [Contributors](https://github.com/TuanHoang297/trackspace-frontend/graphs/contributors)

---

## 📧 Contact

For questions or support:
- 📧 Email: team@trackspace.com
- 🐛 Issues: [GitHub Issues](https://github.com/TuanHoang297/trackspace-frontend/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/TuanHoang297/trackspace-frontend/discussions)

---

<div align="center">

**⭐ If you find this project helpful, please give it a star!**

Made with React + TypeScript + Vite + MUI

</div>
