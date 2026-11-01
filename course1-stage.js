// 기존 reach-core.js 의 STAGE 객체만 아래 데이터로 교체하여 테스트하세요.
// game rules, IK lengths, assets unchanged.
const STAGE = {
  "name": "첫 발이 길을 연다",
  "pattern": "발을 먼저",
  "tip": "위쪽 홀드가 안 닿으면 발판부터 옮겨봐!",
  "W": 700,
  "H": 1550,
  "floor": 1450,
  "goal": "G",
  "start": [
    "S1",
    "S2",
    "F1",
    "F2"
  ],
  "holds": [
    {
      "id": "F1",
      "x": 300,
      "y": 1330,
      "type": "chip"
    },
    {
      "id": "F2",
      "x": 410,
      "y": 1330,
      "type": "chip"
    },
    {
      "id": "S1",
      "x": 290,
      "y": 940,
      "type": "jug"
    },
    {
      "id": "S2",
      "x": 420,
      "y": 940,
      "type": "jug"
    },
    {
      "id": "F3",
      "x": 235,
      "y": 1160,
      "type": "chip"
    },
    {
      "id": "F4",
      "x": 465,
      "y": 1160,
      "type": "chip"
    },
    {
      "id": "F5",
      "x": 300,
      "y": 1010,
      "type": "chip"
    },
    {
      "id": "F6",
      "x": 450,
      "y": 1010,
      "type": "chip"
    },
    {
      "id": "U1",
      "x": 260,
      "y": 735,
      "type": "jug"
    },
    {
      "id": "U2",
      "x": 430,
      "y": 725,
      "type": "jug"
    },
    {
      "id": "F7",
      "x": 310,
      "y": 860,
      "type": "chip"
    },
    {
      "id": "F8",
      "x": 470,
      "y": 850,
      "type": "chip"
    },
    {
      "id": "R",
      "x": 565,
      "y": 630,
      "type": "crimp",
      "honey": true
    },
    {
      "id": "G",
      "x": 350,
      "y": 480,
      "type": "jug"
    }
  ]
};
