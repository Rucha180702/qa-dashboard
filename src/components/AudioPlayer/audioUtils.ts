import type { SilenceRegion } from '../../types';

const SILENCE_THRESHOLD = 0.015; // RMS amplitude below this = silence
const MIN_SILENCE_DURATION = 0.6; // seconds

export function detectSilenceRegions(audioBuffer: AudioBuffer): SilenceRegion[] {
  const sampleRate = audioBuffer.sampleRate;
  const channelData = audioBuffer.getChannelData(0);
  const chunkSize = Math.floor(sampleRate * 0.05); // 50ms window
  const regions: SilenceRegion[] = [];

  let silenceStart: number | null = null;

  for (let i = 0; i < channelData.length; i += chunkSize) {
    const end = Math.min(i + chunkSize, channelData.length);
    let sum = 0;
    for (let j = i; j < end; j++) sum += channelData[j] * channelData[j];
    const rms = Math.sqrt(sum / (end - i));

    if (rms < SILENCE_THRESHOLD) {
      if (silenceStart === null) silenceStart = i / sampleRate;
    } else {
      if (silenceStart !== null) {
        const silenceEnd = i / sampleRate;
        if (silenceEnd - silenceStart >= MIN_SILENCE_DURATION) {
          regions.push({ start: silenceStart, end: silenceEnd });
        }
        silenceStart = null;
      }
    }
  }

  return regions;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2] as const;
export type PlaybackSpeed = (typeof SPEED_OPTIONS)[number];
