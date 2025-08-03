// User types
export interface User {
  userId: string;
  email: string;
  preferences: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Activity types
export interface Activity {
  userId: string;
  activityId: string;
  achievement_count: number;
  athlete: Athlete;
  athlete_id: number;
  athlete_count: number;
  average_cadence?: number;
  average_heartrate?: number;
  average_speed: number;
  comment_count: number;
  commute: boolean;
  display_hide_heartrate_option: boolean;
  distance: number;
  elapsed_time: number;
  elev_high?: number;
  elev_low?: number;
  end_latlng?: [number, number];
  end_lat?: number;
  end_lng?: number;
  external_id?: string;
  flagged: boolean;
  from_accepted_tag: boolean;
  gear_id?: string;
  has_heartrate: boolean;
  has_kudoed: boolean;
  heartrate_opt_out: boolean;
  kudos_count: number;
  location_city?: string;
  location_country?: string;
  location_state?: string;
  manual: boolean;
  map: ActivityMap;
  summary_polyline?: string;
  max_heartrate?: number;
  max_speed: number;
  moving_time: number;
  name: string;
  photo_count: number;
  pr_count: number;
  private: boolean;
  resource_state: number;
  sport_type: string;
  start_date: string;
  start_date_local: string;
  start_latlng?: [number, number];
  start_lat?: number;
  start_lng?: number;
  suffer_score?: number;
  timezone: string;
  total_elevation_gain: number;
  total_photo_count: number;
  trainer: boolean;
  type: string;
  upload_id?: number;
  upload_id_str?: string;
  utc_offset: number;
  visibility: string;
  workout_type?: number;
}

export interface Athlete {
  id: number;
  resource_state: number;
}

export interface ActivityMap {
  id: string;
  summary_polyline: string;
  resource_state: number;
}

// Summary types
export interface ActivitySummary {
  totalActivities: number;
  totalDistance: number;
  totalElevation: number;
  totalMovingTime: number;
  activityTypes: Record<string, number>;
}

// API Response types
export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface ActivitiesResponse {
  activities: Activity[];
  summary: ActivitySummary;
  message?: string;
  lastSyncTime?: string;
  synced?: boolean;
}

// Form data types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
}

// Error types
export interface ApiError {
  error: string;
  code: string;
  details?: any;
}

// Config types
export interface AppConfig {
  API_BASE_URL: string;
  FRONTEND_URL: string;
}

// Goal tracking types
export interface YearlyProgress {
  totalRuns: number;
  totalMiles: string;
}

// Component prop types
export interface DashboardFilters {
  searchTerm: string;
  filterType: string;
}