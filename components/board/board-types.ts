export interface Task {
    id: string;
    number: number;
    summary: string;
    description?: string;
    priority: string;
    tags: string[];
    dueDate?: string;
    estimate?: string;
    createdAt: string;
    updatedAt: string;
    sprintId?: string | null;
    assignee?: {
        id: string;
        name?: string;
        email: string;
        avatar?: string;
    };
    workflowId?: string | null;
    workflowStatusId?: string | null;
    workflowStatus?: {
        id: string;
        key: string;
        name: string;
        category: string;
        color?: string | null;
        statusRefId?: string | null;
    } | null;
    status: {
        id: string;
        name: string;
        key: string;
        color?: string;
    };
}

export interface Status {
    id: string;
    name: string;
    key: string;
    color?: string;
    order: number;
    isStart: boolean;
    isDone: boolean;
    wipLimit?: number;
    hidden?: boolean;
}

export interface BoardData {
    tasks: Task[];
    statuses: Status[];
    sprints: any[];
    board: any;
    space: any;
}
