/**
 * Frontend Browser API Client
 * Used by React Client Components to fetch data from Next.js Backend API routes.
 */

class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    // หากได้รับ 401 Unauthorized บน Client ให้นำทางไปยังหน้า Login พร้อม callbackUrl
    if (res.status === 401 && typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      const currentPath = window.location.pathname + window.location.search;
      window.location.href = `/login?callbackUrl=${encodeURIComponent(currentPath)}`;
    }

    const fallbackMessage = isJson
      ? `Request failed with status ${res.status}`
      : `เซิร์ฟเวอร์เกิดข้อผิดพลาด (${res.status}: ${res.statusText || 'Internal Error'})`;

    throw new ApiError(
      data?.error || fallbackMessage,
      res.status,
      data
    );
  }

  return data as T;
}

export const api = {
  // Auth API
  auth: {
    me: () => fetchJson<any>('/api/auth/me'),
    login: (credentials: { identifier: string; password: string }) =>
      fetchJson<any>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    logout: () =>
      fetchJson<any>('/api/auth/logout', {
        method: 'POST',
      }),
  },

  // Feed & Posts API
  feed: {
    getPosts: () => fetchJson<any[]>('/api/feed'),
    like: (postId: number, userId: number) =>
      fetchJson<any>('/api/feed/like', {
        method: 'POST',
        body: JSON.stringify({ postId, userId }),
      }),
    comment: (postId: number, userId: number, content: string) =>
      fetchJson<any>('/api/feed/comment', {
        method: 'POST',
        body: JSON.stringify({ postId, userId, content }),
      }),
    votePoll: (pollId: number, optionId: number, userId: number) =>
      fetchJson<any>('/api/feed/poll/vote', {
        method: 'POST',
        body: JSON.stringify({ pollId, optionId, userId }),
      }),
    requestPost: (data: { title: string; body: string; category: string; imageUrl?: string }) =>
      fetchJson<any>('/api/feed/request', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Hall of Fame API
  hof: {
    getCandidates: () => fetchJson<any[]>('/api/hof'),
    search: (q: string) => fetchJson<any[]>(`/api/hof/search?q=${encodeURIComponent(q)}`),
    vote: (candidateId: number) =>
      fetchJson<any>('/api/hof/vote', {
        method: 'POST',
        body: JSON.stringify({ candidateId }),
      }),
  },

  // Gallery & Photo Archive API
  gallery: {
    getItems: () => fetchJson<any[]>('/api/gallery'),
    unlock: (photoId: string, answer: string) =>
      fetchJson<any>('/api/gallery/unlock', {
        method: 'POST',
        body: JSON.stringify({ photoId, answer }),
      }),
    tag: (photoId: string, userId: number) =>
      fetchJson<any>('/api/gallery/tag', {
        method: 'POST',
        body: JSON.stringify({ photoId, userId }),
      }),
    untag: (photoId: string, userId: number) =>
      fetchJson<any>('/api/gallery/untag', {
        method: 'POST',
        body: JSON.stringify({ photoId, userId }),
      }),
  },

  // Alumni & Yearbook API (apimju + local DB)
  alumni: {
    getList: (params?: { query?: string; generation?: string; province?: string; careerType?: string }) => {
      const sp = new URLSearchParams();
      if (params?.query) sp.set('q', params.query);
      if (params?.generation) sp.set('generation', params.generation);
      if (params?.province) sp.set('province', params.province);
      if (params?.careerType) sp.set('careerType', params.careerType);
      return fetchJson<any[]>(`/api/alumni?${sp.toString()}`);
    },
    getById: (id: string | number) => fetchJson<any>(`/api/alumni/${encodeURIComponent(String(id))}`),
  },

  // Map API
  map: {
    getData: () => fetchJson<{ hometownData: any[]; workplaceData: any[] }>('/api/map'),
  },

  // User Profile & Settings API
  user: {
    getProfile: () => fetchJson<any>('/api/user/profile'),
    updateProfile: (data: { name?: string; position?: string; company?: string; bio?: string; avatarUrl?: string; generation?: string; isAvailableForMentorship?: boolean }) =>
      fetchJson<any>('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    updatePrivacy: (settings: { showHometownOnMap: boolean; showWorkplaceOnMap: boolean }) =>
      fetchJson<any>('/api/user/privacy', {
        method: 'PUT',
        body: JSON.stringify(settings),
      }),
    getActivity: () => fetchJson<any[]>('/api/user/activity'),
  },

  // Admin Management API
  admin: {
    getOverview: () => fetchJson<any>('/api/admin/overview'),
    getVerifications: () => fetchJson<any[]>('/api/admin/verifications'),
    getAllUsers: () => fetchJson<any[]>('/api/admin/users'),
    deleteUser: (userId: number) =>
      fetchJson<any>(`/api/admin/users?id=${encodeURIComponent(String(userId))}`, {
        method: 'DELETE',
      }),
    verifyUser: (userId: number, decision: 'approved' | 'rejected', remark?: string) =>
      fetchJson<any>('/api/admin/verify', {
        method: 'POST',
        body: JSON.stringify({ userId, decision, remark }),
      }),
    getPostRequests: () => fetchJson<any[]>('/api/admin/post-requests'),
    decidePost: (postId: number, decision: 'approved' | 'rejected') =>
      fetchJson<any>('/api/admin/post-requests/decide', {
        method: 'POST',
        body: JSON.stringify({ postId, decision }),
      }),
    createAnnouncement: (data: { title: string; body: string; category?: string; pinned?: boolean }) =>
      fetchJson<any>('/api/admin/announcement', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    // Yearbook Data Management
    getYearbookList: () => fetchJson<any[]>('/api/admin/yearbook'),
    addYearbookEntry: (data: { name: string; nickname?: string; avatarUrl?: string; quote?: string; generation?: string }) =>
      fetchJson<any>('/api/admin/yearbook', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateYearbookEntry: (data: { id: number | string; name?: string; nickname?: string; avatarUrl?: string; quote?: string; generation?: string }) =>
      fetchJson<any>('/api/admin/yearbook', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteYearbookEntry: (id: number | string) =>
      fetchJson<any>(`/api/admin/yearbook?id=${encodeURIComponent(String(id))}`, {
        method: 'DELETE',
      }),
    // Keyword Filter Management
    getKeywords: () => fetchJson<{ keywords: any[] }>('/api/admin/keywords'),
    addKeyword: (keyword: string) =>
      fetchJson<any>('/api/admin/keywords', {
        method: 'POST',
        body: JSON.stringify({ keyword }),
      }),
    removeKeyword: (id: number) =>
      fetchJson<any>(`/api/admin/keywords?id=${id}`, {
        method: 'DELETE',
      }),
  },
};
