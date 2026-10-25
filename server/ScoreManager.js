class ScoreManager {
  constructor(roomMgr) {
    this.roomMgr = roomMgr;
    this.scores = {}; // roomCode => { playerId => { total: n, firstPlaces: m, lastRoundPoints: p } }
    this.POINTS_TABLE = [3, 2, 1, 0]; // 1º, 2º, 3º, demais
  }

  initRoom(roomCode) {
    this.scores[roomCode] = {};
  }

  updateScore(roomCode, ranking) {
    // ranking: [{ playerId, score, ... }, ...] sorted desc by score
    if (!this.scores[roomCode]) this.scores[roomCode] = {};

    ranking.forEach((entry, index) => {
      const { playerId, score } = entry;
      if (!this.scores[roomCode][playerId]) {
        this.scores[roomCode][playerId] = { total: 0, firstPlaces: 0, lastRoundPoints: 0 };
      }
      const points = this.POINTS_TABLE[index] ?? 0;
      this.scores[roomCode][playerId].total += points;
      this.scores[roomCode][playerId].lastRoundPoints = points;
      if (index === 0) this.scores[roomCode][playerId].firstPlaces += 1;
    });
  }

  getAccumulated(roomCode) {
    const players = this.roomMgr.getPlayers(roomCode);
    return players.map(p => ({
      playerId: p.id,
      name: p.name,
      total: this.scores[roomCode]?.[p.id]?.total ?? 0,
      firstPlaces: this.scores[roomCode]?.[p.id]?.firstPlaces ?? 0,
      lastRoundPoints: this.scores[roomCode]?.[p.id]?.lastRoundPoints ?? 0,
    })).sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      if (b.firstPlaces !== a.firstPlaces) return b.firstPlaces - a.firstPlaces;
      return b.lastRoundPoints - a.lastRoundPoints;
    });
  }

  getFinalRanking(roomCode) {
    return this.getAccumulated(roomCode);
  }

  getWinner(roomCode) {
    const ranking = this.getFinalRanking(roomCode);
    return ranking[0]?.playerId ?? null;
  }

  resetRoom(roomCode) {
    this.scores[roomCode] = {};
  }
}

module.exports = ScoreManager;