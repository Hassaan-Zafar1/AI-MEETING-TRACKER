import React, { useState } from 'react';
import { ActionItem } from '../types';
import { format } from 'date-fns';
import { useMutation } from '@tanstack/react-query';
import { addComment } from '../api/tasks';
import toast from 'react-hot-toast';
import styles from './TaskCard.module.css';

interface Props {
  task: ActionItem;
  onStatusChange: (status: ActionItem['status']) => void;
}

const PRIORITY_COLORS = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
};

const STATUS_OPTIONS: ActionItem['status'][] = ['pending', 'in-progress', 'done'];

const TaskCard = ({ task, onStatusChange }: Props) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const addCommentMutation = useMutation(
    (text: string) => addComment(task._id, text),
    {
      onSuccess: () => {
        setCommentText('');
        toast.success('Comment added');
      },
    }
  );

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <div className={`${styles.card} ${task.riskFlag ? styles.risk : ''}`}>
      {/* Risk badge */}
      {task.riskFlag && (
        <div className={styles.riskBadge}>At Risk</div>
      )}

      {/* Priority indicator */}
      <div
        className={styles.priorityBar}
        style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
      />

      {/* Task description */}
      <p className={styles.description}>{task.description}</p>

      {/* Assignee */}
      <div className={styles.meta}>
        <span className={styles.assignee}>
          {task.assignee?.name || task.assigneeName}
        </span>

        {/* Due date */}
        {task.dueDate && (
          <span
            className={`${styles.dueDate} ${isOverdue ? styles.overdue : ''}`}
          >
            Due: {format(new Date(task.dueDate), 'MMM d')}
          </span>
        )}
      </div>

      {/* Status change dropdown */}
      <select
        value={task.status}
        onChange={(e) => onStatusChange(e.target.value as ActionItem['status'])}
        className={styles.statusSelect}
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>

      {/* Comments toggle */}
      <button
        onClick={() => setShowComments(!showComments)}
        className={styles.commentsToggle}
      >
        {task.comments?.length || 0} comments
      </button>

      {/* Comments section */}
      {showComments && (
        <div className={styles.comments}>
          {task.comments?.map((c) => (
            <div key={c._id} className={styles.comment}>
              <strong>{c.author?.name}: </strong>
              <span>{c.text}</span>
            </div>
          ))}

          <div className={styles.addComment}>
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && commentText.trim()) {
                  addCommentMutation.mutate(commentText.trim());
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCard;