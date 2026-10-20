#!/usr/bin/env python3
"""Gera o PDF da documentação arc42 da Entrega 3.

Pipeline: renderiza diagramas Mermaid em SVG, converte ARC42.md com pandoc,
troca os placeholders {{DIAGRAMA:nome|legenda}} pelas figuras e imprime com
Chrome headless.

Uso: python3 docs/entrega3/build-pdf.py
"""
from __future__ import annotations

import pathlib
import re
import subprocess
import sys

BASE = pathlib.Path(__file__).parent
DIAG = BASE / "diagramas"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"


def renderizar_mermaid() -> None:
    for fonte in sorted(DIAG.glob("*.mmd")):
        svg = fonte.with_suffix(".svg")
        if svg.exists() and svg.stat().st_mtime >= fonte.stat().st_mtime:
            continue
        subprocess.run(
            ["mmdc", "-q", "-p", str(DIAG / ".puppeteer.json"), "-i", str(fonte),
             "-o", str(svg), "-b", "white"],
            check=True,
        )
        print(f"diagrama: {svg.name}")


def carregar_svg(nome: str) -> str:
    svg = (DIAG / f"{nome}.svg").read_text(encoding="utf-8")
    svg = svg[svg.index("<svg"):]
    svg = re.sub(r'\swidth="[^"]*"', "", svg, count=1)
    svg = re.sub(r'\sheight="[^"]*"', "", svg, count=1)
    svg = re.sub(r'(<svg[^>]*?)\sstyle="[^"]*"', r"\1", svg, count=1)
    return svg.replace("<svg", '<svg preserveAspectRatio="xMidYMid meet"', 1)


def main() -> int:
    renderizar_mermaid()

    html = subprocess.run(
        [
            "pandoc", str(BASE / "ARC42.md"),
            "-f", "markdown+pipe_tables+fenced_code_blocks",
            "-t", "html5", "--standalone",
            "--metadata", "lang=pt-BR",
            "--css", "style.css",
            "--resource-path", str(BASE),
        ],
        check=True, capture_output=True, text=True,
    ).stdout

    contador = 0

    def figura(m: re.Match[str]) -> str:
        nonlocal contador
        contador += 1
        nome, legenda = m.group(1), m.group(2)
        svg = carregar_svg(nome)
        return (
            f'<figure class="diagrama">{svg}'
            f'<figcaption><strong>Figura {contador}.</strong> {legenda}</figcaption></figure>'
        )

    html, total = re.subn(r"<p>\{\{DIAGRAMA:([\w\-]+)\|([^}]+)\}\}</p>", figura, html)
    if total != contador:
        print("placeholders não resolvidos", file=sys.stderr)
        return 1

    html_path = BASE / "arc42-entrega3.html"
    html_path.write_text(html, encoding="utf-8")

    pdf = BASE / "Arquitetura-Veterano-Entrega3.pdf"
    subprocess.run(
        [CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer",
         f"--print-to-pdf={pdf}", "--virtual-time-budget=20000", html_path.as_uri()],
        check=True, capture_output=True,
    )
    print(f"gerado: {pdf} ({pdf.stat().st_size // 1024} KB, {contador} figuras)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
