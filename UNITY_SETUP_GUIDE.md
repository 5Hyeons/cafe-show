# Unity Scene 설정 및 WebGL 빌드 가이드

## 1. Unity Scene 설정 (필수!)

코드 수정은 완료되었지만, Unity Scene에서 FluentTAvatar 설정을 변경해야 합니다.

### Unity Editor에서 설정 변경

1. **Unity 프로젝트 열기**
   ```
   mirabel-unity-webgl/ 폴더를 Unity Hub에서 열기
   ```

2. **Scene 열기**
   ```
   Assets/Scenes/AIConsultation.unity
   ```

3. **FluentTAvatar 컴포넌트 설정 변경**

   Hierarchy에서 `b_av_ara_rig_tpose` GameObject 선택

   Inspector에서 `FluentTAvatar` 컴포넌트 찾기

   **LiveKit Settings** 섹션:
   - ☑️ **Auto Connect LiveKit: false로 변경!** ← 중요!

   이렇게 하면 Unity가 시작할 때 자동으로 연결하지 않고,
   React로부터 room name을 받을 때까지 대기합니다.

4. **Scene 저장**
   ```
   Ctrl+S 또는 File → Save
   ```

---

## 2. Unity WebGL 빌드

### 빌드 설정

1. **Build Settings 열기**
   ```
   File → Build Settings
   ```

2. **Platform 선택**
   - Platform: WebGL 선택
   - Switch Platform 클릭 (이미 WebGL이면 생략)

3. **Scenes 확인**
   - Scenes In Build에 `AIConsultation` 씬이 포함되어 있는지 확인

4. **Player Settings 확인**
   ```
   Player Settings... 버튼 클릭
   ```

   **Publishing Settings**:
   - Compression Format: Gzip (또는 Disabled)
   - WebGL Template: **TransparentTemplate**

5. **Build**
   ```
   Build 버튼 클릭
   ```

   빌드 폴더: `mirabel-builds2/` (기존과 동일)

### 빌드 결과물 복사

빌드가 완료되면:

```bash
# cafe-show/public/unity/ 폴더의 Build 파일들 교체
cp -r mirabel-builds2/Build/* cafe-show/public/unity/Build/
```

---

## 3. 작동 원리

### React → Unity Room 동기화 흐름

```
1. React 시작
   ↓
2. LiveKit 연결: room = "cafe-show-abc123" (Agent 참가)
   ↓
3. 사용자가 아바타 모드 버튼 클릭
   ↓
4. Screen 3 (로딩 화면) 표시
   ↓
5. Unity WebGL 로드 시작
   ↓
6. Unity 로드 완료 (autoConnectLiveKit=false이므로 대기)
   ↓
7. React → Unity:
   sendMessage("ReactBridge", "OnReactMessage", {
     action: "setLiveKitRoom",
     roomName: "cafe-show-abc123"
   })
   ↓
8. Unity: ReactBridge.HandleSetLiveKitRoomAction()
   ↓
9. Unity: FluentTAvatar.ConnectToLiveKitWithRoomName("cafe-show-abc123")
   ↓
10. Unity: LiveKit 연결 (같은 room!)
    ↓
11. Participants: Agent + React + Unity = 3명! ✅
    ↓
12. Screen 4 전환 (3명 감지)
```

---

## 4. 디버깅 팁

### Unity Console 로그 확인

빌드 후 브라우저 Console에서 확인:

```
[FluentTAvatar] LiveKit bridge created, waiting for manual connect
[ReactBridge] Setting LiveKit room and connecting: cafe-show-abc123
[FluentTAvatar] Connecting to LiveKit with external room name: cafe-show-abc123
[LiveKitTokenService] Using custom room name: cafe-show-abc123
```

### React Console 로그 확인

```
[Unity] Sent room name to Unity: cafe-show-abc123
```

---

## 5. 문제 해결

### Unity가 자동으로 연결되는 경우
→ Scene에서 `autoConnectLiveKit = false` 확인

### Unity가 다른 room에 접속하는 경우
→ Console에서 room name 로그 확인

### SDK 수정사항이 반영 안 되는 경우
→ Unity 재시작 후 다시 빌드

---

## 다음 단계

1. ✅ Unity Scene 설정 (`autoConnectLiveKit = false`)
2. ✅ Unity WebGL 빌드
3. ✅ 빌드 파일을 `cafe-show/public/unity/Build/`에 복사
4. ✅ 테스트: Agent + React + Unity 동일 Room 확인

성공하면 Participants가 3명이 되고 Screen 4로 자동 전환됩니다!
