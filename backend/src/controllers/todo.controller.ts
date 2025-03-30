import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Todo } from '../models/Todo';

const todoRepository = AppDataSource.getRepository(Todo);

export const todoController = {
    // Get all todos
    getAllTodos: async (_req: Request, res: Response) => {
        try {
            const todos = await todoRepository.find();
            return res.json(todos);
        } catch (error) {
            return res.status(500).json({ message: 'Error fetching todos', error });
        }
    },

    // Get a single todo by ID
    getTodoById: async (req: Request, res: Response) => {
        try {
            const todo = await todoRepository.findOneBy({ id: parseInt(req.params.id) });
            if (!todo) {
                return res.status(404).json({ message: 'Todo not found' });
            }
            return res.json(todo);
        } catch (error) {
            return res.status(500).json({ message: 'Error fetching todo', error });
        }
    },

    // Create a new todo
    createTodo: async (req: Request, res: Response) => {
        try {
            const todo = todoRepository.create(req.body);
            const result = await todoRepository.save(todo);
            return res.status(201).json(result);
        } catch (error) {
            return res.status(500).json({ message: 'Error creating todo', error });
        }
    },

    // Update a todo
    updateTodo: async (req: Request, res: Response) => {
        try {
            const todo = await todoRepository.findOneBy({ id: parseInt(req.params.id) });
            if (!todo) {
                return res.status(404).json({ message: 'Todo not found' });
            }
            todoRepository.merge(todo, req.body);
            const result = await todoRepository.save(todo);
            return res.json(result);
        } catch (error) {
            return res.status(500).json({ message: 'Error updating todo', error });
        }
    },

    // Delete a todo
    deleteTodo: async (req: Request, res: Response) => {
        try {
            const todo = await todoRepository.findOneBy({ id: parseInt(req.params.id) });
            if (!todo) {
                return res.status(404).json({ message: 'Todo not found' });
            }
            await todoRepository.remove(todo);
            return res.status(204).send();
        } catch (error) {
            return res.status(500).json({ message: 'Error deleting todo', error });
        }
    }
}; 