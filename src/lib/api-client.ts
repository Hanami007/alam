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
  },

  // Feed & Posts API
  feed: {
    getPosts: () => fetchJson<any[]>('/api/feed'),
  },

  // Hall of Fame API
  hof: {
    // /api/hof คืน { candidates, campaignStatus, campaignTitle } ไม่ใช่ array เปล่าๆ แล้ว
    getCandidates: () =>
      fetchJson<{ candidates: any[]; campaignStatus: 'open' | 'closed'; campaignTitle: string | null }>('/api/hof'),
  },

  // Gallery & Photo Archive API

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
  },

  // Map API
  map: {
    getData: () => fetchJson<{ hometownData: any[]; workplaceData: any[] }>('/api/map'),
  },

  // User Profile & Settings API
  user: {
    getProfile: () => fetchJson<any>('/api/user/profile'),
    updateProfile: (data: {
      name?: string;
      nickname?: string;
      position?: string;
      company?: string;
      bio?: string;
      avatarUrl?: string;
      generation?: string;
      generationOptionId?: number | string;
      provinceOptionId?: number | string;
      workProvinceId?: number | string;
      careerOptionId?: number | string;
      isAvailableForMentorship?: boolean;
      birthDate?: string;
      yearbookPublished?: boolean;
      facebookUrl?: string;
      lineId?: string;
      showContactOnMap?: boolean;
      phone?: string;
      studentStatus?: 'studying' | 'alumni';
      graduationYear?: number;
    }) =>
      fetchJson<any>('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    changePassword: (currentPassword: string, newPassword: string) =>
      fetchJson<{ success: boolean }>('/api/user/password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
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
    appointGenerationLeader: (userId: number) =>
      fetchJson<{ success: boolean; generationLabel: string; replacedName: string | null }>('/api/admin/generation-leaders', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      }),
    removeGenerationLeader: (userId: number) =>
      fetchJson<{ success: boolean }>(`/api/admin/generation-leaders?userId=${encodeURIComponent(String(userId))}`, {
        method: 'DELETE',
      }),
    setStudentStatus: (userId: number, studentStatus: 'studying' | 'alumni') =>
      fetchJson<any>('/api/admin/users', {
        method: 'PATCH',
        body: JSON.stringify({ id: userId, studentStatus }),
      }),
    verifyUser: (userId: number, decision: 'approved' | 'rejected', remark?: string) =>
      fetchJson<any>('/api/admin/verify', {
        method: 'POST',
        body: JSON.stringify({ userId, decision, remark }),
      }),
    getPostRequests: () => fetchJson<any[]>('/api/admin/post-requests'),
    getAuditLogs: () => fetchJson<any>('/api/admin/audit-logs'),
    createAnnouncement: (data: { title: string; body: string; category?: string; pinned?: boolean }) =>
      fetchJson<any>('/api/admin/announcement', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    // Hall of Fame campaign management (quarterly cycle)
    getHofCampaign: () => fetchJson<any>('/api/admin/hof-campaign'),
    toggleHofCampaign: (status: 'open' | 'closed') =>
      fetchJson<any>('/api/admin/hof-campaign', {
        method: 'POST',
        body: JSON.stringify({ status }),
      }),
    // Yearbook Data Management
    getYearbookList: () => fetchJson<any[]>('/api/admin/yearbook'),
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
    // Wall Widgets Management (เซียมซี — วันเกิดดึงจาก birth_date จริง, อันดับกิจกรรมดึงจาก Top 3 Hall of Fame จริง ไม่ได้จัดการที่นี่)
    getWallWidgets: () =>
      fetchJson<{ fortunes: any[] }>('/api/admin/wall-widgets'),
    addWallFortune: (message: string) =>
      fetchJson<any>('/api/admin/wall-widgets', {
        method: 'POST',
        body: JSON.stringify({ type: 'fortune', message }),
      }),
    removeWallFortune: (id: number) =>
      fetchJson<any>(`/api/admin/wall-widgets?type=fortune&id=${id}`, { method: 'DELETE' }),
  },

  // Public Wall Widgets (หน้าฟีด/วอลล์)
  wall: {
    getWidgets: () =>
      fetchJson<{ fortunes: any[]; birthdays: any[]; leaderboard: any[] }>('/api/wall-widgets'),
  },
};
