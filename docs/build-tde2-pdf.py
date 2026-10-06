#!/usr/bin/env python3
"""Gera o PDF do TDE 2 a partir da documentacao e diagramas versionados."""

from pathlib import Path
import re
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Flowable,
    Frame,
    Image,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    NextPageTemplate,
)


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
DIAGRAMS = DOCS / "diagramas"
OUTPUT = ROOT / "output" / "pdf" / "TDE2-Vertical-Slice-Clean-Architecture-SOLID.pdf"

NAVY = colors.HexColor("#16233A")
LIME = colors.HexColor("#D9F24A")
BLUE = colors.HexColor("#40577F")
PALE = colors.HexColor("#F1F4F8")
PALE_YELLOW = colors.HexColor("#FAF8E9")
TEXT = colors.HexColor("#18243A")
MUTED = colors.HexColor("#5B6676")
GRID = colors.HexColor("#D5DCE6")
WHITE = colors.white


def register_fonts():
    regular_candidates = [
        Path("/System/Library/Fonts/Supplemental/Arial.ttf"),
        Path("/Library/Fonts/Arial.ttf"),
        Path("/usr/share/fonts/truetype/msttcorefonts/Arial.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
    ]
    bold_candidates = [
        Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf"),
        Path("/Library/Fonts/Arial Bold.ttf"),
        Path("/usr/share/fonts/truetype/msttcorefonts/Arial_Bold.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
    ]
    regular = next((path for path in regular_candidates if path.exists()), None)
    bold = next((path for path in bold_candidates if path.exists()), None)
    if regular and bold:
        pdfmetrics.registerFont(TTFont("Entrega", str(regular)))
        pdfmetrics.registerFont(TTFont("Entrega-Bold", str(bold)))
        return "Entrega", "Entrega-Bold"
    return "Helvetica", "Helvetica-Bold"


FONT, FONT_BOLD = register_fonts()

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="TitleCustom", parent=styles["Title"], fontName=FONT_BOLD,
    fontSize=23, leading=28, textColor=NAVY, alignment=TA_LEFT, spaceAfter=10,
))
styles.add(ParagraphStyle(
    name="Section", parent=styles["Heading1"], fontName=FONT_BOLD,
    fontSize=17, leading=21, textColor=NAVY, spaceBefore=2, spaceAfter=10,
))
styles.add(ParagraphStyle(
    name="Subsection", parent=styles["Heading2"], fontName=FONT_BOLD,
    fontSize=11.5, leading=15, textColor=BLUE, spaceBefore=8, spaceAfter=5,
))
styles.add(ParagraphStyle(
    name="BodyCustom", parent=styles["BodyText"], fontName=FONT,
    fontSize=9.4, leading=13.5, textColor=TEXT, spaceAfter=6,
))
styles.add(ParagraphStyle(
    name="SmallCustom", parent=styles["BodyText"], fontName=FONT,
    fontSize=8.2, leading=11, textColor=TEXT, spaceAfter=3,
))
styles.add(ParagraphStyle(
    name="TableCustom", parent=styles["BodyText"], fontName=FONT,
    fontSize=7.7, leading=10, textColor=TEXT,
))
styles.add(ParagraphStyle(
    name="TableHeadCustom", parent=styles["BodyText"], fontName=FONT_BOLD,
    fontSize=8, leading=10, textColor=WHITE,
))
styles.add(ParagraphStyle(
    name="PromptCustom", parent=styles["BodyText"], fontName=FONT,
    fontSize=8.6, leading=12.2, textColor=TEXT, borderColor=GRID,
    borderWidth=0.7, borderPadding=8, backColor=PALE, spaceAfter=8,
))
styles.add(ParagraphStyle(
    name="CoverKicker", parent=styles["BodyText"], fontName=FONT_BOLD,
    fontSize=11, leading=15, textColor=LIME, spaceAfter=20,
))
styles.add(ParagraphStyle(
    name="CoverTitle", parent=styles["BodyText"], fontName=FONT_BOLD,
    fontSize=29, leading=35, textColor=WHITE, spaceAfter=13,
))
styles.add(ParagraphStyle(
    name="CoverSubtitle", parent=styles["BodyText"], fontName=FONT,
    fontSize=13, leading=19, textColor=colors.HexColor("#DEE5EF"), spaceAfter=28,
))
styles.add(ParagraphStyle(
    name="CoverMeta", parent=styles["BodyText"], fontName=FONT,
    fontSize=9.5, leading=15, textColor=WHITE,
))
styles.add(ParagraphStyle(
    name="DiagramCaption", parent=styles["BodyText"], fontName=FONT,
    fontSize=8.5, leading=12, textColor=MUTED, alignment=TA_CENTER, spaceBefore=6,
))


def p(text, style="BodyCustom"):
    return Paragraph(text, styles[style])


def cell(text, header=False):
    return Paragraph(escape(str(text)), styles["TableHeadCustom" if header else "TableCustom"])


def make_table(rows, widths, header=True):
    data = [[cell(value, header and index == 0) for value in row] for index, row in enumerate(rows)]
    table = Table(data, colWidths=widths, repeatRows=1 if header else 0, hAlign="LEFT")
    commands = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("GRID", (0, 0), (-1, -1), 0.45, GRID),
    ]
    if header:
        commands.append(("BACKGROUND", (0, 0), (-1, 0), NAVY))
        for row_index in range(1, len(rows)):
            if row_index % 2 == 0:
                commands.append(("BACKGROUND", (0, row_index), (-1, row_index), PALE))
    table.setStyle(TableStyle(commands))
    return table


class Cover(Flowable):
    def wrap(self, avail_width, avail_height):
        self.width = avail_width
        self.height = avail_height
        return self.width, self.height

    def draw(self):
        canvas = self.canv
        canvas.setFillColor(LIME)
        canvas.roundRect(0, self.height - 12, 46, 5, 2, stroke=0, fill=1)
        y = self.height - 94
        for text, style_name in [
            ("PUCPR  |  ARQUITETURA E SOLUÇÕES EM CLOUD", "CoverKicker"),
            ("TDE 2<br/>Arquitetura do backend", "CoverTitle"),
            ("VERTICAL SLICE  ·  CLEAN ARCHITECTURE  ·  SOLID", "CoverSubtitle"),
        ]:
            paragraph = p(text, style_name)
            _, height = paragraph.wrap(self.width - 20, self.height)
            paragraph.drawOn(canvas, 0, y - height)
            y -= height + 12

        canvas.setStrokeColor(colors.HexColor("#53617A"))
        canvas.line(0, y - 8, self.width, y - 8)
        y -= 48
        metadata = [
            "Projeto: Veterano. - Plataforma de Mentoria entre Veteranos e Calouros",
            "Repositório: github.com/ViniMTrevisan/pjbl-mentoria-cloud",
            "Branch: tde2-vertical-slice-clean-architecture",
            "Grupo cadastrado: Bento Barp, Guilherme Reis, Guilherme Selenko e Vinicius Trevisan",
            "Data: 05 de outubro de 2026",
        ]
        for line in metadata:
            paragraph = p(escape(line), "CoverMeta")
            _, height = paragraph.wrap(self.width - 20, self.height)
            paragraph.drawOn(canvas, 0, y - height)
            y -= height + 7

        canvas.setFillColor(colors.HexColor("#BFCADA"))
        canvas.setFont(FONT, 8.3)
        canvas.drawString(0, 25, "Entrega assistida por IA generativa | contribuições individuais propostas para validação")


def paint_page(canvas, doc):
    page_width, page_height = canvas._pagesize
    if doc.page == 1:
        canvas.saveState()
        canvas.setFillColor(NAVY)
        canvas.rect(0, 0, page_width, page_height, fill=1, stroke=0)
        canvas.restoreState()
        return

    canvas.saveState()
    canvas.setStrokeColor(LIME)
    canvas.setLineWidth(3)
    canvas.line(doc.leftMargin, page_height - 34, page_width - doc.rightMargin, page_height - 34)
    canvas.setFont(FONT_BOLD, 7.5)
    canvas.setFillColor(NAVY)
    canvas.drawString(doc.leftMargin, page_height - 25, "PUCPR  |  TDE 2  |  BACKEND")
    canvas.setFont(FONT, 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(doc.leftMargin, 24, "Veterano. - Vertical Slice, Clean Architecture e SOLID")
    canvas.drawRightString(page_width - doc.rightMargin, 24, f"Página {doc.page}")
    canvas.restoreState()


def load_prompts():
    source = (DOCS / "TDE2-PROMPTS.md").read_text(encoding="utf-8")
    pattern = re.compile(r"^## (Prompt \d+ - .+?)\n\n```text\n(.*?)\n```", re.M | re.S)
    prompts = pattern.findall(source)
    if len(prompts) != 4:
        raise ValueError(f"Esperados 4 prompts no Markdown; encontrados {len(prompts)}")
    return prompts


def prompt_card(title, text):
    body = escape(text).replace("\n", "<br/>")
    return KeepTogether([
        Spacer(1, 8),
        p(escape(title), "Subsection"),
        Paragraph(body, styles["PromptCustom"]),
    ])


def main():
    portrait_width, portrait_height = A4
    landscape_width, landscape_height = landscape(A4)
    margin = 48
    portrait_frame = Frame(margin, 47, portrait_width - 2 * margin, portrait_height - 94,
                           id="portrait", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    landscape_frame = Frame(40, 44, landscape_width - 80, landscape_height - 88,
                            id="landscape", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)

    doc = BaseDocTemplate(str(OUTPUT), pagesize=A4, title="TDE 2 - Vertical Slice, Clean Architecture e SOLID",
                          author="Grupo Veterano. - PUCPR", leftMargin=margin, rightMargin=margin,
                          topMargin=48, bottomMargin=48)
    doc.addPageTemplates([
        PageTemplate(id="Portrait", pagesize=A4, frames=[portrait_frame], onPage=paint_page),
        PageTemplate(id="Landscape", pagesize=landscape(A4), frames=[landscape_frame], onPage=paint_page),
    ])

    story = [Cover(), PageBreak()]

    story.extend([
        p("1. Arquitetura e escopo", "Section"),
        p("A aplicação foi reorganizada por caso de uso, preservando as rotas e as fontes de dados atuais. O frontend continua consumindo Azure Functions; o catálogo de mentores e as sessões permanecem mock, enquanto o CRUD de mentores continua no MongoDB Atlas."),
        p("Direção das dependências", "Subsection"),
        p("<b>Azure Functions -> fatia de aplicação -> domínio/porta -> adaptador.</b> A composição ocorre na borda em <font name='Courier'>functions/dependencies.js</font>. Regras de negócio não importam o SDK Azure nem o driver MongoDB."),
        make_table([
            ["Área", "Local", "Responsabilidade"],
            ["Domínio", "api/src/domain/mentor.js", "Validação, reputação e normalização."],
            ["Fatias", "api/src/features/", "Um módulo por operação de mentores e sessões."],
            ["Porta", "api/src/ports/MentorRepository.js", "Contrato estrutural das operações de persistência."],
            ["Adaptadores", "api/src/infrastructure/", "Catálogo mock, repositório Mongo e conexão reutilizável."],
            ["Entrada", "api/src/functions/", "Bindings HTTP, parsing, composição e resposta JSON."],
        ], [75, 190, 235]),
        Spacer(1, 10),
        p("Rotas preservadas", "Subsection"),
        make_table([
            ["Rota", "Fatia", "Fonte"],
            ["GET /api/mentores", "listarMentoresPublicos", "Mock"],
            ["GET /api/mentores/{id}", "obterMentorPublico", "Mock"],
            ["GET /api/sessoes?status=", "listarSessoes", "Mock"],
            ["GET /api/health", "health check", "Azure Functions"],
            ["POST /api/mentores-db", "criarMentor", "MongoDB"],
            ["GET /api/mentores-db?q=&id=", "pesquisarMentores", "MongoDB"],
            ["PUT|PATCH /api/mentores-db/{id}", "alterarMentor", "MongoDB"],
            ["DELETE /api/mentores-db/{id}", "excluirMentor", "MongoDB"],
        ], [195, 190, 115]),
        PageBreak(),
        p("2. Aplicação de SOLID", "Section"),
        make_table([
            ["Princípio", "Aplicação no backend"],
            ["S - Responsabilidade única", "Handler trata HTTP; cada fatia coordena uma operação; domínio concentra regra; MongoRepository persiste."],
            ["O - Aberto/fechado", "As fatias recebem dependências por contrato e permitem conectar outro adaptador sem reescrever o handler."],
            ["L - Substituição de Liskov", "Um repositório pode substituir outro ao cumprir os métodos e resultados da porta MentorRepository."],
            ["I - Segregação de interfaces", "Catálogo mock atende leituras públicas; o contrato do repositório cobre apenas o CRUD Mongo."],
            ["D - Inversão de dependência", "Casos de uso dependem de portas e recebem adaptadores concretos montados na borda."],
        ], [140, 360]),
        Spacer(1, 12),
        p("Validações e falhas preservadas", "Subsection"),
        p("Corpo ausente ou inválido, campos obrigatórios e período fora de 1-12 retornam 400. Update vazio também retorna 400; ID inexistente retorna 404. A busca continua escapando metacaracteres de regex e limita a 100 registros. A alteração persiste por operação atômica <font name='Courier'>$set</font>. Erros técnicos são registrados no servidor e a resposta 500 não expõe detalhes do driver."),
        p("Não foram alterados autenticação, frontend, configuração Azure ou serviços publicados. O nível <font name='Courier'>anonymous</font> existente e o comportamento de sessões com datas ISO foram mantidos."),
        p("Alunos e contribuições propostas", "Subsection"),
        p("O repositório registra quatro integrantes, mas não registra a divisão individual desta etapa. Esta proposta deve ser validada pelo grupo antes de ser apresentada como contribuição realizada."),
        make_table([
            ["Aluno", "Participação sugerida para validação"],
            ["Bento Barp", "Revisar regras de mentores/sessões e contratos HTTP preservados."],
            ["Guilherme Reis", "Revisar CRUD, porta de repositório e persistência MongoDB."],
            ["Guilherme Selenko", "Revisar diagramas e aplicação de Clean Architecture, Vertical Slice e SOLID."],
            ["Vinicius Trevisan", "Integrar a mudança à branch e consolidar documentação e entrega."],
        ], [135, 365]),
        Spacer(1, 7),
        p("A implementação foi assistida por IA generativa; a tabela não comprova participação individual sem validação dos alunos.", "SmallCustom"),
        NextPageTemplate("Landscape"), PageBreak(),
        p("3. Diagrama de classes e módulos", "Section"),
    ])

    class_image = Image(str(DIAGRAMS / "tde2-backend-classes.png"))
    class_image._restrictSize(750, 430)
    story.extend([
        class_image,
        p("Figura 1. Entidade por estrutura, regras puras, contrato do repositório e módulos que coordenam as fatias. Em JavaScript, esses elementos são funções e objetos; o diagrama expressa o modelo UML conceitual.", "DiagramCaption"),
        NextPageTemplate("Landscape"), PageBreak(),
        p("4. Diagrama de componentes do backend", "Section"),
    ])
    component_image = Image(str(DIAGRAMS / "tde2-backend-componentes.png"))
    component_image._restrictSize(750, 430)
    story.extend([
        component_image,
        p("Figura 2. Azure Functions encaminha requisições às fatias; catálogo mock e repositório Mongo são adaptadores de saída distintos.", "DiagramCaption"),
        NextPageTemplate("Portrait"), PageBreak(),
        p("5. Prompts utilizados", "Section"),
        p("A lista completa inclui o pedido base do aluno e os prompts técnicos gerados para orientar a refatoração, os diagramas, a documentação e a revisão final."),
    ])

    prompts = load_prompts()
    story.extend([prompt_card(*prompts[0]), prompt_card(*prompts[1]), PageBreak()])
    story.extend([
        p("5. Prompts utilizados (continuação)", "Section"),
        prompt_card(*prompts[2]), prompt_card(*prompts[3]),
        Spacer(1, 8),
        p("GitHub", "Subsection"),
        p('<link href="https://github.com/ViniMTrevisan/pjbl-mentoria-cloud/tree/tde2-vertical-slice-clean-architecture" color="#40577F">github.com/ViniMTrevisan/pjbl-mentoria-cloud/tree/tde2-vertical-slice-clean-architecture</link>', "SmallCustom"),
        p("Verificação", "Subsection"),
        p("Os arquivos JavaScript passaram por verificação sintática com <font name='Courier'>node --check</font>. Os diagramas foram renderizados em SVG e PNG e inspecionados. O PDF foi renderizado em imagens para conferência de layout. Não houve validação de integração contra MongoDB, Azure ou ambiente publicado.", "SmallCustom"),
    ])

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc.build(story)
    print(f"PDF gerado: {OUTPUT} ({OUTPUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
