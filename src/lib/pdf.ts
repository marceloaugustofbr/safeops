import jsPDF from "jspdf";

interface PdfDeliveryData {
  collaboratorName: string;
  collaboratorRegistration: string;
  manager: string;
  operation: string;
  date: string;
  signature?: string;
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
  doc.text(`Gestor: ${data.manager}`, 20, y);
  doc.text(`Operação: ${data.operation}`, 120, y);
  y += 7;
  doc.text(`Data: ${data.date}`, 20, y);

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
  }

  y += 50;
  doc.setDrawColor(200);
  doc.line(20, y, 190, y);

  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text("Documento gerado eletronicamente pelo SafeOps", 105, y + 5, {
    align: "center",
  });

  return doc;
}
