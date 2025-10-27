# Cafe-Show Project Specification

## 📋 프로젝트 개요

### 목적
**CafeShow 행사 안내 모바일 웹 애플리케이션** - Figma 디자인을 100% 정확히 구현한 AI 아바타 채팅 앱으로, LiveKit을 통해 Agent와 실시간 텍스트 소통을 하고, Unity WebGL을 통해 3D 아바타(카페쇼 마스코트)와 인터랙션하는 통합 시스템입니다.

### 핵심 기능
- **모바일 우선 UI**: 430px 고정 너비, 세로 레이아웃
- **CafeShow 브랜드 컬러**: 빨간색(#da203d) 중심의 디자인
- **행사 안내 태그**: 행사 정보, 티켓/예매, 입장 절차, 대중교통, 주요 프로그램
- LiveKit Agent와 텍스트 채팅 (음성/비디오 없음, 텍스트만)
- Unity WebGL 3D 아바타 렌더링 (카페쇼 캐릭터)
- 3개의 Participant (Agent + React Client + Unity Client) 동기화
- 멀티 스크린 플로우 (진입 → 채팅 → 로딩 → 아바타 대화)

### 시스템 아키텍처

```
┌─────────────────┐
│  React Client   │ ←→ LiveKit Room ←→ Agent
│  (Vite + TS)    │
└────────┬────────┘
         │
         ↓ (embed)
┌─────────────────┐
│  Unity WebGL    │ ←→ LiveKit Room
│   (3D Avatar)   │
└─────────────────┘

Token Server (http://61.14.209.9:8037)
     │
     └──→ Generates JWT tokens for all participants
```

### 참고 프로젝트
- **agents-playground**: LiveKit + React 채팅 UI 참고
- **mirabel-unity-webgl-builds**: Unity WebGL 빌드 파일 참고

---

## 🛠 기술 스택

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite (Next.js 대신)
- **Styling**: Tailwind CSS
- **Typography**: Noto Sans KR (Google Fonts)
- **Viewport**: 430px 고정 너비 (모바일 최적화)
- **Brand Color**: #da203d (CafeShow Red)
- **Animation**: Framer Motion (선택)

### LiveKit
- **Client Library**: `livekit-client` (^2.9.5)
- **React Components**: `@livekit/components-react` (^2.9.3)
- **Styles**: `@livekit/components-styles` (^1.1.5)

### Unity
- **Unity WebGL Build**: mirabel-unity-webgl-builds
- **Communication**: `unityInstance.SendMessage()` + `window` events

### Backend
- **Token Server**: 기존 Node.js 서버 활용
  - URL: http://61.14.209.9:8037
  - Endpoint: POST `/token`

---

## ⚙️ 개발 환경 설정

### 1. 프로젝트 초기화

```bash
cd cafe-show
npm create vite@latest . -- --template react-ts
npm install
```

### 2. 필수 패키지 설치

```bash
# LiveKit
npm install livekit-client @livekit/components-react @livekit/components-styles

# Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Utilities
npm install framer-motion
```

### 3. Tailwind 설정

**tailwind.config.js**
```js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**src/index.css**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 4. 환경 변수

**.env.example**
```bash
# LiveKit Token Server
VITE_TOKEN_SERVER_URL=http://61.14.209.9:8037

# LiveKit Server URL (wss://...)
VITE_LIVEKIT_SERVER_URL=wss://your-livekit-server.livekit.cloud

# Room Name Prefix
VITE_ROOM_PREFIX=cafe-show
```

**.env**
```bash
# 실제 값으로 채우기
VITE_TOKEN_SERVER_URL=http://61.14.209.9:8037
VITE_LIVEKIT_SERVER_URL=wss://your-actual-server.livekit.cloud
VITE_ROOM_PREFIX=cafe-show
```

---

## 🖼 화면별 상세 스펙

### Screen 1: 초기 진입 화면

**Figma**: [571-21214](https://www.figma.com/design/NJnfnki91NVls4ef06Mokn/TalkMotion_UI_v2.0--2025-?node-id=571-21214&m=dev)

**기능**
- React가 LiveKit Room에 자동 접속
- Agent와 텍스트로만 소통 (음성/비디오 비활성화)
- 채팅 입력 UI (하단)
- [603-18747](https://www.figma.com/design/NJnfnki91NVls4ef06Mokn/TalkMotion_UI_v2.0--2025-?node-id=603-18747&m=dev) 마이크 아이콘은 **구현하지 않음**

**전환 조건**
- [578-22244](https://www.figma.com/design/NJnfnki91NVls4ef06Mokn/TalkMotion_UI_v2.0--2025-?node-id=578-22244&m=dev) 빨간 동그라미 버튼 클릭 시 → Screen 2로 이동

**구현 포인트**
- LiveKit Room 연결
- Data Channel을 통한 텍스트 메시지 송수신
- 사용자 입력창 + 전송 버튼
- Agent 응답 표시

---

### Screen 2: 채팅 대화 화면

**Figma**: [578-19970](https://www.figma.com/design/NJnfnki91NVls4ef06Mokn/TalkMotion_UI_v2.0--2025-?node-id=578-19970&m=dev)

**기능**
- 사용자와 Agent의 채팅 내역 표시
- 사용자 메시지: **테두리 있는 박스**
- Agent 메시지: **테두리 없음** (차이점 명확)
- 스크롤 가능한 채팅 영역

**전환 조건**
- [578-22278](https://www.figma.com/design/NJnfnki91NVls4ef06Mokn/TalkMotion_UI_v2.0--2025-?node-id=578-22278&m=dev) 동그라미 버튼 클릭 시 → Screen 3으로 이동

**구현 포인트**
- 채팅 메시지 리스트 렌더링
- 자동 스크롤 (최신 메시지로)
- agents-playground의 `ChatTile` 컴포넌트 참고
- [603-18742](https://www.figma.com/design/NJnfnki91NVls4ef06Mokn/TalkMotion_UI_v2.0--2025-?node-id=603-18742&m=dev) 마이크 아이콘 **무시**

---

### Screen 3: 로딩/대기 화면

**Figma**: [578-20109](https://www.figma.com/design/NJnfnki91NVls4ef06Mokn/TalkMotion_UI_v2.0--2025-?node-id=578-20109&m=dev)

**기능**
- Unity WebGL 빌드 파일 로딩 시작
- Unity Client가 LiveKit Room에 접속
- **백그라운드 프로세스**:
  1. Unity `createUnityInstance()` 호출
  2. Unity가 LiveKit Room 접속
  3. Participant 수 체크 (React가 감지)

**전환 조건**
- LiveKit Room의 Participant 수가 **3명**이 될 때까지 대기
  - Agent (이미 있음)
  - React Client (이미 있음)
  - Unity Client (새로 접속)
- 3명 확인 시 → Screen 4로 자동 전환

**구현 포인트**
```typescript
import { useParticipants } from '@livekit/components-react';

const participants = useParticipants();

useEffect(() => {
  if (participants.length === 3) {
    // Navigate to Screen 4
  }
}, [participants.length]);
```

---

### Screen 4: 3D 아바타 메인 화면

**Figma**: [578-20359](https://www.figma.com/design/NJnfnki91NVls4ef06Mokn/TalkMotion_UI_v2.0--2025-?node-id=578-20359&m=dev)

**기능**
- 본격적인 3D 아바타와 소통
- Unity Canvas 영역: [578-21427](https://www.figma.com/design/NJnfnki91NVls4ef06Mokn/TalkMotion_UI_v2.0--2025-?node-id=578-21427&m=dev) (샘플 이미지 위치)
- 메시지 표시 영역: [578-21405](https://www.figma.com/design/NJnfnki91NVls4ef06Mokn/TalkMotion_UI_v2.0--2025-?node-id=578-21405&m=dev)
  - Agent로부터 받은 최신 메시지 텍스트 표시
  - 채팅 히스토리는 아님 (현재 메시지만)

**레이아웃**
```
┌──────────────────────────────┐
│                              │
│   Unity Canvas (3D Avatar)   │  ← 578-21427
│                              │
├──────────────────────────────┤
│  Agent Message Text Here     │  ← 578-21405
└──────────────────────────────┘
```

**구현 포인트**
- Unity Canvas 임베드
- Agent의 최신 메시지만 하단에 표시
- Unity와 React 간 상태 동기화

---

### Screen 5: 음소거 모드

**Figma**: [578-22126](https://www.figma.com/design/NJnfnki91NVls4ef06Mokn/TalkMotion_UI_v2.0--2025-?node-id=578-22126&m=dev)

**기능**
- Screen 4에서 음소거 버튼 토글 시 UI 변경
- [578-22133](https://www.figma.com/design/NJnfnki91NVls4ef06Mokn/TalkMotion_UI_v2.0--2025-?node-id=578-22133&m=dev) 아이콘 + 텍스트 변경
- 실제 음소거 기능은 구현하지 않을 수도 있음 (UI만)

**구현 포인트**
- 버튼 상태 관리 (`useState`)
- 조건부 아이콘/텍스트 렌더링

---

## 🔗 LiveKit 통합

### 토큰 생성 흐름

```typescript
// src/lib/livekit.ts
export async function generateToken(
  roomName: string,
  identity: string
): Promise<string> {
  const response = await fetch(`${import.meta.env.VITE_TOKEN_SERVER_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      room: roomName,
      identity: identity,
      livekitUrl: import.meta.env.VITE_LIVEKIT_SERVER_URL,
      metadata: {
        userLanguage: 'ko',
        agentLanguage: 'ko',
        customPersona: '',
        voiceName: 'FEMALE_1'
      }
    })
  });

  const data = await response.json();
  return data.token;
}
```

### Room 연결

```typescript
// src/hooks/useLiveKit.ts
import { useState, useEffect } from 'react';
import { generateToken } from '../lib/livekit';

export function useLiveKit() {
  const [token, setToken] = useState<string>('');
  const [roomName, setRoomName] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);

  const connect = async () => {
    const room = `${import.meta.env.VITE_ROOM_PREFIX}-${generateRoomId()}`;
    const identity = generateUserId();
    const tkn = await generateToken(room, identity);

    setRoomName(room);
    setToken(tkn);
    setIsConnected(true);
  };

  return { token, roomName, isConnected, connect };
}

function generateRoomId(): string {
  return crypto.randomUUID().substring(0, 8);
}

function generateUserId(): string {
  return `user-${crypto.randomUUID().substring(0, 12)}`;
}
```

### 메시지 송수신

```typescript
import { useDataChannel } from '@livekit/components-react';

// 메시지 전송
const { send } = useDataChannel();
send(new TextEncoder().encode(message));

// 메시지 수신
const decoder = new TextDecoder();
const onDataReceived = (payload: Uint8Array) => {
  const message = decoder.decode(payload);
  console.log('Received:', message);
};
```

---

## 🎮 Unity WebGL 통합

### Unity 빌드 파일 배치

```
public/
└── unity/
    ├── Build/
    │   ├── mirabel-unity-webgl-builds.data
    │   ├── mirabel-unity-webgl-builds.framework.js
    │   ├── mirabel-unity-webgl-builds.loader.js
    │   └── mirabel-unity-webgl-builds.wasm
    ├── TemplateData/
    └── index.html (참고용, 직접 사용하진 않음)
```

### Unity 로딩 및 초기화

```typescript
// src/lib/unity.ts
declare global {
  interface Window {
    createUnityInstance: (
      canvas: HTMLCanvasElement,
      config: any,
      onProgress?: (progress: number) => void
    ) => Promise<UnityInstance>;
  }
}

export interface UnityInstance {
  SendMessage(objectName: string, methodName: string, value?: string | number): void;
  SetFullscreen(fullscreen: number): void;
  Quit(): Promise<void>;
}

export async function loadUnityBuild(
  canvas: HTMLCanvasElement,
  onProgress?: (progress: number) => void
): Promise<UnityInstance> {
  // 로더 스크립트 동적 로드
  await loadScript('/unity/Build/mirabel-unity-webgl-builds.loader.js');

  const config = {
    dataUrl: '/unity/Build/mirabel-unity-webgl-builds.data',
    frameworkUrl: '/unity/Build/mirabel-unity-webgl-builds.framework.js',
    codeUrl: '/unity/Build/mirabel-unity-webgl-builds.wasm',
    streamingAssetsUrl: 'StreamingAssets',
    companyName: 'DefaultCompany',
    productName: 'mirabel-unity-webgl',
    productVersion: '1.0',
    webglContextAttributes: { alpha: true, premultipliedAlpha: false }
  };

  return await window.createUnityInstance(canvas, config, onProgress);
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = reject;
    document.body.appendChild(script);
  });
}
```

### React → Unity 통신

```typescript
// Unity의 GameObject와 메서드 호출
unityInstance.SendMessage('GameObjectName', 'MethodName', 'parameter');

// 예시: Unity에 메시지 전달
unityInstance.SendMessage('LiveKitManager', 'OnAgentMessage', 'Hello from React!');
```

### Unity → React 통신

Unity에서 JavaScript 호출:
```csharp
// Unity C# 코드
[DllImport("__Internal")]
private static extern void SendToReact(string message);

public void NotifyReact(string data) {
    SendToReact(data);
}
```

React에서 수신:
```typescript
// React
useEffect(() => {
  window.addEventListener('unityMessage', (event: any) => {
    console.log('From Unity:', event.detail);
  });
}, []);
```

또는 전역 함수 등록:
```typescript
// React
useEffect(() => {
  (window as any).onUnityReady = () => {
    console.log('Unity is ready!');
  };
}, []);
```

---

## 🧩 컴포넌트 설계

### 프로젝트 구조

```
src/
├── components/
│   ├── chat/
│   │   ├── ChatMessage.tsx        # 개별 메시지 컴포넌트
│   │   ├── ChatMessageList.tsx    # 메시지 리스트
│   │   └── ChatInput.tsx          # 입력 필드
│   ├── common/
│   │   ├── Button.tsx             # 공통 버튼 (빨간 동그라미 등)
│   │   ├── Loading.tsx            # 로딩 스피너
│   │   └── Layout.tsx             # 공통 레이아웃
│   └── unity/
│       └── UnityCanvas.tsx        # Unity 캔버스 래퍼
├── hooks/
│   ├── useLiveKit.ts              # LiveKit 연결 관리
│   ├── useUnity.ts                # Unity 인스턴스 관리
│   └── useParticipantCount.ts     # Participant 수 감지
├── lib/
│   ├── livekit.ts                 # LiveKit 유틸리티
│   ├── unity.ts                   # Unity 로딩 유틸리티
│   └── types.ts                   # 공통 타입 정의
├── pages/
│   ├── Screen1.tsx                # 초기 진입 화면
│   ├── Screen2.tsx                # 채팅 히스토리
│   ├── Screen3.tsx                # 로딩 화면
│   └── Screen4.tsx                # 메인 (Unity + 메시지)
├── App.tsx                        # 라우팅
├── main.tsx
└── index.css
```

### 주요 컴포넌트

#### ChatMessage.tsx
```typescript
interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp?: number;
}

export function ChatMessage({ message, isUser, timestamp }: ChatMessageProps) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`
        ${isUser ? 'border border-gray-300 rounded-lg' : ''}
        px-4 py-2 max-w-[70%]
      `}>
        {message}
      </div>
    </div>
  );
}
```

#### UnityCanvas.tsx
```typescript
import { useEffect, useRef, useState } from 'react';
import { loadUnityBuild, UnityInstance } from '../lib/unity';

export function UnityCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [instance, setInstance] = useState<UnityInstance | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!canvasRef.current) return;

    loadUnityBuild(canvasRef.current, setProgress)
      .then(setInstance)
      .catch(console.error);
  }, []);

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full" />
      {progress < 1 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-white">Loading: {Math.round(progress * 100)}%</div>
        </div>
      )}
    </div>
  );
}
```

### Custom Hooks

#### useParticipantCount.ts
```typescript
import { useParticipants } from '@livekit/components-react';
import { useEffect } from 'react';

export function useParticipantCount(targetCount: number, onReached: () => void) {
  const participants = useParticipants();

  useEffect(() => {
    if (participants.length >= targetCount) {
      onReached();
    }
  }, [participants.length, targetCount, onReached]);

  return participants.length;
}
```

---

## 🚀 구현 로드맵

### Phase 1: 프로젝트 기본 설정 (1일)
- [ ] Vite + React + TypeScript 프로젝트 초기화
- [ ] Tailwind CSS 설정
- [ ] 프로젝트 구조 생성
- [ ] 환경 변수 설정
- [ ] 기본 라우팅 구조 (React Router 또는 조건부 렌더링)

### Phase 2: LiveKit 통합 (2-3일)
- [ ] LiveKit 패키지 설치
- [ ] 토큰 생성 함수 구현 (`generateToken`)
- [ ] LiveKit Room 연결 (`useLiveKit` hook)
- [ ] 텍스트 메시지 송수신 구현
- [ ] Screen 1, 2 구현 (초기 진입 + 채팅)
- [ ] ChatMessage, ChatInput 컴포넌트 완성

### Phase 3: Unity WebGL 통합 (2-3일)
- [ ] Unity 빌드 파일을 `public/unity/` 폴더에 복사
- [ ] Unity 로딩 유틸리티 구현 (`loadUnityBuild`)
- [ ] UnityCanvas 컴포넌트 구현
- [ ] Screen 3 구현 (로딩 화면)
- [ ] Participant 카운트 감지 로직 (`useParticipantCount`)
- [ ] React ↔ Unity 통신 테스트

### Phase 4: 메인 화면 및 UI 완성 (2-3일)
- [ ] Screen 4 구현 (Unity + 메시지 표시)
- [ ] Screen 5 구현 (음소거 모드)
- [ ] Figma 디자인 기반 스타일링
- [ ] 에셋 다운로드 및 적용 (이미지, 아이콘)
- [ ] 반응형 레이아웃 조정

### Phase 5: 테스트 및 최적화 (1-2일)
- [ ] 전체 플로우 테스트 (Screen 1 → 2 → 3 → 4)
- [ ] LiveKit Agent 연결 테스트
- [ ] Unity WebGL 성능 최적화
- [ ] 에러 핸들링 강화
- [ ] 크로스 브라우저 테스트

---

## 📝 구현 시 주의사항

### LiveKit
1. **텍스트 전용**: 음성/비디오 트랙은 생성하지 않음
2. **Data Channel 사용**: `useDataChannel` hook으로 메시지 송수신
3. **Participant 순서**: Agent가 먼저 Room에 있어야 함

### Unity WebGL
1. **Alpha Channel**: Unity Canvas는 투명 배경 설정 필요
2. **로딩 시간**: Unity 빌드가 클 경우 로딩 화면 필수
3. **메모리 관리**: Unity 인스턴스는 컴포넌트 언마운트 시 정리 필요
   ```typescript
   useEffect(() => {
     return () => {
       if (unityInstance) {
         unityInstance.Quit();
       }
     };
   }, [unityInstance]);
   ```

### 화면 전환
1. **조건부 렌더링** 또는 **React Router** 선택
   - 간단한 경우: `useState`로 currentScreen 관리
   - 복잡한 경우: React Router 사용
2. **상태 유지**: LiveKit Room 연결은 화면 전환 후에도 유지
3. **Unity 로딩**: Screen 3에서 미리 로딩 시작

### 에셋 관리
1. Figma에서 에셋 다운로드 후 `public/assets/` 저장
2. 아이콘은 CSS로 구현 가능한 것은 CSS 우선
3. 이미지 최적화 (WebP, 압축)

---

## 🔧 개발 환경

### 필수 도구
- Node.js 18+
- npm 또는 yarn
- VS Code (권장)

### 추천 VS Code Extensions
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- ESLint
- Prettier

### 실행 명령어
```bash
# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프리뷰
npm run preview
```

---

## 📚 참고 자료

### LiveKit
- [LiveKit Docs](https://docs.livekit.io/)
- [React Components](https://docs.livekit.io/reference/components/react/)
- [Data Channel Example](https://docs.livekit.io/guides/room/data/)

### Unity WebGL
- [Unity WebGL Communication](https://docs.unity3d.com/Manual/webgl-interactingwithbrowserscripting.html)
- [React + Unity WebGL](https://github.com/jeffreylanters/react-unity-webgl)

### Figma
- [Design File](https://www.figma.com/design/NJnfnki91NVls4ef06Mokn/TalkMotion_UI_v2.0--2025-)

---

## ✅ 다음 단계

이 스펙 문서를 기반으로:

1. **cafe-show 폴더에서 Vite 프로젝트 초기화**
2. **필수 패키지 설치**
3. **Phase 1부터 순차적으로 구현**
4. **각 Phase 완료 시 테스트**

질문이나 추가 설명이 필요한 부분이 있으면 언제든지 문의하세요!
