Hooks.once('init', () => {
  // Patch only once
  if (!CONFIG._origD20RollForce20) 
    CONFIG._origD20RollForce20 = CONFIG.Dice.D20Roll.prototype._evaluateSync;

  CONFIG.Dice.D20Roll.prototype._evaluateSync = function(...args) {
    // Only force 20 if the current user has the flag set
    const userId = (this.options && this.options.user) || game.user?.id;
    if (window.FORCE_NEXT_20_BY_USER?.[userId]) {
      window.FORCE_NEXT_20_BY_USER[userId] = false;
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

// The per-user flag table (client-side, per user)
window.FORCE_NEXT_20_BY_USER = {};

// Hotkey registration - anyone can use!
Hooks.once('ready', function() {
  window.addEventListener('keydown', (ev) => {
    if (ev.ctrlKey && ev.code === "Numpad8" && !ev.repeat) {
      // Set flag for your userId only
      const uid = game.user?.id;
      if (uid) {
        window.FORCE_NEXT_20_BY_USER[uid] = true;
        ui.notifications.notify("🔒 Your next d20 roll will be a natural 20 (single use)");
      }
      ev.preventDefault();
    }
  });
});
