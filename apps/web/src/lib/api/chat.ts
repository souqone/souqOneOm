import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../auth';

export interface Conversation {
  id: string;
  entityType: string;
  entityId: string;
  entityTitle?: string;
  listing: { id: string; title: string; images: { url: string }[] } | null;
  participants: { id: string; username: string; displayName: string | null; avatarUrl: string | null }[];
  lastMessage: { content: string; createdAt: string; senderId: string; type?: string } | null;
  createdById?: string;
  unreadCount: number;
  createdAt: string;
  archived?: boolean;
}

export interface MessageReaction {
  id: string;
  emoji: string;
  userId: string;
  user: { id: string; username: string; displayName: string | null };
}

export interface Message {
  id: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'AUDIO' | 'SYSTEM';
  mediaUrl?: string | null;
  senderId: string;
  sender: { id: string; username: string; displayName: string | null; avatarUrl: string | null };
  isRead: boolean;
  isDeleted: boolean;
  reactions: MessageReaction[];
  createdAt: string;
  status?: 'sending' | 'sent' | 'read';
}

export interface PaginatedMessages {
  items: Message[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export function useConversations(includeArchived = false) {
  return useQuery<Conversation[]>({
    queryKey: ['conversations', includeArchived],
    queryFn: () => apiRequest<Conversation[]>(`/chat/conversations${includeArchived ? '?includeArchived=true' : ''}`),
  });
}

export function useMessages(conversationId: string, page = 1) {
  return useQuery<PaginatedMessages>({
    queryKey: ['messages', conversationId, page],
    queryFn: () => apiRequest<PaginatedMessages>(`/chat/conversations/${conversationId}?page=${page}&limit=30`),
    enabled: !!conversationId,
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { entityType: string; entityId: string } | { listingId: string }) =>
      apiRequest<Conversation>('/chat/conversations', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  });
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { content: string; type?: string; mediaUrl?: string }) =>
      apiRequest<Message>(`/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messages', conversationId] }),
  });
}

export function useMarkRead(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiRequest(`/chat/conversations/${conversationId}/read`, { method: 'PATCH' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
      qc.invalidateQueries({ queryKey: ['messages', conversationId] });
    },
  });
}

export function useDeleteMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) =>
      apiRequest(`/chat/messages/${messageId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messages'] }),
  });
}

export function useArchiveConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, archive }: { id: string; archive: boolean }) =>
      apiRequest(`/chat/conversations/${id}/archive`, { method: 'PATCH', body: JSON.stringify({ archive }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  });
}

export function useToggleReaction() {
  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      apiRequest(`/chat/messages/${messageId}/react`, { method: 'POST', body: JSON.stringify({ emoji }) }),
  });
}

export function useSearchMessages(conversationId: string, query: string) {
  return useQuery<PaginatedMessages>({
    queryKey: ['search-messages', conversationId, query],
    queryFn: () => apiRequest<PaginatedMessages>(`/chat/conversations/${conversationId}/search?q=${encodeURIComponent(query)}`),
    enabled: !!conversationId && !!query && query.length >= 2,
  });
}
