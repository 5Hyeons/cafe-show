import { useEffect, useState } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';

export function useAnimationData() {
  const room = useRoomContext();
  const [latestFrame, setLatestFrame] = useState<Uint8Array | null>(null);
  const [frameCount, setFrameCount] = useState(0);

  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (payload: Uint8Array, participant: any) => {
      // Agent만 처리
      if (!participant?.identity?.startsWith('agent')) {
        return;
      }

      // 208 bytes = 애니메이션 데이터 (52 floats × 4 bytes)
      if (payload.length === 208) {
        setLatestFrame(payload);
        setFrameCount(prev => prev + 1);

        if (frameCount % 30 === 0) {
          console.log('[AnimationData] Received frame:', frameCount, 'from', participant.identity);
        }
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room, frameCount]);

  return {
    latestFrame,
    frameCount,
  };
}
