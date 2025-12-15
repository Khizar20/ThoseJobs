# UstaadOnCall 🏠

**Premium Local Services Marketplace**

UstaadOnCall is a comprehensive service marketplace platform that connects customers with verified local service providers. Built with modern web technologies, it offers a seamless experience for both service seekers and providers across Pakistan.

![UstaadOnCall](https://img.shields.io/badge/UstaadOnCall-Premium%20Services-blue)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue)
![Vite](https://img.shields.io/badge/Vite-5.4.1-purple)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green)

## 🌟 Features

### For Customers
- **🔍 Service Discovery**: Browse and search through verified service providers
- **📍 Location-Based Services**: Find nearby providers using GPS and Google Maps integration
- **💬 Real-Time Chat**: Communicate directly with service providers
- **⭐ Reviews & Ratings**: Read reviews and rate service providers
- **📱 Live Requests**: Create urgent service requests with real-time bidding
- **❤️ Favorites System**: Save and manage favorite service providers
- **🌍 Bilingual Support**: Full English and Urdu language support
- **💳 Multiple Payment Options**: Various payment methods including cash and digital payments

### For Service Providers
- **📊 Provider Dashboard**: Comprehensive dashboard for managing services and bookings
- **💰 Earnings Tracking**: Monitor income and payment history
- **🔔 Real-Time Notifications**: Instant alerts for new requests and messages
- **📋 Service Management**: Manage service categories and pricing
- **📈 Performance Analytics**: Track ratings, reviews, and job completion rates
- **🎯 Bid System**: Participate in live request bidding
- **✅ Verification System**: Get verified to build customer trust

### Admin Features
- **🛡️ Admin Panel**: Comprehensive admin dashboard
- **👥 User Management**: Manage customers and service providers
- **📊 Analytics**: Platform-wide analytics and reporting
- **⚙️ Settings Management**: Configure platform settings and policies

## 🛠️ Technology Stack

### Frontend
- **React 18.3.1** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **React Router DOM** - Client-side routing
- **Radix UI** - Accessible UI components
- **Shadcn/ui** - Beautiful, accessible component library

### Backend & Database
- **Supabase** - Backend as a Service (BaaS)
- **PostgreSQL** - Robust relational database
- **Row Level Security (RLS)** - Data security and access control
- **Real-time Subscriptions** - Live updates and notifications

### APIs & Services
- **Google Maps API** - Location services and mapping
- **EmailJS** - Email notifications
- **Python FastAPI** - Backend proxy services
- **Google Maps Geocoding** - Address to coordinates conversion

### Development Tools
- **ESLint** - Code linting and quality
- **Prettier** - Code formatting
- **TypeScript** - Static type checking
- **Vite** - Fast development server

## 📋 Service Categories

- 🔧 **Plumbing** - Pipe installation, leak repair, drain cleaning
- ⚡ **Electrical** - Wiring, lighting, circuit repairs
- 🧹 **Home Cleaning** - Room, bathroom, kitchen cleaning
- 💄 **Beauty & Wellness** - Haircut, facial, manicure, makeup
- 🚗 **Car Wash** - Exterior wash, interior cleaning, waxing
- 🔨 **Appliance Repair** - Home appliance maintenance and repair
- 🌿 **Gardening** - Landscaping, plant care, garden maintenance
- 🎨 **Painting** - Interior and exterior painting services

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Python 3.8+** (for backend services)
- **Supabase Account**
- **Google Maps API Key**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/UstaadOnCall.git
   cd UstaadOnCall
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install Python dependencies** (for backend services)
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Setup**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
   VITE_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
   VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
   ```

5. **Database Setup**
   
   Run the SQL migrations in your Supabase dashboard:
   ```bash
   # Run these SQL files in order:
   # 1. database_migration.sql
   # 2. reviews_migration.sql
   # 3. user_favorites_schema.sql
   # 4. payment_system_migration.sql
   # 5. live_requests_schema.sql
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Start the Python backend** (optional, for enhanced features)
   ```bash
   python run_google_maps_proxy.py
   ```

The application will be available at `http://localhost:8080`

## 📁 Project Structure

```
UstaadOnCall/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Base UI components (shadcn/ui)
│   │   ├── Chat.tsx        # Real-time chat functionality
│   │   ├── InteractiveGoogleMap.tsx  # Google Maps integration
│   │   └── ...
│   ├── pages/              # Application pages/routes
│   │   ├── Index.tsx       # Landing page
│   │   ├── Services.tsx    # Service marketplace
│   │   ├── UserDashboard.tsx
│   │   ├── ProviderDashboard.tsx
│   │   └── ...
│   ├── lib/                # Utility functions and services
│   │   ├── supabaseClient.ts
│   │   ├── locationUtils.ts
│   │   ├── translations.ts
│   │   └── ...
│   ├── contexts/           # React contexts
│   │   └── LanguageContext.tsx
│   ├── hooks/              # Custom React hooks
│   └── types/              # TypeScript type definitions
├── backend/                # Python backend services
│   ├── main.py
│   └── google_maps_proxy.py
├── public/                 # Static assets
├── database_migrations/    # SQL migration files
└── documentation/         # Project documentation
```

## 🔧 Configuration

### Supabase Setup
1. Create a new Supabase project
2. Run the provided SQL migrations
3. Configure Row Level Security (RLS) policies
4. Set up authentication providers
5. Configure storage buckets for file uploads

### Google Maps Setup
1. Get a Google Maps API key
2. Enable the following APIs:
   - Maps JavaScript API
   - Geocoding API
   - Places API
3. Add your domain to the API key restrictions

## 🌍 Internationalization

The platform supports both English and Urdu languages:

- **Translation System**: Comprehensive translation keys for all UI elements
- **RTL Support**: Right-to-left text support for Urdu
- **Cultural Adaptation**: Localized content and currency formatting
- **Easy Language Switching**: Toggle between languages seamlessly

## 📱 Mobile Responsiveness

- **Responsive Design**: Works perfectly on all device sizes
- **Touch-Friendly**: Optimized for mobile interactions
- **Progressive Web App**: Can be installed on mobile devices
- **Offline Support**: Basic functionality works offline

## 🔐 Security Features

- **Authentication**: Secure user authentication with Supabase Auth
- **Authorization**: Role-based access control
- **Data Validation**: Input validation on both client and server
- **Password Hashing**: Secure password storage with SHA-256
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Input sanitization

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- UserLogin.test.tsx
```

## 📦 Build & Deployment

### Development Build
```bash
npm run build:dev
```

### Production Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Deployment Options
- **Vercel**: Easy deployment with automatic builds
- **Netlify**: Static site hosting with serverless functions
- **AWS S3 + CloudFront**: Scalable cloud hosting
- **Docker**: Containerized deployment

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Use meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Follow the existing code style

## 📄 API Documentation

### Authentication Endpoints
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout

### User Endpoints
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/favorites` - Get user favorites

### Provider Endpoints
- `GET /api/providers` - Get all providers
- `GET /api/providers/nearby` - Get nearby providers
- `POST /api/providers/register` - Register as provider

### Booking Endpoints
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get user bookings
- `PUT /api/bookings/:id` - Update booking status

## 🐛 Troubleshooting

### Common Issues

**1. Google Maps not loading**
- Check API key configuration
- Verify API key has required permissions
- Check browser console for errors

**2. Supabase connection issues**
- Verify environment variables
- Check Supabase project status
- Ensure RLS policies are configured

**3. Build failures**
- Clear node_modules and reinstall
- Check for TypeScript errors
- Verify all dependencies are installed

## 📊 Performance

- **Lighthouse Score**: 95+ for performance
- **Bundle Size**: Optimized with code splitting
- **Loading Time**: < 3 seconds on 3G networks
- **SEO Optimized**: Meta tags and structured data

## 📞 Support

For support and questions:

- **Email**: support@ustaadoncall.com
- **Documentation**: Check the `/docs` folder
- **Issues**: Use GitHub Issues for bug reports
- **Discussions**: Use GitHub Discussions for questions

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** for the excellent backend-as-a-service platform
- **Google Maps** for location services
- **Shadcn/ui** for beautiful UI components
- **Radix UI** for accessible components
- **Tailwind CSS** for utility-first styling
- **React** team for the amazing framework

## 📈 Roadmap

### Upcoming Features
- [ ] **AI-Powered Matching** - Smart provider recommendations
- [ ] **Video Consultations** - Remote service consultations
- [ ] **Advanced Analytics** - Detailed business insights
- [ ] **Multi-City Expansion** - Support for multiple cities
- [ ] **Mobile App** - Native iOS and Android apps
- [ ] **Subscription Plans** - Premium features for providers
- [ ] **Advanced Booking** - Recurring bookings and scheduling

---

**Made with ❤️ for the Pakistani service marketplace**

*UstaadOnCall - Connecting Communities, One Service at a Time*