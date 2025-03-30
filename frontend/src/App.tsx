import React from 'react';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { TodoList } from './components/TodoList';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
    },
});

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <TodoList />
        </ThemeProvider>
    );
}

export default App; 