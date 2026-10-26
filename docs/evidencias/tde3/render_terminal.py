#!/usr/bin/env python3
"""Renderiza a saída real do terminal (arquivos .txt) em PNG estilo iTerm/VS Code."""
import html
import pathlib
import re
import subprocess
import sys

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
SAIDA = pathlib.Path(__file__).parent / "prints"

FONT_PX = 13
LINE_PX = 21
PAD = 22
TITLEBAR = 34
LARGURA = 1180

VERDE = "#3ddc84"
VERMELHO = "#ff5f56"
AMARELO = "#e5c07b"
CINZA = "#7c7c88"
AZUL = "#61afef"

CSS = """*{box-sizing:border-box}html,body{margin:0;background:#16161a}
.janela{background:#1b1b20;border-radius:10px;overflow:hidden;font-family:"SF Mono",Menlo,Monaco,monospace}
.barra{height:%(titlebar)dpx;background:#26262c;display:flex;align-items:center;gap:8px;padding:0 14px;border-bottom:1px solid #30303a}
.bolinha{width:12px;height:12px;border-radius:50%%}
.titulo{margin-left:10px;color:#9a9aa5;font-size:12px;letter-spacing:.2px}
pre{margin:0;padding:%(pad)dpx 24px;font-size:%(font)dpx;line-height:%(line)dpx;color:#d7d7de;white-space:pre-wrap;word-break:break-word}
.v{color:%(verde)s}.r{color:%(vermelho)s}.y{color:%(amarelo)s}.c{color:%(cinza)s}.b{color:%(azul)s;font-weight:bold}
.forte{color:#ffffff;font-weight:bold}
"""


def colorir(linha: str) -> str:
    esc = html.escape(linha) or "&nbsp;"
    if re.search(r"✓", linha):
        return f'<span class="v">{esc}</span>'
    if re.search(r"×|FAIL|failed", linha):
        return f'<span class="r">{esc}</span>'
    if re.search(r"^\s*(Test Files|Tests|Duration|Start at)\s", linha):
        return f'<span class="forte">{esc}</span>'
    if re.search(r"^ RUN |^ *\$ |^> ", linha):
        return f'<span class="c">{esc}</span>'
    if re.search(r"^ *npm (test|run)", linha):
        return f'<span class="b">{esc}</span>'
    if re.search(r"warn|deprecated|Deprecation", linha, re.IGNORECASE):
        return f'<span class="y">{esc}</span>'
    return esc


def render(txt: pathlib.Path, comando: str, projeto: str) -> pathlib.Path:
    linhas = txt.read_text().splitlines()
    # tira banners repetitivos do npm para caber melhor na imagem
    linhas = [
        l
        for l in linhas
        if not re.match(r"^> \S+@\S+ (test|test:arch)$", l)
        and "CJS build of Vite" not in l
    ]
    while linhas and not linhas[0].strip():
        linhas.pop(0)
    corpo = [f"~/pjbl-mentoria-cloud $ {comando}", ""] + linhas

    # pre com quebra de linha: estima as linhas visuais para não cortar o rodapé
    por_linha = int((LARGURA - 48) / 7.85)
    visuais = sum(max(1, -(-len(l) // por_linha)) for l in corpo)
    altura_conteudo = PAD * 2 + LINE_PX * visuais + 8
    altura = TITLEBAR + altura_conteudo

    corpo_html = "\n".join(colorir(l) for l in corpo)
    html_doc = f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<style>{CSS % dict(titlebar=TITLEBAR, pad=PAD, font=FONT_PX, line=LINE_PX, verde=VERDE, vermelho=VERMELHO, amarelo=AMARELO, cinza=CINZA, azul=AZUL)}</style>
</head><body><div class="janela">
<div class="barra">
  <span class="bolinha" style="background:#ff5f56"></span>
  <span class="bolinha" style="background:#ffbd2e"></span>
  <span class="bolinha" style="background:#27c93f"></span>
  <span class="titulo">{html.escape(projeto)} — bash — {html.escape(comando)}</span>
</div>
<pre>{corpo_html}</pre>
</div></body></html>"""

    html_path = txt.with_suffix(".html")
    html_path.write_text(html_doc)
    png = txt.with_suffix(".png")
    subprocess.run(
        [
            CHROME,
            "--headless=new",
            "--disable-gpu",
            "--hide-scrollbars",
            "--force-device-scale-factor=2",
            f"--window-size={LARGURA},{altura}",
            f"--screenshot={png}",
            html_path.as_uri(),
        ],
        check=True,
        capture_output=True,
    )
    html_path.unlink()
    print(f"{png.name}  ({LARGURA}x{altura})")
    return png


if __name__ == "__main__":
    alvos = [
        ("test-mentores-service.txt", "npm test", "mentores-service"),
        ("test-sessoes-service.txt", "npm test", "sessoes-service"),
        ("test-bff.txt", "npm test", "bff"),
        ("test-azure-function.txt", "npm test", "azure-function"),
        ("arch-mentores-service.txt", "npm run test:arch -- --reporter=verbose", "mentores-service"),
        ("arch-bff.txt", "npm run test:arch -- --reporter=verbose", "bff"),
    ]
    for nome, comando, projeto in alvos:
        caminho = SAIDA / nome
        if not caminho.exists():
            sys.exit(f"faltando {caminho}")
        render(caminho, comando, projeto)
