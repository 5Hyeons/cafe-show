1. 첫번째 진입 화면
- https://www.figma.com/design/NJnfnki91NVls4ef06Mokn/TalkMotion_UI_v2.0--2025-?node-id=571-21214&m=dev
- 진입하자마자 React가 Livekit room에 접속하여 Agent와 텍스트로만 소통할 수 있음. (음성/비디오 소통 이런거 안함! 오직 텍스트로만 소통할거임임)
- Livekit sdk 활용 방법은 @../agents-playground <---- 여기 예제 참고하면 됨
- https://www.figma.com/design/NJnfnki91NVls4ef06Mokn/TalkMotion_UI_v2.0--2025-?node-id=603-18747&m=dev <--- 이 마이크 아이콘은 구현하지 마셈.
- https://www.figma.com/design/NJnfnki91NVls4ef06Mokn/TalkMotion_UI_v2.0--2025-?node-id=578-22244&m=dev <--- 이 빨간 동그라미 버튼을 선택하면 다음 화면 (두 번째 화면)으로 넘어감

2. 첫번째 화면에서 Agent와 채팅하는 예시 (두번 째 화면 아님!)
- https://www.figma.com/design/NJnfnki91NVls4ef06Mokn/TalkMotion_UI_v2.0--2025-?node-id=578-19970&m=dev
- 사용자의 채팅 내역과 Agent의 채팅 내역이 위 피그마 예시와 같이 보여짐. 보사디시 사용자의 채팅은 메세지 박스 테두리가 있으나 Agent의 메세지는 메세지 박스 테두리가 없음
- 채팅 창 UI 구현은 마찬가지로 @@../agents-playground 이 예제 프로젝트 참고.
- 1에서 썼던 바와 마찬가지로 https://www.figma.com/design/NJnfnki91NVls4ef06Mokn/TalkMotion_UI_v2.0--2025-?node-id=603-18742&m=dev <--- 이 마이크 아이콘은 무시해도 됨
- 1에서 썼던 바와 마찬가지로 https://www.figma.com/design/NJnfnki91NVls4ef06Mokn/TalkMotion_UI_v2.0--2025-?node-id=578-22278&m=dev 이 동그라미 버튼을 선택하면 다음 화면 (두 번째 화면)으로 넘어가는 거임

3. 두 번째 화면
- https://www.figma.com/design/NJnfnki91NVls4ef06Mokn/TalkMotion_UI_v2.0--2025-?node-id=578-20109&m=dev
- 세 번째 화면으로 넘어가기 이전의 잠깐 보여주는 중간 단계
- 이 때 백그라운드에서는 @../mirabel-unity-webgl-builds 이 유니티 WebGL 빌드 파일이 시작되게 됨.
- 이 때 유니티 webGL 빌드 클라이언트가 Livekit Room에 접속하게 될텐데 그러면 Livekit Room에는 Livekit Agent + Livekit React Client + Livekit Unity Web Client 이렇게 세명이 있을거임
- 프론트엔드 차원에서 현재 livekit room의 participant가 3명이 될때까지 기다렸다가 3명이 됐으면 다음 세 번째 화면으로 넘어가면 됨.

4. 세 번째 화면
- https://www.figma.com/design/NJnfnki91NVls4ef06Mokn/TalkMotion_UI_v2.0--2025-?node-id=578-20359&m=dev
- 본격적으로 3d 아바타와 사용자가 소통하는 화면
- https://www.figma.com/design/NJnfnki91NVls4ef06Mokn/TalkMotion_UI_v2.0--2025-?node-id=578-21427&m=dev <--- 이 영역은 샘플 이미지이며 여기에 unity 캔버스가 들어가면 됨.
- https://www.figma.com/design/NJnfnki91NVls4ef06Mokn/TalkMotion_UI_v2.0--2025-?node-id=578-21405&m=dev <--- 이 영역은 샘플 텍스트이고 여기에는 React가 Agent로부터 받은 메세지 내용을 담으면 됨. 기존 채팅 내역 받아서 화면에 출력하는 것과 같음

5. 세 번째 화면에서 음소거 버튼 눌렀을 때의 화면
- https://www.figma.com/design/NJnfnki91NVls4ef06Mokn/TalkMotion_UI_v2.0--2025-?node-id=578-22126&m=dev
- https://www.figma.com/design/NJnfnki91NVls4ef06Mokn/TalkMotion_UI_v2.0--2025-?node-id=578-22133&m=dev <--- 단순히 이렇게 아이콘이랑 텍스트만 바꾸면 됨