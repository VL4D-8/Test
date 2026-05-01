#!/usr/bin/env python3
"""Generate a silent kinetic-typography Short for the Trendiest channel trailer."""

import os
import subprocess
import cairosvg
import imageio_ffmpeg

OUT_DIR = os.path.dirname(os.path.abspath(__file__))
FRAMES_DIR = os.path.join(OUT_DIR, "_frames")
os.makedirs(FRAMES_DIR, exist_ok=True)

W, H = 1080, 1920
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

# Each scene: (filename, duration in seconds, svg)
def scene(filename, duration, big, small="", eyebrow="", brand=False):
    bg = """
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#1a0510"/>
        <stop offset="0.5" stop-color="#0b0b0f"/>
        <stop offset="1" stop-color="#1a0510"/>
      </linearGradient>
      <linearGradient id="hot" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#FF1F62"/>
        <stop offset="1" stop-color="#FF6A1A"/>
      </linearGradient>
      <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#FF3A4D" stop-opacity="0.4"/>
        <stop offset="1" stop-color="#FF3A4D" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1080" height="1920" fill="url(#bg)"/>
    <ellipse cx="540" cy="960" rx="700" ry="500" fill="url(#glow)"/>
    """

    eyebrow_svg = ""
    if eyebrow:
        eyebrow_svg = f"""
        <g transform="translate(540 540)" text-anchor="middle">
          <rect x="-260" y="-36" width="520" height="68" rx="34" fill="url(#hot)"/>
          <text dominant-baseline="central"
                font-family="'Arial Black', 'Helvetica Neue', Arial, sans-serif"
                font-weight="900" font-size="40" fill="#0b0b0f"
                letter-spacing="6">{eyebrow}</text>
        </g>
        """

    big_svg = f"""
    <text x="540" y="960"
          text-anchor="middle"
          dominant-baseline="central"
          font-family="'Arial Black', 'Helvetica Neue', Arial, sans-serif"
          font-weight="900"
          font-size="{160 if len(big) <= 12 else 130}"
          letter-spacing="-3"
          fill="#FFFFFF">{big}</text>
    """

    small_svg = ""
    if small:
        small_svg = f"""
        <rect x="240" y="1100" width="600" height="6" rx="3" fill="url(#hot)"/>
        <text x="540" y="1180"
              text-anchor="middle"
              dominant-baseline="hanging"
              font-family="'Helvetica Neue', Arial, sans-serif"
              font-weight="500"
              font-size="56"
              fill="#FFFFFF" opacity="0.85">{small}</text>
        """

    brand_svg = ""
    if brand:
        brand_svg = """
        <g transform="translate(540 1700)" text-anchor="middle">
          <text font-family="'Arial Black', sans-serif" font-weight="900"
                font-size="56" fill="#FFFFFF" opacity="0.55"
                letter-spacing="8">@TRENDIEST</text>
        </g>
        """

    # Faint corner accent
    corner = """
    <g stroke="url(#hot)" stroke-width="6" stroke-linecap="round" fill="none" opacity="0.6">
      <polyline points="80,160 160,100 240,140 320,80"/>
      <polyline points="290,80 320,80 320,110"/>
      <polyline points="1000,1840 920,1780 840,1820 760,1760"/>
      <polyline points="790,1760 760,1760 760,1790"/>
    </g>
    """

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
      {bg}
      {corner}
      {eyebrow_svg}
      {big_svg}
      {small_svg}
      {brand_svg}
    </svg>'''
    path = os.path.join(FRAMES_DIR, filename)
    cairosvg.svg2png(bytestring=svg.encode("utf-8"), write_to=path,
                     output_width=W, output_height=H)
    return (path, duration)

scenes = [
    scene("01-welcome.png", 3.0, "WELCOME TO", small="Trendiest", eyebrow="▲ NEW CHANNEL", brand=True),
    scene("02-three.png", 4.0, "3 THINGS", small="you'll get here", brand=True),
    scene("03-predictions.png", 6.0, "1. PREDICTIONS", small="trends before they pop", brand=True),
    scene("04-autopsies.png", 6.0, "2. AUTOPSIES", small="why viral hits actually work", brand=True),
    scene("05-picks.png", 6.0, "3. EARLY PICKS", small="creators on the way up", brand=True),
    scene("06-cta.png", 5.0, "HIT FOLLOW.", small="New short every day.", eyebrow="▲ TRENDIEST", brand=False),
]

# Build ffmpeg concat list
concat_path = os.path.join(FRAMES_DIR, "list.txt")
with open(concat_path, "w") as f:
    for path, dur in scenes:
        f.write(f"file '{os.path.abspath(path)}'\n")
        f.write(f"duration {dur}\n")
    # Concat demuxer requires the last file to be repeated without a duration
    f.write(f"file '{os.path.abspath(scenes[-1][0])}'\n")

out_mp4 = os.path.join(OUT_DIR, "trendiest-channel-trailer.mp4")
cmd = [
    FFMPEG, "-y",
    "-f", "concat", "-safe", "0", "-i", concat_path,
    "-vsync", "vfr",
    "-pix_fmt", "yuv420p",
    "-vf", f"scale={W}:{H},fps=30",
    "-c:v", "libx264",
    "-crf", "20",
    "-preset", "medium",
    "-movflags", "+faststart",
    out_mp4,
]
print("Running ffmpeg…")
subprocess.run(cmd, check=True)
print(f"Wrote {out_mp4}")
