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
  heatTimer: null,

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
    clearTimeout(this.heatTimer);
    this.render();
    this.loop();
  },
  goResult() {
    this.engine.stopRealtimeSimulation();
    cancelAnimationFrame(this.rafId);
    clearTimeout(this.heatTimer);
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

    // 콤보가 쌓일수록 버튼이 달궈지다 불타오름
    this.applyHeat(team);

    // 떠오르는 숫자 + 파티클
    this.spawnFloater(ev, team);
    this.spawnParticles(ev, team);

    // 마일스톤 연출 (누적 연타 수 기준 — 10단위 중간 / 50단위 큰 / 100단위 메가)
    this.milestone(s.userTapCount, team);

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

  // ==================== 콤보 버튼 가열(Heat) 연출 ====================
  heatLevel() {
    if (this.combo >= 20) return 3;  // 점화
    if (this.combo >= 10) return 2;  // 가열
    if (this.combo >= 5) return 1;   // 예열
    return 0;
  },

  applyHeat(team) {
    const btn = document.getElementById('tapBtn');
    if (!btn) return;
    const lv = this.heatLevel();
    // 불꽃 색을 응원 팀 색상으로
    btn.style.setProperty('--heat', team.color);
    btn.style.setProperty('--heat-dark', team.colorDark);
    btn.classList.toggle('heat-1', lv >= 1);
    btn.classList.toggle('heat-2', lv >= 2);
    btn.classList.toggle('heat-3', lv >= 3);

    // 점화 단계에서 약한 진동
    if (lv >= 3 && navigator.vibrate) navigator.vibrate(10);

    // 콤보가 끊기면(연타 멈추면) 버튼이 식음
    clearTimeout(this.heatTimer);
    this.heatTimer = setTimeout(() => this.coolDown(), C.comboWindow + 250);
  },

  coolDown() {
    this.combo = 0;
    const btn = document.getElementById('tapBtn');
    if (btn) btn.classList.remove('heat-1', 'heat-2', 'heat-3');
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

  // ==================== 마일스톤 연출 ====================
  // 큰 연출: 50번마다(50·100·150…) — 가장 화려함
  // 중간 연출: 10번마다(10·20·30…) — 적당히 화려함
  milestone(count, team) {
    if (count <= 0) return;
    if (count % 50 === 0) this.fxTier('big', count, team);
    else if (count % 10 === 0) this.fxTier('medium', count, team);
    else if (navigator.vibrate) navigator.vibrate(16);
  },

  fxLayer() {
    const scr = document.querySelector('.battle-screen');
    if (!scr) return null;
    let layer = scr.querySelector('.fx-layer');
    if (!layer) { layer = document.createElement('div'); layer.className = 'fx-layer'; scr.appendChild(layer); }
    return layer;
  },

  fxTier(tier, count, team) {
    const scr = document.querySelector('.battle-screen');
    const layer = this.fxLayer();
    if (!scr || !layer) return;
    const big = tier === 'big';
    const color = team.color;
    const colors = [team.color, team.colorDark, '#FFE14D', '#fff'];

    // 충격파 링 (큰 연출은 3겹 연쇄)
    const rings = big ? 3 : 1;
    for (let i = 0; i < rings; i++) {
      const ring = document.createElement('div');
      ring.className = 'fx-ring' + (big ? ' big' : '');
      ring.style.color = color;
      ring.style.animationDelay = (i * 0.11) + 's';
      layer.appendChild(ring);
      setTimeout(() => ring.remove(), 1000 + i * 150);
    }

    // 펀치 배너
    const banner = document.createElement('div');
    banner.className = 'fx-banner ' + tier;
    banner.textContent = big ? `🔥 ${count} COMBO!` : `${count} 연타!`;
    layer.appendChild(banner);
    setTimeout(() => banner.remove(), 1000);

    // 중앙 파티클 분출
    this.fxBurst(layer, colors, big ? 30 : 10, big ? 230 : 90);

    // 진영 재료 이미지(말차=녹차잎 / 팥빙=팥)
    // 중간: 중앙에서 톡 솟았다 살랑이며 낙하 / 큰: 사방으로 펑 폭발
    if (team.fxImg) {
      if (big) this.fxImgBurst(layer, team.fxImg, 38, 50, 1300);
      else this.fxImgFall(layer, team.fxImg, 12, 26, 1900);
    }

    // 중간 연출: 가벼운 흔들림 + 진동 후 종료
    if (!big) {
      scr.classList.remove('shake'); void scr.offsetWidth; scr.classList.add('shake');
      if (navigator.vibrate) navigator.vibrate([30, 20, 40]);
      return;
    }

    // 큰 연출: 컬러 플래시 + 가장자리 글로우 + 방사광선 + 풀스크린 폭죽 + 캐릭터 펀치 + 강한 흔들림
    const flash = document.createElement('div');
    flash.className = 'fx-flash';
    flash.style.background = `radial-gradient(circle at 50% 42%, #fff, ${color} 70%)`;
    layer.appendChild(flash);
    setTimeout(() => flash.remove(), 520);

    const edge = document.createElement('div');
    edge.className = 'fx-edge';
    edge.style.color = color;
    layer.appendChild(edge);
    setTimeout(() => edge.remove(), 760);

    const rays = document.createElement('div');
    rays.className = 'fx-rays';
    layer.appendChild(rays);
    setTimeout(() => rays.remove(), 1000);

    this.fxConfetti(layer, colors);
    if (team.fxImg) this.fxImgConfetti(layer, team.fxImg);

    const myFighter = document.querySelector('.bf.mine');
    if (myFighter) { myFighter.classList.remove('bump'); void myFighter.offsetWidth; myFighter.classList.add('bump'); }

    scr.classList.remove('shake-hard'); void scr.offsetWidth; scr.classList.add('shake-hard');
    if (navigator.vibrate) navigator.vibrate([70, 35, 70, 35, 140]);
  },

  fxBurst(layer, colors, n, spread) {
    const rect = layer.getBoundingClientRect();
    const cx = rect.width / 2, cy = rect.height * 0.42;
    for (let i = 0; i < n; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.width = p.style.height = (8 + Math.random() * 8) + 'px';
      p.style.background = colors[i % colors.length];
      p.style.left = cx + 'px';
      p.style.top = cy + 'px';
      const ang = (Math.PI * 2 * i) / n + Math.random() * 0.4;
      const dist = spread * (0.5 + Math.random() * 0.7);
      p.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
      p.style.setProperty('--dy', Math.sin(ang) * dist + 'px');
      layer.appendChild(p);
      setTimeout(() => p.remove(), 650);
    }
  },

  fxConfetti(layer, colors) {
    for (let i = 0; i < 28; i++) {
      const c = document.createElement('div');
      c.className = 'confetti';
      c.style.background = colors[i % colors.length];
      c.style.left = Math.random() * 100 + '%';
      c.style.animationDuration = (1.2 + Math.random() * 1.2) + 's';
      c.style.animationDelay = (Math.random() * 0.3) + 's';
      layer.appendChild(c);
      setTimeout(() => c.remove(), 2600);
    }
  },

  // 진영 재료 이미지가 중앙에서 펑 터져 사방으로 퍼지며 화면 밖으로 날아감
  fxImgBurst(layer, src, n, size, dur) {
    const rect = layer.getBoundingClientRect();
    const cx = rect.width / 2, cy = rect.height * 0.42;
    const reach = Math.hypot(rect.width, rect.height); // 화면 대각선 = 어느 방향이든 밖으로 나감
    for (let i = 0; i < n; i++) {
      const img = document.createElement('img');
      img.className = 'fx-pop';
      img.src = src;
      img.alt = '';
      const sz = size * (0.7 + Math.random() * 0.6);
      img.style.width = img.style.height = sz + 'px';
      img.style.left = cx + 'px';
      img.style.top = cy + 'px';
      const ang = (Math.PI * 2 * i) / n + Math.random() * 0.5;
      const dist = reach * (0.62 + Math.random() * 0.45);
      img.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
      img.style.setProperty('--dy', Math.sin(ang) * dist + 'px');
      img.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
      img.style.animationDuration = dur + 'ms';
      layer.appendChild(img);
      setTimeout(() => img.remove(), dur + 60);
    }
  },

  // 중간 연출: 중앙에서 잎/팥이 톡 솟았다가 살랑이며 화면 아래로 떨어짐
  fxImgFall(layer, src, n, size, dur) {
    const rect = layer.getBoundingClientRect();
    const cx = rect.width / 2, cy = rect.height * 0.42;
    for (let i = 0; i < n; i++) {
      const img = document.createElement('img');
      img.className = 'fx-leaf';
      img.src = src;
      img.alt = '';
      const sz = size * (0.7 + Math.random() * 0.7);
      img.style.width = img.style.height = sz + 'px';
      img.style.left = cx + 'px';
      img.style.top = cy + 'px';
      // 위쪽 부채꼴로 톡 솟아오름
      const ang = -Math.PI * (0.18 + Math.random() * 0.64);
      const pop = 55 + Math.random() * 80;
      const x1 = Math.cos(ang) * pop;
      const y1 = Math.sin(ang) * pop; // 음수 = 위로
      // 좌우 살랑 드리프트 + 중력으로 화면 아래까지 낙하
      const x2 = x1 + (Math.random() - 0.5) * 90;
      const y2 = rect.height * 0.78 + Math.random() * rect.height * 0.35;
      const r1 = Math.random() * 120 - 60;
      const r2 = r1 + (Math.random() * 600 - 300);
      img.style.setProperty('--x1', x1 + 'px');
      img.style.setProperty('--y1', y1 + 'px');
      img.style.setProperty('--x2', x2 + 'px');
      img.style.setProperty('--y2', y2 + 'px');
      img.style.setProperty('--r1', r1 + 'deg');
      img.style.setProperty('--r2', r2 + 'deg');
      img.style.animationDuration = (dur + Math.random() * 500) + 'ms';
      layer.appendChild(img);
      setTimeout(() => img.remove(), dur + 700);
    }
  },

  // 진영 재료 이미지가 컨페티처럼 위에서 우수수 떨어짐 (큰 연출)
  fxImgConfetti(layer, src) {
    for (let i = 0; i < 18; i++) {
      const img = document.createElement('img');
      img.className = 'fx-confetti-img';
      img.src = src;
      img.alt = '';
      const sz = 18 + Math.random() * 20;
      img.style.width = img.style.height = sz + 'px';
      img.style.left = Math.random() * 100 + '%';
      img.style.animationDuration = (1.4 + Math.random() * 1.3) + 's';
      img.style.animationDelay = (Math.random() * 0.35) + 's';
      layer.appendChild(img);
      setTimeout(() => img.remove(), 3000);
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
            </picture>
            <span class="hero-product">${A.product}</span>
            <div class="hero-name a">${A.faction}</div>
          </button>
          <div class="vs-badge">VS</div>
          <button class="hero-fighter right" data-pick="B">
            <div class="speech">${B.bubble}</div>
            <picture>
              <source srcset="${B.imgSrc}" type="${B.imgType}">
              <img class="fighter-img" src="${B.imgFallback}" alt="${B.product}">
            </picture>
            <span class="hero-product">${B.product}</span>
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
