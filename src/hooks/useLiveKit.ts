import { useState, useCallback, useEffect } from 'react';
import { generateToken, generateRoomId, getOrCreateParticipantIdentity } from '../lib/livekit';

export function useLiveKit() {
  const [token, setToken] = useState<string>('');
  const [serverUrl, setServerUrl] = useState<string>('');
  const [roomName, setRoomName] = useState<string>('');
  const [identity, setIdentity] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string>('');

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError('');

    try {
      const room = `${import.meta.env.VITE_ROOM_PREFIX}-${generateRoomId()}`;
      const userId = getOrCreateParticipantIdentity();
      const serverUrl = import.meta.env.VITE_LIVEKIT_SERVER_URL;

      const generatedToken = await generateToken(room, userId);

      setToken(generatedToken);
      setServerUrl(serverUrl);
      setRoomName(room);
      setIdentity(userId);

      console.log('[React LiveKit] Connected to room:', room);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to connect';
      setError(errorMsg);
      console.error('[LiveKit] Connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  return {
    token,
    serverUrl,
    roomName,
    identity,
    isConnecting,
    error,
    connect,
  };
}
