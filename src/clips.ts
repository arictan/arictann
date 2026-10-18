// Highlight clips: while a run is on, the canvas is recorded in overlapping segments so the last
// few seconds before the run ends can be saved as a short video and shared. Off by default
// (Settings → Highlight clips) because recording costs battery on older phones.

const OVERLAP = 6_000; // a new recorder starts this often; two overlap, so a clip is 6-12 s long

interface Seg { rec: MediaRecorder; chunks: Blob[] }

function pickType(): string {
  const types = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
}

export function clipsSupported(): boolean {
  return typeof MediaRecorder === 'function' && typeof HTMLCanvasElement.prototype.captureStream === 'function' && pickType() !== '';
}

export class ClipRecorder {
  private stream: MediaStream | null = null;
  private segs: Seg[] = [];
  private timer = 0;
  private type = '';

  constructor(private canvas: HTMLCanvasElement) {}

  start(): void {
    if (!clipsSupported()) return;
    this.stop();
    this.type = pickType();
    this.stream = this.canvas.captureStream(30);
    this.startSeg();
    this.timer = window.setInterval(() => {
      this.startSeg();
      // Drop segments that are too old to be the best clip.
      while (this.segs.length > 2) this.segs.shift()!.rec.stop();
    }, OVERLAP);
  }

  private startSeg(): void {
    if (!this.stream) return;
    const rec = new MediaRecorder(this.stream, { mimeType: this.type, videoBitsPerSecond: 2_500_000 });
    const seg: Seg = { rec, chunks: [] };
    rec.ondataavailable = (e) => { if (e.data.size) seg.chunks.push(e.data); };
    rec.start();
    this.segs.push(seg);
  }

  /** Stops recording and returns the older (longer) of the two running segments as a video file. */
  async finish(): Promise<File | null> {
    window.clearInterval(this.timer);
    const seg = this.segs[0];
    if (!seg) {
      this.stop();
      return null;
    }
    const done = new Promise<void>((resolve) => { seg.rec.onstop = () => resolve(); });
    if (seg.rec.state === 'recording') seg.rec.stop();
    await done;
    this.stop();
    if (!seg.chunks.length) return null;
    const ext = this.type.includes('mp4') ? 'mp4' : 'webm';
    return new File(seg.chunks, `sushi-stack-clip.${ext}`, { type: this.type.split(';')[0] });
  }

  stop(): void {
    window.clearInterval(this.timer);
    for (const s of this.segs) if (s.rec.state === 'recording') s.rec.stop();
    this.segs = [];
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }
}
