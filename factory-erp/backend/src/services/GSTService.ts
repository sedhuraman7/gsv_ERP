export class GSTService {
    // Indian GST Rates as per 2024
    static readonly GST_RATES = {
        '0': {
            rate: 0,
            description: 'Nil Rated',
            categories: [
                'Fresh fruits and vegetables',
                'Milk, curd, buttermilk',
                'Educational services',
                'Healthcare services'
            ]
        },
        '0.25': {
            rate: 0.25,
            description: '0.25% (Rough precious & semi-precious stones)',
            categories: ['Rough diamonds', 'Unworked precious stones']
        },
        '3': {
            rate: 3,
            description: '3% (Gold, silver, precious metals)',
            categories: ['Gold', 'Silver', 'Platinum articles']
        },
        '5': {
            rate: 5,
            description: '5% Standard Rate',
            categories: [
                'Apparel below ₹1000',
                'Footwear below ₹1000',
                'Restaurant services (non-AC)',
                'Railway transportation',
                'Economy class air travel'
            ]
        },
        '12': {
            rate: 12,
            description: '12% Standard Rate',
            categories: [
                'Processed foods',
                'Mobile phones',
                'Medicines',
                'Business class air travel',
                'AC restaurants',
                'Non-AC hotels'
            ]
        },
        '18': {
            rate: 18,
            description: '18% Standard Rate (Most common)',
            categories: [
                'Most manufactured goods',
                'IT services',
                'Telecom services',
                'Financial services',
                'AC hotels (₹7500+ tariff)',
                'Restaurants in hotels (AC)',
                'Industrial products',
                'Electronics'
            ]
        },
        '28': {
            rate: 28,
            description: '28% Luxury & Demerit Rate',
            categories: [
                'Luxury cars',
                'Aerated drinks',
                'Cigarettes',
                'Pan masala',
                'Cement',
                'Five-star hotels'
            ]
        }
    };

    // HSN Code to GST Rate Mapping
    static readonly HSN_GST_MAPPING = {
        // Chapter 85: Electrical machinery and equipment
        '8501': 18, // Electric motors and generators
        '8504': 18, // Electrical transformers
        '8507': 18, // Electric accumulators
        '8517': 18, // Telephone sets

        // Chapter 84: Nuclear reactors, boilers, machinery
        '8401': 18, // Nuclear reactors
        '8413': 18, // Pumps
        '8421': 18, // Centrifuges

        // Chapter 39: Plastics and articles thereof
        '3901': 18, // Polymers
        '3923': 18, // Plastic articles

        // Chapter 72: Iron and steel
        '7208': 18, // Hot-rolled iron
        '7210': 18, // Coated steel

        // Chapter 87: Vehicles
        '8703': 28, // Motor cars
        '8708': 28, // Parts of motor vehicles

        // Services
        'SAC9983': 18, // IT services
        'SAC9984': 18, // Business services
        'SAC9985': 5,  // Restaurant services
    };

    // GST Slabs for Different States
    static readonly STATE_GST_SLABS = {
        'INTERSTATE': {
            cgst: 0,
            sgst: 0,
            igst: (rate: number) => rate
        },
        'TAMIL NADU': {
            cgst: (rate: number) => rate / 2,
            sgst: (rate: number) => rate / 2,
            igst: 0
        },
        'MAHARASHTRA': {
            cgst: (rate: number) => rate / 2,
            sgst: (rate: number) => rate / 2,
            igst: 0
        },
        'GUJARAT': {
            cgst: (rate: number) => rate / 2,
            sgst: (rate: number) => rate / 2,
            igst: 0
        },
        'KARNATAKA': {
            cgst: (rate: number) => rate / 2,
            sgst: (rate: number) => rate / 2,
            igst: 0
        }
    };

    /**
     * Calculate GST for a transaction
     */
    static calculateGST(
        taxableValue: number,
        gstRate: number,
        customerState: string,
        sellerState: string = 'TAMIL NADU'
    ) {
        const isInterstate = customerState.toUpperCase() !== sellerState.toUpperCase();

        let cgst = 0;
        let sgst = 0;
        let igst = 0;

        if (isInterstate) {
            igst = (taxableValue * gstRate) / 100;
        } else {
            const halfRate = gstRate / 2;
            cgst = (taxableValue * halfRate) / 100;
            sgst = (taxableValue * halfRate) / 100;
        }

        return {
            taxableValue,
            gstRate,
            cgst,
            sgst,
            igst,
            totalGst: cgst + sgst + igst,
            totalAmount: taxableValue + cgst + sgst + igst,
            isInterstate
        };
    }

    /**
     * Get GST rate from HSN code
     */
    static getGSTRateFromHSN(hsnCode: string): number {
        const firstFourDigits = hsnCode.substring(0, 4);
        return this.HSN_GST_MAPPING[firstFourDigits as keyof typeof this.HSN_GST_MAPPING] || 18;
    }

    /**
     * Generate GST-compliant invoice number
     */
    static generateGSTInvoiceNumber(
        financialYear: string = '2024-25',
        stateCode: string = '33',
        sequence: number
    ): string {
        const prefix = 'ABC';
        const fy = financialYear.replace('-', '');
        const seq = sequence.toString().padStart(4, '0');

        return `${prefix}/${stateCode}/${fy}/INV/${seq}`;
    }

    /**
     * Validate GSTIN number
     */
    static validateGSTIN(gstin: string): boolean {
        const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

        if (!gstinRegex.test(gstin)) {
            return false;
        }

        // Additional checksum validation
        return this.validateGSTINChecksum(gstin);
    }

    private static validateGSTINChecksum(gstin: string): boolean {
        // Implementation of GSTIN checksum validation
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let sum = 0;
        let factor = 2;

        for (let i = gstin.length - 2; i >= 0; i--) {
            const codePoint = chars.indexOf(gstin[i]);
            const digit = factor * codePoint;
            factor = factor === 8 ? 2 : factor + 1;
            sum += Math.floor(digit / chars.length) + (digit % chars.length);
        }

        const checkCodePoint = chars.indexOf(gstin[gstin.length - 1]);
        const expectedCheckCodePoint = (chars.length - (sum % chars.length)) % chars.length;

        return checkCodePoint === expectedCheckCodePoint;
    }

    /**
     * Generate GST Return Data (GSTR-1, GSTR-3B format)
     */
    static generateGSTRData(invoices: any[], period: { month: number, year: number }) {
        const gstrData = {
            gstin: '',
            period: `${period.month.toString().padStart(2, '0')}-${period.year}`,
            invoices: {
                b2b: [] as any[],
                b2c: [] as any[],
                export: [] as any[]
            },
            summary: {
                totalTaxableValue: 0,
                totalCGST: 0,
                totalSGST: 0,
                totalIGST: 0,
                totalCess: 0
            }
        };

        invoices.forEach(invoice => {
            const invoiceData = {
                invoiceNo: invoice.invoiceNo,
                date: invoice.date,
                customerGSTIN: invoice.customer.gstin,
                taxableValue: invoice.taxableAmount,
                cgst: invoice.cgstTotal,
                sgst: invoice.sgstTotal,
                igst: invoice.igstTotal,
                total: invoice.grandTotal,
                placeOfSupply: invoice.customer.state
            };

            if (invoice.customer.gstin) {
                gstrData.invoices.b2b.push(invoiceData);
            } else if (invoice.customer.state !== 'TAMIL NADU') {
                gstrData.invoices.export.push(invoiceData);
            } else {
                gstrData.invoices.b2c.push(invoiceData);
            }

            gstrData.summary.totalTaxableValue += invoice.taxableAmount;
            gstrData.summary.totalCGST += invoice.cgstTotal;
            gstrData.summary.totalSGST += invoice.sgstTotal;
            gstrData.summary.totalIGST += invoice.igstTotal;
        });

        return gstrData;
    }
}
