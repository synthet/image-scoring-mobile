import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { DEFAULT_API_BASE_URL, DEV_MOBILE_TOKEN } from '@/config/env';
import { getAccessToken, getApiBaseUrl, setAccessToken, setApiBaseUrl } from '@/services/device';
import { pingHub } from '@/api/labelingHubClient';

export default function SettingsScreen() {
  const [baseUrl, setBaseUrl] = useState(DEFAULT_API_BASE_URL);
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setBaseUrl(await getApiBaseUrl());
      setToken((await getAccessToken()) ?? '');
    })();
  }, []);

  const save = async () => {
    await setApiBaseUrl(baseUrl);
    await setAccessToken(token.trim() || null);
    setStatus('Saved');
  };

  const testConnection = async () => {
    await setApiBaseUrl(baseUrl);
    const ok = await pingHub();
    setStatus(ok ? 'Hub reachable' : 'Hub unreachable (health check failed)');
  };

  return (
    <View style={styles.root}>
      <Text style={styles.label}>Labeling hub base URL</Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        value={baseUrl}
        onChangeText={setBaseUrl}
        placeholder="https://labeling.your-domain.example"
        placeholderTextColor="#5E7085"
      />

      <Text style={styles.label}>Access token</Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
        value={token}
        onChangeText={setToken}
        placeholder="Short-lived mobile token"
        placeholderTextColor="#5E7085"
      />

      <Pressable style={styles.btn} onPress={() => void save()}>
        <Text style={styles.btnText}>Save</Text>
      </Pressable>
      <Pressable style={styles.btnSecondary} onPress={() => void testConnection()}>
        <Text style={styles.btnSecondaryText}>Test connection</Text>
      </Pressable>

      {status ? <Text style={styles.status}>{status}</Text> : null}

      <Text style={styles.note}>
        Dev hub: run `npm run hub:dev` from the repo root, then use token `{DEV_MOBILE_TOKEN}`.
        Shared REST paths and payload schemas are owned by image-scoring-backend — see
        docs/LABELING_API.md.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 16,
    gap: 10,
  },
  label: {
    color: '#C5D3E0',
    fontSize: 13,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#141C26',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#E8EEF5',
    borderWidth: 1,
    borderColor: '#243040',
  },
  btn: {
    marginTop: 8,
    backgroundColor: '#4DA3FF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnText: {
    color: '#0B0F14',
    fontWeight: '700',
  },
  btnSecondary: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#243040',
  },
  btnSecondaryText: {
    color: '#C5D3E0',
    fontWeight: '600',
  },
  status: {
    color: '#6BCB8E',
    marginTop: 8,
  },
  note: {
    marginTop: 16,
    color: '#7E92A8',
    lineHeight: 18,
    fontSize: 12,
  },
});
