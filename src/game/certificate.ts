import { jsPDF } from "jspdf";
import { ISLANDS } from "./data";
import type { Player } from "./store";

const esc = (s: string) => s.replace(/[\\()]/g, (m) => `\\${m}`);

function wrap(doc: jsPDF, text: string, x: number, y: number, maxW: number, lineH: number) {
  const lines = doc.splitTextToSize(text, maxW) as string[];
  doc.text(lines, x, y);
  return y + (lines.length - 1) * lineH;
}

function badge(doc: jsPDF, x: number, y: number, color: string, badge: string) {
  doc.setFillColor("#fffdf5");
  doc.setDrawColor("#5a3a20");
  doc.setLineWidth(0.8);
  doc.circle(x, y, 15, "FD");
  doc.setFillColor(color);
  doc.circle(x, y, 11.4, "FD");
  doc.setFillColor("#fff8e6");
  doc.circle(x, y, 6.8, "F");
  doc.setTextColor("#5a3a20");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.text(badge.toUpperCase(), x, y + 10, { align: "center", maxWidth: 26 });
  doc.setTextColor("#2b1b0e");
}

export type CertificateData = {
  player: Player;
  islandIndex: number;
  score: number;
  accuracy: number;
  dogsDefeated: number;
  teacherPhone: string;
  issuedAt?: Date;
};

/** Membuat dokumen PDF A4 portrait (210 x 297 mm), satu halaman, badge sesuai level. */
export function buildCertificatePdf(data: CertificateData): jsPDF {
  const island = ISLANDS[data.islandIndex];
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const H = 297;
  const margin = 14;

  doc.setFillColor("#fffdf4");
  doc.rect(0, 0, W, H, "F");

  doc.setDrawColor("#a9673a");
  doc.setLineWidth(1.6);
  doc.rect(8, 8, W - 16, H - 16);
  doc.setDrawColor("#ffd54f");
  doc.setLineWidth(0.7);
  doc.rect(11, 11, W - 22, H - 22);

  doc.setTextColor("#7a4a1e");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("ISLAND EXPLORER - KARTU BERBURU POIN", W / 2, 20, { align: "center" });
  doc.setTextColor("#2b1b0e");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(31);
  doc.text("SERTIFIKAT", W / 2, 39, { align: "center" });
  doc.setFontSize(12);
  doc.setTextColor("#7a4a1e");
  doc.text("Penyelesaian Level " + (island.id + 1) + " : " + island.name.toUpperCase(), W / 2, 49, { align: "center" });
  doc.setTextColor("#2b1b0e");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("Dengan ini diberikan kepada:", W / 2, 66, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(27);
  doc.setTextColor("#1173b8");
  doc.text(data.player.nama.toUpperCase(), W / 2, 80, { align: "center", maxWidth: W - 50 });
  doc.setFontSize(12);
  doc.setTextColor("#2b1b0e");
  doc.setFont("helvetica", "normal");
  doc.text("Kelas " + esc(data.player.kelas) + " - Game Edukasi Matematika Kelas 2 SD", W / 2, 89, { align: "center" });

  doc.setFontSize(11);
  const body = `telah menyelesaikan Level ${island.id + 1} (${island.topicLabel}) di ${island.name} dengan membuka peti harta karun, menjawab 10 soal, mengumpulkan 5 mutiara, dan mengalahkan seluruh penjaga robot anjing.`;
  wrap(doc, body, W / 2, 104, W - 54, 5.4);

  const boxY = 121;
  doc.setDrawColor("#5a3a20");
  doc.setLineWidth(0.9);
  doc.setFillColor("#fff8e6");
  doc.roundedRect(margin + 8, boxY, W - 2 * (margin + 8), 34, 4, 4, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor("#7a4a1e");
  doc.text("HASIL AKHIR LEVEL " + (island.id + 1), W / 2, boxY + 8, { align: "center" });
  doc.setFontSize(17);
  doc.setTextColor("#2b1b0e");
  const cols: [string, string][] = [
    ["SKOR / POIN", String(data.score)],
    ["KETEPATAN", data.accuracy + "%"],
    ["ANJING DIKALAHKAN", data.dogsDefeated + " / 5"],
  ];
  cols.forEach(([label, value], i) => {
    const x = margin + 8 + (i + 0.5) * ((W - 2 * (margin + 8)) / 3);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor("#7a4a1e");
    doc.text(label, x, boxY + 17, { align: "center" });
    doc.setFontSize(20);
    doc.setTextColor("#1173b8");
    doc.text(value, x, boxY + 27, { align: "center" });
  });

  badge(doc, W / 2, 179, island.color, island.badge);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor("#7a4a1e");
  doc.text("BADGE LEVEL " + (island.id + 1) + " : " + island.badge.toUpperCase(), W / 2, 200, { align: "center" });

  const issued = data.issuedAt ?? new Date();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor("#2b1b0e");
  doc.text("Diberikan pada " + issued.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) + " pukul " + issued.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }), W / 2, 217, { align: "center" });
  if (data.teacherPhone) doc.text("Hasil level dikirim ke WhatsApp guru: " + data.teacherPhone, W / 2, 224, { align: "center" });

  doc.setDrawColor("#5a3a20");
  doc.setLineWidth(0.6);
  doc.line(margin + 32, 254, W - margin - 32, 254);
  doc.setFontSize(10);
  doc.text("Guru Kelas 2 SD", W / 2, 260, { align: "center" });
  doc.setFontSize(8);
  doc.setTextColor("#8a6a4a");
  doc.text("created by: widodo guru sd", W / 2, H - 17, { align: "center" });

  return doc;
}

export function downloadCertificate(data: CertificateData) {
  const island = ISLANDS[data.islandIndex];
  const doc = buildCertificatePdf(data);
  const name = data.player.nama.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "pemain";
  doc.save(`sertifikat-level-${island.id + 1}-${name}.pdf`);
}
