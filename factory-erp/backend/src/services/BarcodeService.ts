import bwipjs from 'bwip-js';
import JsBarcode from 'jsbarcode';
import { createCanvas } from 'canvas';
import QRCode from 'qrcode';

export class BarcodeService {

    /**
     * Generate Code 128 barcode for inventory items
     */
    static async generateBarcode(
        data: string,
        options: {
            format?: 'CODE128' | 'CODE39' | 'EAN13';
            width?: number;
            height?: number;
            text?: string;
        } = {}
    ): Promise<Buffer> {
        const {
            format = 'CODE128',
            width = 300,
            height = 100,
            text = data
        } = options;

        try {
            const canvas = createCanvas(width, height);

            await bwipjs.toCanvas(canvas, {
                bcid: format.toLowerCase(),
                text: data,
                scale: 3,
                height: 20,
                includetext: true,
                textxalign: 'center',
                textsize: 12,
                textyoffset: 5
            });

            return canvas.toBuffer('image/png');
        } catch (error) {
            console.error('Barcode generation failed:', error);
            throw new Error('Failed to generate barcode');
        }
    }

    /**
     * Generate QR Code for inventory tracking
     */
    static async generateQRCode(
        data: string,
        options: {
            size?: number;
            margin?: number;
            color?: string;
        } = {}
    ): Promise<Buffer> {
        const {
            size = 200,
            margin = 1,
            color = '#000000'
        } = options;

        try {
            const canvas = createCanvas(size, size);
            await QRCode.toCanvas(canvas, data, {
                width: size,
                margin: margin,
                color: {
                    dark: color,
                    light: '#FFFFFF'
                }
            });

            return canvas.toBuffer('image/png');
        } catch (error) {
            console.error('QR Code generation failed:', error);
            throw new Error('Failed to generate QR code');
        }
    }

    /**
     * Generate inventory item barcode with embedded data
     */
    static generateInventoryBarcode(item: {
        code: string;
        name: string;
        category: string;
        batch?: string;
        expiry?: Date;
    }): string {
        // Format: ABC-{CODE}-{CATEGORY}-{BATCH}-{EXPIRY}
        const parts = [
            'ABC', // Company prefix
            item.code,
            item.category.substring(0, 3).toUpperCase(),
            item.batch || '000',
            item.expiry ? this.formatDateForBarcode(item.expiry) : '000000'
        ];

        return parts.join('-');
    }

    /**
     * Parse barcode data
     */
    static parseBarcode(barcode: string): {
        company: string;
        itemCode: string;
        category: string;
        batch: string;
        expiry: Date | null;
    } {
        const parts = barcode.split('-');

        if (parts.length < 5) {
            throw new Error('Invalid barcode format');
        }

        return {
            company: parts[0],
            itemCode: parts[1],
            category: parts[2],
            batch: parts[3],
            expiry: parts[4] !== '000000' ? this.parseDateFromBarcode(parts[4]) : null
        };
    }

    /**
     * Generate RFID tag data
     */
    static generateRFIDData(item: {
        id: string;
        code: string;
        name: string;
        location: string;
        quantity: number;
        lastUpdated: Date;
    }): string {
        const data = {
            v: '1.0', // Version
            cid: 'ABC', // Company ID
            iid: item.id,
            code: item.code,
            name: item.name.substring(0, 30),
            loc: item.location,
            qty: item.quantity,
            ts: item.lastUpdated.getTime(),
            crc: this.calculateCRC(item.id + item.code)
        };

        return JSON.stringify(data);
    }

    /**
     * Parse RFID tag data
     */
    static parseRFIDData(rfidData: string): any {
        try {
            const data = JSON.parse(rfidData);

            // Validate CRC
            const expectedCRC = this.calculateCRC(data.iid + data.code);
            if (data.crc !== expectedCRC) {
                throw new Error('RFID data corrupted');
            }

            return {
                ...data,
                lastUpdated: new Date(data.ts)
            };
        } catch (error) {
            throw new Error('Invalid RFID data format');
        }
    }

    /**
     * Generate batch of barcodes for production
     */
    static async generateBatchBarcodes(
        items: Array<{ code: string; name: string }>,
        batchSize: number = 100
    ): Promise<Array<{ code: string; barcode: Buffer }>> {
        const results = [];

        for (let i = 0; i < Math.min(items.length, batchSize); i++) {
            const item = items[i];
            const barcodeData = this.generateInventoryBarcode({
                code: item.code,
                name: item.name,
                category: 'INV'
            });

            const barcode = await this.generateBarcode(barcodeData, {
                text: item.code
            });

            results.push({
                code: item.code,
                barcode,
                data: barcodeData
            });
        }

        return results;
    }

    /**
     * Generate shipping label with barcode
     */
    static async generateShippingLabel(data: {
        trackingNumber: string;
        destination: string;
        weight: number;
        items: Array<{ code: string; quantity: number }>;
    }): Promise<Buffer> {
        const canvas = createCanvas(600, 400);
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 600, 400);

        // Company Logo
        ctx.fillStyle = '#f97316';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('ABC MANUFACTURING', 20, 40);

        // Shipping Info
        ctx.fillStyle = '#000000';
        ctx.font = '14px Arial';
        ctx.fillText(`Tracking: ${data.trackingNumber}`, 20, 80);
        ctx.fillText(`Destination: ${data.destination}`, 20, 100);
        ctx.fillText(`Weight: ${data.weight} kg`, 20, 120);

        // Generate barcode
        const barcode = await this.generateBarcode(data.trackingNumber, {
            width: 400,
            height: 80
        });

        // Draw barcode (simplified - in real app, you'd draw the image)
        ctx.fillStyle = '#000000';
        ctx.fillRect(20, 150, 400, 80);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.fillText(`BARCODE: ${data.trackingNumber}`, 30, 190);

        // Items list
        ctx.fillStyle = '#000000';
        ctx.font = '12px Arial';
        data.items.forEach((item, index) => {
            ctx.fillText(`${item.code} x ${item.quantity}`, 20, 260 + (index * 20));
        });

        return canvas.toBuffer('image/png');
    }

    /**
     * Scan barcode from image
     */
    static async scanBarcodeFromImage(imageBuffer: Buffer): Promise<string> {
        // This would integrate with a barcode scanning library
        // For demo, we'll simulate scanning
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve('ABC-INV-001-ELC-001-240101');
            }, 500);
        });
    }

    private static formatDateForBarcode(date: Date): string {
        // Format: YYMMDD
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}${month}${day}`;
    }

    private static parseDateFromBarcode(dateStr: string): Date {
        const year = 2000 + parseInt(dateStr.substring(0, 2));
        const month = parseInt(dateStr.substring(2, 4)) - 1;
        const day = parseInt(dateStr.substring(4, 6));
        return new Date(year, month, day);
    }

    private static calculateCRC(data: string): string {
        // Simple CRC calculation for demo
        let crc = 0;
        for (let i = 0; i < data.length; i++) {
            crc = (crc + data.charCodeAt(i)) % 256;
        }
        return crc.toString(16).padStart(2, '0');
    }
}
