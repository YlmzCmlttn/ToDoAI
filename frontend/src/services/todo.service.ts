import axios from 'axios';
import { Todo } from '../types/Todo';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

export const todoService = {
    getAllTodos: async (): Promise<Todo[]> => {
        console.log('Fetching all todos from:', `${API_URL}/todos`);
        const response = await axios.get(`${API_URL}/todos`);
        return response.data;
    },

    getTodoById: async (id: number): Promise<Todo> => {
        console.log('Fetching todo by id:', `${API_URL}/todos/${id}`);
        const response = await axios.get(`${API_URL}/todos/${id}`);
        return response.data;
    },

    createTodo: async (todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>): Promise<Todo> => {
        console.log('Creating todo at:', `${API_URL}/todos`, 'with data:', todo);
        const response = await axios.post(`${API_URL}/todos`, todo);
        console.log('Create todo response:', response.data);
        return response.data;
    },

    updateTodo: async (id: number, todo: Partial<Todo>): Promise<Todo> => {
        console.log('Updating todo at:', `${API_URL}/todos/${id}`, 'with data:', todo);
        const response = await axios.put(`${API_URL}/todos/${id}`, todo);
        return response.data;
    },

    deleteTodo: async (id: number): Promise<void> => {
        console.log('Deleting todo at:', `${API_URL}/todos/${id}`);
        await axios.delete(`${API_URL}/todos/${id}`);
    }
}; 