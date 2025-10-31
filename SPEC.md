# CafeShow 기술 명세서 (Technical Specification)

> 서울카페쇼 2025 AI 아바타 안내 시스템 기술 명세

**프로젝트명:** CafeShow AI Assistant
**버전:** 1.0.0
**최종 업데이트:** 2025-10-31
**배포 URL:** https://cafe-show.vercel.app

---

## 1. 시스템 개요

### 1.1 목적
서울카페쇼 2025 행사 정보를 제공하는 웹 기반 AI 아바타 안내 시스템

### 1.2 주요 기능
- 텍스트 채팅 기반 행사 정보 제공
- 음성 대화 기반 3D 아바타 상담
- 실시간 립싱크 애니메이션
- 키워드 기반 상세 정보 표시

### 1.3 대상 플랫폼
- **디바이스**: 모바일 우선 (데스크톱 호환)
- **해상도**: 430px 최대 너비
- **브라우저**: Chrome, Safari, Edge (WebGL 지원 필수)

---

## 2. 기술 스택

### 2.1 Frontend

| 기술 | 버전 | 용도 |
|------|------|------|
| React | 18.3.1 | UI 프레임워크 |
| TypeScript | 5.6.2 | 타입 안정성 |
| Vite | 6.4.1 | 빌드 도구 |
| Tailwind CSS | 3.4.17 | 스타일링 |

**주요 라이브러리:**
```json
{
  "livekit-client": "^2.15.13",
  "@livekit/components-react": "^2.9.15",
  "react-unity-webgl": "^9.5.2",
  "react-markdown": "^9.0.2"
}
```

### 2.2 Backend/Serverless

| 기술 | 용도 |
|------|------|
| Vercel Serverless Functions | Token 생성 API |
| livekit-server-sdk | JWT 생성 |
| LiveKit Cloud | WebRTC 인프라 |
| Python Agents | AI 대화 처리 |

### 2.3 3D Graphics

| 기술 | 버전 | 용도 |
|------|------|------|
| Unity | 6000.0.59f2 | WebGL 렌더링 |
| TalkMotion SDK | Custom | 립싱크 시스템 |
| ServerMode | NoServer | React 직접 통신 |

---

## 3. 시스템 아키텍처

### 3.1 전체 구조

```
┌─────────────────────────────────────────────────┐
│         Vercel (cafe-show.vercel.app)           │
│  ┌──────────────┐        ┌─────────────────┐    │
│  │  React App   │        │ /api/token (TS) │    │
│  │  (Frontend)  │───────→│  JWT Generator  │    │
│  └──────┬───────┘        └─────────────────┘    │
│         │                                       │
└─────────┼───────────────────────────────────────┘
          │
          │ WebRTC (WSS)
          ↓
┌─────────────────────────────────────────────────┐
│           LiveKit Cloud (mirabel-*)             │
│  ┌──────────────┐        ┌─────────────────┐    │
│  │ WebRTC Room  │←──────→│  Python Agent   │    │
│  │  (Session)   │        │  (AI Backend)   │    │
│  └──────────────┘        └─────────────────┘    │
└─────────────────────────────────────────────────┘
```

### 3.2 React 컴포넌트 아키텍처

**Container/Presentation 패턴:**

```
App (LiveKitRoom Provider)
  ↓
SessionManager (Container - 비즈니스 로직)
  ├─ LiveKit 연결 관리
  ├─ RPC 핸들러 (3개)
  ├─ State 관리 (messages, agentState, avatarMessage, pendingDetailTopic)
  ├─ 마이크 볼륨 감지
  └─ 화면 라우팅
      │
      ├─ ChatView (Presentation - UI)
      │    ├─ 메시지 리스트
      │    ├─ 동적 입력 버튼
      │    └─ DetailContent (MD 렌더링)
      │
      └─ AvatarView (Presentation - UI)
           ├─ Unity WebGL 캔버스
           ├─ 동적 상태 문구 (애니메이션)
           ├─ 마이크 토글
           └─ 볼륨 그라데이션
```

---

## 4. 데이터 흐름

### 4.1 텍스트 채팅 (ChatView)

```
[사용자 입력]
    ↓
SessionManager.send(text) → LiveKit Chat (lk.chat)
    ↓
Agent 수신 → LLM 처리 → 응답 생성
    ↓
Agent Transcription (lk.transcription) → SessionManager
    ↓
messages 배열 업데이트 (segmentId 기반 중복 제거)
    ↓
ChatView 렌더링 (ChatMessageItem)
```

### 4.2 음성 대화 (AvatarView)

```
[사용자 음성]
    ↓
LocalParticipant → LiveKit Room
    ↓
Agent STT → LLM → TTS → STF (얼굴 애니메이션)
    ↓
Agent.publish_data(208 bytes, ~200fps)
    ↓
useAnimationData 수신
    ├─ 3:1 다운샘플링 (60fps → 20fps)
    └─ Queue 저장
    ↓
60fps dequeue → Unity.sendMessage()
    ↓
ReactBridge → NoServerDataProcessor
    ├─ 11 frames 버퍼
    └─ 배치 처리 (10 + 1 overlap)
    ↓
FluentTAvatar → Timeline 재생 (20fps)
```

### 4.3 상세 정보 표시 (ChatView 전용)

```
[사용자: "포럼 있나요?"]
    ↓
Agent LLM: 키워드 감지 → show_event_details("forum") 호출
    ↓
Agent: RPC 전송 (즉시)
    ↓
SessionManager: setPendingDetailTopic("forum")
    ↓
Agent Transcription 도착 (1-2초 후)
    ↓
새 Agent 메시지 생성 시 pendingDetailTopic 소비
    ↓
message.detailTopic = "forum"
    ↓
ChatView: 구분선 + DetailContent 렌더링
    ↓
DetailContent: fetch('/content/forum.md') → react-markdown
```

### 4.4 RPC 통신

**React → Agent:**

| RPC Method | Payload | 목적 |
|------------|---------|------|
| `user_mode_changed` | `{mode: "chat"\|"avatar", should_interrupt: boolean}` | 사용자 모드 알림 |

**Agent → React:**

| RPC Method | Payload | 목적 |
|------------|---------|------|
| `agent_state_changed` | `{new_state: AgentState, old_state, timestamp}` | Agent 상태 알림 |
| `show_event_details` | `{topic: string}` | 상세 정보 표시 요청 |

---

## 5. 상태 관리

### 5.1 SessionManager State

```typescript
type AgentState = 'initializing' | 'idle' | 'listening' | 'thinking' | 'speaking' | 'searching';

// State
const [messages, setMessages] = useState<ChatMessage[]>([]);
const [avatarMessage, setAvatarMessage] = useState<ChatMessage | undefined>(undefined);
const [agentState, setAgentState] = useState<AgentState | null>(null);
const [pendingDetailTopic, setPendingDetailTopic] = useState<string | null>(null);

// Refs (클로저 문제 해결)
const currentScreenRef = useRef(currentScreen);
const pendingDetailTopicRef = useRef(pendingDetailTopic);
```

### 5.2 ChatMessage 타입

```typescript
export interface ChatMessage {
  id: string;               // segmentId 기반
  message: string;          // 메시지 내용
  isUser: boolean;          // User/Agent 구분
  timestamp: number;        // 시간 순 정렬
  sender?: string;          // 'You' | 'Agent'
  detailTopic?: string;     // MD 상세 정보 키 (신규)
}
```

---

## 6. 핵심 알고리즘

### 6.1 립싱크 프레임 다운샘플링

**목적:** Agent 초고속 전송(~200fps)을 Unity 재생 속도(20fps)로 조정

**구현 (`useAnimationData.ts`):**
```typescript
let totalFramesReceived = 0;

if (payload.length === 208) {
  totalFramesReceived++;

  // 3:1 다운샘플링 (3개 중 1개만 저장)
  if (totalFramesReceived % 3 === 0) {
    frameQueue.current.push(payload);  // 실질적 20fps
  }
}

// 60fps dequeue (브라우저 속도)
setInterval(() => {
  const frame = frameQueue.current.shift();
  if (frame) {
    sendToUnity(frame);
  }
}, 1000 / 60);
```

### 6.2 Overlapping Frames (Unity)

**목적:** 0.5초 정확한 애니메이션 길이 보장

**구현 (`NoServerDataProcessor.cs`):**
```csharp
const int MAX_FRAMES_PER_BATCH = 10;
const int FRAMES_PER_BATCH_WITH_OVERLAP = 11;

// 11개 프레임 버퍼 → 10개 처리, 마지막 1개는 다음 배치 시작점
List<TMBlendshapeFrame> frames = buffer.Take(FRAMES_PER_BATCH_WITH_OVERLAP).ToList();
ProcessBatch(frames.Take(MAX_FRAMES_PER_BATCH));
buffer.RemoveRange(0, MAX_FRAMES_PER_BATCH);  // 1개 overlap 유지
```

### 6.3 클로저 문제 해결 패턴

**문제:** useEffect 핸들러가 등록 시점의 state 캡처

**해결 (`SessionManager.tsx`):**
```typescript
// Ref 생성
const currentScreenRef = useRef(currentScreen);

// 자동 동기화
useEffect(() => {
  currentScreenRef.current = currentScreen;
}, [currentScreen]);

// 핸들러에서 사용
const handleTranscription = async (reader, participantIdentity) => {
  if (currentScreenRef.current === 'avatar') {  // 최신 값 참조
    // ...
  }
};
```

### 6.4 Pending Detail 패턴

**문제:** RPC가 Transcription보다 먼저 도착

**해결:**
```typescript
// 1. RPC 즉시 응답 (timeout 방지)
setPendingDetailTopic(topic);
return '';

// 2. Transcription 도착 시 pending 소비
if (!isUserTranscription && pendingDetailTopicRef.current) {
  updatedMessage.detailTopic = pendingDetailTopicRef.current;
  setPendingDetailTopic(null);
}
```

---

## 7. API 명세

### 7.1 Vercel Serverless Function

**Endpoint:** `POST /api/token`

**Request:**
```json
{
  "room": "cafe-show-abc123",
  "identity": "user-xyz789",
  "metadata": {
    "userLanguage": "ko",
    "agentLanguage": "ko",
    "customPersona": "",
    "voiceName": "alloy"
  }
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**구현:** `api/token.ts`
- LiveKit AccessToken SDK 사용
- API KEY/SECRET으로 JWT 서명
- Room join grant 부여

### 7.2 LiveKit RPC Methods

**React → Agent:**

```typescript
// 사용자 모드 변경
await localParticipant.performRpc({
  destinationIdentity: 'agent-xxx',
  method: 'user_mode_changed',
  payload: JSON.stringify({
    mode: 'chat' | 'avatar',
    should_interrupt: boolean
  })
});
```

**Agent → React:**

```typescript
// Agent 상태 변경
localParticipant.registerRpcMethod('agent_state_changed', async (data) => {
  const { new_state, old_state, timestamp } = JSON.parse(data.payload);
  setAgentState(new_state);
  return '';
});

// 상세 정보 표시
localParticipant.registerRpcMethod('show_event_details', async (data) => {
  const { topic } = JSON.parse(data.payload);
  setPendingDetailTopic(topic);
  return '';
});
```

---

## 8. 성능 최적화

### 8.1 프레임 다운샘플링

**Agent 전송:**
- 원본: ~60fps (STF 생성)
- 실제 전송: ~200fps (네트워크 버퍼링)

**React 처리:**
- 3:1 다운샘플링 → 20fps 큐 저장
- 60fps dequeue → Unity 전송

**Unity 재생:**
- 20fps Timeline 재생
- 0.5초 정확한 애니메이션

**결과:** 네트워크 효율 + 부드러운 립싱크

### 8.2 메시지 중복 제거

**방법:** `segmentId` 기반

```typescript
const messageId = segmentId || streamId;

setMessages(prev => {
  const existingIndex = prev.findIndex(m => m.id === messageId);
  if (existingIndex >= 0) {
    // 업데이트 (중복 방지)
    prev[existingIndex] = updatedMessage;
  } else {
    // 새 메시지 추가
    prev.push(updatedMessage);
  }
});
```

### 8.3 ReactBridge 캐싱 (Unity)

**문제:** `FindObjectOfType<>()` 매 프레임 호출 시 성능 저하

**해결:**
```csharp
private NoServerDataProcessor _cachedProcessor;

void Start() {
  _cachedProcessor = FindObjectOfType<NoServerDataProcessor>();
}

void OnAnimationData(string data) {
  _cachedProcessor.ProcessFrame(data);  // 캐시 사용
}
```

### 8.4 Web Audio API 최적화

**볼륨 감지 설정:**
```typescript
analyser.fftSize = 32;                 // 최소 FFT (성능)
analyser.smoothingTimeConstant = 0;    // 평활화 없음 (반응성)
setInterval(updateVolume, 1000 / 30);  // 30 FPS
```

---

## 9. UI/UX 명세

### 9.1 ChatView

**레이아웃:**
```
┌─────────────────────────┐
│       Header            │
├─────────────────────────┤
│ 인사말 / 태그 버튼        │ (고정)
├─────────────────────────┤
│                         │
│   메시지 영역 (스크롤)    │ (flex-1)
│   ├─ User 메시지         │
│   ├─ Agent 메시지        │
│   └─ Detail (MD)        │
│                         │
├─────────────────────────┤
│ [입력창] [동적 버튼]      │ (고정)
└─────────────────────────┘
```

**동적 버튼:**
- 텍스트 있음: 전송 아이콘 (`icon-send-message-4x.png`)
- 텍스트 없음: 아바타 아이콘 (`icon-to-avatar.png`)

### 9.2 AvatarView

**레이아웃:**
```
┌─────────────────────────┐
│       Header            │
├─────────────────────────┤
│   Agent 메시지/인사말     │ (고정)
├─────────────────────────┤
│                         │
│   Unity 캔버스           │ (430×420px)
│   (하단 정렬)            │
│                         │
├─────────────────────────┤
│ [X] [상태문구] [마이크]   │ (고정)
└─────────────────────────┘
```

**동적 상태 문구 우선순위:**
1. Unity 로딩 중 → "연결중" (정적)
2. 음소거 → "음소거 되어있어요"
3. Agent thinking → "생각하고 있어요" (애니메이션)
4. 기본 → "궁금한 점을 물어보세요"

**볼륨 그라데이션:**
- 위치: absolute, bottom: 0, 높이: 550px
- 색상: `rgba(218, 32, 61, 0.2)` → transparent
- opacity: userVolume (0-1)
- transition: 0.1s ease-out

---

## 10. Agent 명세 (Python)

### 10.1 CafeShowAgent

**파일:** `livekit-agents/core/cafe_show_agent.py`

**모델:**
- LLM: `gpt-realtime` (OpenAI Realtime API)
- STF: Speech-to-Face (얼굴 애니메이션)

**function_tool:**
```python
@function_tool()
async def show_event_details(
    self,
    context: RunContext,
    topic: str,
) -> str:
    """Show detailed event information."""

    # Mode 체크
    current_mode = context.userdata.get('current_mode', 'chat')
    if current_mode != 'chat':
        return None  # Avatar 모드에서는 실행 안 함

    # RPC 전송
    room = get_job_context().room
    participant = next(iter(room.remote_participants))
    await room.local_participant.perform_rpc(
        destination_identity=participant,
        method="show_event_details",
        payload=json.dumps({"topic": topic}),
        response_timeout=2.0
    )

    return None  # Silent completion
```

### 10.2 페르소나 (OpenAI Realtime 최적화)

**파일:** `livekit-agents/config/personas.py`

**특징:**
- 불릿 포인트 구조 (문단 대신)
- 중요 규칙 대문자 강조 (YOUR ROLE, CRITICAL)
- 명확한 섹션 레이블
- Tool usage 예시 포함

**핵심 지시사항:**
```
## COMMUNICATION RULES
1. LANGUAGE: Always use 한국어
2. LENGTH: Keep responses to 2-3 sentences MAXIMUM
3. ACCURACY: Provide correct event information only
4. STYLE: Natural conversational voice
5. FORBIDDEN: NEVER use emojis or special characters
```

### 10.3 RPC Handlers

**파일:** `livekit-agents/handlers/rpc_handlers.py`

**등록된 메소드:**
1. `interrupt_agent` - Agent 중단
2. `user_mode_changed` - 모드 변경 (신규)
3. `check_attention` - 비활성 사용자 확인
4. `send_text_input` - 텍스트 입력

---

## 11. 환경 변수

### 11.1 React (.env)

```bash
# Serverless Function용 (브라우저 노출 안 됨)
LIVEKIT_API_KEY=APIAEqsG454pxax
LIVEKIT_API_SECRET=heKLTjXqLal0ML3yU1Z849wV5kxxFfo87vhpeHiozmfB

# 프론트엔드용 (브라우저 노출)
VITE_TOKEN_SERVER_URL=/api/token
VITE_LIVEKIT_SERVER_URL=wss://mirabel-2j47mr85.livekit.cloud
VITE_ROOM_PREFIX=cafe-show
```

### 11.2 Vercel Dashboard

**Production 환경 변수:**
- `LIVEKIT_API_KEY` - JWT 서명
- `LIVEKIT_API_SECRET` - JWT 서명
- `VITE_TOKEN_SERVER_URL` - Token API 경로
- `VITE_LIVEKIT_SERVER_URL` - WebRTC 서버
- `VITE_ROOM_PREFIX` - Room 이름 접두사

---

## 12. 빌드 & 배포

### 12.1 빌드 명령어

```bash
# TypeScript 타입 체크 + Vite 빌드
npm run build

# 결과물
dist/
  ├── index.html
  ├── assets/
  │   ├── index-[hash].js
  │   └── index-[hash].css
  └── unity/  (복사됨)
```

### 12.2 Vercel 배포

**CLI 배포 (권장):**
```bash
vercel --prod
```

**특징:**
- 로컬 파일 직접 업로드 (Unity 파일 정상 포함)
- Git push보다 안정적

**Git 자동 배포:**
- Dashboard에서 비활성화 권장
- Unity 대용량 파일(52MB) 문제 발생 가능

### 12.3 배포 체크리스트

- [ ] 환경 변수 설정 (Vercel Dashboard)
- [ ] Unity 빌드 파일 최신화
- [ ] `npm run build` 로컬 테스트
- [ ] `vercel dev` 로컬 Serverless 테스트
- [ ] `vercel --prod` 배포
- [ ] 브라우저 테스트 (HTTPS)

---

## 13. 브라우저 호환성

### 13.1 필수 기능

| 기능 | 요구사항 |
|------|----------|
| WebGL | WebGL 2.0 지원 |
| WebRTC | getUserMedia, RTCPeerConnection |
| Web Audio API | AudioContext, AnalyserNode |
| WebAssembly | WASM 지원 |

### 13.2 테스트 환경

**Desktop:**
- Chrome 100+ ✅
- Edge 100+ ✅
- Safari 15+ ✅
- Firefox 100+ ✅

**Mobile:**
- iOS Safari 15+ ✅
- Android Chrome 100+ ✅

---

## 14. 보안

### 14.1 API Key 관리

**절대 노출 금지:**
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`

**안전한 관리:**
- Vercel 환경 변수에만 저장
- Serverless Function에서만 사용
- 브라우저에 전송 안 됨

### 14.2 Token 생성 보안

**JWT 구조:**
```javascript
{
  identity: "user-xxx",
  grants: {
    room: "cafe-show-xxx",
    roomJoin: true,
    canPublish: true,
    canSubscribe: true
  },
  metadata: "{...}"
}
```

**서명:** HMAC-SHA256 (API SECRET)

---

## 15. 모니터링 & 로깅

### 15.1 프론트엔드 로그

**콘솔 로그:**
```
[SessionManager] Agent state changed: thinking
[SessionManager] Pending detail topic: forum
[SessionManager] Attached pending detail to new Agent message
[AvatarView] Microphone auto-enabled
[AnimationData] First frame received from Agent
```

### 15.2 Agent 로그

```
[CafeShowAgent] Sent detail view RPC for topic: forum
[SessionManager] User mode changed to: avatar
[SessionManager] Agent interrupted
```

### 15.3 LiveKit Cloud Metrics

**Dashboard 확인:**
- Participant minutes 사용량
- Agent session minutes
- Data transfer (GB)
- Error rate

---

## 16. 알려진 제한사항

### 16.1 LiveKit Cloud 무료 플랜

**Quota (월간):**
- WebRTC Participant Minutes: 5,000분
- Agent Session Minutes: 1,000분
- Data Transfer: 50GB
- **초과 시:** 429 Too Many Requests

**해결:**
- Ship 플랜($50/월) 업그레이드
- 또는 월초(1일) 리셋 대기

### 16.2 Unity WebGL 제약

**파일 크기:**
- unity.wasm: 52MB
- unity.data: 68MB

**Vercel 배포:**
- Git 자동 배포 시 파일 손상 가능
- CLI 배포(`vercel --prod`) 권장

### 16.3 브라우저 제약

**AudioContext 정책:**
- 사용자 제스처 필요 (click, touch)
- `useAudioContext` 훅으로 해결

**HTTPS 필수:**
- Mixed Content 정책
- Serverless Function으로 해결

---

## 17. 트러블슈팅

### 17.1 "..." 표시가 안 사라짐

**원인:** Stream 종료 시 avatarMessage 미업데이트

**해결:** `SessionManager.tsx:150-153`
```typescript
if (currentScreenRef.current === 'avatar' && !isUserTranscription) {
  setAvatarMessage(finalMessage);
}
```

### 17.2 DetailContent가 사라짐

**원인:** Transcription 업데이트 시 detailTopic 유실

**해결:** 기존 detailTopic 보존
```typescript
detailTopic: existingIndex >= 0 ? prev[existingIndex].detailTopic : undefined
```

### 17.3 Agent 응답이 AvatarView에 안 나옴

**원인:** 클로저 - currentScreen이 'chat'으로 고정

**해결:** useRef 패턴
```typescript
const currentScreenRef = useRef(currentScreen);
if (currentScreenRef.current === 'avatar') { ... }
```

### 17.4 Unity WASM 로딩 실패 (Vercel)

**에러:** `expected magic word 00 61 73 6d`

**원인:** Git 자동 배포 시 대용량 파일 손상

**해결:** `vercel --prod` CLI 배포 사용

---

## 18. 향후 개선 사항

### 18.1 기능 추가

- [ ] 다국어 지원 (영어, 일본어, 중국어)
- [ ] 음성 속도 조절
- [ ] 대화 내역 저장/불러오기
- [ ] 즐겨찾기 기능

### 18.2 성능 개선

- [ ] Unity 빌드 최적화 (파일 크기 감소)
- [ ] CDN으로 Unity 파일 호스팅
- [ ] Code splitting (React)
- [ ] Image 최적화 (WebP)

### 18.3 UX 개선

- [ ] 로딩 프로그레스바
- [ ] 에러 핸들링 UI
- [ ] 오프라인 모드
- [ ] PWA 지원

---

## 19. 라이센스 & 크레딧

**Dependencies:**
- LiveKit (Apache 2.0)
- React (MIT)
- Unity (Unity Asset Store EULA)
- TalkMotion SDK (Commercial)

**Author:** CafeShow Development Team
**Contact:** [행사 문의]

---

**문서 버전:** 1.0.0
**최종 업데이트:** 2025-10-31
**검토자:** Claude Code
