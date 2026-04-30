import api from './axios';
import { User } from '../types';

export const register = async (name: string, email: string, password: string): Promise<User> => {
  const { data } = await api.post('/auth/register', { name, email, password });
  return data;
};

export const login = async (email: string, password: string): Promise<User> => {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
};

export const getMe = async (): Promise<User> => {
  const { data } = await api.get('/auth/me');
  return data;
};