/**
 * Globe Data - CSMJU Global Constellation
 * Shared types for the 3D globe (src/modules/map/components/globe-panel.tsx).
 * Clusters are built at render time from real alumni data (see
 * src/modules/map/services/map.service.ts) — this file no longer ships any
 * placeholder alumni.
 */

export interface GlobeAlumni {
  id: number;
  name: string;
  avatar_url?: string;
  position?: string;
  company?: string;
  generation?: string;
  career_type?: string;
  facebook_url?: string | null;
  line_id?: string | null;
  country_code: string;
  country_name: string;
  city: string;
  lat: number;
  lng: number;
  student_status: 'alumni' | 'student';
}

export interface GlobeCountryCluster {
  country_code: string;
  country_name: string;
  city: string;
  lat: number;
  lng: number;
  count: number;
  flag: string;
  alumni: GlobeAlumni[];
  region: 'thailand' | 'asia' | 'americas' | 'europe' | 'oceania' | 'middleeast';
}

export const GLOBE_CLUSTERS: GlobeCountryCluster[] = [];
