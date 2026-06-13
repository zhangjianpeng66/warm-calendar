"""生成温暖日历 PWA 图标"""
from PIL import Image, ImageDraw, ImageFont
import os

SIZES = [192, 512]
COLORS = {'bg': '#f59e0b', 'fg': '#ffffff'}

for size in SIZES:
    img = Image.new('RGBA', (size, size), COLORS['bg'])
    draw = ImageDraw.Draw(img)
    # 画圆角矩形
    r = size // 6
    draw.rounded_rectangle([0, 0, size, size], radius=r, fill=COLORS['bg'])
    # 画文字
    font_size = size // 3
    try:
        font = ImageFont.truetype("C:/Windows/Fonts/msyh.ttc", font_size)
    except:
        font = ImageFont.load_default()
    text = "📅"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(((size - tw) // 2, (size - th) // 2), text, fill=COLORS['fg'], font=font)

    out = f'public/icon-{size}.png'
    img.save(out)
    print(f'OK {out} ({size}x{size})')

print('Icons generated!')
