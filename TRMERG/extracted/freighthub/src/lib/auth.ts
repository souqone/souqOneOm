export interface MockUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  role: 'USER' | 'CARRIER';
}

export const mockUser: MockUser = {
  id: 'user-001',
  username: 'ahmed_albalushi',
  displayName: 'أحمد البلوشي',
  avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=ahmed&backgroundColor=0B2447&textColor=ffffff',
  role: 'USER',
};

// BACKEND INTEGRATION POINT: Replace with real auth provider (JWT, session, etc.)
export function useAuth(): { user: MockUser; isAuthenticated: boolean } {
  return { user: mockUser, isAuthenticated: true };
}