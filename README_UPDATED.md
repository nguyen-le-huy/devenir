# 🛍️ Devenir - Fashion E-commerce Platform

A modern, full-stack MERN application for an online men's fashion store with advanced features including AI-powered recommendations, multi-gateway payments, and professional admin dashboard.

## 🚀 Live Deployment

- **Frontend**: https://devenir-demo.vercel.app
- **Backend**: https://nguyenlehuy-vivobook-asuslaptop-x512fa-a512fa.tail86e288.ts.net/devenir
- **API**: https://nguyenlehuy-vivobook-asuslaptop-x512fa-a512fa.tail86e288.ts.net/devenir/api

## 🎯 Key Features

### For Customers

- ✅ User authentication (Google OAuth + Email/Password)
- ✅ Email verification system
- ✅ Product browsing with advanced filters
- ✅ Shopping cart with persistent storage
- ✅ Multi-gateway payment (PayOS, Coinbase)
- ✅ Order tracking and history
- ✅ AI chatbot for product recommendations
- ✅ Product reviews and ratings
- ✅ Responsive design (Mobile/Tablet/Desktop)

### For Admin

- ✅ Complete dashboard with analytics
- ✅ Product management (CRUD, inventory, variants)
- ✅ Order management and tracking
- ✅ Customer management
- ✅ Promotion and voucher system
- ✅ AI-powered admin assistant
- ✅ Real-time order notifications
- ✅ Business metrics and charts

### Technical Features

- ✅ JWT authentication with refresh tokens
- ✅ MongoDB Atlas cloud database
- ✅ Cloudinary for image optimization
- ✅ n8n for workflow automation
- ✅ OpenAI integration (RAG)
- ✅ CORS configuration for multiple origins
- ✅ Comprehensive error handling
- ✅ Security best practices

## 🏗️ Project Structure

```
devenir/
├── client/              # React + Vite Frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── contexts/     # React contexts (Auth)
│   │   ├── pages/        # Page components
│   │   ├── services/     # API service
│   │   └── App.jsx       # Main app component
│   ├── .env.local        # Client environment variables
│   └── vite.config.js    # Vite configuration
│
├── server/              # Node.js + Express Backend
│   ├── routes/          # API routes
│   ├── controllers/      # Business logic
│   ├── models/          # Database schemas
│   ├── middleware/      # Custom middleware
│   ├── config/          # Database config
│   ├── .env             # Server environment variables
│   └── server.js        # Main server file
│
├── admin/               # Admin Dashboard (React + Vite)
│   ├── src/
│   │   ├── components/  # Admin components
│   │   └── pages/       # Dashboard pages
│   ├── .env.local       # Admin environment variables
│   └── vite.config.ts   # Vite configuration
│
├── DEPLOYMENT_GUIDE.md           # Complete deployment guide
├── DEPLOYMENT_CHECKLIST.md       # Deployment checklist
├── QUICK_REFERENCE.md            # Quick reference
├── SETUP_SUMMARY.md              # Configuration summary
├── setup-deployment.sh           # Linux/Mac setup script
├── setup-deployment.ps1          # Windows PowerShell script
└── test-deployment.js            # Connectivity test tool
```

## 🛠️ Tech Stack

### Frontend

- **React 19.1.1** - UI library
- **Vite** - Build tool (fast development)
- **React Router v7** - Client-side routing
- **Axios** - HTTP client
- **CSS Modules** - Component-scoped styling
- **Responsive Design** - Mobile-first approach

### Backend

- **Node.js** - Runtime
- **Express.js** - Web framework
- **MongoDB Atlas** - Cloud database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **Google OAuth 2.0** - Social login

### Additional Services

- **Vercel** - Frontend hosting
- **Tailscale** - VPN for secure server access
- **Cloudinary** - Image hosting
- **PayOS** - Vietnamese bank payments
- **Coinbase Commerce** - Crypto payments
- **OpenAI API** - AI features
- **n8n** - Workflow automation
- **Gmail SMTP** - Email notifications

## 📦 Installation

### Prerequisites

- Node.js 16+ and npm
- MongoDB Atlas account
- Google Cloud Console credentials
- Vercel account (for deployment)
- Tailscale account (for server deployment)

### Local Development

1. **Clone the repository**

```bash
git clone <repository-url>
cd devenir
```

2. **Install dependencies**

```bash
cd server && npm install
cd ../client && npm install
cd ../admin && npm install
```

3. **Configure environment variables**

**Server (.env)**:

```dotenv
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
# ... (see DEPLOYMENT_GUIDE.md for all variables)
```

**Client (.env.local)**:

```dotenv
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_API_URL=http://localhost:5000/api
```

**Admin (.env.local)**:

```dotenv
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_API_URL=http://localhost:5000/api
```

4. **Start development servers**

```bash
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend
cd client
npm run dev

# Terminal 3 - Admin (optional)
cd admin
npm run dev
```

5. **Open in browser**

- Client: http://localhost:5174
- Admin: http://localhost:5173
- API: http://localhost:5000

## 🚀 Deployment

### Server Deployment (Tailscale)

```bash
cd server
npm install
NODE_ENV=production npm start
```

Server accessible at: https://nguyenlehuy-vivobook-asuslaptop-x512fa-a512fa.tail86e288.ts.net/devenir

### Client Deployment (Vercel)

```bash
cd client
npm install -g vercel
vercel --prod
```

Client accessible at: https://devenir-demo.vercel.app

### Admin Deployment (Vercel)

```bash
cd admin
vercel --prod
```

For detailed deployment instructions, see `DEPLOYMENT_GUIDE.md`.

## 🔐 Security Features

- ✅ HTTPS enforced in production
- ✅ JWT authentication with expiration
- ✅ Password hashing (bcrypt)
- ✅ Email verification required
- ✅ CORS configured for known domains
- ✅ Environment variables for sensitive data
- ✅ Input validation on all endpoints
- ✅ Secure cookie options

## 📱 Responsive Design

The application is fully responsive and tested on:

- 📱 iPhone SE (375px)
- 📱 iPhone 12-15 (390px+)
- 📱 Samsung Galaxy (360px+)
- 📱 iPad (768px+)
- 💻 Desktop (1024px+)

See `client/RESPONSIVE_DESIGN_GUIDE.md` for details.

## 🧪 Testing

### Test Connectivity

```bash
node test-deployment.js
```

### Test API Endpoints

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## 📚 Documentation

- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Quick start guide
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Complete deployment guide
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Pre/post deployment checklist
- **[SETUP_SUMMARY.md](SETUP_SUMMARY.md)** - Configuration overview
- **[client/RESPONSIVE_DESIGN_GUIDE.md](client/RESPONSIVE_DESIGN_GUIDE.md)** - Mobile optimization
- **[client/AUTH_SETUP.md](client/AUTH_SETUP.md)** - Authentication system

## 🔧 Available Scripts

### Server

```bash
npm start              # Start development server
npm run dev           # Start with auto-reload
npm test              # Run tests
npm run build         # Build for production
```

### Client

```bash
npm run dev           # Start development server
npm run build         # Build for production
npm run preview       # Preview production build
npm run lint          # Run ESLint
```

### Admin

```bash
npm run dev           # Start development server
npm run build         # Build for production
npm run preview       # Preview production build
npm run lint          # Run linting
```

## 🐛 Troubleshooting

### CORS Error

- Check `VITE_API_URL` in `.env.local`
- Verify server CORS settings in `server.js`
- Ensure domain is in allowedOrigins list

### Google OAuth Error

- Verify `GOOGLE_CLIENT_ID` is correct
- Check redirect URI in Google Cloud Console
- Ensure cookies are not blocked

### Database Connection Error

- Verify `MONGO_URI` in `.env`
- Check IP whitelist in MongoDB Atlas
- Ensure network connection is stable

### Build Error on Vercel

- Set all environment variables in Vercel Dashboard
- Check `package.json` for correct build command
- Verify all dependencies are installed

## 📊 API Routes

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with credentials
- `POST /api/auth/google` - Login with Google
- `POST /api/auth/verify-email` - Verify email token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/logout` - Logout user

### Future Routes (To Implement)

- `/api/products` - Product management
- `/api/orders` - Order management
- `/api/users` - User management
- `/api/reviews` - Product reviews
- `/api/promotions` - Promotions and vouchers

## 🎓 Learning Resources

- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com)
- [MongoDB Manual](https://docs.mongodb.com)
- [Vite Guide](https://vitejs.dev)
- [JWT Introduction](https://jwt.io)
- [Vercel Docs](https://vercel.com/docs)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📝 License

This project is licensed under the MIT License.

## 💬 Support

For questions or issues:

1. Check the documentation files
2. Review the code comments
3. Open an issue on GitHub
4. Contact: dung1322003@gmail.com

## 🙏 Acknowledgments

- React and Vite communities
- MongoDB Atlas for cloud database
- Vercel for hosting
- All contributors and supporters

---

**Version**: 1.0  
**Last Updated**: November 19, 2024  
**Status**: Production Ready ✅

🎉 Thank you for using Devenir!
