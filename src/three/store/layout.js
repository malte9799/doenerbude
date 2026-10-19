// Shared floor plan of the shop (1 unit = 10 cm), used by the exterior and the
// interior. Floor y = 0, front facade plane z = 0, interior at z < 0, back wall
// at z = -depth, door centred at x = door.x.
export const STORE = { width: 50, depth: 40, height: 30, door: { x: 0, width: 9, height: 21 } };
