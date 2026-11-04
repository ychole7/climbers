영차영차 등반대 — 오른팔 독립 리깅 테스트

업로드할 파일 (GitHub ychole7/climbers / main)
1) test.html                         → 저장소 최상위에 기존 test.html 덮어쓰기
2) assets/characters/bear/rig/body.png       → 경로 그대로 추가
3) assets/characters/bear/rig/right_arm.png  → 경로 그대로 추가

테스트 주소: https://climbers-orcin.vercel.app/test.html

테스트 방법
- 오른손 주변 ✋ 표시를 누른 채 위쪽 노란 홀드로 드래그
- 또는 목표 노란 홀드 / '자동 뻗기' 버튼을 터치
- 왼손과 양발이 움직이지 않는지, 오른팔 관절 경계가 부자연스럽지 않은지 확인

주의 사항
- 현재는 기존 통짜 PNG에서 오른팔을 추출·마스킹한 임시 단일 회전 파츠입니다.
- 어깨/팔꿈치 2본 IK, 자유로운 전체 등반, 캐릭터 간 공유 리깅은 아직 구현하지 않았습니다.
- 기존 index.html 및 pose PNG 자산은 변경하지 않았습니다.
- 모바일 실기기 QA, 실제 브라우저 렌더링 검증은 완료하지 못했습니다.
