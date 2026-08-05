/**
 * Sound effects using Web Audio API — no audio files needed.
 * All sounds are synthesized programmatically.
 */

let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  // Resume if suspended (browser autoplay policy)
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  gainPeak = 0.3,
  startTime = 0
) {
  const ac = getCtx()
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.connect(gain)
  gain.connect(ac.destination)

  osc.type = type
  osc.frequency.setValueAtTime(frequency, ac.currentTime + startTime)

  gain.gain.setValueAtTime(0, ac.currentTime + startTime)
  gain.gain.linearRampToValueAtTime(gainPeak, ac.currentTime + startTime + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + startTime + duration)

  osc.start(ac.currentTime + startTime)
  osc.stop(ac.currentTime + startTime + duration)
}

/** Dice rattling tumble sound */
export function playDiceRoll() {
  const ac = getCtx()
  // White noise burst — simulates dice tumbling
  const bufferSize = ac.sampleRate * 0.35
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize) * 0.6
  }
  const source = ac.createBufferSource()
  source.buffer = buffer

  // Band-pass filter to make it sound more like plastic dice
  const filter = ac.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 800
  filter.Q.value = 0.8

  const gain = ac.createGain()
  gain.gain.setValueAtTime(1.2, ac.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.35)

  source.connect(filter)
  filter.connect(gain)
  gain.connect(ac.destination)
  source.start()
  source.stop(ac.currentTime + 0.35)

  // Add a few sharp clicks to simulate dice hitting the table
  for (let i = 0; i < 4; i++) {
    const t = 0.05 + i * 0.07 + Math.random() * 0.03
    playTone(180 + Math.random() * 120, 0.04, 'triangle', 0.15, t)
  }
}

/** Satisfying "ding" when banking points */
export function playBank() {
  playTone(523, 0.12, 'sine', 0.25, 0)     // C5
  playTone(659, 0.15, 'sine', 0.2, 0.1)    // E5
  playTone(784, 0.25, 'sine', 0.2, 0.22)   // G5
}

/** Sad wah-wah for a Farkle */
export function playFarkle() {
  const ac = getCtx()
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.connect(gain)
  gain.connect(ac.destination)

  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(320, ac.currentTime)
  osc.frequency.exponentialRampToValueAtTime(120, ac.currentTime + 0.6)

  gain.gain.setValueAtTime(0.2, ac.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.65)

  osc.start(ac.currentTime)
  osc.stop(ac.currentTime + 0.65)
}

/** Upbeat fanfare for player turn handoff */
export function playNextPlayer() {
  playTone(392, 0.08, 'square', 0.12, 0)    // G4
  playTone(523, 0.12, 'square', 0.12, 0.1)  // C5
}

/** Big winner fanfare */
export function playWinner() {
  const notes = [523, 659, 784, 1047]
  notes.forEach((freq, i) => {
    playTone(freq, 0.2, 'sine', 0.25, i * 0.12)
  })
  // Sparkle overtones
  playTone(2093, 0.3, 'sine', 0.08, 0.3)
  playTone(1568, 0.3, 'sine', 0.1, 0.45)
}
