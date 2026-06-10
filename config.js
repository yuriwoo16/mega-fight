/* ===================================================================
   config.js — 대결 콘텐츠 설정
   여기 값만 바꾸면 게임 전체 콘텐츠가 바뀝니다.
   실제 운영 시 서버에서 내려주는 값으로 교체.
   =================================================================== */

const GAME_CONFIG = {
  // 상단 정보
  title: "메가파이트",
  subtitle: "5,000,000P를 건 여름 파르페 대결",
  logoLeft: "img/logo_okshop.png",
  logoRight: "img/logo_mega.png",
  period: "6.1 ~ 6.10",

  // 데모 라운드 길이(초). 운영 시 4시간 = 14400
  roundSeconds: 60,

  // 연타 게임 파라미터
  tapValue: 1,
  comboWindow: 700,   // ms 안에 연타하면 콤보 유지

  // OCB 커머스 스타일 요소
  liveLabel: "명이 응원 중",

  // 보상
  rewards: [
    { kind: "win",    label: "승리 진영 혜택",   sub: "응원한 파르페가 우승하면", big: "<b>전원</b> 지급",     ticketTop: "메가커피 단독 공구", ticketMid: "4,900원 할인" },
    { kind: "lucky",  label: "추가 럭키드로우", sub: "참여만 해도 자동 응모",   big: "총 <b>1,000명</b>", ticketTop: "메가커피", ticketMid: "아이스 음료 기프티콘" },
  ],

  // 두 진영 — 메가 파르페 A vs B
  teams: {
    A: {
      key: "A",
      faction: "말차파",
      product: "말차 젤라또 팥빙 파르페",
      brand: "메가MGC커피",
      imgSrc: "img/mega_2.png",
      imgType: "image/png",
      imgFallback: "img/mega_2.png",
      color: "#18AC87",
      colorDark: "#0F9070",
      colorLight: "#DEFBF3",
      textColor: "#ffffff",
      bubble: "역시\n신상 말차!",
      gongguPrice: "4,900원",
      normalPrice: "7,500원",
    },
    B: {
      key: "B",
      faction: "팥빙파",
      product: "팥빙 젤라또 파르페",
      brand: "메가MGC커피",
      imgSrc: "img/mega_1.png",
      imgType: "image/png",
      imgFallback: "img/mega_1.png",
      color: "#FF6E3D",
      colorDark: "#E05520",
      colorLight: "#FFECD6",
      textColor: "#ffffff",
      bubble: "근본은\n팥빙수지!",
      gongguPrice: "4,900원",
      normalPrice: "7,500원",
    },
  },
};
