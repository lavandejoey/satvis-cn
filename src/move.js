import satvisSetup from "./app";

const { cc, state } = satvisSetup();

cc.sats.addFromTleUrl("data/tle/ext/move.txt", ["MOVE"]);

window.addEventListener("load", () => {
  if (cc.sats.visibleSatellites.length === 0) {
    state.sat.enabledTags = ["MOVE"];
  }
});
