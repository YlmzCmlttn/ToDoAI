import React, { useState } from 'react';
import {
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Checkbox,
    TextField,
    Button,
    Box,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Paper,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { Todo } from '../types/Todo';
import { todoService } from '../services/todo.service';

export const TodoList: React.FC = () => {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [open, setOpen] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
    const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
    const [newTodo, setNewTodo] = useState({
        name: '',
        description: '',
        dueDate: '',
    });

    React.useEffect(() => {
        loadTodos();
    }, []);

    const loadTodos = async () => {
        try {
            const data = await todoService.getAllTodos();
            setTodos(data);
        } catch (error) {
            console.error('Error loading todos:', error);
        }
    };

    const handleToggle = async (todo: Todo) => {
        try {
            await todoService.updateTodo(todo.id, { isDone: !todo.isDone });
            setTodos(todos.map(t => t.id === todo.id ? { ...t, isDone: !t.isDone } : t));
        } catch (error) {
            console.error('Error toggling todo:', error);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await todoService.deleteTodo(id);
            setTodos(todos.filter(t => t.id !== id));
        } catch (error) {
            console.error('Error deleting todo:', error);
        }
    };

    const handleEdit = (todo: Todo) => {
        setEditingTodo(todo);
        setNewTodo({
            name: todo.name,
            description: todo.description || '',
            dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : '',
        });
        setOpen(true);
    };

    const handleSubmit = async () => {
        try {
            console.log('Submitting todo:', newTodo);
            if (editingTodo) {
                console.log('Updating existing todo:', editingTodo.id);
                await todoService.updateTodo(editingTodo.id, {
                    name: newTodo.name,
                    description: newTodo.description,
                    dueDate: newTodo.dueDate ? new Date(newTodo.dueDate) : null,
                });
                setTodos(todos.map(t => t.id === editingTodo.id ? {
                    ...t,
                    name: newTodo.name,
                    description: newTodo.description,
                    dueDate: newTodo.dueDate ? new Date(newTodo.dueDate) : null,
                } : t));
            } else {
                console.log('Creating new todo');
                const todo = await todoService.createTodo({
                    name: newTodo.name,
                    description: newTodo.description,
                    dueDate: newTodo.dueDate ? new Date(newTodo.dueDate) : null,
                    isDone: false,
                });
                console.log('Created todo:', todo);
                setTodos([...todos, todo]);
            }
            handleClose();
        } catch (error) {
            console.error('Error saving todo:', error);
        }
    };

    const handleClose = () => {
        setOpen(false);
        setEditingTodo(null);
        setNewTodo({
            name: '',
            description: '',
            dueDate: '',
        });
    };

    const handleTodoClick = (todo: Todo) => {
        setSelectedTodo(todo);
        setDetailsOpen(true);
    };

    const handleDetailsClose = () => {
        setDetailsOpen(false);
        setSelectedTodo(null);
    };

    return (
        <Box sx={{ maxWidth: 600, margin: '0 auto', padding: 2 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Todo List
            </Typography>
            <Button
                variant="contained"
                color="primary"
                onClick={() => setOpen(true)}
                sx={{ mb: 2 }}
            >
                Add Todo
            </Button>
            <List>
                {todos.map((todo) => (
                    <ListItem
                        key={todo.id}
                        divider
                        sx={{
                            textDecoration: todo.isDone ? 'line-through' : 'none',
                            opacity: todo.isDone ? 0.7 : 1,
                            cursor: 'pointer',
                        }}
                        onClick={() => handleTodoClick(todo)}
                    >
                        <Checkbox
                            checked={todo.isDone}
                            onChange={() => handleToggle(todo)}
                            color="primary"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <ListItemText
                            primary={todo.name}
                        />
                        <ListItemSecondaryAction>
                            <IconButton
                                edge="end"
                                aria-label="edit"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(todo);
                                }}
                                sx={{ mr: 1 }}
                            >
                                <EditIcon />
                            </IconButton>
                            <IconButton
                                edge="end"
                                aria-label="delete"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(todo.id);
                                }}
                            >
                                <DeleteIcon />
                            </IconButton>
                        </ListItemSecondaryAction>
                    </ListItem>
                ))}
            </List>

            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>
                    {editingTodo ? 'Edit Todo' : 'Add New Todo'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Name"
                        fullWidth
                        value={newTodo.name}
                        onChange={(e) => setNewTodo({ ...newTodo, name: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Description"
                        fullWidth
                        multiline
                        rows={4}
                        value={newTodo.description}
                        onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Due Date"
                        type="date"
                        fullWidth
                        value={newTodo.dueDate}
                        onChange={(e) => setNewTodo({ ...newTodo, dueDate: e.target.value })}
                        InputLabelProps={{
                            shrink: true,
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" color="primary">
                        {editingTodo ? 'Update' : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={detailsOpen} onClose={handleDetailsClose} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Todo Details
                </DialogTitle>
                <DialogContent>
                    {selectedTodo && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                {selectedTodo.name}
                            </Typography>
                            <Typography variant="body1" color="text.secondary" paragraph>
                                {selectedTodo.description || 'No description provided'}
                            </Typography>
                            {selectedTodo.dueDate && (
                                <Typography variant="body2" color="text.secondary">
                                    Due Date: {new Date(selectedTodo.dueDate).toLocaleDateString()}
                                </Typography>
                            )}
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Status: {selectedTodo.isDone ? 'Completed' : 'Pending'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Created: {new Date(selectedTodo.createdAt).toLocaleString()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Last Updated: {new Date(selectedTodo.updatedAt).toLocaleString()}
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDetailsClose}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}; 