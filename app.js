/* ===================================================================
   app.js — 게임 로직 & UI (리디자인)
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
    const ra = (a / sum * 100), rb = 100 - ra;
    this.setText('numA', a.toLocaleString('ko-KR'));
    this.setText('numB', b.toLocaleString('ko-KR'));
    const segA = document.getElementById('segA'), segB = document.getElementById('segB');
    if (segA) segA.style.width = ra + '%';
    if (segB) segB.style.width = rb + '%';
    this.setText('myCount', s.userTapCount.toLocaleString('ko-KR'));
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
    const boost = this.combo >= 10 ? '🔥' : '';
    f.textContent = `+1${boost}`;
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

  introHTML() {
    const A = C.teams.A, B = C.teams.B;
    return `
    <div class="screen intro-screen">
      <div class="topbar">
        <button class="icon-btn">‹</button>
        <div class="topbar-title">${C.title}</div>
        <button class="icon-btn">⤴</button>
      </div>
      <div class="cobrand">
        <div class="brands">
          <span class="pay-chip">${C.partnerLeft}</span>
          <span class="x">×</span>
          <span class="partner">${C.partnerRight}</span>
        </div>
        <div class="period">${C.period}</div>
      </div>
      <div class="tabs">
        <button class="tab-btn active" data-tab="main">${C.title}</button>
        <button class="tab-btn" data-tab="benefit">참가 혜택</button>
        <button class="tab-btn" data-tab="prize">우승 상금</button>
      </div>

      <div class="tab-pane active" data-pane="main">
        <div class="hero">
          <div class="hero-eyebrow">🏆 ${C.prizePool} 대결</div>
          <div class="hero-title">${C.title}</div>
          <div class="hero-sub">${C.subtitle}</div>
          <div class="hero-vs">
            <div class="hero-fighter left">
              <div class="speech">${A.bubble}</div>
              ${this.picture(A, 'fighter-img')}
            </div>
            <div class="vs-badge">VS</div>
            <div class="hero-fighter right">
              <div class="speech">${B.bubble}</div>
              ${this.picture(B, 'fighter-img')}
            </div>
          </div>
          <div class="hero-names">
            <div class="hero-name a">${A.faction}</div>
            <div class="hero-name-vs">vs</div>
            <div class="hero-name b">${B.faction}</div>
          </div>
          <div class="hero-question">당신의 파르페 취향은?</div>
        </div>

        <div class="pick-row">
          <button class="pick-btn a" data-pick="A">
            <span class="emoji">${A.emoji}</span>
            ${A.faction}
            <span class="sub">${A.product}</span>
          </button>
          <button class="pick-btn b" data-pick="B">
            <span class="emoji">${B.emoji}</span>
            ${B.faction}
            <span class="sub">${B.product}</span>
          </button>
        </div>
        <div class="pick-hint">편을 고르면 바로 연타 대결이 시작돼요 👊</div>

        <div class="promo-bar">
          <span class="pay-chip">${C.promoBadge}</span>
          <span>${C.promoText}</span>
        </div>
      </div>

      <div class="tab-pane" data-pane="benefit">
        <div class="content-pad">
          ${C.benefits.map(b => `
            <div class="benefit-item">
              <div class="benefit-icon">${b.icon}</div>
              <div>
                <div class="benefit-title">${b.title}</div>
                <div class="benefit-desc">${b.desc}</div>
              </div>
            </div>`).join('')}
        </div>
      </div>

      <div class="tab-pane" data-pane="prize">
        <div class="content-pad">
          <div class="prize-hero">
            <div class="label">총 상금풀</div>
            <div class="amount">${C.prizePool}</div>
          </div>
          ${C.prizeBreakdown.map(p => `
            <div class="prize-row">
              <div class="tier">${p.tier}</div>
              <div style="text-align:right">
                <div class="amt">${p.amount}</div>
                <div class="desc">${p.desc}</div>
              </div>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
  },

  battleHTML() {
    const s = this.engine.getGameState();
    const A = C.teams.A, B = C.teams.B;
    const mine = s.userTeam;
    const team = C.teams[mine];
    return `
    <div class="screen battle-screen">
      <div class="topbar">
        <button class="icon-btn" id="backBtn">‹</button>
        <div class="topbar-title">${C.title}</div>
        <button class="icon-btn">⤴</button>
      </div>
      <div class="cobrand">
        <div class="brands">
          <span class="pay-chip">${C.partnerLeft}</span><span class="x">×</span>
          <span class="partner">${C.partnerRight}</span>
        </div>
        <div class="period">${C.period}</div>
      </div>

      <div class="battle-fighters">
        <div class="bf a ${mine==='A'?'mine':'dimmed'}">
          <div class="speech">${A.bubble}</div>
          ${this.picture(A, '')}
        </div>
        <div class="battle-vs">VS</div>
        <div class="bf b ${mine==='B'?'mine':'dimmed'}">
          <div class="speech">${B.bubble}</div>
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

      <div class="timer-box">
        <div class="lab">라운드 종료까지</div>
        <div class="time" id="time">1:00</div>
        <div class="timer-track"><div class="timer-fill" id="timerFill"></div></div>
      </div>

      <div class="mytap">
        <div class="lab">내가 연타한 횟수</div>
        <div class="count"><span id="myCount">0</span><span class="unit">회</span></div>
        <div class="combo-badge" id="combo"></div>
      </div>

      <div class="tap-area">
        <button class="tap-button" id="tapBtn" style="background:linear-gradient(135deg, ${team.color}, ${team.colorDark})">
          <span class="big">👊 ${team.faction} 응원!</span>
          <span class="small">탭하고 또 탭해서 점수를 올려요</span>
        </button>
      </div>

      <div class="promo-bar">
        <span class="pay-chip">${C.promoBadge}</span>
        <span>${C.promoText}</span>
      </div>
    </div>`;
  },

  resultHTML() {
    const s = this.engine.getGameState();
    const r = this.engine.getResultScreen();
    const win = C.teams[r.winner];
    const userWon = r.userWon;
    return `
    <div class="screen result-screen">
      <div class="topbar">
        <div class="icon-btn"></div>
        <div class="topbar-title">결과</div>
        <div class="icon-btn"></div>
      </div>
      <div class="result-top ${userWon?'win':'lose'}" id="resultTop">
        <div class="result-crown">${userWon?'🎉':'😢'}</div>
        ${this.picture(win, 'result-img')}
        <div class="result-title">${userWon?'우리 편 우승!':'아쉽게 졌어요'}</div>
        <div class="result-sub">${win.faction} · ${win.product}</div>
      </div>

      <div class="result-card">
        <div class="row"><span>내 연타</span><strong>${r.userTapCount.toLocaleString('ko-KR')}회</strong></div>
        <div class="row"><span>다음 공구 확정</span><strong>${win.product}</strong></div>
        <div class="row"><span>공구가</span><strong>${win.normalPrice} → ${win.gongguPrice}</strong></div>
        <div class="row reward" style="background:${userWon?win.colorLight:'#F4F4F6'}">
          <span>받은 포인트</span><strong style="color:${userWon?win.colorDark:'#1A1A1A'}">${r.userReward.toLocaleString('ko-KR')}P</strong>
        </div>
      </div>

      <div class="result-msg">${r.shareText}</div>

      <div class="result-actions">
        <button class="btn ghost" id="shareBtn">공유하기</button>
        <button class="btn primary" id="nextBtn" style="background:${win.color}">다음 라운드</button>
      </div>
    </div>`;
  },

  // ==================== 바인딩 ====================
  bind() {
    // 탭 전환
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.querySelector(`[data-pane="${btn.dataset.tab}"]`).classList.add('active');
      };
    });
    // 편 선택
    document.querySelectorAll('.pick-btn').forEach(btn => {
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
    if (backBtn) backBtn.onclick = () => { this.engine.stopRealtimeSimulation(); cancelAnimationFrame(this.rafId); this.reset(); };

    // 결과 컨페티
    if (this.screen === 'result' && this.engine.getResultScreen().userWon) {
      this.confetti();
    }
  },

  confetti() {
    const top = document.getElementById('resultTop');
    if (!top) return;
    const colors = ['#FFE14D', '#FF5B5B', '#5FA83C', '#E8506E', '#4DA6FF'];
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
