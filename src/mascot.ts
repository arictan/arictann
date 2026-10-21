// Sake-chan: the game's mascot, a grumpy little salmon nigiri with a soft heart. Drawn in code so
// it scales from the app icon down to a corner of the screen.

export type SakeMood = 'grumpy' | 'happy' | 'shock' | 'wink' | 'proud';

/** Draws Sake-chan centred on (x, y); s = 1 is about 80 px wide. */
export function drawSake(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, mood: SakeMood, t: number): void {
  ctx.save();
  ctx.translate(x, y + Math.sin(t * 2.4) * 2 * s);
  ctx.scale(s, s);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(0, 34, 34, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Little feet.
  ctx.fillStyle = '#f2e8d5';
  for (const fx of [-14, 14]) {
    ctx.beginPath();
    ctx.ellipse(fx, 31, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Rice body with a few grains.
  const rg = ctx.createLinearGradient(0, -2, 0, 32);
  rg.addColorStop(0, '#ffffff');
  rg.addColorStop(1, '#ece3d0');
  ctx.fillStyle = rg;
  ctx.beginPath();
  ctx.moveTo(-16, -4);
  ctx.arcTo(30, -4, 30, 30, 14);
  ctx.arcTo(30, 30, -30, 30, 14);
  ctx.arcTo(-30, 30, -30, -4, 14);
  ctx.arcTo(-30, -4, 30, -4, 14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(200,190,160,0.5)';
  for (const [gx, gy] of [[-20, 10], [-8, 20], [6, 12], [18, 22], [22, 6], [-24, 22]]) {
    ctx.beginPath();
    ctx.ellipse(gx, gy, 3, 1.8, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // Tiny arms (they wave when happy).
  ctx.strokeStyle = '#f2e8d5';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  const wave = mood === 'happy' || mood === 'proud' ? Math.sin(t * 8) * 0.5 - 0.6 : 0.4;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * 29, 12);
    ctx.lineTo(side * (38 + Math.cos(wave) * 2), 12 + (side === 1 ? Math.sin(wave) * 10 : 6));
    ctx.stroke();
  }
  // The salmon slab draped over the rice.
  const sg = ctx.createLinearGradient(0, -34, 0, 4);
  sg.addColorStop(0, '#ffa07a');
  sg.addColorStop(1, '#ff7f50');
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.moveTo(-36, 0);
  ctx.quadraticCurveTo(-38, -30, -6, -34);
  ctx.quadraticCurveTo(30, -36, 38, -8);
  ctx.quadraticCurveTo(40, 4, 30, 4);
  ctx.lineTo(-30, 6);
  ctx.quadraticCurveTo(-38, 6, -36, 0);
  ctx.fill();
  // Fat stripes, kept inside the slab.
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = 'rgba(255,240,230,0.9)';
  ctx.lineWidth = 2.6;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(-28 + i * 15, 2);
    ctx.quadraticCurveTo(-22 + i * 15, -16, -12 + i * 15, -31);
    ctx.stroke();
  }
  ctx.restore();
  // Face on the salmon.
  ctx.fillStyle = '#3a1d12';
  ctx.strokeStyle = '#3a1d12';
  ctx.lineWidth = 2.4;
  const blink = Math.sin(t * 1.3) > 0.985;
  const eye = (ex: number, closed: boolean) => {
    if (closed) {
      ctx.beginPath();
      ctx.moveTo(ex - 4, -12);
      ctx.lineTo(ex + 4, -12);
      ctx.stroke();
    } else if (mood === 'shock') {
      ctx.beginPath();
      ctx.arc(ex, -12, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(ex + 1.2, -13.5, 1.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a1d12';
    } else {
      ctx.beginPath();
      ctx.arc(ex, -12, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  eye(-10, blink || mood === 'happy');
  eye(10, blink || mood === 'wink' || mood === 'happy');
  if (mood === 'happy') {
    // Happy closed eyes: little arches.
    for (const ex of [-10, 10]) {
      ctx.beginPath();
      ctx.arc(ex, -11, 4, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    }
  }
  // Eyebrows: the famous frown.
  if (mood === 'grumpy' || mood === 'proud') {
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-16, -21);
    ctx.lineTo(-5, -17);
    ctx.moveTo(16, -21);
    ctx.lineTo(5, -17);
    ctx.stroke();
  }
  // Mouth.
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  if (mood === 'grumpy') {
    ctx.arc(0, -1, 5, Math.PI * 1.15, Math.PI * 1.85);
  } else if (mood === 'shock') {
    ctx.ellipse(0, -3, 3.5, 4.5, 0, 0, Math.PI * 2);
  } else {
    ctx.arc(0, -7, 5, Math.PI * 0.15, Math.PI * 0.85);
  }
  ctx.stroke();
  // Blush.
  ctx.fillStyle = 'rgba(230,57,70,0.35)';
  for (const bx of [-19, 19]) {
    ctx.beginPath();
    ctx.ellipse(bx, -6, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // A tiny nori belt.
  ctx.fillStyle = '#24321f';
  ctx.fillRect(-5, 5, 10, 25);
  ctx.restore();
}

/** What Sake-chan says, by situation. Grumpy on the outside, proud of you on the inside. */
export const SAKE_LINES = {
  home: ['Hmph. Back already? …Good.', 'Wash your hands. Then stack.', 'I’m not cute. I’m premium.', 'Grandma believed in you. So… fine. Me too.', 'Don’t drop me. I mean it.', 'Psst. The Daily Roll is the same for everyone.', 'Tap me again and I’ll charge you.', 'The rival across the street? Overrated.'],
  shop: ['Coins first, compliments later.', 'Everything here is earnable. I checked.', 'No mystery boxes for money. Ever.', 'That plate would suit you. Probably.'],
  win: ['Fine. That was… acceptable.', 'Hmph. Impressive. Don’t let it go to your rice.', 'Grandma would be proud. I am… neutral.'],
  lose: ['Ouch. Again! Faster!', 'Even I wobble sometimes.', 'Breathe out, then tap.'],
};
