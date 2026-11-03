영차영차 등반대 | 곰돌이 접점 맞춤 V2

1. bear-art-test.html 1개만 GitHub ychole7/climbers의 main 루트에 덮어쓰기
2. 기존 자산 assets/characters/bear/poses/*.png 3개는 건드리지 않음
3. 테스트: https://climbers-orcin.vercel.app/bear-art-test.html

변경:
- 곰돌이 이미지 화면 폭 120% -> 79% (기존 대비 65.8%)
- 세 포즈별 손발 위치에 홀드를 맞춰 정렬한 정적 비주얼 테스트
- 기존 메인 index.html, 게임 로직, PNG 무변경

주의: 포즈별 이미지에 맞춰 홀드를 배치한 정적인 접점 시각화입니다. 자유 손발 드래그, 실제 등반 IK 및 무게중심 계산은 미구현입니다.
