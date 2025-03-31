import OpenAI from 'openai';
import { Todo } from '../models/Todo';
import { todoService } from './todo.service';
import { ChatCompletionMessageParam, ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam, ChatCompletionAssistantMessageParam, ChatCompletionFunctionMessageParam } from 'openai/resources';
import { Stream } from 'openai/streaming';
import { ChatCompletionChunk } from 'openai/resources';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

type FunctionHandler = {
    getAllTodos: () => Promise<Todo[]>;
    createTodo: (params: { name: string; description?: string; dueDate?: string }) => Promise<Todo>;
    updateTodo: (params: { id: number; name?: string; description?: string; dueDate?: string; isDone?: boolean }) => Promise<Todo | null>;
    deleteTodo: (params: { id: number }) => Promise<boolean>;
    getTodosByDueDate: (params: { date: string }) => Promise<Todo[]>;
    getUpcomingTodos: (params: { days: number }) => Promise<Todo[]>;
    getCurrentTime: () => Promise<{
        currentTime: string;
        currentDate: string;
        currentDayOfWeek: number;
        currentMonth: number;
        currentYear: number;
        currentHour: number;
        currentMinute: number;
        currentSecond: number;
        timezone: string;
    }>;
};

const functions = [
    {
        name: 'getAllTodos',
        description: 'Get all todos from the list',
        parameters: {
            type: 'object',
            properties: {},
            required: [],
        },
    },
    {
        name: 'createTodo',
        description: 'Create a new todo item',
        parameters: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    description: 'Name of the todo',
                },
                description: {
                    type: 'string',
                    description: 'Description of the todo',
                },
                dueDate: {
                    type: 'string',
                    description: 'Due date of the todo in ISO format',
                },
            },
            required: ['name'],
        },
    },
    {
        name: 'updateTodo',
        description: 'Update an existing todo item',
        parameters: {
            type: 'object',
            properties: {
                id: {
                    type: 'number',
                    description: 'ID of the todo to update',
                },
                name: {
                    type: 'string',
                    description: 'New name of the todo',
                },
                description: {
                    type: 'string',
                    description: 'New description of the todo',
                },
                dueDate: {
                    type: 'string',
                    description: 'New due date of the todo in ISO format',
                },
                isDone: {
                    type: 'boolean',
                    description: 'Whether the todo is done',
                },
            },
            required: ['id'],
        },
    },
    {
        name: 'deleteTodo',
        description: 'Delete a todo item',
        parameters: {
            type: 'object',
            properties: {
                id: {
                    type: 'number',
                    description: 'ID of the todo to delete',
                },
            },
            required: ['id'],
        },
    },
    {
        name: 'getTodosByDueDate',
        description: 'Get todos due on a specific date',
        parameters: {
            type: 'object',
            properties: {
                date: {
                    type: 'string',
                    description: 'Date to filter todos by in ISO format',
                },
            },
            required: ['date'],
        },
    },
    {
        name: 'getUpcomingTodos',
        description: 'Get todos due in the next few days',
        parameters: {
            type: 'object',
            properties: {
                days: {
                    type: 'number',
                    description: 'Number of days to look ahead',
                },
            },
            required: ['days'],
        },
    },
    {
        name: 'getCurrentTime',
        description: 'Get the current time and date information',
        parameters: {
            type: 'object',
            properties: {},
            required: [],
        },
    },
];

const functionHandlers: FunctionHandler = {
    getAllTodos: async () => {
        return await todoService.getAllTodos();
    },
    createTodo: async (params: { name: string; description?: string; dueDate?: string }) => {
        return await todoService.createTodo({
            ...params,
            dueDate: params.dueDate ? new Date(params.dueDate) : undefined,
            isDone: false,
        });
    },
    updateTodo: async (params: { id: number; name?: string; description?: string; dueDate?: string; isDone?: boolean }) => {
        return await todoService.updateTodo(params.id, {
            ...params,
            dueDate: params.dueDate ? new Date(params.dueDate) : undefined,
        });
    },
    deleteTodo: async (params: { id: number }) => {
        return await todoService.deleteTodo(params.id);
    },
    getTodosByDueDate: async (params: { date: string }) => {
        const todos = await todoService.getAllTodos();
        const targetDate = new Date(params.date);
        return todos.filter((todo: Todo) => {
            if (!todo.dueDate) return false;
            const todoDate = new Date(todo.dueDate);
            return todoDate.toDateString() === targetDate.toDateString();
        });
    },
    getUpcomingTodos: async (params: { days: number }) => {
        const todos = await todoService.getAllTodos();
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + params.days);
        return todos.filter((todo: Todo) => {
            if (!todo.dueDate) return false;
            const todoDate = new Date(todo.dueDate);
            return todoDate >= today && todoDate <= futureDate;
        });
    },
    getCurrentTime: async () => {
        const now = new Date();
        return {
            currentTime: now.toISOString(),
            currentDate: now.toISOString().split('T')[0],
            currentDayOfWeek: now.getDay(), // 0 = Sunday, 1 = Monday, etc.
            currentMonth: now.getMonth() + 1, // 1-12
            currentYear: now.getFullYear(),
            currentHour: now.getHours(),
            currentMinute: now.getMinutes(),
            currentSecond: now.getSeconds(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    },
};

export const chatbotService = {
    async processMessage(message: string, stream: boolean = false): Promise<string | Stream<ChatCompletionChunk>> {
        console.log('\n=== Chatbot Request Debug ===');
        console.log('Message:', message);
        console.log('Stream mode:', stream);
        console.log('API Key present:', !!process.env.OPENAI_API_KEY);

        const messages: ChatCompletionMessageParam[] = [
            {
                role: 'system',
                content: `You are a helpful assistant that helps users manage their todo list. 
                You can create, update, delete, and query todos. 
                Always be friendly and concise in your responses. 
                When showing todos, format them nicely with bullet points.
                When a user asks for multiple actions, you should chain the function calls together.
                
                For time-based tasks (like "tomorrow", "next Monday", "next month"), you should:
                1. First call getCurrentTime to get the current time information
                2. Use that information to calculate the correct due date
                3. Then create or update the todo with the calculated date
                
                Examples of time calculations:
                - "tomorrow" = current date + 1 day
                - "next Monday" = next occurrence of Monday from current date
                - "next month" = first day of next month
                - "yesterday" = current date - 1 day
                
                Always convert relative dates to ISO format before creating or updating todos.`,
            } as ChatCompletionSystemMessageParam,
            {
                role: 'user',
                content: message,
            } as ChatCompletionUserMessageParam,
        ];

        console.log('Messages being sent:', JSON.stringify(messages, null, 2));

        try {
            if (stream) {
                let currentMessages = [...messages];
                let functionCallCount = 0;
                const maxFunctionCalls = 5; // Prevent infinite loops

                while (functionCallCount < maxFunctionCalls) {
                    const completion = await openai.chat.completions.create({
                        model: 'gpt-4o',
                        messages: currentMessages,
                        functions,
                        stream: false,
                    });
                    console.log('Completion received:', JSON.stringify(completion.choices[0].message, null, 2));

                    const response = completion.choices[0].message;
                    if (!response.function_call) {
                        // No more function calls, return the final response
                        return typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
                    }

                    console.log('Function call detected:', response.function_call.name);
                    const functionName = response.function_call.name as keyof FunctionHandler;
                    const functionArgs = JSON.parse(response.function_call.arguments);
                    console.log('Function arguments:', JSON.stringify(functionArgs, null, 2));

                    console.log('Executing function:', functionName);
                    const functionResult = await functionHandlers[functionName](functionArgs);
                    console.log('Function result:', JSON.stringify(functionResult, null, 2));

                    const assistantMessage: ChatCompletionAssistantMessageParam = {
                        role: 'assistant',
                        content: `I've executed the ${functionName} function. Here's the result:`,
                        function_call: {
                            name: functionName,
                            arguments: JSON.stringify(functionArgs),
                        },
                    };

                    const functionMessage: ChatCompletionFunctionMessageParam = {
                        role: 'function',
                        name: functionName,
                        content: JSON.stringify(functionResult),
                    };

                    currentMessages = [...currentMessages, assistantMessage, functionMessage];
                    functionCallCount++;
                }

                // If we've reached max function calls, return the last response
                const lastMessage = currentMessages[currentMessages.length - 1];
                return typeof lastMessage.content === 'string' ? lastMessage.content : JSON.stringify(lastMessage.content);
            } else {
                // Non-streaming mode implementation
                const completion = await openai.chat.completions.create({
                    model: 'gpt-4o',
                    messages,
                    functions,
                    stream: false,
                });

                return typeof completion.choices[0].message.content === 'string' 
                    ? completion.choices[0].message.content 
                    : JSON.stringify(completion.choices[0].message.content);
            }
        } catch (error) {
            console.error('Error in processMessage:', error);
            throw error;
        } finally {
            console.log('=== End Chatbot Request Debug ===\n');
        }
    },
}; 