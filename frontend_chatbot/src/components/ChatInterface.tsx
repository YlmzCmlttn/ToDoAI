import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    TextField,
    Button,
    Paper,
    Typography,
    Container,
    CircularProgress,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { chatbotService } from '../services/chatbot.service';

interface Message {
    content: string;
    isUser: boolean;
}

export const ChatInterface: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { content: userMessage, isUser: true }]);
        setIsLoading(true);

        let currentResponse = '';
        setMessages(prev => [...prev, { content: '', isUser: false }]);

        try {
            await chatbotService.sendMessage(userMessage, (content) => {
                currentResponse += content;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                        content: currentResponse,
                        isUser: false,
                    };
                    return newMessages;
                });
            });
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                    content: 'Sorry, there was an error processing your request.',
                    isUser: false,
                };
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container maxWidth="md" sx={{ height: '100vh', py: 4 }}>
            <Paper
                elevation={3}
                sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="h5" component="h1">
                        Todo AI Assistant
                    </Typography>
                </Box>

                <Box
                    sx={{
                        flex: 1,
                        overflow: 'auto',
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                    }}
                >
                    {messages.map((message, index) => (
                        <Box
                            key={index}
                            sx={{
                                display: 'flex',
                                justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                            }}
                        >
                            <Paper
                                elevation={1}
                                sx={{
                                    p: 2,
                                    maxWidth: '70%',
                                    backgroundColor: message.isUser ? 'primary.light' : 'background.paper',
                                    color: message.isUser ? 'primary.contrastText' : 'text.primary',
                                }}
                            >
                                <Typography variant="body1" component="div">
                                    {message.content}
                                </Typography>
                            </Paper>
                        </Box>
                    ))}
                    {isLoading && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                            <CircularProgress size={20} />
                        </Box>
                    )}
                    <div ref={messagesEndRef} />
                </Box>

                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{
                        p: 2,
                        borderTop: 1,
                        borderColor: 'divider',
                        display: 'flex',
                        gap: 1,
                    }}
                >
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Type your message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={!input.trim() || isLoading}
                        endIcon={<SendIcon />}
                    >
                        Send
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}; 