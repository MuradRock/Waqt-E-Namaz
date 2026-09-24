/**
 * Built-in tone catalog. `sound` is the file name Expo Notifications should
 * play (must be bundled at build time via a native rebuild + app.config).
 * For the skeleton we point everything at the OS default; real assets can be
 * dropped into `assets/tones/` later.
 */
export interface Tone {
  key: string;
  displayNameKey: string;
  sound: string | null;
}

export const TONES: Tone[] = [
  { key: 'default_azan', displayNameKey: 'reminders.tones.defaultAzan', sound: null },
  { key: 'soft_chime',   displayNameKey: 'reminders.tones.softChime',   sound: null },
  { key: 'gentle_bell',  displayNameKey: 'reminders.tones.gentleBell',  sound: null },
];

export function getTone(key: string | null | undefined): Tone {
  return TONES.find((t) => t.key === key) ?? TONES[0];
}
