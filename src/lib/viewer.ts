import type { Anim, Detail, Dir } from './types';

export const COMPASS: (Dir | null)[] = ['north-west', 'north', 'north-east', 'west', null, 'east', 'south-west', 'south', 'south-east'];

const ORDER: Dir[] = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west', 'unknown'];

/** "south-east" -> "South-east"; the 1-direction 'unknown' reads "Still". */
export const dirLabel = (d: Dir): string => (d === 'unknown' ? 'Still' : d[0].toUpperCase() + d.slice(1));

/** Directions the picture set has, in compass order. anim -1 = Rotations. */
export function dirsFor(detail: Detail, anim: number): Dir[] {
  const have = anim < 0 ? detail.rotations : detail.animations[anim]?.frames ?? {};
  return ORDER.filter((d) => (have[d]?.length ?? 0) > 0);
}

/** Previous type when the new asset has it, else an idle/breathing animation, else the first, else Rotations. */
export function defaultAnim(anims: Anim[], prevType?: string | null): number {
  const at = (f: (a: Anim) => boolean) => anims.findIndex(f);
  const prev = prevType ? at((a) => a.type === prevType) : -1;
  if (prev >= 0) return prev;
  const idle = at((a) => /idle|breath/i.test(a.type ?? a.name));
  if (idle >= 0) return idle;
  return anims.length ? 0 : -1;
}

export const pickDir = (avail: Dir[], want?: Dir): Dir =>
  want && avail.includes(want) ? want : avail.includes('south') ? 'south' : avail[0] ?? 'south';

/** "Walk · East"; Rotations reads as the state name when there are several; one direction drops the suffix. */
export function chipLabel(detail: Detail, anim: number, dir: Dir, stateLabel: string | null, states: number): string {
  const name = anim < 0 ? (states > 1 && stateLabel ? stateLabel : 'Rotations') : detail.animations[anim]?.name ?? 'Rotations';
  return dirsFor(detail, anim).length > 1 ? `${name} · ${dirLabel(dir)}` : name;
}

/** The chip shows only when there is something to choose: another animation, a direction or a state. */
export function chipVisible(detail: Detail | null, states: number): boolean {
  if (!detail) return false;
  if (states > 1) return true;
  const options = (Object.keys(detail.rotations).length ? 1 : 0) + detail.animations.length;
  return options > 1 || [-1, ...detail.animations.keys()].some((a) => dirsFor(detail, a).length > 1);
}
