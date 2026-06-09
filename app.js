/* ===================================================================
   app.js — 게임 로직 & UI
   =================================================================== */

const C = GAME_CONFIG;

const app = {
  engine: null,
  screen: 'intro',
  rafId: null,
  combo: 0,
  lastTapTime: 0,
  comboTimer: null,

  init() {
    this.engine = initGameEngine(C);
    this.render();
  },

  // ==================== 전환 ====================
  goBattle(teamKey) {
    this.engine.selectTeam(teamKey);
    this.screen = 'battle';
    this.engine.startRealtimeSimulation();
    this.combo = 0;
    this.render();
    this.loop();
  },
  goResult() {
    this.engine.stopRealtimeSimulation();
    cancelAnimationFrame(this.rafId);
    this.screen = 'result';
    this.render();
  },
  reset() {
    this.engine.reset();
    this.screen = 'intro';
    this.render();
  },

  // ==================== 배틀 루프 ====================
  loop() {
    const tick = () => {
      const remain = this.engine.getTimeRemaining();
      if (remain <= 0) { this.goResult(); return; }
      this.updateBattle();
      this.rafId = requestAnimationFrame(tick);
    };
    tick();
  },

  updateBattle() {
    const s = this.engine.getGameState();
    const remain = this.engine.getTimeRemaining();
    const total = C.roundSeconds;

    // 타이머
    const t = document.getElementById('time');
    if (t) {
      const m = Math.floor(remain / 60000);
      const sec = Math.floor((remain % 60000) / 1000);
      t.textContent = `${m}:${sec.toString().padStart(2, '0')}`;
      if (remain <= 10000) t.classList.add('urgent');
    }
    const fill = document.getElementById('timerFill');
    if (fill) fill.style.width = ((total - remain / 1000) / total * 100) + '%';

    // 카운트 + 막대
    const a = s.teamACount, b = s.teamBCount, sum = a + b;
    const ra = sum > 0 ? (a / sum * 100) : 50, rb = 100 - ra;
    this.setText('numA', a.toLocaleString('ko-KR'));
    this.setText('numB', b.toLocaleString('ko-KR'));
    const segA = document.getElementById('segA'), segB = document.getElementById('segB');
    if (segA) segA.style.width = ra + '%';
    if (segB) segB.style.width = rb + '%';
    this.setText('myCount', s.userTapCount.toLocaleString('ko-KR'));

    // 실시간 1위 뱃지
    const r1a = document.getElementById('rank1A'), r1b = document.getElementById('rank1B');
    if (r1a && r1b) { r1a.style.display = a >= b ? '' : 'none'; r1b.style.display = a >= b ? 'none' : ''; }
  },

  setText(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; },

  // ==================== 연타 ====================
  onTap(ev) {
    this.engine.recordTap();
    const s = this.engine.getGameState();
    const team = C.teams[s.userTeam];

    // 버튼 스쿼시
    const btn = document.getElementById('tapBtn');
    btn.classList.remove('squash'); void btn.offsetWidth; btn.classList.add('squash');

    // 캐릭터 범프
    const myFighter = document.querySelector('.bf.mine');
    if (myFighter) { myFighter.classList.remove('bump'); void myFighter.offsetWidth; myFighter.classList.add('bump'); }

    // 콤보
    const now = Date.now();
    if (now - this.lastTapTime < C.comboWindow) this.combo++; else this.combo = 1;
    this.lastTapTime = now;
    this.showCombo(team);

    // 떠오르는 숫자 + 파티클
    this.spawnFloater(ev, team);
    this.spawnParticles(ev, team);

    // 마일스톤 (10콤보마다 화면 흔들림)
    if (this.combo > 0 && this.combo % 10 === 0) {
      const scr = document.querySelector('.battle-screen');
      scr.classList.remove('shake'); void scr.offsetWidth; scr.classList.add('shake');
      if (navigator.vibrate) navigator.vibrate([30, 20, 40]);
    } else if (navigator.vibrate) {
      navigator.vibrate(20);
    }

    this.updateBattle();
  },

  showCombo(team) {
    const c = document.getElementById('combo');
    if (!c) return;
    if (this.combo >= 3) {
      c.textContent = `${this.combo} COMBO!`;
      c.style.background = team.color;
      c.classList.add('show');
      clearTimeout(this.comboTimer);
      this.comboTimer = setTimeout(() => c.classList.remove('show'), 800);
    }
  },

  spawnFloater(ev, team) {
    const area = document.querySelector('.tap-area');
    const rect = area.getBoundingClientRect();
    const f = document.createElement('div');
    f.className = 'floater';
    f.textContent = '+1';
    f.style.color = team.color;
    f.style.fontSize = (18 + Math.min(this.combo, 12)) + 'px';
    const x = ev ? (ev.clientX - rect.left) : rect.width / 2;
    f.style.left = (x - 10 + (Math.random() * 30 - 15)) + 'px';
    f.style.top = '20px';
    area.appendChild(f);
    setTimeout(() => f.remove(), 900);
  },

  spawnParticles(ev, team) {
    const area = document.querySelector('.tap-area');
    const rect = area.getBoundingClientRect();
    const x = ev ? (ev.clientX - rect.left) : rect.width / 2;
    const y = ev ? (ev.clientY - rect.top) : 40;
    const colors = [team.color, team.colorDark, '#FFE14D'];
    for (let i = 0; i < 6; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.background = colors[i % colors.length];
      p.style.left = x + 'px';
      p.style.top = y + 'px';
      const ang = (Math.PI * 2 * i) / 6 + Math.random();
      const dist = 30 + Math.random() * 30;
      p.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
      p.style.setProperty('--dy', Math.sin(ang) * dist + 'px');
      area.appendChild(p);
      setTimeout(() => p.remove(), 600);
    }
  },

  // ==================== 렌더 ====================
  render() {
    const root = document.getElementById('screen');
    if (this.screen === 'intro') root.innerHTML = this.introHTML();
    else if (this.screen === 'battle') root.innerHTML = this.battleHTML();
    else root.innerHTML = this.resultHTML();
    this.bind();
  },

  picture(team, cls) {
    return `<picture>
      <source srcset="${team.imgSrc}" type="${team.imgType}">
      <img class="${cls}" src="${team.imgFallback}" alt="${team.product}">
    </picture>`;
  },

  // ==================== INTRO ====================
  introHTML() {
    const A = C.teams.A, B = C.teams.B;

    return `
    <div class="screen intro-screen">

      <div class="logo-bar">
        <img src="${C.logoLeft}" class="logo" alt="OK캐쉬백 쇼핑">
        <span class="x-sep">×</span>
        <img src="${C.logoRight}" class="logo logo-mega" alt="메가MGC커피">
        <span class="period">${C.period}</span>
      </div>

      <div class="hero">
        <img class="hero-title-img" src="img/tit.png" alt="${C.title}">

        <div class="hero-question">당신의 메가 파르페 취향은?</div>

        <div class="hero-vs">
          <button class="hero-fighter left" data-pick="A">
            <div class="speech">${A.bubble}</div>
            <picture>
              <source srcset="${A.imgSrc}" type="${A.imgType}">
              <img class="fighter-img" src="${A.imgFallback}" alt="${A.product}">
              <span class="hero-product">${A.product}</span>
            </picture>
            <div class="hero-name a">${A.faction}</div>
          </button>
          <div class="vs-badge">VS</div>
          <button class="hero-fighter right" data-pick="B">
            <div class="speech">${B.bubble}</div>
            <picture>
              <source srcset="${B.imgSrc}" type="${B.imgType}">
              <img class="fighter-img" src="${B.imgFallback}" alt="${B.product}">
              <span class="hero-product">${B.product}</span>
            </picture>
            <div class="hero-name b">${B.faction}</div>
          </button>
        </div>

        <div class="hero-names">
        </div>
      </div>

      <div class="rewards-section">
        <div class="rewards-head" style="font-weight: 800; font-size: 18px; line-height: 1.4;">메가 취향전<br>우승 팀에게 드려요</div>
        ${C.rewards.filter(r => r.kind === 'win').map((r) => `
          <div class="reward-card ${r.kind}">
            <div class="reward-left">
              <div class="reward-sub">${r.sub}</div>
              <div class="reward-big">${r.big}</div>
            </div>
            <div class="reward-ticket">
              <div class="ticket-top">${r.ticketTop}</div>
              <div class="ticket-mid">${r.ticketMid}</div>
            </div>
          </div>`).join('')}
        <div class="rewards-head" style="font-weight: 800; font-size: 18px; line-height: 1.4;">참여만 해도<br>럭키드로우 응모 완료!</div>
        ${C.rewards.filter(r => r.kind === 'lucky').map((r) => `
          <div class="reward-card ${r.kind}">
            <div class="reward-left">
              <div class="reward-sub">${r.sub}</div>
              <div class="reward-big">${r.big}</div>
            </div>
            <div class="reward-ticket">
              <div class="ticket-top">${r.ticketTop}</div>
              <div class="ticket-mid">${r.ticketMid}</div>
            </div>
          </div>`).join('')}
      </div>

    </div>`;
  },

  // ==================== BATTLE ====================
  battleHTML() {
    const s = this.engine.getGameState();
    const A = C.teams.A, B = C.teams.B;
    const mine = s.userTeam;
    const team = C.teams[mine];
    return `
    <div class="screen battle-screen">

      <div class="logo-bar">
        <button class="back-btn" id="backBtn">‹</button>
        <img src="${C.logoLeft}" class="logo" alt="OK캐쉬백 쇼핑">
        <span class="x-sep">×</span>
        <img src="${C.logoRight}" class="logo logo-mega" alt="메가MGC커피">
        <span class="period">${C.period}</span>
      </div>

      <div class="battle-title">
        <span class="battle-title-team" style="color:${team.color}">${team.faction}를</span>응원하고 있어요!
      </div>

      <div class="battle-fighters">
        <div class="bf a ${mine === 'A' ? 'mine' : ''}">
          <span class="rank1" id="rank1A" style="display:none">1위</span>
          ${this.picture(A, '')}
        </div>
        <div class="battle-vs">VS</div>
        <div class="bf b ${mine === 'B' ? 'mine' : ''}">
          <span class="rank1" id="rank1B" style="display:none">1위</span>
          ${this.picture(B, '')}
        </div>
      </div>

      <div class="vsbar-wrap">
        <div class="vsbar-labels">
          <span class="lab a">${A.faction}</span>
          <span class="lab b">${B.faction}</span>
        </div>
        <div class="vsbar">
          <div class="seg a" id="segA" style="width:50%"><span class="num" id="numA">0</span></div>
          <div class="seg b" id="segB" style="width:50%"><span class="num" id="numB">0</span></div>
        </div>
      </div>

      <div class="mytap">
        <div class="lab">내가 연타한 횟수</div>
        <div class="count"><span id="myCount">0</span><span class="unit">회</span></div>
        <div class="combo-badge" id="combo"></div>
      </div>

      <div class="tap-area">
        <button class="tap-button" id="tapBtn"
          style="background:linear-gradient(135deg,${team.color},${team.colorDark})">
          <span class="big">${team.faction} 응원!</span>
          <span class="small">탭하고 또 탭해서 점수를 올려요</span>
        </button>
      </div>

      <div class="battle-cashback">
        우승 진영 전원 4,900원 공구 쿠폰 + 럭키 <span class="pt">1,000명</span> 기프티콘
      </div>

      <div class="timer-box">
        <div class="lab">라운드 종료까지</div>
        <div class="time" id="time">1:00</div>
        <div class="timer-track"><div class="timer-fill" id="timerFill"></div></div>
      </div>

    </div>`;
  },

  // ==================== RESULT ====================
  resultHTML() {
    const r = this.engine.getResultScreen();
    const win = C.teams[r.winner];
    const userWon = r.userWon;
    const myTeam = C.teams[this.engine.getGameState().userTeam] || win;
    const entries = r.userTapCount;
    const winReward = C.rewards.find(x => x.kind === 'win') || {};
    return `
    <div class="screen result-screen">

      <div class="logo-bar">
        <img src="${C.logoLeft}" class="logo" alt="OK캐쉬백 쇼핑">
        <span class="x-sep">×</span>
        <img src="${C.logoRight}" class="logo logo-mega" alt="메가MGC커피">
        <span class="period">${C.period}</span>
      </div>

      <div class="result-top ${userWon ? 'win' : 'lose'}" id="resultTop">
        ${userWon ? '<div class="result-rays"></div>' : ''}
        <div class="result-badge ${userWon ? 'win' : 'lose'}">${userWon ? 'WIN!' : 'LUCKY'}</div>
        ${this.picture(win, 'result-img')}
        <div class="result-title">${userWon ? '우리 편 우승! 🎉' : '아쉽게 한 끗 차이!'}</div>
        <div class="result-sub">${win.faction} · ${win.product}</div>
      </div>

      ${userWon ? `
      <div class="result-reward win">
        <div class="reward-spark">🎁</div>
        <div class="reward-headline">승리 진영 혜택 <b>전원 지급!</b></div>
        <div class="reward-amount">${winReward.ticketMid || win.gongguPrice}</div>
        <div class="reward-desc">${winReward.ticketTop || '메가커피 단독 공구'} · <s>${win.normalPrice}</s> <b>${win.gongguPrice}</b></div>
        <div class="reward-chip win">공구 쿠폰 발급 완료 ✓</div>
      </div>` : `
      <div class="result-reward lucky">
        <div class="lucky-headline">${myTeam.faction} 응원, 끝까지 멋졌어요!</div>
        <div class="lucky-count"><span class="num" id="luckyNum" data-target="${entries}">0</span><span class="unit">번 응모 완료</span></div>
        <div class="lucky-desc">연타한 <b>${entries.toLocaleString('ko-KR')}회</b>가 그대로 럭키드로우 티켓이 됐어요.<br>많이 누를수록 당첨 확률이 쑥쑥 올라가요 🍀</div>
        <div class="lucky-gauge"><div class="lucky-gauge-fill" id="luckyGauge"></div></div>
        <div class="reward-chip lucky">두근두근, 당첨자 발표를 기다려 주세요!</div>
      </div>`}

      <div class="result-card">
        <div class="row"><span>내 연타</span><strong>${entries.toLocaleString('ko-KR')}회</strong></div>
        <div class="row"><span>다음 공구 확정</span><strong>${win.product}</strong></div>
        <div class="row"><span>공구가</span><strong>${win.normalPrice} → ${win.gongguPrice}</strong></div>
        <div class="row highlight">
          <span>${userWon ? '우승 진영 혜택' : '내 럭키드로우 응모'}</span>
          <strong>${userWon ? '4,900원 공구 쿠폰 발급' : `${entries.toLocaleString('ko-KR')}번 응모 · 추첨 대기 중`}</strong>
        </div>
      </div>

      <div class="result-msg">${r.shareText}</div>

      <div class="result-actions">
        <button class="btn ghost" id="shareBtn">공유하기</button>
        <button class="btn primary" id="nextBtn">다음 라운드</button>
      </div>

    </div>`;
  },

  // ==================== 바인딩 ====================
  bind() {
    // 편 선택 (상품 이미지 = 선택 버튼)
    document.querySelectorAll('.hero-fighter').forEach(btn => {
      btn.onclick = () => this.goBattle(btn.dataset.pick);
    });
    // 탭(연타)
    const tapBtn = document.getElementById('tapBtn');
    if (tapBtn) tapBtn.onclick = (e) => this.onTap(e);
    // 결과 액션
    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) shareBtn.onclick = () => {
      const text = this.engine.getResultScreen().shareText;
      if (navigator.share) navigator.share({ title: C.title, text });
      else alert(text);
    };
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) nextBtn.onclick = () => this.reset();
    const backBtn = document.getElementById('backBtn');
    if (backBtn) backBtn.onclick = () => {
      this.engine.stopRealtimeSimulation();
      cancelAnimationFrame(this.rafId);
      this.reset();
    };
    // 결과 컨페티 / 럭키 연출
    if (this.screen === 'result') {
      if (this.engine.getResultScreen().userWon) this.confetti();
      else this.luckyReveal();
    }
  },

  luckyReveal() {
    const el = document.getElementById('luckyNum');
    const gauge = document.getElementById('luckyGauge');
    if (!el) return;
    const target = parseInt(el.dataset.target, 10) || 0;
    if (gauge) requestAnimationFrame(() => { gauge.style.width = Math.min(100, 25 + target / 4) + '%'; });
    const dur = 900, start = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('ko-KR');
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  },

  confetti() {
    const top = document.getElementById('resultTop');
    if (!top) return;
    const colors = ['#FFE14D', '#FF5B5B', '#5FA83C', '#F50087', '#7C5CFC'];
    for (let i = 0; i < 40; i++) {
      const c = document.createElement('div');
      c.className = 'confetti';
      c.style.background = colors[i % colors.length];
      c.style.left = Math.random() * 100 + '%';
      c.style.animationDuration = (1.5 + Math.random() * 1.5) + 's';
      c.style.animationDelay = (Math.random() * 0.5) + 's';
      top.appendChild(c);
      setTimeout(() => c.remove(), 3500);
    }
  },
};

window.addEventListener('DOMContentLoaded', () => app.init());
