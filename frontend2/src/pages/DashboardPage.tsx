import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getMeetings, createMeeting } from '../api/meetings';
import { getAnalytics } from '../api/tasks';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Analytics, Meeting } from '../types';
import styles from './DashboardPage.module.css';

const DashboardPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State for "Create Meeting" form
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');

  // Listen for custom event from Sidebar
  useEffect(() => {
    const handleOpenModal = () => setShowForm(true);
    window.addEventListener('openCreateMeetingModal', handleOpenModal);
    return () => window.removeEventListener('openCreateMeetingModal', handleOpenModal);
  }, []);

  // useQuery automatically fetches data and manages loading/error states
  // 'meetings' is the cache key - React Query tracks this
  const { data: meetings, isLoading: meetingsLoading } = useQuery<Meeting[]>(
    ['meetings'],
    getMeetings
  );

  const { data: analytics } = useQuery<Analytics>(['analytics'], getAnalytics);

  // useMutation handles POST/PUT/DELETE operations
  const createMeetingMutation = useMutation(
    (payload: { title: string; date: string }) => createMeeting(payload),
    {
      onSuccess: () => {
        // Invalidate the 'meetings' query so it refetches automatically
        queryClient.invalidateQueries({ queryKey: ['meetings'] });
        toast.success('Meeting created!');
        setShowForm(false);
        setTitle('');
        setDate('');
      },
      onError: () => {
        toast.error('Failed to create meeting');
      },
    }
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMeetingMutation.mutate({ title, date });
  };

  // Prepare data for the analytics chart
  const chartData = analytics?.stats.map((s) => ({
    name: s._id,
    count: s.count,
  })) || [];

  if (meetingsLoading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Dashboard</h1>
      </div>

      {/* Analytics Summary Cards */}
      {analytics && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{analytics.riskItems}</span>
            <span className={styles.statLabel}>At Risk Items</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{analytics.overdueItems}</span>
            <span className={styles.statLabel}>Overdue Items</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{meetings?.length || 0}</span>
            <span className={styles.statLabel}>Total Meetings</span>
          </div>
        </div>
      )}

      {/* Bar chart of task statuses */}
      {chartData.length > 0 && (
        <div className={styles.chartContainer}>
          <h2>Task Status Overview</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{ fontSize: 13, fill: '#64748b' }} />
              <Tooltip cursor={{ fill: '#f8fafc' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', color: '#64748b', paddingTop: '10px' }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 99, 99, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Create Meeting Form (modal-like) */}
      {showForm && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h2>Create New Meeting</h2>
            <form onSubmit={handleCreate}>
              <div className={styles.field}>
                <label>Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Q4 Planning Meeting"
                  required
                />
              </div>
              <div className={styles.field}>
                <label>Date & Time</label>
                <input
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={createMeetingMutation.isLoading}>
                  {createMeetingMutation.isLoading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Meetings List */}
      <div id="recent-meetings" className={styles.meetingsList}>
        <h2>Recent Meetings</h2>
        {meetings?.length === 0 && (
          <p className={styles.empty}>No meetings yet. Create your first one!</p>
        )}
        <div className={styles.meetingsGrid}>
          {meetings?.map((meeting) => (
            <div
              key={meeting._id}
              className={styles.meetingCard}
              onClick={() => navigate(`/meeting/${meeting._id}`)}
            >
              <div className={styles.meetingInfo}>
                <h3>{meeting.title}</h3>
                <span>{format(new Date(meeting.date), 'MMM d, yyyy, h:mm a')}</span>
              </div>
              <div className={styles.meetingMeta}>
                <span className={styles.creator}>Host: {meeting.createdBy?.name}</span>
                {meeting.isProcessed ? (
                  <span className={styles.badge + ' ' + styles.processed}>AI Processed</span>
                ) : (
                  <span className={styles.badge}>Not processed</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;