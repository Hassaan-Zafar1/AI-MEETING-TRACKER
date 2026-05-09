import api from './axios';
import { User } from '../types';

export const register = async (name: string, email: string, password: string): Promise<any> => {
  const { data } = await api.post('/auth/register', { name, email, password });
  return data;
};

export const verifyOtp = async (email: string, otp: string): Promise<any> => {
  const { data } = await api.post('/auth/verify-otp', { email, otp });
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

export const forgotPassword = async (email: string): Promise<any> => {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
};

export const resetPassword = async (email: string, otp: string, newPassword: string): Promise<any> => {
  const { data } = await api.post('/auth/reset-password', { email, otp, newPassword });
  return data;
};