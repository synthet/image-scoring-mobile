import Constants from 'expo-constants';

export const APP_VERSION =
  Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? '1.0.0';

/** Local dev hub (`labeling-hub/`). Override in Settings for device/LAN or Hetzner. */
export const DEFAULT_API_BASE_URL = 'http://localhost:8787';

export const DEV_MOBILE_TOKEN = 'dev-mobile-token';

export const SECURE_KEYS = {
  apiBaseUrl: 'labeler.api_base_url',
  accessToken: 'labeler.access_token',
  deviceId: 'labeler.device_id',
} as const;
