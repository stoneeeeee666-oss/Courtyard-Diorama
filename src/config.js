export const PALETTE = {
  plaster: 0xe7e4da,
  plasterShade: 0xd5d0c2,
  wood: 0xa58d70,
  darkWood: 0x514238,
  roof: 0x93856c,
  roofDark: 0x746953,
  sage: 0x81947b,
  olive: 0x61765b,
  deepGreen: 0x384f3f,
  water: 0x819c91,
  stone: 0xa4a399,
  earth: 0xb4aa91,
  moss: 0x71806a,
};

export const DIMENSIONS = {
  siteWidth: 29,
  siteDepth: 23,
  floorY: 0.42,
  wallHeight: 3.5,
  northLength: 21,
  northDepth: 2.5,
  westLength: 15.5,
  westDepth: 5.3,
  eastLength: 13.5,
  eastDepth: 5.2,
  roofPitch: 0.52,
  pondCenter: [0.5, 0.5],
};

export function seededRandom(seed = 1337) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}
