import type { TailoredResumeDoc } from "@/types/resume";

/**
 * Renders a structured resume into a formatted PDF (same layout as the
 * job-tailor preview). Works in both the browser and Node (server routes),
 * so a saved resume can be re-rendered server-side for download.
 */
export async function buildResumePdf(doc: TailoredResumeDoc): Promise<Uint8Array> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdf: any = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 56;
  const width = pdf.internal.pageSize.getWidth() - margin * 2;
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const LH = 15;
  let y = margin;

  const ensure = (h: number) => {
    if (y + h > pageH - margin) { pdf.addPage(); y = margin; }
  };
  const heading = (t: string) => {
    y += 8;
    ensure(28);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11.5);
    pdf.setTextColor(60);
    pdf.text(t.toUpperCase(), margin, y);
    pdf.setDrawColor(150);
    pdf.setLineWidth(1);
    pdf.line(margin, y + 4, margin + width, y + 4);
    y += 18;
    pdf.setTextColor(34);
  };
  const bullets = (arr: string[]) => {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    arr.forEach((b) => {
      const lines = pdf.splitTextToSize(b, width - 16) as string[];
      ensure(lines.length * LH);
      pdf.text("•", margin + 2, y);
      pdf.text(lines, margin + 14, y);
      y += lines.length * LH + 3;
    });
    y += 4;
  };
  const titleRow = (left: string, period: string, bold: boolean, size: number) => {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    const periodW = period ? pdf.getTextWidth(period) : 0;
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setFontSize(size);
    const leftLines = pdf.splitTextToSize(left, width - periodW - 16) as string[];
    ensure(leftLines.length * LH);
    pdf.text(leftLines, margin, y);
    if (period) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(110);
      pdf.text(period, margin + width, y, { align: "right" });
      pdf.setTextColor(34);
    }
    y += leftLines.length * LH;
  };

  // Centered header
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.text(doc.name || "Resume", pageW / 2, y, { align: "center" }); y += 18;
  if (doc.title) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.setTextColor(90);
    pdf.text(doc.title, pageW / 2, y, { align: "center" }); y += 14;
  }
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(110);
  pdf.text(doc.contact || "", pageW / 2, y, { align: "center" }); y += 6;
  pdf.setTextColor(34);

  if (doc.summary?.length) { heading("Summary"); bullets(doc.summary); }

  if (doc.skills?.length) {
    heading("Skills");
    autoTable(pdf, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: "grid",
      styles: { fontSize: 9.5, cellPadding: 6, lineColor: [225, 225, 225], textColor: [40, 40, 40] },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 140, fillColor: [248, 247, 252] } },
      body: doc.skills.map((s) => [s.category, s.items.join(", ")]),
    });
    y = pdf.lastAutoTable.finalY + 6;
  }

  if (doc.experience?.length) {
    heading("Experience");
    doc.experience.forEach((e) => {
      ensure(24);
      titleRow(`${e.role} · ${e.company}`, e.period || "", true, 11);
      if (e.location) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(110);
        pdf.text(e.location, margin, y);
        pdf.setTextColor(34);
        y += 12;
      }
      y += 2;
      bullets(e.bullets);
    });
  }

  if (doc.education?.length) {
    heading("Education");
    doc.education.forEach((ed) => {
      titleRow(`${ed.degree}, ${ed.school}`, ed.period || "", false, 10);
      y += 4;
    });
  }

  return new Uint8Array(pdf.output("arraybuffer"));
}

/** Renders a structured resume to Word-compatible HTML (.doc). */
export function buildResumeDocHtml(doc: TailoredResumeDoc): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const li = (arr: string[]) => arr.map((b) => `<li style="margin-bottom:5px;">${esc(b)}</li>`).join("");

  const skillsRows = doc.skills
    .map((s) =>
      `<tr><td width="28%" style="padding:6px 10px;border:1px solid #e2e2e2;font-weight:bold;vertical-align:top;">${esc(
        s.category
      )}</td><td style="padding:6px 10px;border:1px solid #e2e2e2;">${esc(s.items.join(", "))}</td></tr>`
    )
    .join("");

  const titleRow = (left: string, period: string, bold: boolean, size: string) => `
    <table width="100%" cellpadding="0" cellspacing="0" style="table-layout:fixed;margin:12px 0 2px;">
      <tr>
        <td valign="top" style="font-weight:${bold ? "bold" : "normal"};font-size:${size};">${left}</td>
        <td width="110" valign="top" align="right" style="color:#666;font-size:10pt;">${esc(period)}</td>
      </tr>
    </table>`;

  const expBlocks = doc.experience
    .map((e) => `
      ${titleRow(`${esc(e.role)} · ${esc(e.company)}`, e.period, true, "11.5pt")}
      ${e.location ? `<p style="margin:0 0 4px;color:#888;font-size:10pt;">${esc(e.location)}</p>` : ""}
      <ul style="margin:4px 0 14px;">${li(e.bullets)}</ul>`)
    .join("");

  const eduBlocks = doc.education
    .map((ed) => titleRow(`${esc(ed.degree)}, ${esc(ed.school)}`, ed.period, false, "11pt"))
    .join("");

  const heading = (t: string) =>
    `<p style="border-bottom:1.5px solid #888;text-transform:uppercase;font-size:11.5pt;font-weight:bold;letter-spacing:0.5px;color:#333;margin:18px 0 8px;padding-bottom:3px;">${t}</p>`;

  return `<!DOCTYPE html><html xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8">
  <style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#222;} ul{margin-top:4px;margin-bottom:8px;} li{margin-bottom:5px;}</style>
  </head>
  <body>
    <p align="center" style="margin:0;font-size:21pt;font-weight:bold;">${esc(doc.name)}</p>
    ${doc.title ? `<p align="center" style="margin:2px 0 0;font-size:11pt;color:#555;">${esc(doc.title)}</p>` : ""}
    <p align="center" style="margin:3px 0 8px;color:#666;font-size:10pt;">${esc(doc.contact)}</p>
    ${doc.summary.length ? heading("Summary") + `<ul>${li(doc.summary)}</ul>` : ""}
    ${doc.skills.length ? heading("Skills") + `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${skillsRows}</table>` : ""}
    ${doc.experience.length ? heading("Experience") + expBlocks : ""}
    ${doc.education.length ? heading("Education") + eduBlocks : ""}
  </body></html>`;
}
