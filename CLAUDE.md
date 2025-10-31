# CLAUDE.md

이 파일은 Claude Code가 cafe-show 코드베이스 작업 시 참고하는 가이드입니다.

## 프로젝트 개요

**CafeShow**는 React 프론트엔드와 Unity WebGL 3D 아바타를 결합한 하이브리드 웹 애플리케이션입니다. 사용자는 텍스트 채팅 또는 립싱크 아바타와의 음성 대화를 통해 행사 정보를 얻을 수 있습니다.

### 기술 스택

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (CafeShow 커스텀 디자인 토큰)
- **실시간 통신**: LiveKit (WebRTC)
- **3D 아바타**: Unity WebGL + TalkMotion SDK (ServerMode.NoServer)
- **빌드 도구**: Vite

---

## 아키텍처 패턴

### Container/Presentation 패턴

**SessionManager (Container - 비즈니스 로직):**
- LiveKit 연결 관리
- State 관리 (messages, agentState, avatarMessage)
- 오디오/텍스트 스트림 처리
- RPC 핸들러 등록 (agent_state_changed, show_event_details, user_mode_changed)
- 마이크 볼륨 감지 (useTrackVolume)
- 사용자 모드 추적 (chat/avatar)

**ChatView & AvatarView (Presentation - UI):**
- UI 렌더링만 담당
- Props를 통해 데이터 수신
- LiveKit 직접 접근 없음

### 컴포넌트 계층

```
App (LiveKit 초기화)
  ↓
LiveKitRoom (컨텍스트 제공)
  ↓
SessionManager (비즈니스 로직)
  ├─ Audio tracks (모든 화면)
  ├─ Transcription 구독
  ├─ Messages state
  └─ 화면 라우팅
      ├─ ChatView (텍스트 채팅 UI)
      └─ AvatarView (Unity + 음성 UI)
```

---

## 주요 파일 및 역할

### `/src/components/SessionManager.tsx`

**목적:** LiveKit 세션 중앙 관리

**책임:**
- LiveKit Room 컨텍스트 사용
- Audio track 렌더링 (AudioTrack 컴포넌트)
- Transcription 스트림 처리 (`lk.transcription` topic)
- 텍스트 채팅 처리 (`lk.chat` topic)
- Messages state 관리
- 화면 라우팅 (ChatView vs AvatarView)

**핵심 로직:**
- `participantIdentity`로 User/Agent 구분
- `segmentId`로 메시지 중복 제거
- Final/Interrupt 신호 처리
- ChatView에서 마이크 비활성화
- **useRef를 통한 클로저 문제 해결** (currentScreenRef, pendingDetailTopicRef)

**RPC 통신:**
- `agent_state_changed`: Agent 상태 수신 (listening/thinking/speaking)
- `show_event_details`: 상세 정보 표시 요청 수신 (pending 방식)
- `user_mode_changed`: 사용자 모드 변경 알림 전송 (chat/avatar)

**새로운 기능 (2025-10-31):**
- Agent 상태 기반 동적 UI (agentState)
- 마이크 볼륨 감지 및 시각화 (useTrackVolume)
- AvatarView 초기 인사말 관리 (avatarMessage)
- 상세 정보 표시 (detailTopic → ChatMessage)

**하지 말아야 할 것:**
- UI 렌더링 추가 (ChatView/AvatarView에 위임)
- Unity 전용 로직 관리 (AvatarView의 역할)

---

### `/src/pages/ChatView.tsx`

**목적:** 텍스트 채팅 UI

**책임:**
- 메시지 리스트 렌더링
- 인사말 + 태그 버튼
- 텍스트 입력 필드
- 아바타 툴팁 (메시지 없을 때)

**Props:**
- `messages: ChatMessage[]` - SessionManager에서 받음 (detailTopic 포함)
- `onSendMessage: (text: string) => void` - SessionManager 콜백
- `onNextScreen?: (shouldInterrupt?: boolean) => void` - AvatarView로 이동
- `onClearDetail?: (messageId: string) => void` - 상세 정보 닫기

**새로운 기능 (2025-10-31):**
- **동적 버튼**: 텍스트 입력 시 전송 버튼, 비어있을 때 아바타 모드 버튼
- **상세 정보 표시**: Agent 메시지에 MD 형식 상세 내용 붙이기 (react-markdown)
- **메시지별 detail 관리**: 각 Agent 답변 아래 해당 detail 표시

**스타일:**
- 고정 높이 컨테이너 (`h-screen`)
- 스크롤 가능한 메인 컨텐츠
- 숨겨진 스크롤바 (`.hide-scrollbar`)

---

### `/src/pages/AvatarView.tsx`

**목적:** Unity 통합 음성 아바타 UI

**책임:**
- Unity WebGL 관리 (`useUnityContext`)
- 애니메이션 데이터 처리 (`useAnimationData`)
- 마이크 토글 (로컬 state)
- Unity ↔ React 데이터 전송
- 커스텀 로딩 화면

**Props:**
- `lastMessage?: ChatMessage` - SessionManager에서 받음 (AvatarView 진입 시 초기화)
- `agentState: AgentState | null` - Agent 상태 (listening/thinking/speaking)
- `userVolume: number` - 사용자 마이크 볼륨 (0-1)
- `onBack: () => void` - ChatView로 돌아가기

**주요 기능:**
- 고정 캔버스 크기: 430×420px
- 하단 정렬 Unity 캔버스
- 원형 아바타 로딩 오버레이
- 마이크 on/off 토글 (80×80px 버튼)

**새로운 기능 (2025-10-31):**
- **동적 상태 문구**: Agent state 및 음소거 상태에 따라 변경
  - 연결중: "연결중" (정적)
  - 음소거: "음소거 되어있어요"
  - Thinking: "생각하고 있어요" (그라데이션 애니메이션)
  - 기본: "궁금한 점을 물어보세요"
- **볼륨 기반 그라데이션**: 마이크 볼륨에 따라 하단 빨간 그라데이션 투명도 변화
- **초기 인사말 관리**: AvatarView 진입 시 항상 초기 인사말 표시

**Unity 통합:**
- 애니메이션 데이터: `sendMessage('ReactBridge', 'OnAnimationData', frameString)`
- Control signals: `"final"` (큐 경유), `"interrupted"` (즉시)
- ReactBridge 캐시된 processor 참조

---

### `/src/hooks/useAnimationData.ts`

**목적:** 애니메이션 프레임 큐잉 및 다운샘플링

**주요 기능:**
- Agent로부터 애니메이션 프레임 수신 (208 bytes each)
- **3:1 다운샘플링** (60fps → 20fps)
- 60fps dequeue를 통한 프레임 큐
- Control signal 처리 ("final", "interrupted")

**중요 사항:**
- Agent만 처리 (`participant.identity.startsWith('agent')`)
- Final signal은 큐 경유 (순서 보장)
- Interrupted signal은 큐 우회 (즉시 처리)

---

### `/src/hooks/useAudioContext.ts`

**목적:** 브라우저 autoplay 정책 우회

**기능:**
- 첫 사용자 인터랙션 시 AudioContext 재개
- click, touch, keydown 이벤트 리스닝
- Agent 오디오 재생에 필수

---

### `/src/hooks/useTrackVolume.ts` (신규 2025-10-31)

**목적:** LiveKit Track의 실시간 오디오 볼륨 감지

**기능:**
- Web Audio API (AudioContext + AnalyserNode)
- RMS 계산으로 볼륨 정규화 (0-1)
- 30 FPS 업데이트
- MediaStream 기반 분석

**사용처:**
- SessionManager: 사용자 마이크 볼륨 감지
- AvatarView: 볼륨 기반 시각적 피드백

---

### `/src/components/DetailContent.tsx` (신규 2025-10-31)

**목적:** MD 형식 상세 정보 렌더링

**기능:**
- `/content/{topic}.md` 파일 fetch
- react-markdown으로 렌더링
- 볼드, 리스트, 줄바꿈 등 MD 구문 지원
- 닫기 버튼 (선택)

**데이터:**
- `forum.md` - 월드커피리더스포럼
- `ticket.md` - 티켓 정보
- `hall.md` - 홀별 소개
- `transportation.md` - 교통 안내
- `program.md` - 주요 프로그램

---

## Unity 통합 (ServerMode.NoServer)

### 아키텍처

**TalkMotion SDK 확장:**
- `ServerMode.NoServer` enum (WebGL 모드)
- `TMNoServer/Runtime/NoServerDataProcessor.cs` (프레임 처리)
- `TMAvatar/Runtime/Avatar/FluentTAvatar.NoServer.cs` (통합)
- @..\talkmotion-sdk

**핵심 개념:**
- **NoServer 모드**: Unity가 서버 연결 없이 React로부터 데이터 수신
- **프레임 처리**: 208 bytes → 52 floats → TMAnimationClip
- **배치 처리**: 11 frames → 10 frames + 1 overlapping
- **FPS**: 20fps (React에서 60fps를 다운샘플링)

### ReactBridge (Unity C#) 
@..\cafe-show-unity-webgl\Assets\Scripts\Bridge\ReactBridge.cs

**캐시된 참조:**
```csharp
private NoServerDataProcessor _cachedProcessor;

void Start() {
  InitializeProcessor();  // 한 번 캐시, 재사용
}
```

**Control Signals:**
- `"final"`: 더미 208 bytes + `isFinal: true` → FlushBuffer
- `"interrupted"`: InterruptStream() → 버퍼 클리어

---

## 데이터 흐름 상세

### 텍스트 채팅

```
User 입력 → SessionManager.send()
  ↓
LiveKit (lk.chat topic)
  ↓
Agent 처리
  ↓
Agent 응답 (lk.transcription topic)
  ↓
SessionManager 수신
  ↓
participantIdentity 체크 → Agent 메시지
  ↓
segmentId → 중복 제거
  ↓
setMessages() → ChatView/AvatarView 표시
```

### 음성 대화 + 립싱크

```
User 음성 → Agent STT + LLM + TTS + STF
  ↓
Agent.publish_data(208 bytes) @ 원본 ~60fps, 전송 ~200fps
  ↓
React.useAnimationData 수신
  ↓
3:1 다운샘플링 (3개 중 1개만 큐에 저장)
  ↓
Queue.push() → 실질적 20fps
  ↓
setInterval dequeue @ 60fps 브라우저 속도
  ↓
Unity.OnAnimationData(frameString)
  ↓
ReactBridge 파싱 → NoServerDataProcessor
  ↓
11 frames 버퍼링 → 배치 처리 (10 frames + 1 overlap)
  ↓
FluentTAvatar.OnNoServerDataReceived
  ↓
ConvertBlendshapeFramesToTMAnimationClip (20fps)
  ↓
Timeline.Reserve(startTime, 0.5s, fadeIn, fadeOut)
  ↓
Blendshape 애니메이션 재생 @ 20fps
```

---

## 개발 가이드라인

### 새 화면 추가 시

1. `/src/pages/`에 UI 컴포넌트 생성
2. SessionManager에 화면 라우팅 추가
3. Props 인터페이스 정의
4. `/src/types/`의 `ScreenType` union에 추가

### LiveKit 로직 수정 시

**해야 할 것:**
- SessionManager만 수정
- ChatView/AvatarView는 순수 UI 유지

**하지 말아야 할 것:**
- ChatView/AvatarView에 LiveKit hooks 추가
- State 관리 중복

---

## 스타일링 가이드

### Tailwind 커스텀 토큰

```javascript
// tailwind.config.js
colors: {
  cafeshow: {
    red: '#da203d',
    pink: '#fef0f2',
    gray: { 100, 200, 300, 900 }
  }
}

maxWidth: {
  mobile: '430px'
}
```

### 전역 스타일

```css
/* index.css */
.hide-scrollbar {
  /* 크로스 브라우저 스크롤바 숨김 */
}
```

---

## 신규 기능 (2025-10-31)

### 1. 동적 UI 시스템

**동적 버튼 (ChatView):**
- 텍스트 입력 중: 전송 아이콘 + 전송 기능
- 텍스트 비어있음: 아바타 모드 아이콘 + 화면 전환 + Agent interrupt

**동적 상태 문구 (AvatarView):**
- Agent state 기반 문구 변경
- "생각하고 있어요" 그라데이션 애니메이션 (linear, 끊김 없음)
- 음소거 상태 감지

---

### 2. Agent 상태 관리

**RPC 기반 양방향 통신:**
- React → Agent: `user_mode_changed` (chat/avatar 모드 알림)
- Agent → React: `agent_state_changed` (thinking/listening/speaking)

**사용자 모드 추적:**
- ChatView: `current_mode = 'chat'` → function_tool 활성화
- AvatarView: `current_mode = 'avatar'` → function_tool 비활성화, 상세 답변

**클로저 문제 해결:**
- `useRef` 패턴으로 최신 상태 참조 (currentScreenRef, pendingDetailTopicRef)

---

### 3. 키워드 기반 상세 정보 표시 (ChatView 전용)

**Agent function_tool:**
- `@function_tool() show_event_details(topic)`
- OpenAI Realtime API 최적화 (불릿, 대문자 강조)
- Tool preamble: "자세한 정보를 보여드릴게요"

**동작 흐름:**
```
사용자: "포럼 있나요?"
    ↓
Agent: "네, 월드커피리더스포럼이 열립니다. 자세한 정보를 보여드릴게요."
    ↓
RPC: show_event_details(topic="forum")
    ↓
React: Pending 저장 → 다음 Agent 메시지에 detailTopic 붙이기
    ↓
ChatView: Agent 답변 + 구분선 + MD 상세 내용
```

**Pending 방식:**
- RPC 즉시 응답 (timeout 방지)
- 다음 Agent Transcription에 자동 연결
- 각 메시지별로 detail 누적 표시

---

### 4. 마이크 볼륨 시각화

**useTrackVolume 훅:**
- Web Audio API (AnalyserNode)
- RMS 계산으로 0-1 정규화
- 30 FPS 업데이트

**시각적 피드백 (AvatarView):**
- 하단 빨간 그라데이션 (550px 고정 높이)
- 볼륨에 따라 opacity 변화 (0-1)
- `transition: opacity 0.1s` 부드러운 전환

---

### 5. CSS 애니메이션

**그라데이션 애니메이션 (`index.css`):**
```css
@keyframes gradient-flow {
  0% { background-position: 100% 50%; }
  100% { background-position: -100% 50%; }
}
```

**적용:**
- "생각하고 있어요" 텍스트
- 왼쪽 → 오른쪽 흐르는 효과
- 4s linear infinite

---

## 배포 (Vercel)

### Vercel Serverless Function

**Token 생성:**
- `api/token.ts` - LiveKit JWT 생성
- Mixed Content 문제 해결 (HTTPS)
- livekit-server-sdk 사용

**환경 변수 (Vercel Dashboard):**
```
LIVEKIT_API_KEY=APIAEqsG454pxax
LIVEKIT_API_SECRET=heKLTjXqLal0ML3yU1Z849wV5kxxFfo87vhpeHiozmfB
VITE_TOKEN_SERVER_URL=/api/token
VITE_LIVEKIT_SERVER_URL=wss://mirabel-2j47mr85.livekit.cloud
VITE_ROOM_PREFIX=cafe-show
```

**배포 방식:**
- Git 자동 배포 비활성화 (Unity 파일 문제)
- `vercel --prod` 수동 배포 (CLI)

**로컬 테스트:**
```bash
vercel dev  # Serverless Function 포함
```

---

## 관련 프로젝트

- **talkmotion-sdk** @../talkmotion-sdk : ServerMode.NoServer 구현
- **cafe-show-unity-webgl** @../cafe-show-unity-webgl : Unity WebGL 빌드 소스
- **livekit-agents** @../livekit-agents :
  - CafeShow Agent (`core/cafe_show_agent.py`)
  - 카페쇼 페르소나 (`config/personas.py`)
  - RPC handlers (`handlers/rpc_handlers.py`)

---


**업데이트:** 2025-10-31
**상태:** ✅ 동적 UI, Agent 상태 관리, 상세 정보 표시, 볼륨 시각화, Vercel 배포 완료
