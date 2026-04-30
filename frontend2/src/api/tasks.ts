import api from './axios';
import { ActionItem, Analytics } from '../types';

export const getTasks = async (meetingId: string): Promise<ActionItem[]> => {
  const { data } = await api.get(`/tasks?meetingId=${meetingId}`);
  return data;
};

export const updateTaskStatus = async (
  taskId: string,
  status: ActionItem['status']
): Promise<ActionItem> => {
  const { data } = await api.put(`/tasks/${taskId}/status`, { status });
  return data;
};

export const addComment = async (taskId: string, text: string) => {
  const { data } = await api.post(`/tasks/${taskId}/comments`, { text });
  return data;
};

export const getAnalytics = async (): Promise<Analytics> => {
  const { data } = await api.get('/tasks/analytics');
  return data;
};