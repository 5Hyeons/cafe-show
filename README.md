# CafeShow - AI 행사 안내 시스템

CafeShow 행사를 위한 AI 아바타 안내 시스템입니다. 텍스트 채팅과 음성 아바타 대화를 통해 행사 정보를 제공합니다.

## ✨ 주요 기능

### 💬 텍스트 채팅 (ChatView)
- LiveKit Agent와 실시간 텍스트 대화
- 빠른 질의응답 태그 버튼
- 대화 내역 실시간 표시
- User/Agent 메시지 구분 표시

### 🎭 음성 아바타 대화 (AvatarView)
- Unity WebGL 3D 아바타
- 실시간 음성 인식 및 응답
- **완벽한 립싱크** (20fps 애니메이션)
- 마이크 on/off 토글

### 🎨 디자인
- Figma 디자인 100% 구현
- 모바일 우선 (430px 최대 너비)
- CafeShow 브랜드 컬러
- Noto Sans KR 폰트

---

## 🛠 기술 스택

### Frontend
- **React 18** + TypeScript
- **Vite** (빌드 도구)
- **Tailwind CSS** (스타일링)

### 통신
- **LiveKit** (WebRTC 실시간 통신)
  - `livekit-client`: 클라이언트 SDK
  - `@livekit/components-react`: React 컴포넌트

### 3D 아바타
- **Unity WebGL** (3D 렌더링)
- **react-unity-webgl** (React 통합)
- **TalkMotion SDK** (ServerMode.NoServer)

---

## 🏗️ 아키텍처

### 컴포넌트 구조

```
App
  ↓
LiveKitRoom (컨텍스트)
  ↓
SessionManager (비즈니스 로직)
  ├─ LiveKit 연결 관리
  ├─ 오디오/텍스트 처리
  ├─ 메시지 state 관리
  └─ 화면 분기
      ├─ ChatView (텍스트 채팅 UI)
      └─ AvatarView (Unity 아바타 UI)
```

### 데이터 흐름

**텍스트 대화:**
```
User → LiveKit Chat → Agent → Transcription → SessionManager → ChatView/AvatarView
```

**음성 대화 (립싱크):**
```
User 음성 → Agent → Animation Data (60fps)
  ↓
React 수신 & 큐잉
  ↓
3:1 다운샘플링 (60fps → 20fps)
  ↓
Unity (NoServerDataProcessor)
  ↓
11-frame overlapping batches
  ↓
Timeline 재생 (20fps, 완벽한 싱크!)
```

---

## 🚀 시작하기

### 1. 환경 변수 설정

`.env` 파일 생성:

```bash
VITE_TOKEN_SERVER_URL=http://61.14.209.9:8037
VITE_LIVEKIT_SERVER_URL=wss://your-livekit-server.livekit.cloud
VITE_ROOM_PREFIX=cafe-show
```

### 2. 패키지 설치

```bash
npm install
```

### 3. Unity 빌드 파일 준비

Unity WebGL 빌드 결과를 `public/unity/Build/`에 복사:

```
public/unity/Build/
  ├── unity.loader.js
  ├── unity.data
  ├── unity.framework.js
  └── unity.wasm
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

---

## 📁 프로젝트 구조

```
cafe-show/
├── public/
│   ├── assets/              # Figma 에셋 (로고, 아이콘, 이미지)
│   └── unity/               # Unity WebGL 빌드
│       ├── Build/
│       └── TemplateData/
├── src/
│   ├── components/
│   │   ├── chat/
│   │   │   └── ChatMessageItem.tsx    # 메시지 아이템
│   │   ├── common/
│   │   │   ├── Header.tsx             # 공통 헤더
│   │   │   └── TagButton.tsx          # 태그 버튼
│   │   └── SessionManager.tsx         # LiveKit 세션 관리
│   ├── hooks/
│   │   ├── useAnimationData.ts        # 애니메이션 데이터 수신 & 큐잉
│   │   ├── useAudioContext.ts         # 브라우저 오디오 정책 우회
│   │   └── useLiveKit.ts              # LiveKit 연결
│   ├── pages/
│   │   ├── ChatView.tsx               # 텍스트 채팅 화면
│   │   └── AvatarView.tsx             # 음성 아바타 화면
│   ├── types/
│   │   └── index.ts                   # TypeScript 타입
│   ├── App.tsx                        # 앱 진입점
│   ├── main.tsx                       # React 렌더링
│   └── index.css                      # 전역 스타일
└── tailwind.config.js                 # Tailwind 설정
```

---

## 🎯 주요 구현 사항

### 1. SessionManager (통합 세션 관리)

**역할:**
- LiveKit 연결 및 데이터 관리
- 오디오 출력 (AudioTrack)
- Transcription 구독 (User/Agent 구분)
- 메시지 state 관리
- 화면 분기 (ChatView/AvatarView)

**핵심 로직:**
- `participantIdentity` 기반 User/Agent 구분
- `segmentId` 기반 메시지 중복 제거
- Final signal 처리 (순서 보장)
- Interrupt signal 처리 (즉시 실행)

---

### 2. 립싱크 시스템

**프레임 다운샘플링 (60fps → 20fps):**
```typescript
// useAnimationData.ts
if (totalFramesReceived.current % 3 === 0) {
  frameQueue.current.push(payload);  // 3개 중 1개만
}
```

**프레임 큐잉:**
- Agent: 초고속 전송 (~200fps)
- React: 큐에 저장
- Dequeue: 60fps로 안정적 전송

**Overlapping Frames (Unity):**
```csharp
// NoServerDataProcessor.cs
// 11개 배치 → 10개 처리, 마지막 1개 유지
// 0.5초 정확한 애니메이션 길이
```

---

### 3. Unity 통합 (ServerMode.NoServer)

**TalkMotion SDK 확장:**
- `ServerMode.NoServer` 추가 (WebGL 전용)
- `TMNoServer` 모듈 생성
- `FluentTAvatar.NoServer.cs` 구현
- `ReactBridge.cs` 캐싱 최적화

**데이터 흐름:**
```
Agent → publish_data(208 bytes)
  ↓
React → useAnimationData (큐잉 + 다운샘플링)
  ↓
Unity → ReactBridge → NoServerDataProcessor
  ↓
FluentTAvatar → Timeline (20fps 재생)
```

---

## 🔧 개발 가이드

### 컴포넌트 수정

**SessionManager 수정 시:**
- LiveKit 관련 모든 로직
- 화면 전환 로직
- messages state

**ChatView 수정 시:**
- 텍스트 채팅 UI만
- props로 데이터 받기

**AvatarView 수정 시:**
- Unity 관리
- 마이크 토글
- props로 lastMessage 받기

---

### Unity 빌드 프로세스

1. **Unity Editor:**
   - Scene: AIConsultation
   - FluentTAvatar: ServerMode = **NoServer**
   - Build Settings → WebGL → Build

2. **빌드 파일 복사:**
   ```bash
   cp -r unity-build/Build/* cafe-show/public/unity/Build/
   ```

3. **테스트:**
   ```bash
   npm run dev
   ```

---

### 립싱크 조정

**FPS 변경:**
- `useAnimationData.ts`: 다운샘플링 비율 (`% 3`)
- `FluentTAvatar.NoServer.cs`: `DEFAULT_FPS = 20f`
- `NoServerDataProcessor.cs`: `MAX_FRAMES_PER_BATCH = 10`

**Fade 조정:**
- `FluentTAvatar.NoServer.cs` Line 115: `TimeSlot(..., fadeIn, fadeOut)`

---

## 🐛 문제 해결

### 마이크가 켜져 있음
- `useConnectionState` 사용 (타이밍 문제)
- ChatView: 연결 완료 후 비활성화

### User 메시지가 Agent 쪽에 표시
- `participantIdentity` 객체 처리
- `.identity` 추출

### 립싱크가 안 맞음
- 100배 증폭 (0~1 → 0~100)
- 다운샘플링 (60fps → 20fps)
- Overlapping frames

### 로딩 화면이 안 바뀜
- Unity Splash Screen 비활성화
- React 오버레이로 덮기

---

## 📚 참고 자료

- [Figma 디자인](https://www.figma.com/design/NJnfnki91NVls4ef06Mokn/TalkMotion_UI_v2.0--2025-?node-id=590-18930&m=dev)
- [LiveKit Docs](https://docs.livekit.io/)
- [TalkMotion SDK](../talkmotion-sdk/)
- [Unity Project](../cafe-show-unity-webgl/)
