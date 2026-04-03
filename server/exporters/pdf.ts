/**
 * Generador de PDF profesional para la Editorial de Élite
 * Convierte HTML del editor TipTap a PDF con formato literario
 */

export async function generatePDF(title: string, htmlContent: string): Promise<Buffer> {
  // Extraer texto plano del HTML manteniendo estructura
  const lines = parseHtmlToLines(htmlContent);

  // Generar PDF usando formato de texto estructurado
  const pdfContent = buildPDFContent(title, lines);

  // Usar PDFKit via dynamic import para generar el PDF
  const PDFDocument = await import("pdfkit").then(m => m.default).catch(() => null);

  if (PDFDocument) {
    return generateWithPDFKit(PDFDocument, title, lines);
  }

  // Fallback: generar PDF básico con estructura de bytes válida
  return generateSimplePDF(title, pdfContent);
}

interface TextLine {
  type: "title" | "heading1" | "heading2" | "heading3" | "paragraph" | "quote" | "empty";
  text: string;
}

function parseHtmlToLines(html: string): TextLine[] {
  const lines: TextLine[] = [];

  // Reemplazar etiquetas de bloque con marcadores
  let processed = html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, (_, t) => `\n[H1]${stripTags(t)}\n`)
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, (_, t) => `\n[H2]${stripTags(t)}\n`)
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, (_, t) => `\n[H3]${stripTags(t)}\n`)
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, (_, t) => `\n[QUOTE]${stripTags(t)}\n`)
    .replace(/<p[^>]*>(.*?)<\/p>/gi, (_, t) => `\n[P]${stripTags(t)}\n`)
    .replace(/<li[^>]*>(.*?)<\/li>/gi, (_, t) => `\n[P]• ${stripTags(t)}\n`)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "");

  const rawLines = processed.split("\n").map(l => l.trim()).filter(l => l);

  for (const line of rawLines) {
    if (line.startsWith("[H1]")) {
      lines.push({ type: "heading1", text: line.slice(4) });
    } else if (line.startsWith("[H2]")) {
      lines.push({ type: "heading2", text: line.slice(4) });
    } else if (line.startsWith("[H3]")) {
      lines.push({ type: "heading3", text: line.slice(4) });
    } else if (line.startsWith("[QUOTE]")) {
      lines.push({ type: "quote", text: line.slice(7) });
    } else if (line.startsWith("[P]")) {
      const text = line.slice(3);
      if (text.trim()) {
        lines.push({ type: "paragraph", text });
      } else {
        lines.push({ type: "empty", text: "" });
      }
    } else if (line.trim()) {
      lines.push({ type: "paragraph", text: line });
    }
  }

  return lines;
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

function buildPDFContent(title: string, lines: TextLine[]): string {
  const parts: string[] = [title, ""];
  for (const line of lines) {
    switch (line.type) {
      case "heading1": parts.push(`\n${line.text}\n`); break;
      case "heading2": parts.push(`\n${line.text}\n`); break;
      case "heading3": parts.push(`\n${line.text}\n`); break;
      case "quote": parts.push(`  "${line.text}"`); break;
      case "paragraph": parts.push(line.text); break;
      case "empty": parts.push(""); break;
    }
  }
  return parts.join("\n");
}

async function generateWithPDFKit(PDFDocument: any, title: string, lines: TextLine[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 72, bottom: 72, left: 85, right: 85 },
      info: { Title: title, Author: "Editorial de Élite", Creator: "Editor IA" },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Título
    doc.fontSize(24).font("Helvetica-Bold").text(title, { align: "center" });
    doc.moveDown(0.5);
    doc.moveTo(85, doc.y).lineTo(510, doc.y).stroke("#C9A84C");
    doc.moveDown(1.5);

    // Contenido
    for (const line of lines) {
      switch (line.type) {
        case "heading1":
          doc.moveDown(0.5).fontSize(18).font("Helvetica-Bold").text(line.text);
          doc.moveDown(0.3);
          break;
        case "heading2":
          doc.moveDown(0.4).fontSize(15).font("Helvetica-Bold").text(line.text);
          doc.moveDown(0.2);
          break;
        case "heading3":
          doc.moveDown(0.3).fontSize(13).font("Helvetica-Bold").text(line.text);
          doc.moveDown(0.2);
          break;
        case "quote":
          doc.moveDown(0.3)
            .fontSize(11)
            .font("Helvetica-Oblique")
            .text(`"${line.text}"`, { indent: 30 });
          doc.moveDown(0.3);
          break;
        case "paragraph":
          doc.fontSize(11).font("Helvetica").text(line.text, { align: "justify", lineGap: 4 });
          doc.moveDown(0.4);
          break;
        case "empty":
          doc.moveDown(0.5);
          break;
      }
    }

    // Footer
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      doc.fontSize(9).font("Helvetica").fillColor("#888888")
        .text(`Editorial de Élite — ${title} — Página ${i + 1} de ${range.count}`,
          85, doc.page.height - 50, { align: "center", width: doc.page.width - 170 });
    }

    doc.end();
  });
}

function generateSimplePDF(title: string, content: string): Buffer {
  // PDF mínimo válido como fallback
  const escapedTitle = title.replace(/[()\\]/g, "\\$&");
  const escapedContent = content
    .replace(/[()\\]/g, "\\$&")
    .replace(/\n/g, ") Tj\nT* (")
    .slice(0, 5000);

  const pdfStr = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 200>>stream
BT /F1 24 Tf 85 770 Td (${escapedTitle}) Tj
/F1 11 Tf 0 -40 Td T* (${escapedContent}) Tj ET
endstream endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
xref 0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000274 00000 n
0000000526 00000 n
trailer<</Size 6/Root 1 0 R>>
startxref 617
%%EOF`;

  return Buffer.from(pdfStr, "utf-8");
}
