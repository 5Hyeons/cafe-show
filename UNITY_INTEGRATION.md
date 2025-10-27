# Unity WebGL Integration Issues

## 현재 상황

Unity WebGL 빌드를 React 앱에 통합하는 과정에서 다음 문제가 발생했습니다.

### 발생한 에러

```
SyntaxError: Failed to execute 'querySelector' on 'Document': '#' is not a valid selector.
```

### 에러 분석

1. **위치**: `mirabel-unity-webgl-builds.framework.js` 내부
2. **원인**: Unity가 키보드 이벤트 등록을 위해 빈 ID 선택자(`#`)를 사용
3. **타이밍**: Unity 빌드 초기화 단계에서 발생

### 구현된 코드

#### Screen 3 (로딩 화면)
- ✅ 원형 아바타 이미지 (핑크 배경, 빨간 테두리)
- ✅ 회전 애니메이션
- ✅ "카페쇼 AI와 연결 중..." 텍스트
- ✅ Participant 카운트 표시
- ✅ 3명 감지 시 Screen 4로 자동 전환

#### Screen 4 (Unity 캔버스)
- ✅ Unity Canvas 컴포넌트
- ✅ Agent 메시지 표시 영역
- ✅ 하단 컨트롤 버튼 (닫기, 마이크)
- ❌ Unity 로딩 실패

#### Unity 로딩 로직
- ✅ `loadUnityBuild()` 함수 구현
- ✅ 로더 스크립트 동적 로드
- ✅ `createUnityInstance` 대기 로직
- ❌ Unity 초기화 시 querySelector 에러

## 해결 방법 (추후 작업)

### Option 1: Unity 빌드 설정 변경
Unity에서 WebGL 빌드 시 다음 설정 확인:
- Canvas ID를 명시적으로 설정
- 키보드 입력 타겟 설정

### Option 2: React 환경에 Unity Container ID 제공
```typescript
// Unity가 찾을 수 있는 명시적인 container ID 제공
<div id="unity-container">
  <canvas id="unity-canvas" ref={canvasRef} />
</div>
```

### Option 3: react-unity-webgl 라이브러리 사용
```bash
npm install react-unity-webgl
```

이 라이브러리는 React 환경에서 Unity WebGL을 쉽게 통합할 수 있도록 설계되었습니다.

## 현재 완료된 작업

- ✅ Screen 1: Agent 텍스트 채팅 (완벽 작동)
- ✅ Screen 3: 로딩 화면 UI (완성)
- ✅ Screen 4: 레이아웃 (완성, Unity 로딩 대기)
- ✅ 화면 전환 로직 (작동)
- ❌ Unity WebGL 실제 로딩 (에러 발생)

## 다음 단계

1. Unity 빌드 설정 재확인
2. react-unity-webgl 라이브러리 도입 검토
3. Canvas ID 명시적 설정
4. Unity ↔ React 통신 테스트
