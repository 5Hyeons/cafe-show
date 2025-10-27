import { useState, useEffect, useRef } from 'react';
import { Header } from '../components/common/Header';
import { Unity, useUnityContext } from 'react-unity-webgl';
import { ChatMessage } from '../types';

interface Screen4Props {
  roomName: string;
  lastMessage?: ChatMessage;
  onBack: () => void;
}

export function Screen4({ roomName, lastMessage, onBack }: Screen4Props) {
  console.log('[Screen4] Received room name:', roomName);

  const hasConnected = useRef(false);
  const { unityProvider, isLoaded, loadingProgression, sendMessage, unload } = useUnityContext({
    loaderUrl: '/unity/Build/unity.loader.js',
    dataUrl: '/unity/Build/unity.data',
    frameworkUrl: '/unity/Build/unity.framework.js',
    codeUrl: '/unity/Build/unity.wasm',
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

  // Send room name to Unity when loaded
  useEffect(() => {
    if (isLoaded && roomName && !hasConnected.current) {
      hasConnected.current = true;

      const message = JSON.stringify({
        action: 'setLiveKitRoom',
        roomName: roomName
      });

      sendMessage('ReactBridge', 'OnReactMessage', message);
      console.log('[Unity] Sent room name to Unity:', roomName);
    }
  }, [isLoaded, roomName, sendMessage]);

  // Unity screen (always show canvas, let Unity handle loading)
  return (
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
        <button className="w-12 h-12 rounded-full bg-cafeshow-red flex items-center justify-center hover:bg-opacity-90">
          <img src="/assets/icon-mic-small.svg" alt="음성 입력" className="w-6 h-6 invert" />
        </button>
      </div>
    </div>
  );
}
