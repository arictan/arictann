# Store assets

Both scripts drive the real game in a headless browser. Start the dev server first
(`npx vite --port 5174 --strictPort`) and have Playwright installed.

**Screenshots and feature graphic** (8 framed screenshots per store, plus the Play feature graphic):

```
mkdir -p /tmp/shots/store
node tools/store/screenshots.mjs /tmp/shots store
```

The first argument is a scratch folder for the raw captures, the second is where the framed
images go (`store/ios`, `store/android`, `store/feature-graphic.png`). Captions and scenes are the
`scenes` list at the top of the script.

**Trailer** (`store/trailer.mp4`): the game is stepped at exactly 30 fps and every 1080×1920
frame is saved, so it comes out smooth even on a machine without a GPU. Then ffmpeg adds the
captions:

```
mkdir -p /tmp/trailer && node tools/store/trailer.mjs /tmp/trailer
F=/path/to/a/bold/font.ttf
cap() { echo "drawtext=fontfile=$F:text='$1':fontsize=74:fontcolor=white:x=(w-text_w)/2:y=h-360:box=1:boxcolor=0x2a1a33@0.78:boxborderw=34:enable='between(n,$2,$3)'"; }
VF="$(cap 'One tap. Stack the sushi.' 80 340),$(cap 'Beat the boss chefs' 342 520),$(cap 'Build grandma\’s restaurant' 522 625),$(cap 'A new Daily Roll every day' 627 700),$(cap 'One tower for the whole world' 702 775),$(cap 'Sushi Stack · Play free' 777 866)"
ffmpeg -framerate 30 -i /tmp/trailer/f%04d.jpg -f lavfi -i anullsrc=r=44100:cl=stereo \
  -vf "$VF,format=yuv420p" -c:v libx264 -preset slow -crf 20 -c:a aac -b:a 64k -shortest \
  -movflags +faststart store/trailer.mp4
```

The frame numbers in the captions come from `marks.json`, which the trailer script writes. The
video has a silent audio track. For a version with music, record the game's audio separately or
lay a track over it in any video editor.
