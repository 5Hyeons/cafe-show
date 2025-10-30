import { useState, useEffect, useRef } from 'react';
import { Header } from '../components/common/Header';
import { Unity, useUnityContext } from 'react-unity-webgl';
import { useLocalParticipant } from '@livekit/components-react';
import { ChatMessage } from '../types';
import { useAnimationData } from '../hooks/useAnimationData';

// Timing tracking for Unity data transmission
let firstUnityFrameTime: number | null = null;
let lastUnityFrameTime: number | null = null;
let unitySentCount = 0;

type AgentState = 'initializing' | 'idle' | 'listening' | 'thinking' | 'speaking' | 'searching';

interface AvatarViewProps {
  lastMessage?: ChatMessage;
  agentState: AgentState | null;
  userVolume: number;
  onBack: () => void;
}

export function AvatarView({ lastMessage, agentState, userVolume, onBack }: AvatarViewProps) {

  const { unityProvider, isLoaded, loadingProgression, sendMessage, unload } = useUnityContext({
    loaderUrl: '/unity/Build/unity.loader.js',
    dataUrl: '/unity/Build/unity.data',
    frameworkUrl: '/unity/Build/unity.framework.js',
    codeUrl: '/unity/Build/unity.wasm',
  });

  // loadingProgression: 0 to 1 (Unity 로딩 진행률)

  const { latestFrame, frameCount, interruptSignal } = useAnimationData();
  const { localParticipant } = useLocalParticipant();
  const [isMicEnabled, setIsMicEnabled] = useState(false);

  // Handle back button
  const handleBack = () => {
    console.log('[AvatarView] Back button clicked - disconnecting Unity');

    // Send disconnect message to Unity
    try {
      const message = JSON.stringify({
        action: 'disconnect'
      });
      sendMessage('ReactBridge', 'OnReactMessage', message);
      console.log('[AvatarView] Sent disconnect message to Unity');
    } catch (error) {
      console.error('[AvatarView] Failed to send disconnect:', error);
    }

    // Go back to Screen 1
    onBack();
  };

  // Auto-enable microphone when Avatar View loads
  useEffect(() => {
    if (localParticipant) {
      localParticipant.setMicrophoneEnabled(true);
      setIsMicEnabled(true);
      console.log('[AvatarView] Microphone auto-enabled');
    }

    // Cleanup: disable mic when leaving Avatar View
    return () => {
      if (localParticipant) {
        localParticipant.setMicrophoneEnabled(false);
        console.log('[AvatarView] Microphone disabled on unmount');
      }
    };
  }, [localParticipant]);

  // Toggle microphone
  const toggleMic = async () => {
    if (localParticipant) {
      const newState = !isMicEnabled;
      await localParticipant.setMicrophoneEnabled(newState);
      setIsMicEnabled(newState);
      console.log('[AvatarView] Microphone toggled:', newState);
    }
  };

  // Get status text and animation state based on priority
  const getStatusText = () => {
    if (!isLoaded) {
      return { text: '연결중', isAnimated: false };  // Highest priority: Unity loading (with animation)
    }
    if (!isMicEnabled) {
      return { text: '음소거 되어있어요', isAnimated: true };  // 2nd priority: User muted
    }
    if (agentState === 'thinking') {
      return { text: '생각하고 있어요', isAnimated: true };  // 3rd priority: Agent thinking (with animation)
    }
    return { text: '궁금한 점을 물어보세요', isAnimated: false };  // Default
  };

  // Interrupt signal - immediate execution (bypasses queue)
  useEffect(() => {
    if (interruptSignal > 0 && isLoaded) {
      sendMessage('ReactBridge', 'OnAnimationData', 'interrupted');
      console.log('[AvatarView → Unity] ⚠️ Interrupt sent (immediate)');
    }
  }, [interruptSignal, isLoaded, sendMessage]);

  // Send animation data to Unity (including final signal via queue)
  useEffect(() => {
    if (isLoaded && latestFrame) {
      try {
        const now = performance.now();

        // First frame to Unity
        if (firstUnityFrameTime === null) {
          firstUnityFrameTime = now;
          console.log('[AvatarView → Unity] 🚀 First frame sent to Unity');
        }

        // Calculate timing
        const interval = lastUnityFrameTime ? now - lastUnityFrameTime : 0;
        lastUnityFrameTime = now;
        unitySentCount++;

        // Convert to string
        let frameString: string;

        if (latestFrame.length === 208) {
          // Animation frame: Uint8Array → comma-separated string
          const frameArray = Array.from(latestFrame);
          frameString = frameArray.join(',');
        } else {
          // Control signal (final): decode as string
          frameString = new TextDecoder().decode(latestFrame);
          console.log(`[Screen4→Unity] 🏁 Final signal sent (via queue)`);
        }

        // Unity로 전달
        sendMessage('ReactBridge', 'OnAnimationData', frameString);

        // Log every 20 frames (downsampled to 20fps)
        if (unitySentCount % 20 === 0) {
          const elapsed = now - (firstUnityFrameTime || now);
          const avgInterval = elapsed / unitySentCount;
          const estimatedFPS = avgInterval > 0 ? 1000 / avgInterval : 0;

          console.log(`[Screen4→Unity] 📤 Sent ${unitySentCount} frames:`, {
            elapsedMs: Math.round(elapsed),
            avgIntervalMs: avgInterval.toFixed(2),
            estimatedFPS: estimatedFPS.toFixed(1),
            lastIntervalMs: interval.toFixed(2),
          });
        }
      } catch (error) {
        console.error('[Screen4] Failed to send animation data:', error);
      }
    }
  }, [isLoaded, latestFrame, sendMessage]);

  // Unity screen (always show canvas, let Unity handle loading)
  return (
    <div className={`w-full max-w-mobile mx-auto min-h-screen flex flex-col relative ${isLoaded ? "bg-cafeshow-pink" : "bg-white"}`}>
        <Header />

      {/* Volume-reactive gradient overlay (bottom) */}
      {isLoaded && isMicEnabled && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '350px',
            background: 'linear-gradient(to top, rgba(218, 32, 61, 0.5), transparent)',
            opacity: userVolume > 0.2 ? userVolume : 0,
            transition: 'opacity 0.2s ease-in-out',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}

      {/* Agent Message - 로딩 완료 시에만 표시 */}
      {isLoaded && (
      <div className="px-5 pt-10 pb-4">
        <div className="text-center mb-4">
          {lastMessage ? (
            // Agent 메시지 있으면 표시
            <p className="text-[23px] leading-[1.4] tracking-[-0.46px] text-black">
              {lastMessage.message}
            </p>
          ) : (
            // 초기 인사 메시지
            <div className="text-[23px] leading-[1.4] tracking-[-0.46px] text-black">
              <p className="mb-0">안녕하세요.</p>
              <p className="mb-0">
                <span className="font-bold text-cafeshow-red">카페쇼 AI </span>
                입니다.
              </p>
              <p>무엇을 도와드릴까요?</p>
            </div>
          )}
        </div>

        {!lastMessage && (
          <p className="text-[16px] text-[#666666] tracking-[-0.32px] leading-[1.3] text-center">
            아바타와 대화를 시작해보세요
          </p>
          )}
        </div>
      )}

      {/* Unity Canvas Area */}
      <div className="flex-1 relative flex flex-col">
        <div className="flex-grow" />
        <div className="flex justify-center">
          {/* Unity 캔버스 - 430x420 고정 크기 (Figma 디자인) */}
          <div style={{ width: '430px', height: '420px' }}>
            <Unity
              unityProvider={unityProvider}
              style={{
                width: '100%',
                height: '100%',
              }}
            />
          </div>

          {/* 로딩 오버레이 - Figma 디자인 */}
          {!isLoaded && (
            <div className="absolute inset-0 flex flex-col z-50">

              {/* 메인 컨텐츠 */}
              <div className="flex-1 flex flex-col items-center pt-[180px] relative">
                {/* 원형 아바타 - 핑크 테두리 */}
                <div
                  className="relative rounded-full mb-10"
                  style={{
                    width: '160px',
                    height: '160px',
                  }}
                >
                  {/* 외부 핑크 링 */}
                  <div
                    className="absolute inset-0 rounded-full animate-pulse"
                    style={{
                      background: 'linear-gradient(180deg, #DA203D 0%, #FFFFFF 100%)',
                    }}
                  />
                  {/* 내부 아바타 컨테이너 */}
                  <div
                    className="absolute left-[5px] top-[5px] w-[150px] h-[150px] rounded-full overflow-hidden"
                    style={{ background: '#FFE8EB' }}
                  >
                    <img
                      src="/assets/avatar-hand-wave.png"
                      alt="AI Avatar"
                      style={{
                        width: '123%',
                        height: '119%',
                        marginLeft: '-10px',
                        marginTop: '1px',
                        objectFit: 'cover',
                      }}
                    />
                  </div>
                </div>

                {/* 텍스트 */}
                <div className="text-center px-5">
                  <p
                    className="text-[23px] font-medium leading-[1.3] mb-2.5"
                    style={{ color: '#222222', letterSpacing: '-0.46px' }}
                  >
                    카페쇼 AI와 연결 중...
                  </p>
                  <p
                    className="text-[16px] leading-[1.3]"
                    style={{ color: '#666666', letterSpacing: '-0.32px' }}
                  >
                    잠시만 기다려주세요
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls - Figma 디자인 */}
      <div
        className="px-10 py-4 flex flex-col gap-2 items-center border-t border-gray-200"
        style={{ position: 'relative', zIndex: 10 }}
      >
        {/* 버튼 영역 */}
        <div className="flex items-center gap-2 w-full">
          {/* X 버튼 */}
          <button
            onClick={handleBack}
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl bg-white"
            style={{
              border: '1.5px solid rgba(218, 32, 61, 0.15)',
              flexShrink: 0,
            }}
          >
            ✕
          </button>

          {/* 중앙 텍스트 - 로딩 상태 및 Agent 상태에 따라 변경 */}
          {(() => {
            const statusInfo = getStatusText();
            return (
              <p
                className="flex-1 text-center text-[16px]"
                style={{
                  background: statusInfo.isAnimated
                    ? 'linear-gradient(90deg, #666666 0%, rgba(102,102,102,0.3) 25%, #666666 50%, rgba(102,102,102,0.3) 75%, #666666 100%)'
                    : 'none',
                  backgroundSize: statusInfo.isAnimated ? '200% 100%' : '100% 100%',
                  WebkitBackgroundClip: statusInfo.isAnimated ? 'text' : 'unset',
                  WebkitTextFillColor: statusInfo.isAnimated ? 'transparent' : '#666666',
                  color: statusInfo.isAnimated ? 'transparent' : '#666666',
                  animation: statusInfo.isAnimated ? 'gradient-flow 4s linear infinite' : 'none',
                  letterSpacing: '-0.32px',
                  lineHeight: '1.3',
                }}
              >
                {statusInfo.text}
              </p>
            );
          })()}

          {/* 마이크 버튼 - 로딩 상태에 따라 변경 */}
          <button
            onClick={isLoaded ? toggleMic : undefined}
            disabled={!isLoaded}
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              border: '1.5px solid rgba(218, 32, 61, 0.15)',
              flexShrink: 0,
              background: isMicEnabled ?'#FFFFFF' : '#F8CAD2',
            }}
          >
            <img
              src={
                !isLoaded
                  ? '/assets/icon-mic-loading.svg'
                  : isMicEnabled
                    ? '/assets/icon-mic-default.svg'
                    : '/assets/icon-mic-muted.svg'
              }
              alt="음성"
              className="w-5 h-5"
            />
          </button>
        </div>

        {/* 하단 안내 문구 */}
        <p
          className="text-[14px] text-center whitespace-nowrap"
          style={{
            color: '#BCBCBC',
            letterSpacing: '-0.28px',
            lineHeight: '1.4',
          }}
        >
          AI 이기 때문에 실수할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
