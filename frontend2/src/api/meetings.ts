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
  const { data } = await api.post('/meetings', {
    ...payload,
    date: new Date(payload.date).toISOString(),
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

// Delete a meeting
export const deleteMeeting = async (id: string) => {
  const { data } = await api.delete(`/meetings/${id}`);
  return data;
};