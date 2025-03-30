export interface Todo {
    id: number;
    name: string;
    description?: string;
    dueDate: Date | null;
    isDone: boolean;
    createdAt: Date;
    updatedAt: Date;
} 