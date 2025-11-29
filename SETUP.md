# YUMA Platform Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

Copy the example environment file and configure your API keys:

```bash
cp env.example .env.local
```

Edit `.env.local` and add your API keys:

```env
# Required: JWT Secret (generate a secure random string)
# Generate using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-use-random-string

# Database
DATABASE_URL=file:./prisma/dev.db

# NextAuth Configuration (optional, for compatibility)
NEXTAUTH_SECRET=your-super-secret-jwt-key-change-this-in-production-use-random-string
NEXTAUTH_URL=http://localhost:3000

# Optional: OpenAI API Key
OPENAI_API_KEY=sk-your-openai-api-key-here
```

#### Getting OpenAI API Key

1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign up or log in
3. Create a new API key
4. Copy the key (starts with `sk-`)
5. Add it to your `.env.local` file

### 3. Setup Database

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push
```

### 4. Create Admin User

```bash
npm run seed:admin
```

Follow the prompts to create your admin user.

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Features

### AI Integration

The platform includes AI-powered features:

- **Text Improvement**: Improve, correct, or translate text in task descriptions
- **Description Generation**: Auto-generate professional descriptions
- **Event Scheduling**: Schedule events from natural language
- **Reminder Setting**: Set reminders from natural language

See [OPENAI_INTEGRATION_GUIDE.md](./OPENAI_INTEGRATION_GUIDE.md) for detailed documentation.

## Project Structure

```
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # Dashboard
│   ├── spaces/         # Space management
│   └── ...
├── components/         # React components
│   ├── admin/         # Admin components
│   ├── ai/            # AI features
│   ├── auth/          # Auth components
│   ├── board/         # Kanban board
│   ├── calendar/      # Calendar view
│   ├── roadmap/       # Roadmap view
│   └── ...
├── lib/               # Utilities and services
├── prisma/            # Database schema
└── public/            # Static assets
```

## Troubleshooting

### "OpenAI API key not configured"

- Make sure `.env.local` exists in the project root
- Ensure `OPENAI_API_KEY` is set in `.env.local`
- Restart the development server after adding the key

### Database errors

- Run `npm run db:push` to sync the schema
- Check that `prisma/dev.db` exists
- Try deleting `.prisma` folder and run `npm run db:generate` again

### Port already in use

- Change the port: `npm run dev -- -p 3001`
- Or kill the process using port 3000

## Documentation

- [OpenAI Integration Guide](./OPENAI_INTEGRATION_GUIDE.md)
- [AI Integration Recommendations](./AI_INTEGRATION_RECOMMENDATIONS.md)
- [Admin Setup](./ADMIN_SETUP.md)
- [Email Setup](./EMAIL_SETUP.md)
- [Architecture](./docs/ARCHITECTURE_IMPORT.md)

## Support

For issues or questions, refer to the documentation files or check the OpenAI status at [status.openai.com](https://status.openai.com).








