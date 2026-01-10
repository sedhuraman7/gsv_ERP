import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export class PDFService {
    static generateInvoicePDF(invoiceData: any) {
        const doc = new jsPDF();

        // Company Header
        doc.setFontSize(24);
        doc.setTextColor(249, 115, 22); // Orange color
        doc.text('ABC MANUFACTURING', 20, 20);

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text('123 Industrial Estate, Chennai - 600032', 20, 30);
        doc.text('GSTIN: 33AABCA1234M1Z5', 20, 36);
        doc.text('Phone: +91 44 1234 5678 | Email: info@abcmfg.com', 20, 42);

        // Invoice Title
        doc.setFontSize(18);
        doc.setTextColor(0, 0, 0);
        doc.text('TAX INVOICE', 150, 20);

        doc.setFontSize(10);
        doc.text(`Invoice No: ${invoiceData.invoiceNo}`, 150, 30);
        doc.text(`Date: ${new Date(invoiceData.date).toLocaleDateString()}`, 150, 36);

        // Customer Details
        doc.setFontSize(12);
        doc.text('Bill To:', 20, 60);
        doc.setFontSize(10);
        doc.text(invoiceData.customer.name, 20, 68);
        doc.text(invoiceData.customer.address, 20, 74);
        doc.text(`GSTIN: ${invoiceData.customer.gstin || 'N/A'}`, 20, 80);
        doc.text(`State: ${invoiceData.customer.state}`, 20, 86);

        // Items Table
        autoTable(doc, {
            startY: 100,
            head: [
                ['S.No', 'Description', 'HSN', 'Qty', 'Rate', 'Taxable', 'GST%', 'CGST', 'SGST', 'Amount']
            ],
            body: invoiceData.items.map((item: any, index: number) => [
                index + 1,
                item.description,
                item.hsnCode || 'N/A',
                `${item.quantity} ${item.unit}`,
                `₹${item.rate.toFixed(2)}`,
                `₹${item.taxableValue.toFixed(2)}`,
                `${item.gstPercentage}%`,
                `₹${item.cgst.toFixed(2)}`,
                `₹${item.sgst.toFixed(2)}`,
                `₹${item.amount.toFixed(2)}`
            ]),
            theme: 'grid',
            headStyles: { fillColor: [249, 115, 22] },
            margin: { left: 20, right: 20 }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;

        // Totals
        doc.setFontSize(10);
        doc.text('Total Amount:', 120, finalY);
        doc.text(`₹${invoiceData.grandTotal.toFixed(2)}`, 170, finalY);

        doc.text('Amount in Words:', 20, finalY + 10);
        doc.text(this.numberToWords(invoiceData.grandTotal), 20, finalY + 18);

        // Footer
        doc.setFontSize(8);
        doc.text('Terms & Conditions:', 20, finalY + 30);
        doc.text('1. Goods once sold will not be taken back.', 20, finalY + 36);
        doc.text('2. All disputes subject to Chennai jurisdiction.', 20, finalY + 42);
        doc.text('3. E.& O.E.', 20, finalY + 48);

        // Signature
        doc.text('For ABC Manufacturing', 20, finalY + 60);
        doc.text('Authorized Signatory', 20, finalY + 66);

        // Save PDF
        doc.save(`Invoice_${invoiceData.invoiceNo}.pdf`);
    }

    static generateStockReportPDF(stockData: any[]) {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.setTextColor(249, 115, 22);
        doc.text('STOCK REPORT - ABC MANUFACTURING', 20, 20);

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);

        // Summary
        const totalItems = stockData.length;
        const lowStock = stockData.filter(item => item.currentStock < item.minStock).length;
        const totalValue = stockData.reduce((sum, item) => sum + (item.currentStock * item.averageCost), 0);

        doc.setFontSize(12);
        doc.text('Summary:', 20, 45);
        doc.setFontSize(10);
        doc.text(`Total Items: ${totalItems}`, 20, 52);
        doc.text(`Low Stock Items: ${lowStock}`, 20, 58);
        doc.text(`Total Inventory Value: ₹${totalValue.toLocaleString()}`, 20, 64);

        // Stock Table
        autoTable(doc, {
            startY: 75,
            head: [
                ['Item Code', 'Name', 'Category', 'Current Stock', 'Min Stock', 'Max Stock', 'Status', 'Value']
            ],
            body: stockData.map(item => [
                item.materialCode,
                item.name,
                item.category,
                `${item.currentStock} ${item.unit}`,
                item.minStock,
                item.maxStock,
                item.currentStock < item.minStock ? 'Low' : 'OK',
                `₹${(item.currentStock * (item.averageCost || 0)).toFixed(2)}`
            ]),
            theme: 'grid',
            headStyles: { fillColor: [249, 115, 22] },
            didDrawCell: (data: any) => {
                if (data.column.index === 6 && data.cell.raw === 'Low') {
                    doc.setTextColor(255, 0, 0);
                }
            }
        });

        // Save PDF
        doc.save(`Stock_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    }

    static generateGSTReportPDF(gstData: any) {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.setTextColor(249, 115, 22);
        doc.text('GST REPORT - ABC MANUFACTURING', 20, 20);

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`Period: ${gstData.period.from} to ${gstData.period.to}`, 20, 30);
        doc.text(`GSTIN: ${gstData.gstin}`, 20, 36);

        // Summary
        doc.setFontSize(12);
        doc.text('GST Summary:', 20, 50);

        autoTable(doc, {
            startY: 60,
            head: [['Description', 'Amount (₹)']],
            body: [
                ['Total Sales (Before Tax)', gstData.totalSales.toFixed(2)],
                ['CGST Collected', gstData.cgstCollected.toFixed(2)],
                ['SGST Collected', gstData.sgstCollected.toFixed(2)],
                ['IGST Collected', gstData.igstCollected.toFixed(2)],
                ['Total GST Collected', gstData.totalGstCollected.toFixed(2)],
                ['GST Payable', gstData.gstPayable.toFixed(2)],
                ['Net GST Liability', gstData.netGstLiability.toFixed(2)]
            ],
            theme: 'grid',
            headStyles: { fillColor: [249, 115, 22] }
        });

        // Save PDF
        doc.save(`GST_Report_${gstData.period.from}_to_${gstData.period.to}.pdf`);
    }

    private static numberToWords(num: number): string {
        // Simplified number to words conversion
        // For production, use a proper library
        const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        if (num === 0) return 'Zero Rupees';

        let result = '';
        const rupees = Math.floor(num);
        const paise = Math.round((num - rupees) * 100);

        // Convert rupees
        if (rupees > 0) {
            result += this.convertNumber(rupees) + ' Rupees';
        }

        // Convert paise
        if (paise > 0) {
            if (result) result += ' and ';
            result += this.convertNumber(paise) + ' Paise';
        }

        return result + ' Only';
    }

    private static convertNumber(num: number): string {
        // Simple conversion for demo
        // Implement proper conversion for production
        if (num < 10) return ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'][num];
        if (num < 20) return ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'][num - 10];
        if (num < 100) {
            const tensDigit = Math.floor(num / 10);
            const unitDigit = num % 10;
            return ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'][tensDigit] +
                (unitDigit > 0 ? ' ' + ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'][unitDigit] : '');
        }
        if (num < 1000) {
            const hundreds = Math.floor(num / 100);
            const remainder = num % 100;
            return ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'][hundreds] +
                ' Hundred' + (remainder > 0 ? ' and ' + this.convertNumber(remainder) : '');
        }
        return num.toLocaleString();
    }
}
