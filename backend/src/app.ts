import express from 'express';
import cors from 'cors';
import { AppDataSource } from './config/data-source';
import { todoController } from './controllers/todo.controller';
import { chatbotController } from './controllers/chatbot.controller';

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3002'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
const apiRouter = express.Router();

// Todo routes
apiRouter.get('/todos', todoController.getAllTodos);
apiRouter.post('/todos', todoController.createTodo);
apiRouter.put('/todos/:id', todoController.updateTodo);
apiRouter.delete('/todos/:id', todoController.deleteTodo);

// Chatbot routes
apiRouter.post('/chatbot/message', chatbotController.processMessage);

app.use('/api', apiRouter);

// Initialize database connection
const initializeDatabase = async () => {
    try {
        await AppDataSource.initialize();
        console.log('Database connection initialized');
    } catch (error) {
        console.error('Error connecting to the database:', error);
        process.exit(1);
    }
};

initializeDatabase();

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

export default app; 