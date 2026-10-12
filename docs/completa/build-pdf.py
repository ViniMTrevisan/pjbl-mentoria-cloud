#!/usr/bin/env python3
"""Renderiza os .mmd em SVG, injeta no template arc42 e gera o PDF da documentação completa.

Placeholder no template: {{DIAGRAMA:nome|legenda}}. As figuras são numeradas na ordem em que aparecem.
"""
import pathlib, re, subprocess, sys

BASE = pathlib.Path(__file__).parent
DIAG = BASE / "diagramas"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# Formatos possíveis para uma figura: (classe CSS, largura útil mm, altura útil mm, aceita proporção?)
# A figura vai para o menor formato em que o texto base (16 px no Mermaid) fica com pelo menos FONTE_MIN_PT.
FORMATOS = [
    ("", 178, 205, lambda r: True),                   # no fluxo do texto, A4 retrato
    ("paisagem", 269, 165, lambda r: r >= 1.0),       # página A4 paisagem
    ("a3retrato", 269, 370, lambda r: r < 1.0),       # página A3 retrato
    ("a3paisagem", 392, 250, lambda r: r >= 1.0),     # página A3 paisagem
]
FONTE_MIN_PT = 6.0


def renderizar_mermaid() -> None:
    for fonte in sorted(DIAG.glob("*.mmd")):
        svg = fonte.with_suffix(".svg")
        if svg.exists() and svg.stat().st_mtime >= fonte.stat().st_mtime:
            continue
        subprocess.run(["mmdc", "-q", "-p", str(DIAG / ".puppeteer.json"), "-i", str(fonte),
                        "-o", str(svg), "-b", "white"], check=True)
        print(f"renderizado: {svg.name}")


def carregar_svg(nome: str) -> tuple[str, float]:
    svg = (DIAG / f"{nome}.svg").read_text(encoding="utf-8")
    svg = svg[svg.index("<svg"):]
    svg = re.sub(r'\swidth="[^"]*"', "", svg, count=1)
    svg = re.sub(r'\sheight="[^"]*"', "", svg, count=1)
    svg = re.sub(r'(<svg[^>]*?)\sstyle="[^"]*"', r"\1", svg, count=1)
    svg = svg.replace("<svg", '<svg preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%"', 1)
    caixa = re.search(r'viewBox="([\d.\- ]+)"', svg)
    if not caixa:
        return svg, 1.0, 1000.0
    _, _, largura, altura = (float(v) for v in caixa.group(1).split())
    return svg, largura / altura, largura


def main() -> int:
    renderizar_mermaid()
    html = (BASE / "arc42.template.html").read_text(encoding="utf-8")
    contador = 0

    def figura(m: re.Match) -> str:
        nonlocal contador
        contador += 1
        nome, legenda = m.group(1), m.group(2)
        svg, proporcao, *larg_px = carregar_svg(nome)
        candidatos = [f for f in FORMATOS if f[3](proporcao)]
        for nome_classe, largura, altura_max, _ in candidatos:
            altura = min(altura_max, largura / proporcao)
            fonte_pt = 16 * (altura / larg_px[0] * proporcao) / 0.3528
            if fonte_pt >= FONTE_MIN_PT:
                break
        classe = f' class="{nome_classe}"' if nome_classe else ""
        print(f"  {nome}: {nome_classe or 'retrato'} ({fonte_pt:.1f} pt)")
        return (f'<figure{classe}><div style="height:{altura:.0f}mm">{svg}</div>'
                f'<figcaption><strong>Figura {contador}.</strong> {legenda}</figcaption></figure>')

    html = re.sub(r"\{\{DIAGRAMA:([\w-]+)\|([^}]+)\}\}", figura, html)
    if "{{" in html:
        print("placeholder sem legenda no template", file=sys.stderr)
        return 1

    saida = BASE / "arc42-veterano-completo.html"
    saida.write_text(html, encoding="utf-8")
    pdf = BASE.parent / "Arquitetura-Veterano-arc42-Completa.pdf"
    subprocess.run([CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer",
                    f"--print-to-pdf={pdf}", "--virtual-time-budget=20000", saida.as_uri()],
                   check=True, capture_output=True)
    print(f"gerado: {pdf} ({pdf.stat().st_size // 1024} KB, {contador} figuras)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
