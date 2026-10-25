class RoomManager {
  constructor() {
    this.rooms = {}; // code -> { hostSocketId, players: [{ id, name, socketId }] }
  }

  createRoom(hostSocketId) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.rooms[code] = { hostSocketId, players: [] };
    return code;
  }

  joinRoom(code, playerId, name, socketId) {
    const room = this.rooms[code];
    if (!room) return false;
    const existing = room.players.find(p => p.id === playerId);
    if (existing) {
      existing.socketId = socketId; // reconnect
    } else {
      room.players.push({ id: playerId, name, socketId });
    }
    return true;
  }

  getPlayers(code) {
    return this.rooms[code]?.players || [];
  }

  getSocketIds(code) {
    const room = this.rooms[code];
    if (!room) return [];
    return [room.hostSocketId, ...room.players.map(p => p.socketId)];
  }

  getRoomInfo(code) {
    return this.rooms[code];
  }

  removeRoom(code) {
    delete this.rooms[code];
  }
}

module.exports = RoomManager;