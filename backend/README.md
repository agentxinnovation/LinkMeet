# LinkMeet Backend

Open-source video conferencing platform backend built with Express.js, Prisma ORM, and PostgreSQL.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (running on your VPS/local machine)
- npm or yarn

### Local Development Setup

1. **Clone and navigate to backend directory**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment setup**
```bash
cp .env.sample .env
# Edit .env with your database credentials and secrets
```

4. **Database setup**
```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view database
npm run prisma:studio
```

5. **Start development server**
```bash
npm run dev
```

The server will start on `http://localhost:5000`

### Docker Production Setup

1. **Build and run with Docker Compose**
```bash
# From project root
docker-compose up -d
```

2. **Run database migrations in container**
```bash
docker exec linkmeet-backend npx prisma migrate deploy
```

## 📁 Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── docs/
│   └── global.md             # API documentation
├── .env.sample               # Environment variables template
├── .gitignore               # Git ignore rules
├── Dockerfile               # Docker configuration
├── package.json             # NPM dependencies and scripts
└── server.js               # Main application file (to be created)
```

## 🛠️ Available Scripts

```bash
# Development
npm run dev              # Start with nodemon (auto-reload)
npm start               # Start in production mode

# Database
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate  # Run database migrations
npm run prisma:studio   # Open Prisma Studio
npm run prisma:deploy   # Deploy migrations (production)
```

## 🐳 Docker Commands

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f linkmeet-backend

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up -d --build
```

## 📊 Database Schema

The application uses the following main entities:

- **Users**: Authentication and user profiles
- **Rooms**: Video conference rooms
- **RoomMembers**: User-room relationships with roles
- **Messages**: Chat messages within rooms

See `prisma/schema.prisma` for detailed schema definition.

## 🔧 Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

### Database Connection

The application expects PostgreSQL to be running outside of Docker. Update your `DATABASE_URL` in `.env` to point to your PostgreSQL instance.

## 📖 API Documentation

Comprehensive API documentation is available in `docs/global.md`, including:

- All available endpoints
- Authentication requirements
- Request/response formats
- WebSocket events
- Error handling

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Helmet.js security headers
- Request logging with Morgan
- Input validation and sanitization

## 🚦 Health Check

The application includes a health check endpoint at `/health` for monitoring and Docker health checks.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Harsh Raithatha**

---

For detailed API documentation, see `docs/global.md`