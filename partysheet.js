// Everyone loads the patch

// Table to store per-user request (keyed by userId)
const FORCE_NEXT_20_BY_USER = {};

Hooks.once('init', () => {
  // Patch d20 evaluation everywhere
  if (!CONFIG._origD20RollForce20)
    CONFIG._origD20RollForce20 = CONFIG.Dice.D20Roll.prototype._evaluateSync;

  CONFIG.Dice.D20Roll.prototype._evaluateSync = function(...args) {
    // Figure out user id associated with roll
    // Foundry 0.8+ (dnd5e, etc): this.options.user is usually set
    const userId = (this.options && this.options.user) || game?.user?.id;
    // Only force if the "force" flag is set on this user in this session
    if (FORCE_NEXT_20_BY_USER?.[userId]) {
      FORCE_NEXT_20_BY_USER[userId] = false;
      if (
        Array.isArray(this.terms) &&
        this.terms[0].faces === 20 &&
        this.terms[0].number === 1
      ) {
        this.terms[0].results = [{ result: 20, active: true }];
        this._total = 20;
        return this;
      }
    }
    return CONFIG._origD20RollForce20.apply(this, args);
  };
});

// Register and handle a socket message to set the user flag on the host/server/GM instance
Hooks.once('ready', async () => {
  // Use a unique event name
  game.socket.on('module.force-nat20', ({ userId }) => {
    // Only set this flag on the world-owning instance (who will process the roll)
    if (game.user?.isGM && game.user?.isActiveGM) {
      FORCE_NEXT_20_BY_USER[userId] = true;
    }
  });

  // Hotkey handler (all users can trigger)
  window.addEventListener('keydown', (ev) => {
    if (ev.ctrlKey && ev.code === "Numpad8" && !ev.repeat) {
      const uid = game.user?.id;
      if (uid) {
        // Instead of setting local flag,
        // Request the host/server to set the flag for your userId
        game.socket.emit('module.force-nat20', { userId: uid });
        ui.notifications.notify("🔒 Your next d20 roll will be a natural 20 (single use)");
      }
      ev.preventDefault();
    }
  });
});
