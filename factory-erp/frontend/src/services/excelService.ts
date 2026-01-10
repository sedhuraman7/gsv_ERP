import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export class ExcelService {
    static exportToExcel(data: any[], filename: string, sheetName: string = 'Sheet1') {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);

        // Auto-size columns
        const wscols = this.calculateColumnWidths(data);
        ws['!cols'] = wscols;

        // Generate Excel file
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    static exportInventoryReport(inventoryData: any[]) {
        const formattedData = inventoryData.map(item => ({
            'Item Code': item.materialCode,
            'Item Name': item.name,
            'Category': item.category,
            'Unit': item.unit,
            'Current Stock': item.currentStock,
            'Minimum Stock': item.minStock,
            'Maximum Stock': item.maxStock,
            'Reorder Level': item.reorderLevel,
            'Average Cost': item.averageCost,
            'Stock Value': item.currentStock * (item.averageCost || 0),
            'Location': item.location?.godown || 'N/A',
            'HSN Code': item.hsnCode || 'N/A',
            'GST %': item.gstPercentage,
            'Status': item.currentStock < item.minStock ? 'Low Stock' : 'In Stock',
            'Last Updated': new Date(item.updatedAt).toLocaleDateString()
        }));

        this.exportToExcel(formattedData, 'Inventory_Report', 'Inventory');
    }

    static exportSalesReport(salesData: any[]) {
        const formattedData = salesData.map(sale => ({
            'Invoice No': sale.invoiceNo,
            'Date': new Date(sale.date).toLocaleDateString(),
            'Customer Name': sale.customer.name,
            'Customer GSTIN': sale.customer.gstin || 'N/A',
            'State': sale.customer.state,
            'Total Amount': sale.grandTotal,
            'Taxable Amount': sale.taxableAmount,
            'CGST': sale.cgstTotal,
            'SGST': sale.sgstTotal,
            'IGST': sale.igstTotal,
            'Total GST': sale.totalGst,
            'Payment Mode': sale.paymentMode,
            'Payment Status': sale.paymentStatus,
            'Balance Due': sale.balanceDue,
            'Created By': sale.createdBy?.name || 'N/A'
        }));

        this.exportToExcel(formattedData, 'Sales_Report', 'Sales');
    }

    static exportProductionReport(productionData: any[]) {
        const formattedData = productionData.map(order => ({
            'Order No': order.orderNo,
            'Date': new Date(order.date).toLocaleDateString(),
            'Product Code': order.productCode,
            'Product Name': order.productName,
            'Quantity To Produce': order.quantityToProduce,
            'Produced Quantity': order.producedQuantity,
            'Passed Quantity': order.passedQuantity,
            'Rejected Quantity': order.rejectedQuantity,
            'Current Stage': order.currentStage,
            'Status': order.status,
            'Target Date': new Date(order.targetDate).toLocaleDateString(),
            'Created By': order.createdBy?.name || 'N/A'
        }));

        this.exportToExcel(formattedData, 'Production_Report', 'Production');
    }

    static exportGSTReport(gstData: any) {
        const formattedData = [
            {
                'Period': `${gstData.period.from} to ${gstData.period.to}`,
                'Total Sales': gstData.totalSales,
                'Taxable Sales': gstData.taxableSales,
                'CGST Collected': gstData.cgstCollected,
                'SGST Collected': gstData.sgstCollected,
                'IGST Collected': gstData.igstCollected,
                'Total GST Collected': gstData.totalGstCollected,
                'GST Payable': gstData.gstPayable,
                'Net GST Liability': gstData.netGstLiability
            }
        ];

        this.exportToExcel(formattedData, 'GST_Report', 'GST Summary');
    }

    private static calculateColumnWidths(data: any[]) {
        if (!data || data.length === 0) return [];

        const headers = Object.keys(data[0]);
        const columnWidths = headers.map(header => ({ width: header.length + 5 }));

        data.forEach(row => {
            headers.forEach((header, index) => {
                const cellValue = row[header]?.toString() || '';
                columnWidths[index].width = Math.max(
                    columnWidths[index].width,
                    cellValue.length + 5
                );
            });
        });

        // Limit maximum width
        return columnWidths.map(col => ({
            width: Math.min(col.width, 50)
        }));
    }

    static importFromExcel(file: File): Promise<any[]> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = e.target?.result;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = (error) => reject(error);
            reader.readAsBinaryString(file);
        });
    }
}
