import { useState, useEffect, useRef } from 'react';
import { Header } from '../components/common/Header';
import { Unity, useUnityContext } from 'react-unity-webgl';
import { useLocalParticipant, useTracks, AudioTrack } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { ChatMessage } from '../types';
import { useAnimationData } from '../hooks/useAnimationData';
import { useAudioContext } from '../hooks/useAudioContext';

interface Screen4Props {
  roomName: string;
  lastMessage?: ChatMessage;
  onBack: () => void;
}

export function Screen4({ roomName, lastMessage, onBack }: Screen4Props) {
  const { unityProvider, isLoaded, loadingProgression, sendMessage, unload } = useUnityContext({
    loaderUrl: '/unity/Build/unity.loader.js',
    dataUrl: '/unity/Build/unity.data',
    frameworkUrl: '/unity/Build/unity.framework.js',
    codeUrl: '/unity/Build/unity.wasm',
  });

  const { latestFrame, frameCount } = useAnimationData();
  const { localParticipant } = useLocalParticipant();
  const [isMicEnabled, setIsMicEnabled] = useState(false);

  // Auto-resume AudioContext on user interaction (fix browser autoplay policy)
  useAudioContext();

  // Subscribe to agent audio tracks
  const audioTracks = useTracks([
    { source: Track.Source.Microphone, withPlaceholder: false },
  ], {
    onlySubscribed: true,
  });

  // Handle back button
  const handleBack = () => {
    console.log('[Screen4] Back button clicked - disconnecting Unity');

    // Send disconnect message to Unity
    try {
      const message = JSON.stringify({
        action: 'disconnect'
      });
      sendMessage('ReactBridge', 'OnReactMessage', message);
      console.log('[Screen4] Sent disconnect message to Unity');
    } catch (error) {
      console.error('[Screen4] Failed to send disconnect:', error);
    }

    // Go back to Screen 1
    onBack();
  };

  // Auto-enable microphone when Screen 4 loads
  useEffect(() => {
    if (localParticipant) {
      localParticipant.setMicrophoneEnabled(true);
      setIsMicEnabled(true);
      console.log('[Screen4] Microphone auto-enabled');
    }

    // Cleanup: disable mic when leaving Screen 4
    return () => {
      if (localParticipant) {
        localParticipant.setMicrophoneEnabled(false);
        console.log('[Screen4] Microphone disabled on unmount');
      }
    };
  }, [localParticipant]);

  // Toggle microphone
  const toggleMic = async () => {
    if (localParticipant) {
      const newState = !isMicEnabled;
      await localParticipant.setMicrophoneEnabled(newState);
      setIsMicEnabled(newState);
      console.log('[Screen4] Microphone toggled:', newState);
    }
  };

  // Send animation data to Unity
  useEffect(() => {
    if (isLoaded && latestFrame) {
      try {
        // Uint8Array를 comma-separated string으로 변환
        const frameArray = Array.from(latestFrame);
        const frameString = frameArray.join(',');

        // Unity로 전달
        sendMessage('ReactBridge', 'OnAnimationData', frameString);

        if (frameCount % 30 === 0) {
          console.log('[Screen4] Sent animation frame to Unity:', frameCount);
        }
      } catch (error) {
        console.error('[Screen4] Failed to send animation data:', error);
      }
    }
  }, [isLoaded, latestFrame, frameCount, sendMessage]);

  // Unity screen (always show canvas, let Unity handle loading)
  return (
    <>
      {/* Render agent audio tracks (hidden, only for playback) */}
      {audioTracks
        .filter(track => track.participant.identity !== localParticipant.identity)
        .map((track) => (
          <AudioTrack
            key={track.publication.trackSid}
            trackRef={track}
            volume={1.0}
          />
        ))}

      <div className="w-full max-w-mobile mx-auto bg-cafeshow-pink min-h-screen flex flex-col">
        <Header onBack={handleBack} />

      {/* Unity Canvas Area */}
      <div className="flex-1 relative">
        <div className="relative w-full h-full bg-cafeshow-pink">
          <Unity
            unityProvider={unityProvider}
            style={{
              width: '100%',
              height: '100%',
            }}
          />
        </div>
      </div>

      {/* Agent Message Display */}
      <div className="bg-white p-6 min-h-[120px] flex items-center justify-center border-t border-cafeshow-gray-200">
        {lastMessage && !lastMessage.isUser ? (
          <div className="text-center">
            <p className="text-base text-black">{lastMessage.message}</p>
          </div>
        ) : (
          <p className="text-gray-400 text-sm">AI와 대화해보세요</p>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="bg-white px-5 py-4 flex items-center justify-center gap-4 border-t border-cafeshow-gray-200">
        <button className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center text-2xl hover:bg-gray-50">
          ✕
        </button>
        <p className="text-sm text-gray-600">공금한 점을 물어보세요</p>
        <button
          onClick={toggleMic}
          className={`w-12 h-12 rounded-full flex items-center justify-center hover:bg-opacity-90 ${
            isMicEnabled ? 'bg-cafeshow-red' : 'bg-gray-400'
          }`}
        >
          <img src="/assets/icon-mic-small.svg" alt="음성 입력" className="w-6 h-6 invert" />
        </button>
      </div>
      </div>
    </>
  );
}
