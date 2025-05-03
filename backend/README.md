# Sero Backend

This is the backend server for the Sero social platform, built with Node.js, Express, and MongoDB.

## Features

- User authentication and authorization
- Profile management
- Social connections
- Posts and comments
- Events management
- Job/Gig listings
- Real-time messaging
- File uploads

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/sero-backend.git
cd sero-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add the following:
```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

4. Start the development server:
```bash
npm run server
```

## Project Structure

```
sero-backend/
├── config/                  # Configuration files
├── controllers/             # Request handlers
├── middleware/              # Custom middleware
├── models/                  # MongoDB schemas
├── routes/                  # API routes
├── utils/                   # Utility functions
├── socket/                  # Real-time communication
└── uploads/                 # File storage
```

## API Documentation

The API documentation is available at `/api-docs` when running the server in development mode.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 