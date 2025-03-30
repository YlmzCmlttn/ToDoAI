import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

export const chatbotService = {
    async sendMessage(message: string, onStream?: (content: string) => void) {
        try {
            if (onStream) {
                const response = await fetch(`${API_URL}/chatbot/message`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message, stream: true }),
                });

                const reader = response.body?.getReader();
                if (!reader) throw new Error('No reader available');

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = new TextDecoder().decode(value);
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = JSON.parse(line.slice(6));
                            onStream(data.content);
                        }
                    }
                }
            } else {
                const response = await axios.post(`${API_URL}/chatbot/message`, {
                    message,
                    stream: false,
                });
                return response.data.response;
            }
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    },
}; 