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
                When showing todos, format them nicely with bullet points.`,
            } as ChatCompletionSystemMessageParam,
            {
                role: 'user',
                content: message,
            } as ChatCompletionUserMessageParam,
        ];

        console.log('Messages being sent:', JSON.stringify(messages, null, 2));

        try {
            if (stream) {
                console.log('Creating streaming completion...');
                const completion = await openai.chat.completions.create({
                    model: 'gpt-4o',
                    messages,
                    functions,
                    stream: false, // Force non-streaming for initial completion
                });
                console.log('Initial completion received:', JSON.stringify(completion.choices[0].message, null, 2));

                const response = completion.choices[0].message;
                if (response.function_call) {
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

                    console.log('Creating final streaming completion...');
                    const finalStream = await openai.chat.completions.create({
                        model: 'gpt-4o',
                        messages: [...messages, assistantMessage, functionMessage],
                        stream: true,
                    });

                    console.log('Starting stream processing...');
                    let fullResponse = '';
                    for await (const chunk of finalStream) {
                        const content = chunk.choices[0]?.delta?.content || '';
                        fullResponse += content;
                        console.log('Stream chunk received:', content);
                    }
                    console.log('Stream processing complete. Full response:', fullResponse);
                    return fullResponse;
                } else {
                    // If no function call, stream the response directly
                    const directStream = await openai.chat.completions.create({
                        model: 'gpt-4o',
                        messages,
                        stream: true,
                    });

                    console.log('Starting direct stream processing...');
                    let fullResponse = '';
                    for await (const chunk of directStream) {
                        const content = chunk.choices[0]?.delta?.content || '';
                        fullResponse += content;
                        console.log('Stream chunk received:', content);
                    }
                    console.log('Stream processing complete. Full response:', fullResponse);
                    return fullResponse;
                }
            } else {
                console.log('Creating regular completion...');
                const completion = await openai.chat.completions.create({
                    model: 'gpt-4o',
                    messages,
                    functions,
                });
                console.log('Completion received:', JSON.stringify(completion.choices[0].message, null, 2));

                const response = completion.choices[0].message;
                if (response.function_call) {
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

                    console.log('Creating final completion with function result...');
                    const finalCompletion = await openai.chat.completions.create({
                        model: 'gpt-4o',
                        messages: [...messages, assistantMessage, functionMessage],
                    });
                    console.log('Final completion received:', JSON.stringify(finalCompletion.choices[0].message, null, 2));
                    return finalCompletion.choices[0].message.content || '';
                }

                console.log('No function call, returning direct response');
                return response.content || '';
            }
        } catch (error) {
            console.error('Error in processMessage:', error);
            throw error;
        } finally {
            console.log('=== End Chatbot Request Debug ===\n');
        }
    },
}; 