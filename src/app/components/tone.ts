import type { Tone } from '../selectors'

/** Maps a balance tone to its Tailwind text-color class. */
export const toneText: Record<Tone, string> = {
  pos: 'text-pos',
  neg: 'text-neg',
  muted: 'text-mute',
}
