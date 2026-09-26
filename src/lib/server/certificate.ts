import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb, StandardFonts, type PDFFont } from "pdf-lib";
import { cohortHours, type Cohort, type Course } from "@/lib/courses";
import { formatDate, formatTime } from "@/lib/format";
import { siteConfig } from "@/lib/site-config";
import type { Enrollment } from "@/lib/server/enrollments";

/**
 * Certificado de participação, gerado na hora a partir da matrícula. Serve ao
 * aluno e também como evidência: traz o horário do check-in e o código da
 * matrícula, que liga o documento à trilha de auditoria.
 *
 * As fontes padrão do PDF só codificam Latin-1; `latin1` troca o que ficar de
 * fora (um "ł" num sobrenome, por exemplo) pela letra sem acento.
 */
function latin1(text: string): string {
  return Array.from(text)
    .map((char) => {
      if (char.charCodeAt(0) <= 0xff) return char;
      const base = char.normalize("NFD").replace(/[̀-ͯ]/g, "");
      return base.charCodeAt(0) <= 0xff ? base : "?";
    })
    .join("");
}

function hex(value: string) {
  const n = parseInt(value.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

const INK = hex("#190630");
const MUTED = hex("#574a63");
const ORANGE = hex("#cd5d01");
const LAYERS = ["#fea520", "#fe7c20", "#cd5d01", "#822ca3", "#18702e"].map(hex);

function wrap(
  text: string,
  font: PDFFont,
  size: number,
  width: number,
): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const attempt = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(attempt, size) > width && line) {
      lines.push(line);
      line = word;
    } else {
      line = attempt;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function renderCertificate(
  enrollment: Enrollment,
  course: Course,
  cohort: Cohort,
  verifyUrl: string,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(
    latin1(`Certificado - ${course.title} - ${enrollment.buyer_name}`),
  );
  pdf.setAuthor(siteConfig.name);
  pdf.setCreator(siteConfig.name);

  const page = pdf.addPage([842, 595]); // A4 paisagem
  const { width, height } = page.getSize();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const mono = await pdf.embedFont(StandardFonts.Courier);

  // Estrias de deposição na lateral: o motivo da Impressão 3D no papel.
  for (let y = 0, i = 0; y < height; y += 7, i++) {
    page.drawRectangle({
      x: 0,
      y,
      width: 28,
      height: 4,
      color: LAYERS[i % LAYERS.length],
    });
  }

  const left = 80;
  const textWidth = width - left - 70;

  const logo = await pdf.embedPng(
    await readFile(path.join(process.cwd(), "public/brand/tkxhi-wordmark.png")),
  );
  const logoWidth = 150;
  page.drawImage(logo, {
    x: left,
    y: height - 70 - (logo.height * logoWidth) / logo.width,
    width: logoWidth,
    height: (logo.height * logoWidth) / logo.width,
  });

  page.drawText("CERTIFICADO DE PARTICIPAÇÃO", {
    x: left,
    y: height - 150,
    size: 12,
    font: mono,
    color: ORANGE,
  });

  page.drawText("Certificamos que", {
    x: left,
    y: height - 200,
    size: 16,
    font: regular,
    color: MUTED,
  });

  const name = latin1(enrollment.buyer_name);
  let nameSize = 40;
  while (bold.widthOfTextAtSize(name, nameSize) > textWidth && nameSize > 20) {
    nameSize -= 2;
  }
  page.drawText(name, {
    x: left,
    y: height - 250,
    size: nameSize,
    font: bold,
    color: INK,
  });

  const attendedAt = enrollment.attendance_timestamp!;
  const body = latin1(
    `participou do curso presencial ${course.title}, edição ${course.edition}, realizado em ${formatDate(cohort.startsAt)}, em ${cohort.venue}, com carga horária de ${cohortHours(cohort)} horas.`,
  );
  let y = height - 295;
  for (const line of wrap(body, regular, 16, textWidth)) {
    page.drawText(line, { x: left, y, size: 16, font: regular, color: INK });
    y -= 24;
  }

  y -= 8;
  page.drawText(
    latin1(
      `Presença registrada por check-in em ${formatDate(attendedAt)}, às ${formatTime(attendedAt)}.`,
    ),
    { x: left, y, size: 11, font: regular, color: MUTED },
  );

  page.drawText(latin1(course.authors), {
    x: left,
    y: 120,
    size: 13,
    font: bold,
    color: INK,
  });
  page.drawText("Instrutores", {
    x: left,
    y: 104,
    size: 10,
    font: regular,
    color: MUTED,
  });

  const footer = [
    latin1(`${siteConfig.name} · CNPJ ${siteConfig.cnpj}`),
    `Código de verificação: ${enrollment.id}`,
    verifyUrl,
  ];
  footer.forEach((line, index) => {
    page.drawText(latin1(line), {
      x: left,
      y: 60 - index * 13,
      size: 8.5,
      font: mono,
      color: MUTED,
    });
  });

  return pdf.save();
}
