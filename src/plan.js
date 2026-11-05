// Plan north is -Z; coordinates retain the existing landscape origin.
// Scan proportions are approximate, not measured construction dimensions.
export const PLAN = {
  regions: {
    west: [-12.7, -7.15, -5.95, 8.15],
    passage: [-12.7, -5.9, -8.45, -5.95],
    openCorridor: [-5.9, 6.1, -8.45, -5.95],
    right: [6.1, 11.3, -8.45, 9.25],
    foreground: [-10.85, 8.7, 6.9, 9.25],
    landscape: [-5.8, 5.8, -4.6, 4.6],
  },
  // B's room interfaces. A's facades are timber; C, E and F have no solid walls.
  walls: [
    [-12.7, -8.45, -9.8, -8.45], [-8.3, -8.45, -5.9, -8.45],
    [-7.15, -5.95, -5.9, -5.95],
  ],
  // C: both sides, with courtyard openings. E: west/north link to C stays open;
  // south has only end rails, leaving a central opening into F. F has no rails.
  rails: [
    [-5.9, -8.45, -1.4, -8.45], [.4, -8.45, 6.1, -8.45],
    [-5.9, -5.95, -1.4, -5.95], [.4, -5.95, 6.1, -5.95],
    [6.1, -5.95, 6.1, 6.9],
    [11.3, -8.45, 11.3, 9.25],
    [6.1, -8.45, 11.3, -8.45],
    [6.1, 9.25, 7.2, 9.25], [10.2, 9.25, 11.3, 9.25],
  ],
};
