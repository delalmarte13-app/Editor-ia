/**
 * Parser HTML compartido para exportaciones PDF y DOCX
 * Elimina la duplicación de código entre ambos formatos
 */

export interface ParsedHTMLElement {
  tag: string;
  attributes: Record<string, string>;
  content: string;
  children: ParsedHTMLElement[];
}

export function parseHTMLToStructure(html: string): ParsedHTMLElement[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  
  return Array.from(doc.body.children).map(element => 
    parseElement(element as HTMLElement)
  );
}

function parseElement(element: HTMLElement): ParsedHTMLElement {
  const attributes: Record<string, string> = {};
  
  for (const attr of element.attributes) {
    attributes[attr.name] = attr.value;
  }
  
  const children: ParsedHTMLElement[] = [];
  for (const child of Array.from(element.children)) {
    children.push(parseElement(child as HTMLElement));
  }
  
  // Extraer texto directo (sin incluir el de los hijos)
  let content = "";
  for (const node of Array.from(element.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      content += node.textContent;
    }
  }
  
  return {
    tag: element.tagName.toLowerCase(),
    attributes,
    content: content.trim(),
    children,
  };
}

export function extractTextContent(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  return doc.body.textContent || "";
}

export function sanitizeHTML(html: string): string {
  // Eliminar scripts y eventos peligrosos
  const sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/g, "")
    .replace(/on\w+='[^']*'/g, "");
  
  return sanitized;
}
