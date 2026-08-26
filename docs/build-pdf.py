#!/usr/bin/env python3
"""Injeta os SVGs dos diagramas no template arc42 e gera o HTML pronto para impressao."""
import pathlib, re, subprocess, sys

BASE = pathlib.Path(__file__).parent
DIAG = BASE / "diagramas"

LEGENDAS = {
  "c4-n1-contexto":        ("Figura 1",  "C4 Model — Nível 1 (Contexto). Fronteira do sistema, atores e sistemas externos."),
  "c4-n2-conteineres":     ("Figura 2",  "C4 Model — Nível 2 (Contêineres). Unidades executáveis e implantáveis do Veterano. e como se comunicam."),
  "c4-n3-componentes-api": ("Figura 3",  "C4 Model — Nível 3 (Componentes). Decomposição interna do contêiner “API de Mentoria”."),
  "c4-n4-classes":         ("Figura 4",  "C4 Model — Nível 4 (Código). Diagrama de classes UML do domínio da sessão de mentoria."),
  "c4-n4-componentes":     ("Figura 5",  "C4 Model — Nível 4 (Código). Diagrama de componentes UML, com interfaces providas e requeridas."),
  "c4-n4-sequencia":       ("Figura 6",  "C4 Model — Nível 4 (Código). Diagrama de sequência UML: solicitação e aceite de uma sessão (RF6 e RF7)."),
  "estados-sessao":        ("Figura 7",  "Diagrama de máquina de estados UML da entidade Sessão."),
  "implantacao":           ("Figura 8",  "Diagrama de implantação UML: nós de execução em Azure e artefatos publicados."),
  "der":                   ("Figura 9",  "Diagrama de Entidades e Relacionamentos (DER) do modelo persistido."),
  "qualidade":             ("Figura 10", "Árvore de requisitos de qualidade (arc42, seção 10)."),
}

LARGURA_UTIL_MM = 178   # A4 (210mm) menos as margens laterais de 16mm
ALTURA_UTIL_MM = 196    # sobra espaco para o titulo da secao na mesma pagina

# Diagramas mais largos que altos ficam ilegiveis espremidos na largura do retrato:
# vao para uma pagina em paisagem, que oferece 269mm uteis em vez de 178mm.
PROPORCAO_PAISAGEM = 1.2
LARGURA_PAISAGEM_MM = 269
ALTURA_PAISAGEM_MM = 168


def carregar_svg(nome: str) -> tuple[str, float]:
    """Devolve o SVG pronto para embutir e a proporcao largura/altura do desenho."""
    svg = (DIAG / f"{nome}.svg").read_text(encoding="utf-8")
    svg = svg[svg.index("<svg"):]                       # descarta o preambulo XML
    svg = re.sub(r'\swidth="[^"]*"', "", svg, count=1)   # deixa o CSS controlar o tamanho
    svg = re.sub(r'\sheight="[^"]*"', "", svg, count=1)
    svg = svg.replace("<svg", '<svg preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%"', 1)

    caixa = re.search(r'viewBox="([\d.\- ]+)"', svg)
    if not caixa:
        return svg, 1.0
    _, _, largura, altura = (float(v) for v in caixa.group(1).split())
    return svg, largura / altura


def montar_figura(nome: str) -> str:
    """Dimensiona cada diagrama para ocupar o maximo da pagina sem distorcer."""
    numero, texto = LEGENDAS[nome]
    svg, proporcao = carregar_svg(nome)

    if proporcao >= PROPORCAO_PAISAGEM:
        classe = ' class="paisagem"'
        altura_mm = min(ALTURA_PAISAGEM_MM, LARGURA_PAISAGEM_MM / proporcao)
    else:
        classe = ""
        altura_mm = min(ALTURA_UTIL_MM, LARGURA_UTIL_MM / proporcao)

    return (
        f'<figure{classe}><div style="height:{altura_mm:.0f}mm">{svg}</div>'
        f'<figcaption><strong>{numero}.</strong> {texto}</figcaption></figure>'
    )


def main() -> int:
    html = (BASE / "arc42.template.html").read_text(encoding="utf-8")
    faltando = [n for n in re.findall(r"\{\{DIAGRAMA:([\w-]+)\}\}", html) if n not in LEGENDAS]
    if faltando:
        print(f"legenda ausente para: {faltando}", file=sys.stderr)
        return 1
    html = re.sub(r"\{\{DIAGRAMA:([\w-]+)\}\}", lambda m: montar_figura(m.group(1)), html)

    saida_html = BASE / "arc42-veterano.html"
    saida_html.write_text(html, encoding="utf-8")

    pdf = BASE / "Arquitetura-Veterano-arc42.pdf"
    subprocess.run([
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "--headless", "--disable-gpu", "--no-pdf-header-footer",
        f"--print-to-pdf={pdf}", "--virtual-time-budget=15000",
        saida_html.as_uri(),
    ], check=True, capture_output=True)
    print(f"gerado: {pdf} ({pdf.stat().st_size // 1024} KB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
