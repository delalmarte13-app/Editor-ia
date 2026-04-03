/**
 * Generador de DOCX profesional para la Editorial de Élite
 * Convierte HTML del editor TipTap a DOCX compatible con Microsoft Word
 */
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, ShadingType,
  Header, Footer, PageNumber, NumberFormat,
} from "docx";

interface TextLine {
  type: "heading1" | "heading2" | "heading3" | "paragraph" | "quote" | "empty" | "bullet";
  text: string;
  bold?: boolean;
  italic?: boolean;
}

function stripTags(html: string): string {
  return html
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "$1")
    .replace(/<em[^>]*>(.*?)<\/em>/gi, "$1")
    .replace(/<u[^>]*>(.*?)<\/u>/gi, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function parseHtmlToLines(html: string): TextLine[] {
  const lines: TextLine[] = [];

  let processed = html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, (_, t) => `\n[H1]${stripTags(t)}\n`)
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, (_, t) => `\n[H2]${stripTags(t)}\n`)
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, (_, t) => `\n[H3]${stripTags(t)}\n`)
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, (_, t) => `\n[QUOTE]${stripTags(t)}\n`)
    .replace(/<li[^>]*>(.*?)<\/li>/gi, (_, t) => `\n[BULLET]${stripTags(t)}\n`)
    .replace(/<p[^>]*>(.*?)<\/p>/gi, (_, t) => `\n[P]${stripTags(t)}\n`)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "");

  const rawLines = processed.split("\n").map(l => l.trim()).filter(l => l);

  for (const line of rawLines) {
    if (line.startsWith("[H1]")) lines.push({ type: "heading1", text: line.slice(4) });
    else if (line.startsWith("[H2]")) lines.push({ type: "heading2", text: line.slice(4) });
    else if (line.startsWith("[H3]")) lines.push({ type: "heading3", text: line.slice(4) });
    else if (line.startsWith("[QUOTE]")) lines.push({ type: "quote", text: line.slice(7) });
    else if (line.startsWith("[BULLET]")) lines.push({ type: "bullet", text: line.slice(8) });
    else if (line.startsWith("[P]")) {
      const text = line.slice(3);
      if (text.trim()) lines.push({ type: "paragraph", text });
      else lines.push({ type: "empty", text: "" });
    } else if (line.trim()) {
      lines.push({ type: "paragraph", text: line });
    }
  }

  return lines;
}

function buildDocxParagraph(line: TextLine): Paragraph {
  switch (line.type) {
    case "heading1":
      return new Paragraph({
        text: line.text,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      });

    case "heading2":
      return new Paragraph({
        text: line.text,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 },
      });

    case "heading3":
      return new Paragraph({
        text: line.text,
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 100 },
      });

    case "quote":
      return new Paragraph({
        children: [
          new TextRun({
            text: `"${line.text}"`,
            italics: true,
            size: 22,
            color: "555555",
          }),
        ],
        indent: { left: 720 },
        spacing: { before: 200, after: 200 },
        border: {
          left: {
            color: "C9A84C",
            size: 6,
            style: BorderStyle.SINGLE,
            space: 10,
          },
        },
      });

    case "bullet":
      return new Paragraph({
        children: [new TextRun({ text: line.text, size: 24 })],
        bullet: { level: 0 },
        spacing: { before: 60, after: 60 },
      });

    case "empty":
      return new Paragraph({
        children: [new TextRun({ text: "" })],
        spacing: { before: 100, after: 100 },
      });

    case "paragraph":
    default:
      return new Paragraph({
        children: [
          new TextRun({
            text: line.text,
            size: 24,
            font: "Garamond",
          }),
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { before: 0, after: 160, line: 360 },
        indent: { firstLine: 720 },
      });
  }
}

export async function generateDOCX(title: string, htmlContent: string): Promise<Buffer> {
  const lines = parseHtmlToLines(htmlContent);

  const titleParagraph = new Paragraph({
    children: [
      new TextRun({
        text: title,
        bold: true,
        size: 52,
        font: "Garamond",
        color: "1A1A2E",
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 600 },
  });

  const separatorParagraph = new Paragraph({
    children: [new TextRun({ text: "─────────────────────────────────────", color: "C9A84C" })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 600 },
  });

  const contentParagraphs = lines.map(buildDocxParagraph);

  const doc = new Document({
    creator: "Editorial de Élite — Editor IA",
    title,
    description: `Documento generado por Editorial de Élite`,
    styles: {
      default: {
        document: {
          run: {
            font: "Garamond",
            size: 24,
            color: "1A1A2E",
          },
          paragraph: {
            spacing: { line: 360 },
          },
        },
      },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          run: { bold: true, size: 40, color: "1A1A2E", font: "Garamond" },
          paragraph: { spacing: { before: 400, after: 200 } },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          run: { bold: true, size: 32, color: "2C2C54", font: "Garamond" },
          paragraph: { spacing: { before: 300, after: 150 } },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Editorial de Élite — ${title}`,
                    size: 18,
                    color: "888888",
                    italics: true,
                  }),
                ],
                alignment: AlignmentType.RIGHT,
                border: {
                  bottom: { color: "C9A84C", size: 3, style: BorderStyle.SINGLE, space: 4 },
                },
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "Página ", size: 18, color: "888888" }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 18,
                    color: "888888",
                  }),
                  new TextRun({ text: " de ", size: 18, color: "888888" }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 18,
                    color: "888888",
                  }),
                ],
                alignment: AlignmentType.CENTER,
                border: {
                  top: { color: "DDDDDD", size: 3, style: BorderStyle.SINGLE, space: 4 },
                },
              }),
            ],
          }),
        },
        children: [titleParagraph, separatorParagraph, ...contentParagraphs],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}
