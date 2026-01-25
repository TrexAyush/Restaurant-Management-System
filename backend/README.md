# Restaurant Management System

A comprehensive restaurant management system built with Node.js, TypeScript, Express.js, React, and PostgreSQL.

## Features

- **User Authentication & Authorization**: Role-based access control for Admin, Manager, Waiter, Kitchen Staff, and Cashier
- **Menu Management**: Complete CRUD operations for menu items with categorization and availability control
- **Table Management**: Real-time table status tracking and capacity management
- **Order Management**: Full order lifecycle from placement to completion with status tracking
- **Billing System**: Automated bill generation with tax calculations and PDF invoices
- **Inventory Management**: Stock tracking with automatic deduction and low-stock alerts
- **Reporting & Analytics**: Sales reports, item popularity tracking, and revenue analysis

## Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Knex.js ORM
- **Authentication**: JWT-based authentication
- **Real-time**: WebSocket for live updates
- **Testing**: Jest with fast-check for property-based testing

### Frontend
- **Framework**: React with TypeScript
- **UI Library**: Material-UI (MUI)
- **Routing**: React Router
- **State Management**: React Context (expandable to Redux if needed)
- **HTTP Client**: Axios

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd restaurant-management-system
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   cp frontend/.env.example frontend/.env
   ```
   
   Edit the `.env` files with your database credentials and configuration.

5. **Set up the database**
   ```bash
   # Create database
   createdb restaurant_management
   
   # Run migrations
   npm run migrate
   
   # Seed initial data (optional)
   npm run seed
   ```

### Development

1. **Start the development servers**
   ```bash
   npm run dev
   ```
   
   This will start both the backend server (port 3001) and frontend development server (port 3000).

2. **Run tests**
   ```bash
   npm test
   ```

3. **Build for production**
   ```bash
   npm run build
   ```

### Available Scripts

- `npm run dev` - Start both backend and frontend in development mode
- `npm run dev:backend` - Start only the backend server
- `npm run dev:frontend` - Start only the frontend development server
- `npm run build` - Build both backend and frontend for production
- `npm start` - Start the production server
- `npm test` - Run the test suite
- `npm run migrate` - Run database migrations
- `npm run migrate:rollback` - Rollback the last migration

## Project Structure

```
├── src/                    # Backend source code
│   ├── config/            # Configuration files
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Express middleware
│   ├── models/           # Data models and types
│   ├── services/         # Business logic services
│   ├── database/         # Database migrations and seeds
│   ├── utils/            # Utility functions
│   └── test/             # Test setup and utilities
├── frontend/             # React frontend application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── context/      # React context providers
│   │   ├── config/       # Frontend configuration
│   │   └── utils/        # Frontend utilities
├── dist/                 # Compiled backend code
└── docs/                 # Documentation
```

## API Documentation

The API follows RESTful conventions with the following main endpoints:

- `/api/auth/*` - Authentication and user management
- `/api/menu/*` - Menu item management
- `/api/tables/*` - Table management
- `/api/orders/*` - Order management
- `/api/bills/*` - Billing and payment processing
- `/api/inventory/*` - Inventory management
- `/api/reports/*` - Analytics and reporting

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.