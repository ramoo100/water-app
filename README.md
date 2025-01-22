# Water Delivery Management System

A comprehensive mobile application system for managing water bottle delivery services.

## Project Structure

The project consists of three main components:
1. Customer Mobile App
2. Worker Mobile App
3. Admin Dashboard

## Features

### Customer App
- User registration and authentication
- Product catalog (water bottles)
- Order placement with location
- Order tracking
- Payment options (COD/Online)
- Rating system and customer support

### Worker App
- Worker authentication
- Order management and tracking
- Delivery status updates
- Order history

### Admin Dashboard
- Customer and order management
- Sales analytics and reporting
- Worker management
- Order assignment and tracking

## Technical Stack

- **Frontend**: React Native for mobile apps, React for admin dashboard
- **Backend**: Node.js with Express.js
- **Database**: MongoDB
- **Authentication**: JWT
- **Cloud Services**: AWS
- **Maps Integration**: Google Maps API
- **Payment Gateway**: Stripe

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
- Create a `.env` file
- Add necessary API keys and configuration

3. Run the development server:
```bash
npm run dev
```

## Project Status
Under development - Phase 1
app/
├── src/
│   ├── components/      # Reusable UI components
│   ├── screens/         # App screens
│   ├── navigation/      # Navigation configuration
│   ├── services/        # API and business logic
│   ├── utils/          # Helper functions
│   └── assets/         # Images, fonts, etc.
├── App.js              # Root component
└── package.json        # Project dependenciesapp/
├── src/
│   ├── components/      # Reusable UI components
│   ├── screens/         # App screens
│   ├── navigation/      # Navigation configuration
│   ├── services/        # API and business logic
│   ├── utils/          # Helper functions
│   └── assets/         # Images, fonts, etc.
├── App.js              # Root component
└── package.json        # Project dependenciesnpm install
npx expo start