# YUMA Task Management System

A comprehensive task management and project collaboration platform built with Next.js, TypeScript, Prisma, and modern web technologies.

## 🚀 Features

- **Task Management**: Create, organize, and track tasks with multiple views (Board, List, Calendar)
- **Spaces & Projects**: Organize work into dedicated spaces with custom configurations
- **Scrum & Agile**: Full sprint management, backlog, and release planning
- **Roadmap Planning**: Visual timeline for project planning and milestones
- **AI Integration**: AI-powered task suggestions, descriptions, and assistance
- **Templates & Workflows**: Reusable templates and automated workflows
- **Real-time Collaboration**: Live updates and notifications
- **Reporting & Analytics**: Comprehensive reports and insights
- **Integrations**: Connect with external tools and services

## 📋 Prerequisites

- Node.js 18.x or higher
- npm or yarn
- PostgreSQL, MySQL, or SQLite (for Prisma)
- Git

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <your-github-repo-url>
   cd task-management-project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   Edit `.env` and configure your database connection and other required variables.

4. **Set up the database**
   ```bash
   npm run db:generate
   npm run db:push
   # or
   npm run db:migrate
   ```

5. **Create admin user**
   ```bash
   npm run seed:admin
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📚 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run seed:admin` - Create admin user

## 🏗️ Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── admin/             # Admin pages
│   ├── ai/                # AI features
│   ├── auth/              # Authentication
│   ├── calendar/          # Calendar view
│   ├── dashboard/         # Dashboard
│   ├── spaces/            # Spaces/Projects
│   └── ...
├── components/            # React components
│   ├── admin/            # Admin components
│   ├── ai/               # AI components
│   ├── board/            # Board view components
│   ├── calendar/         # Calendar components
│   ├── scrum/            # Scrum/Agile components
│   ├── spaces/           # Space components
│   ├── tasks/            # Task components
│   └── ui/               # UI components
├── lib/                   # Utility libraries
├── prisma/                # Prisma schema and migrations
├── public/                # Static assets
└── scripts/               # Utility scripts
```

## 🔧 Configuration

### Environment Variables

Key environment variables (see `env.example` for full list):

- `DATABASE_URL` - Database connection string
- `NEXTAUTH_SECRET` - Secret for NextAuth.js
- `NEXTAUTH_URL` - Application URL
- `OPENAI_API_KEY` - OpenAI API key (for AI features)
- `EMAIL_SERVER` - Email server configuration
- `EMAIL_FROM` - Default sender email

### Database

The project uses Prisma as the ORM. Database schema is defined in `prisma/schema.prisma`.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📦 Deployment

**See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.**

### Quick Start (Vercel - Recommended)

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Configure environment variables in Vercel dashboard:
   - `OPENAI_API_KEY`
   - `DATABASE_URL` (use production database)
   - `SESSION_SECRET`
   - `NEXTAUTH_URL`
4. Deploy

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- **Vercel** (Recommended) - See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Railway** - See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **AWS** (Elastic Beanstalk, EC2, App Runner) - See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Google Cloud Platform** (Cloud Run, App Engine) - See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **DigitalOcean** App Platform - See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Render** - See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Heroku** - See [DEPLOYMENT.md](./DEPLOYMENT.md)

**Important:** Never upload `.env` files to production! Use your platform's environment variable management system instead.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please read our contributing guidelines before submitting PRs.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Links

- [Documentation](./docs/)
- [Architecture](./docs/ARCHITECTURE_IMPORT.md)
- [Setup Guide](./SETUP.md)
- [Admin Setup](./ADMIN_SETUP.md)

## 🆘 Support

For support, please open an issue in the GitHub repository.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Prisma for the excellent ORM
- All contributors and users of this project



