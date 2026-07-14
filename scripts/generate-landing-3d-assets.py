from pathlib import Path
from PIL import Image, ImageDraw

WIDTH, HEIGHT = 1280, 800
OUT = Path(__file__).resolve().parents[1] / "public" / "assets" / "landing3d"
OUT.mkdir(parents=True, exist_ok=True)

image = Image.new("RGB", (WIDTH, HEIGHT), "#071329")
draw = ImageDraw.Draw(image, "RGBA")

for y in range(HEIGHT):
    shade = int(16 + (y / HEIGHT) * 12)
    draw.line((0, y, WIDTH, y), fill=(5, shade, 42, 255))

origin_x, horizon = 640, 500
for x in range(-720, 721, 80):
    draw.line((origin_x + x, horizon, origin_x + x * 2, HEIGHT), fill=(51, 112, 178, 72), width=2)
for row in range(9):
    y = horizon + int((row / 8) ** 1.55 * 300)
    draw.line((0, y, WIDTH, y), fill=(51, 112, 178, 66), width=2)

def iso_box(x, y, w, h, depth, color):
    top = [(x, y), (x + w, y - w * 0.28), (x + w + depth, y - w * 0.28 + depth * 0.45), (x + depth, y + depth * 0.45)]
    front = [(x + depth, y + depth * 0.45), (x + w + depth, y - w * 0.28 + depth * 0.45), (x + w + depth, y - w * 0.28 + h), (x + depth, y + h)]
    side = [(x, y), (x + depth, y + depth * 0.45), (x + depth, y + h), (x, y + h - depth * 0.45)]
    draw.polygon(front, fill=(*color, 230))
    draw.polygon(side, fill=(max(0, color[0] - 22), max(0, color[1] - 22), max(0, color[2] - 22), 230))
    draw.polygon(top, fill=(min(255, color[0] + 40), min(255, color[1] + 40), min(255, color[2] + 40), 235))
    draw.line(top + [top[0]], fill=(191, 230, 255, 110), width=2)

for idx, (height, color) in enumerate([(132, (45, 212, 191)), (210, (59, 130, 246)), (108, (245, 158, 11)), (174, (45, 212, 191))]):
    x = 128 + idx * 112
    draw.line((x + 34, 542 - height - 28, x + 34, 570), fill=(144, 220, 255, 180), width=5)
    iso_box(x, 542 - height, 58, height, 20, color)

panel = [(460, 170), (805, 100), (890, 158), (545, 230)]
draw.polygon(panel, fill=(86, 173, 236, 38), outline=(161, 222, 255, 135), width=3)
for idx, height in enumerate([56, 92, 126, 78]):
    iso_box(555 + idx * 66, 278 - height, 30, height, 10, (59, 130, 246) if idx != 2 else (245, 158, 11))

center = (944, 288)
for radius, color, width in [(132, (45, 212, 191, 115), 4), (165, (245, 158, 11, 95), 3), (94, (87, 177, 255, 160), 3)]:
    draw.ellipse((center[0] - radius, center[1] - radius * .55, center[0] + radius, center[1] + radius * .55), outline=color, width=width)
draw.ellipse((center[0] - 78, center[1] - 78, center[0] + 78, center[1] + 78), fill=(19, 91, 164, 150), outline=(144, 220, 255, 210), width=3)
for angle in range(-60, 61, 30):
    offset = int(angle * 0.8)
    draw.arc((center[0] - 70 + abs(offset) // 3, center[1] - 74, center[0] + 70 - abs(offset) // 3, center[1] + 74), 90, 270, fill=(160, 226, 255, 130), width=2)
draw.line((center[0] - 78, center[1], center[0] + 78, center[1]), fill=(160, 226, 255, 130), width=2)

iso_box(632, 424, 116, 142, 38, (39, 110, 203))
draw.ellipse((688, 465, 754, 531), outline=(245, 158, 11, 245), width=10)
draw.line((721, 486, 721, 511), fill=(245, 210, 98, 255), width=7)

path = [(172, 620), (350, 566), (520, 622), (710, 540), (902, 596), (1100, 492)]
draw.line(path, fill=(103, 232, 249, 220), width=5, joint="curve")
for x, y in path:
    draw.ellipse((x - 8, y - 8, x + 8, y + 8), fill=(245, 158, 11, 240), outline=(255, 235, 174, 220), width=2)

for idx in range(44):
    x = 44 + ((idx * 197) % 1190)
    y = 48 + ((idx * 83) % 560)
    r = 2 + idx % 3
    draw.ellipse((x - r, y - r, x + r, y + r), fill=(177, 235, 255, 80 + (idx % 4) * 24))

image.save(OUT / "stockpro-financial-research.png", optimize=True)
image.save(OUT / "stockpro-financial-research.webp", "WEBP", quality=78, method=6)
image.save(OUT / "stockpro-financial-research.avif", "AVIF", quality=56)
