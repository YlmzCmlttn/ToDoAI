# TodoAI - A Modern Todo Application

A full-stack Todo application built with TypeScript, React, Node.js, PostgreSQL, and Docker.

## Features

- Create, read, update, and delete todo items
- Task management with name, description, and due date
- Mark tasks as complete/incomplete
- Modern and responsive UI
- Type-safe development with TypeScript
- Containerized deployment with Docker

## Tech Stack

### Frontend
- React
- TypeScript
- Material UI
- React Query for data fetching

### Backend
- Node.js
- TypeScript
- Express
- TypeORM
- PostgreSQL

### DevOps
- Docker
- Docker Compose

## Getting Started

### Prerequisites
- Docker
- Docker Compose
- Node.js (for local development)

### Running the Application

1. Clone the repository:
```bash
git clone https://github.com/yourusername/TodoAI.git
cd TodoAI
```

2. Start the application using Docker Compose:
```bash
docker-compose up --build
```

3. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

### Development

To run the application in development mode:

1. Start the backend:
```bash
cd backend
npm install
npm run dev
```

2. Start the frontend:
```bash
cd frontend
npm install
npm start
```

## Project Structure

```
/project-root
├── /frontend
│   ├── Dockerfile
│   ├── package.json
│   ├── public/
│   └── src/
├── /backend
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── migrations/
│   │   └── app.ts
└── docker-compose.yml
```

## API Endpoints

- GET /api/todos - Get all todos
- POST /api/todos - Create a new todo
- PUT /api/todos/:id - Update a todo
- DELETE /api/todos/:id - Delete a todo

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.