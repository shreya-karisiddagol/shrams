import { format, formatDistanceToNow } from 'date-fns';

export const formatDate = (date) =>
  date ? format(new Date(date), 'dd MMM yyyy, hh:mm a') : '—';

export const timeAgo = (date) =>
  date ? formatDistanceToNow(new Date(date), { addSuffix: true }) : '—';

export const isOverdue = (deadline, status) => {
  if (!deadline || status === 'Resolved') return false;
  return new Date(deadline) < new Date();
};
