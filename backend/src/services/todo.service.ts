import { Todo } from '../models/Todo';
import { AppDataSource } from '../config/data-source';

const todoRepository = AppDataSource.getRepository(Todo);

export const todoService = {
    async getAllTodos(): Promise<Todo[]> {
        console.log('\n=== Todo Service: getAllTodos ===');
        try {
            const todos = await todoRepository.find();
            console.log('Found todos:', todos.length);
            console.log('Todos:', JSON.stringify(todos, null, 2));
            return todos;
        } catch (error) {
            console.error('Error in getAllTodos:', error);
            throw error;
        } finally {
            console.log('=== End getAllTodos ===\n');
        }
    },

    async createTodo(todo: Partial<Todo>): Promise<Todo> {
        console.log('\n=== Todo Service: createTodo ===');
        console.log('Creating todo with data:', JSON.stringify(todo, null, 2));
        try {
            const newTodo = todoRepository.create(todo);
            const savedTodo = await todoRepository.save(newTodo);
            console.log('Todo created successfully:', JSON.stringify(savedTodo, null, 2));
            return savedTodo;
        } catch (error) {
            console.error('Error in createTodo:', error);
            throw error;
        } finally {
            console.log('=== End createTodo ===\n');
        }
    },

    async updateTodo(id: number, todo: Partial<Todo>): Promise<Todo | null> {
        console.log('\n=== Todo Service: updateTodo ===');
        console.log('Updating todo ID:', id);
        console.log('Update data:', JSON.stringify(todo, null, 2));
        try {
            const existingTodo = await todoRepository.findOneBy({ id });
            if (!existingTodo) {
                console.log('Todo not found with ID:', id);
                return null;
            }
            const updatedTodo = await todoRepository.save({
                ...existingTodo,
                ...todo,
            });
            console.log('Todo updated successfully:', JSON.stringify(updatedTodo, null, 2));
            return updatedTodo;
        } catch (error) {
            console.error('Error in updateTodo:', error);
            throw error;
        } finally {
            console.log('=== End updateTodo ===\n');
        }
    },

    async deleteTodo(id: number): Promise<boolean> {
        console.log('\n=== Todo Service: deleteTodo ===');
        console.log('Attempting to delete todo ID:', id);
        try {
            const result = await todoRepository.delete(id);
            const success = result.affected ? result.affected > 0 : false;
            console.log('Delete operation result:', success);
            return success;
        } catch (error) {
            console.error('Error in deleteTodo:', error);
            throw error;
        } finally {
            console.log('=== End deleteTodo ===\n');
        }
    }
}; 