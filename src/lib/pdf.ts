import jsPDF from "jspdf";

interface PdfDeliveryData {
  collaboratorName: string;
  collaboratorRegistration: string;
  collaboratorRole?: string;
  manager: string;
  operation: string;
  date: string;
  signature?: string;
  deviceType?: string | null;
  ipAddress?: string | null;
  geoLatitude?: number | null;
  geoLongitude?: number | null;
  items: {
    itemType: string;
    itemName: string;
    size?: string;
    quantity: number;
    reason: string;
    notes?: string;
  }[];
}

export function generateDeliveryPdf(data: PdfDeliveryData): jsPDF {
  const doc = new jsPDF();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("SafeOps", 105, 20, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Sistema de Gestão de EPIs e Uniformes", 105, 27, {
    align: "center",
  });

  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.5);
  doc.line(20, 32, 190, 32);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("FICHA DE ENTREGA", 105, 42, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  let y = 55;

  doc.setFont("helvetica", "bold");
  doc.text("Dados do Colaborador", 20, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.text(`Nome: ${data.collaboratorName}`, 20, y);
  doc.text(`Matrícula: ${data.collaboratorRegistration}`, 120, y);
  y += 7;
  if (data.collaboratorRole) {
    doc.text(`Cargo: ${data.collaboratorRole}`, 20, y);
    doc.text(`Gestor: ${data.manager}`, 120, y);
    y += 7;
  } else {
    doc.text(`Gestor: ${data.manager}`, 20, y);
    doc.text(`Operação: ${data.operation}`, 120, y);
    y += 7;
  }
  doc.text(`Data: ${data.date}`, 20, y);
  if (data.collaboratorRole) {
    doc.text(`Operação: ${data.operation}`, 120, y);
  }

  y += 12;
  doc.setDrawColor(200);
  doc.line(20, y - 4, 190, y - 4);

  doc.setFont("helvetica", "bold");
  doc.text("Itens Entregues", 20, y);
  y += 8;
  doc.setFont("helvetica", "normal");

  data.items.forEach((item) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    const sizeText = item.size ? ` (${item.size})` : "";
    const notesText = item.notes ? ` - ${item.notes}` : "";
    doc.text(
      `${item.itemName}${sizeText} x${item.quantity} - ${item.reason}${notesText}`,
      25,
      y,
    );
    y += 6;
  });

  if (data.signature) {
    if (y > 210) {
      doc.addPage();
      y = 20;
    }
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("Assinatura do Colaborador", 20, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    try {
      doc.addImage(data.signature, "PNG", 50, y, 100, 40);
    } catch {
      doc.text("(Assinatura digital registrada)", 50, y + 20);
    }
    y += 50;
  }

  if (y > 230) {
    doc.addPage();
    y = 20;
  }
  doc.setDrawColor(200);
  doc.line(20, y, 190, y);
  y += 6;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Dados da coleta", 20, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  const metaParts: string[] = [];
  if (data.deviceType) metaParts.push(`Dispositivo: ${data.deviceType}`);
  if (data.ipAddress) metaParts.push(`IP: ${data.ipAddress}`);
  if (data.geoLatitude != null && data.geoLongitude != null)
    metaParts.push(`GPS: ${data.geoLatitude.toFixed(6)}, ${data.geoLongitude.toFixed(6)}`);
  doc.text(metaParts.length > 0 ? metaParts.join("  |  ") : "Nenhum metadado registrado", 20, y);
  y += 8;

  doc.setDrawColor(200);
  doc.line(20, y, 190, y);

  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text("Documento gerado eletronicamente pelo SafeOps", 105, y + 5, {
    align: "center",
  });

  return doc;
}
