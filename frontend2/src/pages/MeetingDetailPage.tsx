import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getMeeting,
  saveMeetingNotes,
  extractActionItems,
  deleteMeeting,
} from '../api/meetings';
import { updateTaskStatus } from '../api/tasks';
import { useSocket } from '../hooks/useSocket';
import { ActionItem } from '../types';
import TaskCard from '../components/TaskCard';
import styles from './MeetingDetailPage.module.css';

type MeetingDetailResponse = Awaited<ReturnType<typeof getMeeting>>;
type ExtractActionItemsResponse = Awaited<ReturnType<typeof extractActionItems>>;

const COLUMNS: ActionItem['status'][] = ['pending', 'in-progress', 'done'];
const COLUMN_LABELS = {
  'pending': 'To Do',
  'in-progress': 'In Progress',
  'done': 'Done',
};

const MeetingDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const socket = useSocket();
  const [notes, setNotes] = useState('');
  const [localTasks, setLocalTasks] = useState<ActionItem[]>([]);

  const { data, isLoading } = useQuery<MeetingDetailResponse>(
    ['meeting', id],
    () => getMeeting(id!),
    {
      onSuccess: (data: MeetingDetailResponse) => {
        setNotes(data.meeting.rawNotes || '');
        setLocalTasks(data.actionItems);
      },
    }
  );

  // Join the Socket.IO room for this meeting
  useEffect(() => {
    if (!socket || !id) return;
    socket.emit('join:meeting', id);

    // Listen for new tasks created by AI extraction
    socket.on('tasks:created', (newTasks: ActionItem[]) => {
      setLocalTasks(newTasks);
      toast.success(`${newTasks.length} action items extracted!`);
    });

    // Listen for task status changes from other users
    socket.on('task:updated', ({ taskId, status }: { taskId: string; status: ActionItem['status'] }) => {
      setLocalTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status } : t))
      );
    });

    return () => {
      socket.emit('leave:meeting', id);
      socket.off('tasks:created');
      socket.off('task:updated');
    };
  }, [socket, id]);

  // Save notes mutation
  const saveNotesMutation = useMutation(
    () => saveMeetingNotes(id!, notes),
    {
      onSuccess: () => toast.success('Notes saved!'),
      onError: () => toast.error('Failed to save notes'),
    }
  );

  // AI extraction mutation
  const extractMutation = useMutation(
    () => extractActionItems(id!),
    {
      onSuccess: ({ actionItems }: ExtractActionItemsResponse) => {
        setLocalTasks(actionItems);
        queryClient.invalidateQueries({ queryKey: ['meeting', id] });
        toast.success('Action items extracted!');
      },
      onError: () => toast.error('AI extraction failed. Check your API key.'),
    }
  );

  // Update task status mutation
  const updateStatusMutation = useMutation(
    ({ taskId, status }: { taskId: string; status: ActionItem['status'] }) =>
      updateTaskStatus(taskId, status),
    {
      onSuccess: (updatedTask: ActionItem) => {
        setLocalTasks((prev) =>
          prev.map((t) => (t._id === updatedTask._id ? updatedTask : t))
        );
      },
    }
  );

  // Delete meeting mutation
  const deleteMeetingMutation = useMutation(
    () => deleteMeeting(id!),
    {
      onSuccess: () => {
        toast.success('Meeting deleted successfully!');
        queryClient.invalidateQueries({ queryKey: ['meetings'] });
        navigate('/');
      },
      onError: () => toast.error('Failed to delete meeting'),
    }
  );

  if (isLoading) return <div className={styles.loading}>Loading meeting...</div>;
  if (!data) return <div>Meeting not found</div>;

  const { meeting } = data;

  // Filter tasks by column status
  const getTasksByStatus = (status: ActionItem['status']) =>
    localTasks.filter((t) => t.status === status);

  return (
    <div className={styles.container}>
      {/* Meeting Header */}
      <div className={styles.header}>
        <div>
          <h1>{meeting.title}</h1>
          <p className={styles.date}>
            {new Date(meeting.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to delete this meeting? This action cannot be undone.')) {
              deleteMeetingMutation.mutate();
            }
          }}
          disabled={deleteMeetingMutation.isLoading}
          className={styles.deleteBtn}
        >
          {deleteMeetingMutation.isLoading ? 'Deleting...' : 'Delete Meeting'}
        </button>
      </div>

      {/* AI Summary (if extracted) */}
      {meeting.summary && (
        <div className={styles.summary}>
          <h2>Meeting Summary</h2>
          <p>{meeting.summary}</p>
        </div>
      )}

      {/* Notes Section */}
      <div className={styles.notesSection}>
        <div className={styles.notesSectionHeader}>
          <h2>Meeting Notes</h2>
          <div className={styles.notesActions}>
            <button
              onClick={() => saveNotesMutation.mutate()}
              disabled={saveNotesMutation.isLoading}
              className={styles.saveBtn}
            >
              {saveNotesMutation.isLoading ? 'Saving...' : 'Save Notes'}
            </button>
            <button
              onClick={() => extractMutation.mutate()}
              disabled={extractMutation.isLoading || !notes.trim()}
              className={styles.extractBtn}
            >
              {extractMutation.isLoading
                ? 'AI is analyzing...'
                : 'Extract Action Items with AI'}
            </button>
          </div>
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={`Paste your meeting notes here...

Example:
- John will set up the staging environment by Friday
- Sarah needs to review the design mockups (urgent, due tomorrow)
- Team agreed to migrate to TypeScript next quarter
- Michael to send weekly status report every Monday`}
          className={styles.notesTextarea}
          rows={12}
        />
      </div>

      {/* Kanban Board */}
      {localTasks.length > 0 && (
        <div className={styles.board}>
          <h2>Action Items</h2>
          <div className={styles.columns}>
            {COLUMNS.map((col) => (
              <div key={col} className={styles.column}>
                <div className={styles.columnHeader}>
                  <h3>{COLUMN_LABELS[col]}</h3>
                  <span className={styles.count}>{getTasksByStatus(col).length}</span>
                </div>
                <div className={styles.taskList}>
                  {getTasksByStatus(col).map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onStatusChange={(status) =>
                        updateStatusMutation.mutate({ taskId: task._id, status })
                      }
                    />
                  ))}
                  {getTasksByStatus(col).length === 0 && (
                    <div className={styles.emptyColumn}>No tasks</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingDetailPage;