/* ===================================================================
   config.js — 대결 콘텐츠 설정
   여기 값만 바꾸면 게임 전체 콘텐츠가 바뀝니다.
   실제 운영 시 서버에서 내려주는 값으로 교체.
   =================================================================== */

const GAME_CONFIG = {
  // 상단 헤더
  title: "메가파이트",
  subtitle: "5,000,000P를 건 여름 파르페 대결",
  partnerLeft: "OK pay",
  partnerRight: "메가MGC커피",
  period: "6.1 ~ 6.10",

  // 데모 라운드 길이(초). 운영 시 4시간 = 14400
  roundSeconds: 60,

  // 연타 게임 파라미터
  tapValue: 1,
  comboWindow: 700,   // ms 안에 연타하면 콤보 유지

  // 프로모 띠
  promoBadge: "OK pay",
  promoText: "OK캐쉬백 쇼핑 가맹점에서 10배 연타 적용 중",

  // 두 진영 — 메가 파르페 A vs B
  teams: {
    A: {
      key: "A",
      faction: "말차파",
      product: "말차 젤라또 팥빙 파르페",
      brand: "메가MGC커피",
      imgSrc: "img/mega_1.avif",
      imgType: "image/avif",
      imgFallback: "img/mega_1.avif",
      emoji: "🍵",
      color: "#5FA83C",
      colorDark: "#4A8A2C",
      colorLight: "#EAF5E1",
      textColor: "#ffffff",
      bubble: "쑥쑥\n들어와~",
      gongguPrice: "4,900원",
      normalPrice: "7,500원",
    },
    B: {
      key: "B",
      faction: "팥빙파",
      product: "팥빙 젤라또 파르페",
      brand: "메가MGC커피",
      imgSrc: "img/mega_2.webp",
      imgType: "image/webp",
      imgFallback: "img/mega_2.webp",
      emoji: "🍧",
      color: "#E8506E",
      colorDark: "#C93A57",
      colorLight: "#FCE6EC",
      textColor: "#ffffff",
      bubble: "여름엔\n팥빙수지!",
      gongguPrice: "4,900원",
      normalPrice: "7,500원",
    },
  },

  // 참가 혜택
  benefits: [
    { icon: "🏆", title: "우승 진영 쿠폰", desc: "응원한 파르페가 이기면 단독 공구 4,900원 특가 쿠폰" },
    { icon: "🎯", title: "연타 기여 포인트", desc: "많이 연타할수록 OK포인트 추가 지급 (최대 10,000P)" },
    { icon: "🎁", title: "럭키 당첨", desc: "참여자 중 랜덤 1,000명 메가커피 아이스 기프티콘" },
    { icon: "🔥", title: "집단 목표 달성", desc: "전체 500만 연타 돌파 시 할인율 추가 상승" },
  ],

  // 우승 상금
  prizePool: "5,000,000P",
  prizeBreakdown: [
    { tier: "우승 진영", amount: "100P ~ 500P", desc: "기여도 기반 분배" },
    { tier: "럭키 당첨", amount: "아이스 메가 +300P", desc: "1,000명" },
    { tier: "참여 보상", amount: "300P", desc: "전체 참여자" },
  ],
};
