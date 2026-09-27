import Constants from 'expo-constants';

export const APP_VERSION =
  Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? '1.0.0';

/** Default Hetzner labeling hub base URL (override in Settings). */
export const DEFAULT_API_BASE_URL = 'https://labeling.example.vexlum.local';

export const SECURE_KEYS = {
  apiBaseUrl: 'labeler.api_base_url',
  accessToken: 'labeler.access_token',
  deviceId: 'labeler.device_id',
} as const;
