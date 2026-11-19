import os
import urllib.request
from fontTools import subset

SRC_DIR = '.cache/fonts'
OUT_DIR = 'public/fonts'
SOURCES = {
    'Regular': 'https://raw.githubusercontent.com/notofonts/noto-cjk/main/Serif/OTF/SimplifiedChinese/NotoSerifCJKsc-Regular.otf',
    'SemiBold': 'https://raw.githubusercontent.com/notofonts/noto-cjk/main/Serif/OTF/SimplifiedChinese/NotoSerifCJKsc-SemiBold.otf',
}


def gb2312_chars():
    chars = set()
    for hi in range(0xB0, 0xF8):
        for lo in range(0xA1, 0xFF):
            try:
                chars.add(bytes([hi, lo]).decode('gb2312'))
            except UnicodeDecodeError:
                pass
    chars.update('，。；：？！、“”‘’（）《》〈〉【】—…·「」『』％＃＠＆＊＋－／＝＜＞±×÷≈≠≤≥∞√∫∑∏∂∆∈∉⊂⊃∪∩→←↔⇒⇔∀∃∠⊥∥°′″')
    return chars


def download(url, dest):
    print(f'downloading {url}')
    req = urllib.request.Request(url, headers={'User-Agent': 'gezhi-font-subset/1.0'})
    with urllib.request.urlopen(req, timeout=600) as resp, open(dest, 'wb') as out:
        while True:
            chunk = resp.read(1024 * 1024)
            if not chunk:
                break
            out.write(chunk)


def main():
    os.makedirs(SRC_DIR, exist_ok=True)
    os.makedirs(OUT_DIR, exist_ok=True)
    unicodes = set(range(0x20, 0x7F)) | set(range(0xA0, 0x100))
    unicodes |= set(range(0x2000, 0x2070)) | set(range(0x2200, 0x2300))
    unicodes |= set(range(0x3000, 0x3040)) | set(range(0xFF00, 0xFFF0))
    unicodes |= {ord(c) for c in gb2312_chars()}
    unicode_arg = ','.join(f'U+{u:04X}' for u in sorted(unicodes))
    for name, url in SOURCES.items():
        src = os.path.join(SRC_DIR, f'NotoSerifCJKsc-{name}.otf')
        if not os.path.exists(src):
            download(url, src)
        out = os.path.join(OUT_DIR, f'NotoSerifSC-{name}.woff2')
        subset.main([
            src,
            f'--unicodes={unicode_arg}',
            '--flavor=woff2',
            '--layout-features=*',
            f'--output-file={out}',
        ])
        print(out, os.path.getsize(out), 'bytes')


if __name__ == '__main__':
    main()
