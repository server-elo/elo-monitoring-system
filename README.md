# 🚀 Solidity Learning Platform

> Next-generation Solidity learning platform with AI-powered features, interactive coding, immersive blockchain education, and comprehensive accessibility support.

[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.3.4-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue)](https://react.dev/)
[![Performance](https://img.shields.io/badge/Lighthouse-90%2B-brightgreen)](https://web.dev/performance-scoring/)
[![Accessibility](https://img.shields.io/badge/WCAG-2.1%20AA-blue)](https://www.w3.org/WAI/WCAG21/quickref/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## ✨ Features

### 🎮 Interactive Learning Experience
- **Monaco Code Editor** with Solidity syntax highlighting, auto-completion, and error detection
  - IntelliSense with context-aware suggestions
  - Real-time syntax checking and linting
  - Auto-save functionality with 2-3 second intervals
  - Customizable themes (dark/light) and font sizes
- **Real-time Compilation** with instant feedback and gas estimation
- **Interactive Tutorials** with step-by-step guided learning and progress tracking
- **Gamification System** with comprehensive XP, levels, achievements, and badges
  - Dynamic XP calculation with streak multipliers
  - 50+ achievements across learning, coding, and social categories
  - Level progression with unlockable content and rewards
  - Real-time notifications with glassmorphism design

### 🤖 AI-Powered Features
- **Google Gemini Integration** for personalized tutoring and code review
- **Intelligent Code Analysis** with security vulnerability detection
- **Adaptive Learning Paths** based on user progress and skill assessment
- **AI Assistant** with conversation history and context-aware responses

### 🌐 Blockchain Integration
- **Web3 Wallet Support** with MetaMask integration
- **Multi-Testnet Support** (Sepolia, Goerli, Mumbai)
- **Contract Deployment** with gas estimation and transaction monitoring
- **Real-time Blockchain Visualization** using Three.js

### 🎨 Modern UI/UX
- **Glassmorphism & Neumorphism** design patterns
- **Advanced Animations** with GSAP, Lottie, and Framer Motion
- **Responsive Design** optimized for all devices
- **Dark/Light Theme** support

### 🔄 Real-Time Collaboration
- **Live Coding Sessions** with WebSocket-powered real-time synchronization
  - Operational transformation for conflict-free editing
  - <200ms latency for 2-10 concurrent users
  - Persistent session management with auto-reconnection
- **Collaborative Editor** with multi-user cursor and selection tracking
  - Color-coded user presence indicators
  - Real-time typing indicators and user activity
  - Shared code execution and debugging
- **Team Challenges** and group projects with progress synchronization
- **Community Chat** and Q&A system with moderation tools

### ♿ Accessibility & Inclusion
- **WCAG 2.1 AA Compliant** with comprehensive screen reader support
- **Full Keyboard Navigation** with enhanced focus indicators
- **High Contrast Mode** and reduced motion support
- **Multi-language Support** and internationalization
- **Voice Commands** and speech synthesis integration

### ⚡ Performance & Optimization
- **Sub-200ms Page Load Times** with intelligent caching
- **Service Worker** with offline-first approach
- **Lazy Loading** and code splitting for optimal bundle sizes
- **Core Web Vitals Optimization** (LCP < 2.5s, CLS < 0.1)
- **Progressive Web App (PWA)** with native app-like experience

## 🚀 Quick Start

### Prerequisites
- **Node.js 18.0.0 or higher** (20+ recommended)
- **npm 9.0.0 or higher**
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/[your-username]/learning_solidity.git
   cd learning_solidity/learning_sol
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

   Required environment variables:
   - `DATABASE_URL` - Database connection string
   - `NEXTAUTH_SECRET` - Authentication secret (generate with: `openssl rand -hex 32`)
   - `NEXTAUTH_URL` - Application URL (default: http://localhost:5000)

4. **Initialize the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   # Open http://localhost:3000 in your browser
   
   # Or run on a different port:
   npm run dev -- -p 5000
   ```
   - 📦 Optimized for Next.js 15
   - 🚀 Better development experience

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage

### Database Commands

- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

### Docker Support

```bash
# Build Docker image
npm run docker:build

# Run Docker container
npm run docker:run
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
npm start
```

### Recommended Deployment Platforms

#### Vercel (Recommended for Next.js)
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts to deploy

#### Railway
1. Install Railway CLI: `npm i -g @railway/cli`
2. Run: `railway login` and `railway up`
3. Configure environment variables in Railway dashboard

#### Other Platforms
- **Netlify**: Great for static sites with serverless functions
- **Render**: Full-stack hosting with PostgreSQL included
- **Heroku**: Easy deployment with buildpacks
- **DigitalOcean App Platform**: Container-based deployment

### Production Environment Variables

Configure these in your deployment platform:

```env
# Required
DATABASE_URL=postgresql://user:password@host:5432/dbname
NEXTAUTH_SECRET=your-production-secret-min-32-chars
NEXTAUTH_URL=https://your-domain.com

# Optional
GEMINI_API_KEY=your_gemini_api_key
GITHUB_CLIENT_ID=your_github_oauth_id
GITHUB_CLIENT_SECRET=your_github_oauth_secret
GOOGLE_CLIENT_ID=your_google_oauth_id
GOOGLE_CLIENT_SECRET=your_google_oauth_secret
```

### Important Notes
- Use PostgreSQL for production (not SQLite)
- Generate a secure NEXTAUTH_SECRET: `openssl rand -hex 32`
- Set NODE_ENV=production in your deployment platform
- Enable HTTPS for production deployments

# Optional: Monitoring
SENTRY_DSN=your_sentry_dsn
```

### Migration from Static Deployment

⚠️ **Important**: This application has been migrated from static export to server-side functionality to enable:
- API routes for real-time features
- Database integration
- Authentication systems
- AI-powered tutoring
- Real-time collaboration

If you were previously using GitHub Pages deployment, you'll need to migrate to one of the server-compatible platforms listed above.

## 📁 Project Structure

```
learning_sol/
├── app/                    # Next.js App Router
├── components/             # React components
│   ├── accessibility/     # Accessibility components
│   ├── ai/                # AI-related components
│   ├── auth/              # Authentication components
│   ├── blockchain/        # Web3 components
│   ├── code/              # Code editor components
│   ├── lazy/              # Lazy-loaded components
│   ├── learning/          # Learning platform components
│   ├── monitoring/        # Performance monitoring
│   ├── performance/       # Performance optimization
│   └── ui/                # UI components
├── lib/                   # Utility libraries
│   ├── hooks/             # Custom React hooks
│   ├── monitoring/        # Performance monitoring
│   └── utils/             # Utility functions
├── prisma/                # Database schema
├── public/                # Static assets
├── scripts/               # Build and optimization scripts
├── services/              # External services
├── tests/                 # Test suites
│   ├── accessibility/     # Accessibility tests
│   └── performance/       # Performance tests
├── types/                 # TypeScript type definitions
└── docs/                  # Documentation
```

## 🔧 Environment Variables

Create a `.env.local` file with the following configuration:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/solidity_learn"
DIRECT_URL="postgresql://username:password@localhost:5432/solidity_learn"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-min-32-chars"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
GITHUB_CLIENT_ID="your-github-oauth-client-id"
GITHUB_CLIENT_SECRET="your-github-oauth-client-secret"

# AI Integration (Required for AI tutoring features)
GOOGLE_AI_API_KEY="your-gemini-pro-api-key"
OPENAI_API_KEY="your-openai-api-key"  # Optional: For additional AI features

# Real-time Collaboration (Required for collaborative features)
WEBSOCKET_URL="ws://localhost:3001"  # Development
COLLABORATION_SECRET="your-collaboration-secret"

# Performance Monitoring (Recommended for production)
SENTRY_DSN="your-sentry-dsn"
SENTRY_ORG="your-sentry-org"
SENTRY_PROJECT="your-sentry-project"
PLAUSIBLE_DOMAIN="your-domain.com"

# File Storage (Required for user uploads and assets)
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud"
CLOUDINARY_API_KEY="your-cloudinary-key"
CLOUDINARY_API_SECRET="your-cloudinary-secret"
UPLOAD_MAX_SIZE="10485760"  # 10MB in bytes

# Caching and Session Management (Recommended for production)
REDIS_URL="redis://localhost:6379"
SESSION_SECRET="your-session-secret-min-32-chars"

# Email Services (Required for notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Rate Limiting (Production security)
RATE_LIMIT_MAX="100"  # Requests per window
RATE_LIMIT_WINDOW="900000"  # 15 minutes in ms
```

### Environment Setup Guide

1. **Database Setup**:
   - Install PostgreSQL locally or use a cloud provider (Supabase, PlanetScale)
   - Create a new database named `solidity_learn`
   - Update `DATABASE_URL` with your connection string

2. **OAuth Setup**:
   - **Google**: Visit [Google Cloud Console](https://console.cloud.google.com/)
   - **GitHub**: Visit [GitHub Developer Settings](https://github.com/settings/developers)
   - Configure redirect URIs: `http://localhost:3000/api/auth/callback/[provider]`

3. **AI Integration**:
   - Get Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Ensure you have access to Gemini Pro model

## 📜 Available Scripts

### Development
```bash
npm run dev              # Start development server with Turbopack
npm run dev:webpack      # Start development server with Webpack
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint with auto-fix
npm run type-check       # Run TypeScript type checking
```

### Database
```bash
npm run db:push          # Push schema changes to database
npm run db:pull          # Pull schema from database
npm run db:generate      # Generate Prisma client
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Seed database with sample data
npm run db:reset         # Reset database (destructive)
```

### Testing
```bash
npm run test             # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
npm run test:e2e         # Run end-to-end tests
npm run test:e2e:ui      # Run E2E tests with UI
npm run test:performance # Run performance tests
npm run test:accessibility # Run accessibility tests
```

### Performance & Analysis
```bash
npm run build:analyze    # Analyze bundle size
npm run lighthouse       # Run Lighthouse audit
npm run lighthouse:mobile # Run mobile Lighthouse audit
npm run performance:analyze # Full performance analysis
```

### Code Quality
```bash
npm run format           # Format code with Prettier
npm run lint:fix         # Fix ESLint issues
npm run prepare          # Set up Husky hooks
```

## ♿ Accessibility Compliance

This platform is built with accessibility as a core principle, achieving **WCAG 2.1 AA compliance**:

### Key Accessibility Features
- **Screen Reader Support**: Full compatibility with NVDA, JAWS, and VoiceOver
- **Keyboard Navigation**: Complete keyboard accessibility with enhanced focus indicators
- **High Contrast**: Support for high contrast mode and custom color schemes
- **Reduced Motion**: Respects user preferences for reduced motion
- **Semantic HTML**: Proper heading hierarchy and landmark usage
- **ARIA Labels**: Comprehensive ARIA labeling for complex interactions

### Testing Accessibility
```bash
# Run automated accessibility tests
npm run test:accessibility

# Manual testing with screen readers
# - NVDA (Windows): Free download from nvaccess.org
# - VoiceOver (macOS): Built-in, activate with Cmd+F5
# - JAWS (Windows): Commercial screen reader

# Keyboard navigation testing
# - Tab through all interactive elements
# - Use arrow keys for menu navigation
# - Test Escape key for modal dismissal
```

### Accessibility Resources
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Accessibility Testing Guide](docs/accessibility-testing.md)
- [Screen Reader Testing Procedures](docs/screen-reader-testing.md)

## ⚡ Performance Optimization

The platform is optimized for exceptional performance with sub-200ms load times:

### Performance Features
- **Core Web Vitals Optimization**: LCP < 2.5s, FID < 100ms, CLS < 0.1
- **Intelligent Caching**: Multi-layer caching with service worker
- **Code Splitting**: Lazy loading for optimal bundle sizes
- **Image Optimization**: WebP/AVIF formats with responsive loading
- **Critical CSS**: Inline critical styles for faster rendering

### Performance Monitoring
```bash
# Run performance tests
npm run test:performance

# Lighthouse audits
npm run lighthouse        # Desktop audit
npm run lighthouse:mobile # Mobile audit

# Bundle analysis
npm run build:analyze

# Performance monitoring in development
# - Real-time Core Web Vitals display
# - Resource timing analysis
# - API performance tracking
```

### Performance Budgets
The platform enforces strict performance budgets:
- **JavaScript**: < 400KB initial bundle
- **CSS**: < 100KB total styles
- **Images**: < 500KB per page
- **Total Page Size**: < 1MB critical path

## 🔧 Troubleshooting

### Common Issues

#### Performance Issues
```bash
# Clear Next.js cache
rm -rf .next

# Clear npm cache
npm cache clean --force

# Rebuild with fresh dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Database Issues
```bash
# Reset database schema
npm run db:reset

# Regenerate Prisma client
npm run db:generate

# Check database connection
npm run db:studio
```

#### Build Issues
```bash
# Check TypeScript errors
npm run type-check

# Fix linting issues
npm run lint:fix

# Clear build cache
npm run clean
```

### Getting Help
- 📖 [Documentation](docs/)
- 🐛 [Report Issues](https://github.com/ezekaj/learning_sol/issues)
- 💬 [Discussions](https://github.com/ezekaj/learning_sol/discussions)
- 📧 [Email Support](mailto:elvizekaj02@gmail.com)

## 🎯 Competitive Advantages

Our platform surpasses existing solutions by combining:

- **Superior Learning Experience** with multi-modal learning approaches
- **Advanced Technical Features** including integrated IDE and debugging tools
- **Innovative Gamification** with blockchain-native rewards
- **Comprehensive Ecosystem** with job board integration and mentorship

See our [Competitive Analysis](docs/competitive-analysis.md) for detailed comparisons.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [CryptoZombies](https://cryptozombies.io/) for gamification inspiration
- [Alchemy University](https://university.alchemy.com/) for curriculum structure
- [OpenZeppelin](https://openzeppelin.com/) for security best practices
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) for the code editor
- [Three.js](https://threejs.org/) for 3D visualizations

## 📞 Support

- 📧 Email: [elvizekaj02@gmail.com](mailto:elvizekaj02@gmail.com)
- 🐛 Issues: [GitHub Issues](https://github.com/ezekaj/learning_sol/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/ezekaj/learning_sol/discussions)

---

<div align="center">
  <strong>Built with ❤️ for the blockchain community</strong>
</div>

