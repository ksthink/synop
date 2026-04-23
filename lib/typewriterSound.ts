let ctx: AudioContext | null = null
let gainNode: GainNode | null = null
const buffers = new Map<string, AudioBuffer>()
let initialized = false

async function load(url: string) {
  if (!ctx || buffers.has(url)) return
  const res = await fetch(url)
  const raw = await res.arrayBuffer()
  buffers.set(url, await ctx.decodeAudioData(raw))
}

export async function initSounds() {
  if (initialized) return
  initialized = true
  try {
    ctx = new AudioContext()
    gainNode = ctx.createGain()
    gainNode.gain.value = 0.4
    gainNode.connect(ctx.destination)
    if (ctx.state === 'suspended') await ctx.resume()
    await Promise.all([load('/enter.mp3'), load('/space.mp3')])
  } catch {
    initialized = false
  }
}

// 완전 동기 — await 없음
export function playKeySound(isEnter: boolean) {
  if (!ctx || !gainNode) return
  if (ctx.state === 'suspended') { ctx.resume(); return }

  const url = isEnter
    ? '/enter.mp3'
    : Math.random() < 0.5 ? '/space.mp3' : '/enter.mp3'

  const buf = buffers.get(url)
  if (!buf) return

  const src = ctx.createBufferSource()
  src.buffer = buf
  src.playbackRate.value = 0.9 + Math.random() * 0.2
  src.connect(gainNode)
  src.start()
}
