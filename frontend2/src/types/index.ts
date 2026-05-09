// These TypeScript interfaces define the "shape" of our data
// They match exactly the models we defined in the backend

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  token?: string;
}

export interface Meeting {
  _id: string;
  title: string;
  date: string;
  rawNotes: string;
  summary: string;
  participants: User[];
  createdBy: User;
  isProcessed: boolean;
  createdAt: string;
}

export interface ActionItem {
  _id: string;
  meetingId: string;
  description: string;
  assigneeName: string;
  assignee: User | null;
  dueDate: string | null;
  dueTime: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'done';
  riskFlag: boolean;
  comments: Comment[];
  createdAt: string;
}

export interface Comment {
  _id: string;
  text: string;
  author: User;
  createdAt: string;
}

export interface Analytics {
  stats: { _id: string; count: number }[];
  riskItems: number;
  overdueItems: number;
}