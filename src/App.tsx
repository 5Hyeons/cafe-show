import { useEffect, useState, useRef } from 'react';
import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';
import { SessionManager } from './components/SessionManager';
import { useLiveKit } from './hooks/useLiveKit';
import { ScreenType } from './types';

interface AppInnerProps {
  roomName: string;
  currentScreen: ScreenType;
  onNextScreen: () => void;
  onBack: () => void;
}

function AppInner({ roomName, currentScreen, onNextScreen, onBack }: AppInnerProps) {
  return (
    <SessionManager
      currentScreen={currentScreen}
      onNextScreen={onNextScreen}
      onBack={onBack}
    />
  );
}

function App() {
  const { token, serverUrl, roomName, connect, isConnecting, error } = useLiveKit();
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('chat');
  const hasConnected = useRef(false);

  const handleNextScreen = () => {
    setCurrentScreen('avatar');
  };

  const handleBackToChat = () => {
    setCurrentScreen('chat');
  };

  // Auto-connect on mount (only once, prevent Strict Mode double execution)
  useEffect(() => {
    if (!hasConnected.current) {
      hasConnected.current = true;
      connect();
    }
  }, [connect]);

  if (isConnecting) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-xl">LiveKit 연결 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center flex-col gap-4">
        <p className="text-xl text-red-600">연결 오류</p>
        <p className="text-sm text-gray-600">{error}</p>
        <button
          onClick={connect}
          className="px-6 py-2 bg-cafeshow-red text-white rounded-lg"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!token || !serverUrl) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-xl">준비 중...</p>
      </div>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={token}
      connect={true}
      audio={true}
      video={false}
      className="min-h-screen bg-white"
    >
      <AppInner
        roomName={roomName}
        currentScreen={currentScreen}
        onNextScreen={handleNextScreen}
        onBack={handleBackToChat}
      />
    </LiveKitRoom>
  );
}

export default App;
