# CafeShow - AI 행사 안내 챗봇

CafeShow 행사 안내를 위한 모바일 웹 애플리케이션입니다. LiveKit을 통해 AI Agent와 실시간 텍스트 채팅을 하고, Unity WebGL을 통해 3D 아바타와 인터랙션할 수 있습니다.

## 🎨 디자인

Figma 디자인을 100% 정확하게 구현했습니다.
- 모바일 우선 UI (430px 최대 너비)
- CafeShow 브랜드 컬러 (#da203d)
- Noto Sans KR 폰트

## ✨ 주요 기능

- ✅ **LiveKit Agent 텍스트 채팅**: 음성 없이 텍스트만으로 소통
- ✅ **실시간 AI 응답**: Agent가 즉시 응답
- ✅ **태그 버튼**: 행사 정보, 티켓/예매, 입장 절차, 대중교통, 주요 프로그램
- ✅ **자동 Agent 연결**: Room 생성 시 Agent 자동 참가
- 🚧 **Unity WebGL 통합**: 3D 아바타 (예정)

## 🛠 기술 스택

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **LiveKit**: livekit-client, @livekit/components-react
- **Token Server**: http://61.14.209.9:8037

## 🚀 시작하기

### 1. 환경 변수 설정

`.env` 파일을 생성하고 LiveKit 서버 URL을 설정하세요:

```bash
VITE_TOKEN_SERVER_URL=http://61.14.209.9:8037
VITE_LIVEKIT_SERVER_URL=wss://your-livekit-server.livekit.cloud
VITE_ROOM_PREFIX=cafe-show
```

### 2. 패키지 설치

```bash
npm install
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 을 열면 됩니다.

## 📁 프로젝트 구조

```
cafe-show/
├── public/
│   └── assets/              # Figma 에셋 (로고, 아이콘, 아바타 이미지)
├── src/
│   ├── components/
│   │   ├── chat/            # ChatMessageItem
│   │   ├── common/          # Header, TagButton
│   │   └── LiveKitChat.tsx  # LiveKit 채팅 통합
│   ├── hooks/
│   │   └── useLiveKit.ts    # LiveKit 연결 관리
│   ├── lib/
│   │   ├── livekit.ts       # 토큰 생성 유틸리티
│   │   └── unity.ts         # Unity WebGL 유틸리티 (예정)
│   ├── pages/
│   │   └── Screen1.tsx      # 메인 채팅 화면
│   ├── types/
│   │   └── index.ts         # TypeScript 타입 정의
│   ├── App.tsx
│   └── main.tsx
└── PROJECT_SPEC.md          # 상세 기술 스펙 문서
```

## 🔧 주요 구현 사항

### LiveKit 텍스트 채팅

Agent와의 양방향 텍스트 채팅을 구현했습니다:

- **사용자 → Agent**: `useChat()` hook + `lk.chat` topic
- **Agent → 사용자**: `lk.transcription` topic 구독
- **오디오 비활성화**: `audio={false}`, `video={false}`

### 메시지 스타일 (Figma 디자인)

- **사용자 메시지**: 흰색 박스 + 회색 테두리
- **Agent 메시지**: 테두리 없이 텍스트만 표시

## 📝 다음 단계

- [ ] Screen 3, 4 구현 (Unity WebGL 통합)
- [ ] Participant 카운트 감지 (3명: Agent + React + Unity)
- [ ] Unity 캔버스 임베드
- [ ] React ↔ Unity 통신

## 🔗 참고

- [PROJECT_SPEC.md](./PROJECT_SPEC.md) - 상세 기술 스펙
- [Figma 디자인](https://www.figma.com/design/NJnfnki91NVls4ef06Mokn/TalkMotion_UI_v2.0--2025-)
- [LiveKit Docs](https://docs.livekit.io/)
