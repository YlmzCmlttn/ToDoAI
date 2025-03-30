import { Request, Response } from 'express';
import { chatbotService } from '../services/chatbot.service';

export const chatbotController = {
    async processMessage(req: Request, res: Response): Promise<void> {
        try {
            console.log('\n=== Chatbot Controller: processMessage ===');
            const { message, stream = false } = req.body;
            console.log('Request body:', { message, stream });

            if (!message) {
                console.log('No message provided');
                res.status(400).json({ error: 'Message is required' });
                return;
            }

            const response = await chatbotService.processMessage(message, stream);
            console.log('Response received:', response);

            if (stream) {
                console.log('Sending streaming response');
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');
                res.write(`data: ${JSON.stringify({ content: response })}\n\n`);
                res.end();
            } else {
                console.log('Sending regular response');
                res.json({ content: response });
            }
        } catch (error) {
            console.error('Error in chatbot controller:', error);
            res.status(500).json({ error: 'Failed to process message' });
        } finally {
            console.log('=== End Chatbot Controller: processMessage ===\n');
        }
    },
}; 