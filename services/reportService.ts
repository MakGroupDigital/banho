import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface SaleItem {
  productName: string;
  price: number;
  quantity: number;
}

interface Sale {
  id?: string;
  orderId?: string;
  buyerName: string;
  items: SaleItem[];
  total: number;
  status: string;
  createdAt?: { toDate: () => Date };
  paymentMethod?: string;
}

interface UserInfo {
  displayName: string;
  email: string;
  banhoPayNumber: string;
  photoURL?: string;
}

interface ReportStats {
  totalSales: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  topProducts: { name: string; quantity: number; revenue: number }[];
}

// Couleurs de la charte graphique Banho
const COLORS = {
  primary: [6, 78, 59] as [number, number, number],      // emerald-900 #064e3b
  secondary: [5, 150, 105] as [number, number, number],  // emerald-600 #059669
  accent: [16, 185, 129] as [number, number, number],    // emerald-500 #10b981
  dark: [31, 41, 55] as [number, number, number],        // gray-800
  light: [249, 250, 251] as [number, number, number],    // gray-50
  white: [255, 255, 255] as [number, number, number],
};

// Calculer les statistiques
const calculateStats = (sales: Sale[]): ReportStats => {
  const totalSales = sales.length;
  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const pendingOrders = sales.filter(s => s.status === 'En attente').length;
  const completedOrders = sales.filter(s => s.status === 'Livrée').length;
  const cancelledOrders = sales.filter(s => s.status === 'Annulée').length;
  const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

  // Top produits
  const productMap = new Map<string, { quantity: number; revenue: number }>();
  sales.forEach(sale => {
    sale.items?.forEach(item => {
      const existing = productMap.get(item.productName) || { quantity: 0, revenue: 0 };
      productMap.set(item.productName, {
        quantity: existing.quantity + (item.quantity || 1),
        revenue: existing.revenue + (item.price * (item.quantity || 1))
      });
    });
  });

  const topProducts = Array.from(productMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    totalSales,
    totalRevenue,
    pendingOrders,
    completedOrders,
    cancelledOrders,
    averageOrderValue,
    topProducts
  };
};

// Générer le rapport PDF
export const generateSalesReport = async (
  sales: Sale[],
  userInfo: UserInfo,
  userBalance: number
): Promise<void> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  const stats = calculateStats(sales);
  const today = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // ===== EN-TÊTE =====
  // Fond vert en haut
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 55, 'F');

  // Logo Banho (texte stylisé)
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('BANHO', margin, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Zando na Tshombo', margin, 33);

  // Titre du rapport
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('RAPPORT DE VENTES', pageWidth - margin, 25, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Généré le ${today}`, pageWidth - margin, 33, { align: 'right' });

  yPos = 70;

  // ===== INFORMATIONS VENDEUR =====
  doc.setFillColor(...COLORS.light);
  doc.roundedRect(margin, yPos - 5, pageWidth - 2 * margin, 45, 3, 3, 'F');

  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Informations du vendeur', margin + 5, yPos + 5);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nom: ${userInfo.displayName}`, margin + 5, yPos + 15);
  doc.text(`Email: ${userInfo.email}`, margin + 5, yPos + 23);
  doc.text(`N° BanhoPay: ${userInfo.banhoPayNumber}`, margin + 5, yPos + 31);

  // Solde à droite
  doc.setFillColor(...COLORS.secondary);
  doc.roundedRect(pageWidth - margin - 55, yPos, 50, 30, 3, 3, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(8);
  doc.text('Solde BanhoPay', pageWidth - margin - 50, yPos + 10);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`$${userBalance.toFixed(2)}`, pageWidth - margin - 50, yPos + 22);

  yPos += 55;

  // ===== STATISTIQUES =====
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Statistiques de ventes', margin, yPos);
  yPos += 10;

  // Cartes de statistiques
  const cardWidth = (pageWidth - 2 * margin - 15) / 4;
  const cardHeight = 35;
  const statsCards = [
    { label: 'Total Ventes', value: stats.totalSales.toString(), color: COLORS.primary },
    { label: 'Revenus', value: `$${stats.totalRevenue.toFixed(2)}`, color: COLORS.secondary },
    { label: 'Livrées', value: stats.completedOrders.toString(), color: COLORS.accent },
    { label: 'En attente', value: stats.pendingOrders.toString(), color: [234, 179, 8] as [number, number, number] }
  ];

  statsCards.forEach((card, index) => {
    const x = margin + index * (cardWidth + 5);
    doc.setFillColor(...card.color);
    doc.roundedRect(x, yPos, cardWidth, cardHeight, 3, 3, 'F');
    
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(card.label, x + 5, yPos + 12);
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(card.value, x + 5, yPos + 26);
  });

  yPos += cardHeight + 15;

  // Statistiques supplémentaires
  doc.setFillColor(...COLORS.light);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 25, 3, 3, 'F');
  
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const extraStats = [
    `Panier moyen: $${stats.averageOrderValue.toFixed(2)}`,
    `Annulées: ${stats.cancelledOrders}`,
    `Taux de livraison: ${stats.totalSales > 0 ? ((stats.completedOrders / stats.totalSales) * 100).toFixed(1) : 0}%`
  ];
  
  extraStats.forEach((stat, index) => {
    const x = margin + 10 + index * 60;
    doc.text(stat, x, yPos + 15);
  });

  yPos += 35;

  // ===== TOP PRODUITS =====
  if (stats.topProducts.length > 0) {
    doc.setTextColor(...COLORS.primary);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Top 5 Produits', margin, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [['Produit', 'Quantité vendue', 'Revenus']],
      body: stats.topProducts.map(p => [
        p.name.length > 30 ? p.name.substring(0, 30) + '...' : p.name,
        p.quantity.toString(),
        `$${p.revenue.toFixed(2)}`
      ]),
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: COLORS.light
      },
      margin: { left: margin, right: margin },
      tableWidth: 'auto'
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // ===== LISTE DES VENTES =====
  // Nouvelle page si nécessaire
  if (yPos > pageHeight - 80) {
    doc.addPage();
    yPos = margin;
  }

  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Détail des ventes', margin, yPos);
  yPos += 5;

  if (sales.length > 0) {
    const salesData = sales.map(sale => {
      const date = sale.createdAt?.toDate().toLocaleDateString('fr-FR') || 'N/A';
      const products = sale.items?.map(i => i.productName).join(', ') || 'N/A';
      const statusEmoji = {
        'En attente': '⏳',
        'En cours': '📦',
        'Expédiée': '📤',
        'En route': '🚚',
        'Livrée': '✅',
        'Annulée': '❌'
      }[sale.status] || '';
      
      return [
        sale.orderId || sale.id?.substring(0, 8) || 'N/A',
        date,
        sale.buyerName || 'Client',
        products.length > 25 ? products.substring(0, 25) + '...' : products,
        `$${sale.total?.toFixed(2) || '0.00'}`,
        `${statusEmoji} ${sale.status}`
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [['N° Commande', 'Date', 'Client', 'Produits', 'Total', 'Statut']],
      body: salesData,
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 8
      },
      bodyStyles: {
        fontSize: 8
      },
      alternateRowStyles: {
        fillColor: COLORS.light
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 22 },
        2: { cellWidth: 28 },
        3: { cellWidth: 40 },
        4: { cellWidth: 20 },
        5: { cellWidth: 25 }
      },
      margin: { left: margin, right: margin },
      didDrawPage: (data) => {
        // Pied de page sur chaque page
        doc.setFillColor(...COLORS.primary);
        doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
        doc.setTextColor(...COLORS.white);
        doc.setFontSize(8);
        doc.text(
          `Banho - Rapport de ventes | ${userInfo.displayName} | Page ${doc.getNumberOfPages()}`,
          pageWidth / 2,
          pageHeight - 6,
          { align: 'center' }
        );
      }
    });
  } else {
    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(10);
    doc.text('Aucune vente enregistrée.', margin, yPos + 10);
  }

  // ===== PIED DE PAGE FINAL =====
  const finalY = (doc as any).lastAutoTable?.finalY || yPos + 20;
  
  if (finalY < pageHeight - 50) {
    doc.setFillColor(...COLORS.light);
    doc.roundedRect(margin, finalY + 10, pageWidth - 2 * margin, 30, 3, 3, 'F');
    
    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(
      'Ce rapport a été généré automatiquement par Banho. Les données sont à jour au moment de la génération.',
      pageWidth / 2,
      finalY + 22,
      { align: 'center' }
    );
    doc.text(
      `© ${new Date().getFullYear()} Banho - Zando na Tshombo. Tous droits réservés.`,
      pageWidth / 2,
      finalY + 30,
      { align: 'center' }
    );
  }

  // Télécharger le PDF
  const fileName = `Banho_Rapport_Ventes_${userInfo.displayName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

export default generateSalesReport;
