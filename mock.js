/* ===================================================================
   mock.js — 가짜 실시간 데이터 엔진

   ⚠️ IMPORTANT: 서버 연동 시 이 파일 통째로 삭제하고
   실제 API 호출로 교체합니다.

   이 파일의 모든 함수는 실제 백엔드 API로 대체 가능하게 설계됨.
   =================================================================== */

class MockGameEngine {
  constructor(config) {
    this.config = config;
    this.gameState = {
      roundId: Date.now(),
      startTime: Date.now(),
      endTime: Date.now() + config.roundSeconds * 1000,
      teamACount: Math.floor(Math.random() * 50000) + 100000,
      teamBCount: Math.floor(Math.random() * 50000) + 100000,
      userTeam: null,
      userTapCount: 0,
      lastUpdateTime: Date.now(),
    };

    // 실시간 업데이트 간격
    this.updateInterval = null;
  }

  // ========== 게임 상태 조회 ==========
  getGameState() {
    return { ...this.gameState };
  }

  // ========== 팀 선택 ==========
  selectTeam(teamKey) {
    if (!['A', 'B'].includes(teamKey)) throw new Error("Invalid team");
    this.gameState.userTeam = teamKey;
    this.gameState.userTapCount = 0;
    return { success: true, team: teamKey };
  }

  // ========== 연타 기록 ==========
  recordTap() {
    if (!this.gameState.userTeam) {
      throw new Error("Team not selected");
    }

    this.gameState.userTapCount += 1;

    // 선택한 팀의 카운트 증가
    const increment = this.config.tapValue;
    if (this.gameState.userTeam === 'A') {
      this.gameState.teamACount += increment;
    } else {
      this.gameState.teamBCount += increment;
    }

    return {
      success: true,
      userTapCount: this.gameState.userTapCount,
      teamACounts: this.gameState.teamACount,
      teamBCount: this.gameState.teamBCount,
    };
  }

  // ========== 실시간 대체 카운트 생성 (백그라운드에서 계속 증가하는 척) ==========
  // 이걸 호출하면 setInterval을 시작 → 멈출 때까지 계속 상대팀 카운트를 올림
  startRealtimeSimulation() {
    this.updateInterval = setInterval(() => {
      // 상대팀이 연타하는 시뮬레이션
      const randomIncrement = Math.floor(Math.random() * 10) + 2; // 2~12

      if (this.gameState.userTeam === 'A') {
        // 사용자가 A팀이면 B팀을 증가
        this.gameState.teamBCount += randomIncrement;
      } else {
        // 사용자가 B팀이면 A팀을 증가
        this.gameState.teamACount += randomIncrement;
      }

      this.gameState.lastUpdateTime = Date.now();
    }, 500); // 0.5초마다 업데이트 (자연스러운 증가)
  }

  stopRealtimeSimulation() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  // ========== 라운드 남은 시간(ms) ==========
  getTimeRemaining() {
    return Math.max(0, this.gameState.endTime - Date.now());
  }

  // ========== 라운드 종료 여부 ==========
  isRoundEnded() {
    return this.getTimeRemaining() <= 0;
  }

  // ========== 우승 팀 결정 ==========
  getWinner() {
    return this.gameState.teamACount >= this.gameState.teamBCount ? 'A' : 'B';
  }

  // ========== 결과 화면 데이터 ==========
  getResultScreen() {
    const winner = this.getWinner();
    const userWon = winner === this.gameState.userTeam;

    return {
      winner: winner,
      userWon: userWon,
      teamACount: this.gameState.teamACount,
      teamBCount: this.gameState.teamBCount,
      userTapCount: this.gameState.userTapCount,
      userReward: userWon ? Math.floor(this.gameState.userTapCount * 0.5) : 100, // 기여도 50% + 참여보상 100P
      shareText: userWon
        ? `나 ${this.gameState.userTeam === 'A' ? '말차파르페' : '팥빙파르페'}파로 이겼어! 🎉 너도 함께 응원해줘!`
        : `${this.gameState.userTeam === 'A' ? '말차파르페' : '팥빙파르페'}파 화이팅! 다음 공구에는 꼭! 🔥`,
    };
  }

  // ========== 초기화 (새 라운드) ==========
  reset() {
    this.stopRealtimeSimulation();
    this.gameState = {
      roundId: Date.now(),
      startTime: Date.now(),
      endTime: Date.now() + this.config.roundSeconds * 1000,
      teamACount: Math.floor(Math.random() * 50000) + 100000,
      teamBCount: Math.floor(Math.random() * 50000) + 100000,
      userTeam: null,
      userTapCount: 0,
      lastUpdateTime: Date.now(),
    };
  }
}

// 글로벌 인스턴스 생성
let gameEngine = null;

function initGameEngine(config) {
  gameEngine = new MockGameEngine(config);
  return gameEngine;
}

function getEngine() {
  if (!gameEngine) throw new Error("Game engine not initialized");
  return gameEngine;
}
