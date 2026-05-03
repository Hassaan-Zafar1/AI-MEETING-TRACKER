import api from './axios';
import { Meeting, ActionItem } from '../types';

// Fetch all meetings
export const getMeetings = async (): Promise<Meeting[]> => {
  const { data } = await api.get('/meetings');
  return data;
};

// Fetch one meeting + its action items
export const getMeeting = async (id: string) => {
  const { data } = await api.get(`/meetings/${id}`);
  return data as { meeting: Meeting; actionItems: ActionItem[] };
};

// Create a new meeting
export const createMeeting = async (payload: {
  title: string;
  date: string;
  participants?: string[];
}) => {
  // Convert local datetime to UTC
  const localDate = new Date(payload.date);
  const utcDate = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000);
  
  const { data } = await api.post('/meetings', {
    ...payload,
    date: utcDate.toISOString(),
  });
  return data as Meeting;
};

// Save raw notes to a meeting
export const saveMeetingNotes = async (id: string, rawNotes: string) => {
  const { data } = await api.put(`/meetings/${id}/notes`, { rawNotes });
  return data as Meeting;
};

// Trigger AI extraction
export const extractActionItems = async (id: string) => {
  const { data } = await api.post(`/meetings/${id}/extract`);
  return data as { summary: string; actionItems: ActionItem[] };
};