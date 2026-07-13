import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// Ubah angka jadi ordinal: 1 -> "1st", 2 -> "2nd", 3 -> "3rd", 4 -> "4th", dst.
function toOrdinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// Generate PDF sertifikat — landscape A4, layout standar sertifikat pada umumnya.
// rank bersifat opsional (null kalau tidak ingin ditampilkan).
export async function generateCertificatePdf({
  participantName,
  eventTitle,
  distance,
  finishTime,
  rank, // number | null
}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]); // A4 landscape (points)
  const { width, height } = page.getSize();
  const centerX = width / 2;

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const primaryColor = rgb(0.09, 0.13, 0.32);
  const accentColor = rgb(0.78, 0.58, 0.09);
  const grayColor = rgb(0.35, 0.35, 0.35);

  function drawCentered(text, y, size, font, color = primaryColor) {
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: centerX - textWidth / 2, y, size, font, color });
  }

  // --- Border dekoratif (ganda) ---
  page.drawRectangle({
    x: 24,
    y: 24,
    width: width - 48,
    height: height - 48,
    borderColor: accentColor,
    borderWidth: 2.5,
  });
  page.drawRectangle({
    x: 34,
    y: 34,
    width: width - 68,
    height: height - 68,
    borderColor: accentColor,
    borderWidth: 0.75,
  });

  // --- Header ---
  drawCentered(
    "CERTIFICATE OF COMPLETION",
    height - 95,
    30,
    fontBold,
    primaryColor,
  );
  drawCentered(
    "VIRTUAL RUN EVENT MANAGEMENT",
    height - 118,
    11,
    fontRegular,
    grayColor,
  );

  // --- Garis pemisah dekoratif ---
  page.drawLine({
    start: { x: centerX - 60, y: height - 132 },
    end: { x: centerX + 60, y: height - 132 },
    thickness: 1,
    color: accentColor,
  });

  // --- Isi utama ---
  drawCentered(
    "This certificate is proudly presented to",
    height - 165,
    13,
    fontItalic,
    grayColor,
  );
  drawCentered(participantName, height - 210, 34, fontBold, accentColor);
  drawCentered(
    `for successfully completing`,
    height - 245,
    13,
    fontRegular,
    grayColor,
  );
  drawCentered(`"${eventTitle}"`, height - 267, 16, fontBold, primaryColor);

  // --- Detail info: baris-baris TERPISAH (bukan digabung 1 baris) ---
  const detailStartY = height - 320;
  const detailLineGap = 26;
  let currentY = detailStartY;

  drawCentered(
    `Distance: ${distance} km`,
    currentY,
    14,
    fontRegular,
    primaryColor,
  );
  currentY -= detailLineGap;

  drawCentered(
    `Finish Time: ${finishTime}`,
    currentY,
    14,
    fontRegular,
    primaryColor,
  );
  currentY -= detailLineGap;

  if (rank) {
    drawCentered(
      `Rank: ${toOrdinal(rank)} Place`,
      currentY,
      14,
      fontBold,
      accentColor,
    );
    currentY -= detailLineGap;
  }

  // --- Footer: tanggal & tanda tangan area ---
  const footerY = 95;
  page.drawLine({
    start: { x: centerX - 100, y: footerY },
    end: { x: centerX + 100, y: footerY },
    thickness: 0.75,
    color: grayColor,
  });
  drawCentered("Event Organizer", footerY - 16, 10, fontRegular, grayColor);

  const dateText = `Issued on ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`;
  drawCentered(dateText, 45, 9, fontRegular, grayColor);

  return pdfDoc.save();
}
