import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';

export class EmailService {
    private transporter: any;
    private useSendGrid: boolean;

    constructor() {
        this.useSendGrid = process.env.EMAIL_PROVIDER === 'sendgrid';

        if (this.useSendGrid) {
            sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
        } else {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                },
                tls: {
                    rejectUnauthorized: false
                }
            });
        }
    }

    /**
     * Send email using SendGrid or SMTP
     */
    async sendEmail(to: string, subject: string, html: string, attachments?: any[]) {
        const mailOptions: any = {
            from: {
                name: process.env.FROM_NAME || 'ABC Manufacturing ERP',
                address: process.env.FROM_EMAIL!
            },
            to,
            subject,
            html,
            attachments
        };

        try {
            if (this.useSendGrid) {
                // Adapt for SendGrid if needed, but for now just casting to suppress TS error
                // SendGrid expects 'email' key, Nodemailer expects 'address'
                if (mailOptions.from.address) {
                    mailOptions.from.email = mailOptions.from.address;
                }
                await sgMail.send(mailOptions);
            } else {
                await this.transporter.sendMail(mailOptions);
            }
            console.log(`Email sent to ${to}`);
            return true;
        } catch (error) {
            console.error('Email sending failed:', error);
            return false;
        }
    }

    /**
     * Load and compile email template
     */
    private async loadTemplate(templateName: string, data: any): Promise<string> {
        const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.hbs`);

        try {
            const templateContent = await fs.readFile(templatePath, 'utf-8');
            const template = Handlebars.compile(templateContent);
            return template(data);
        } catch (error) {
            console.error(`Template ${templateName} not found, using default`);
            return this.getDefaultTemplate(data);
        }
    }

    /**
     * Send welcome email to new user
     */
    async sendWelcomeEmail(user: {
        name: string;
        email: string;
        employeeId: string;
        role: string;
        password?: string;
    }) {
        const templateData = {
            companyName: 'ABC Manufacturing',
            userName: user.name,
            employeeId: user.employeeId,
            role: user.role,
            loginUrl: `${process.env.FRONTEND_URL}/login`,
            supportEmail: 'support@abcmfg.com',
            year: new Date().getFullYear()
        };

        const html = await this.loadTemplate('welcome', templateData);
        const subject = `Welcome to ABC Manufacturing ERP - ${user.employeeId}`;

        return this.sendEmail(user.email, subject, html);
    }

    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(user: {
        name: string;
        email: string;
        resetToken: string;
    }) {
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${user.resetToken}`;

        const templateData = {
            companyName: 'ABC Manufacturing',
            userName: user.name,
            resetLink,
            expiryHours: 1,
            supportEmail: 'support@abcmfg.com',
            year: new Date().getFullYear()
        };

        const html = await this.loadTemplate('password-reset', templateData);
        const subject = 'Password Reset Request - ABC Manufacturing ERP';

        return this.sendEmail(user.email, subject, html);
    }

    /**
     * Send invoice email
     */
    async sendInvoiceEmail(customer: {
        name: string;
        email: string;
    }, invoice: {
        invoiceNo: string;
        date: Date;
        amount: number;
        pdfBuffer: Buffer;
    }) {
        const templateData = {
            companyName: 'ABC Manufacturing',
            customerName: customer.name,
            invoiceNo: invoice.invoiceNo,
            invoiceDate: new Date(invoice.date).toLocaleDateString(),
            invoiceAmount: invoice.amount.toLocaleString('en-IN', {
                style: 'currency',
                currency: 'INR'
            }),
            paymentLink: `${process.env.FRONTEND_URL}/pay/${invoice.invoiceNo}`,
            supportEmail: 'accounts@abcmfg.com',
            year: new Date().getFullYear()
        };

        const html = await this.loadTemplate('invoice', templateData);
        const subject = `Invoice #${invoice.invoiceNo} from ABC Manufacturing`;

        const attachments = [{
            filename: `Invoice_${invoice.invoiceNo}.pdf`,
            content: invoice.pdfBuffer,
            contentType: 'application/pdf'
        }];

        return this.sendEmail(customer.email, subject, html, attachments);
    }

    /**
     * Send low stock alert
     */
    async sendLowStockAlert(items: Array<{
        code: string;
        name: string;
        currentStock: number;
        minStock: number;
        unit: string;
    }>, recipients: string[]) {
        const templateData = {
            companyName: 'ABC Manufacturing',
            items,
            totalItems: items.length,
            dashboardUrl: `${process.env.FRONTEND_URL}/inventory`,
            year: new Date().getFullYear()
        };

        const html = await this.loadTemplate('low-stock-alert', templateData);
        const subject = `Low Stock Alert - ${items.length} items below minimum level`;

        // Send to multiple recipients
        const promises = recipients.map(recipient =>
            this.sendEmail(recipient, subject, html)
        );

        return Promise.all(promises);
    }

    /**
     * Send production completion notification
     */
    async sendProductionCompleteEmail(order: {
        orderNo: string;
        productName: string;
        quantity: number;
        completedBy: string;
        completionDate: Date;
    }, recipients: string[]) {
        const templateData = {
            companyName: 'ABC Manufacturing',
            orderNo: order.orderNo,
            productName: order.productName,
            quantity: order.quantity,
            completedBy: order.completedBy,
            completionDate: new Date(order.completionDate).toLocaleString(),
            dashboardUrl: `${process.env.FRONTEND_URL}/production`,
            year: new Date().getFullYear()
        };

        const html = await this.loadTemplate('production-complete', templateData);
        const subject = `Production Order ${order.orderNo} Completed`;

        const promises = recipients.map(recipient =>
            this.sendEmail(recipient, subject, html)
        );

        return Promise.all(promises);
    }

    /**
     * Send GST report email
     */
    async sendGSTReportEmail(period: { month: string; year: number }, reportData: any, recipients: string[]) {
        const templateData = {
            companyName: 'ABC Manufacturing',
            period: `${period.month} ${period.year}`,
            totalSales: reportData.totalSales.toLocaleString('en-IN', {
                style: 'currency',
                currency: 'INR'
            }),
            totalGST: reportData.totalGst.toLocaleString('en-IN', {
                style: 'currency',
                currency: 'INR'
            }),
            reportUrl: `${process.env.FRONTEND_URL}/reports/gst`,
            year: new Date().getFullYear()
        };

        const html = await this.loadTemplate('gst-report', templateData);
        const subject = `GST Report - ${period.month} ${period.year} - ABC Manufacturing`;

        const promises = recipients.map(recipient =>
            this.sendEmail(recipient, subject, html)
        );

        return Promise.all(promises);
    }

    /**
     * Send daily summary email
     */
    async sendDailySummaryEmail(summary: {
        date: Date;
        totalSales: number;
        totalProduction: number;
        lowStockItems: number;
        pendingPayments: number;
    }, recipients: string[]) {
        const templateData = {
            companyName: 'ABC Manufacturing',
            date: new Date(summary.date).toLocaleDateString(),
            totalSales: summary.totalSales.toLocaleString('en-IN', {
                style: 'currency',
                currency: 'INR'
            }),
            totalProduction: summary.totalProduction,
            lowStockItems: summary.lowStockItems,
            pendingPayments: summary.pendingPayments.toLocaleString('en-IN', {
                style: 'currency',
                currency: 'INR'
            }),
            dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
            year: new Date().getFullYear()
        };

        const html = await this.loadTemplate('daily-summary', templateData);
        const subject = `Daily Summary - ${new Date(summary.date).toLocaleDateString()} - ABC Manufacturing`;

        const promises = recipients.map(recipient =>
            this.sendEmail(recipient, subject, html)
        );

        return Promise.all(promises);
    }

    /**
     * Send delivery status update email
     */
    async sendDeliveryUpdateEmail(data: {
        invoiceNo: string;
        customerName: string;
        customerEmail?: string;
        status: string;
        updatedBy: string;
        reason?: string;
    }, adminEmails: string[]) {
        const cssClasses: any = {
            'delivered': 'delivered',
            'failed': 'failed',
            'out_for_delivery': 'shipped',
            'assigned': 'shipped'
        };

        const templateData = {
            invoiceNo: data.invoiceNo,
            customerName: data.customerName,
            status: data.status.replace(/_/g, ' ').toUpperCase(),
            cssClass: cssClasses[data.status] || 'shipped',
            updatedBy: data.updatedBy,
            timestamp: new Date().toLocaleString(),
            reason: data.reason,
            showAction: true,
            actionUrl: `${process.env.FRONTEND_URL}/billing`, // Or deep link if available
            year: new Date().getFullYear()
        };

        const html = await this.loadTemplate('delivery-status', templateData);
        const subject = `Delivery Update: Invoice #${data.invoiceNo} - ${data.status.toUpperCase()}`;

        const promises = adminEmails.map(email =>
            this.sendEmail(email, subject, html)
        );

        if (data.customerEmail) {
            promises.push(this.sendEmail(data.customerEmail, subject, html));
        }

        return Promise.all(promises);
    }

    private getDefaultTemplate(data: any): string {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ABC Manufacturing ERP</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
          }
          .header {
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 8px 8px;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #64748b;
            font-size: 12px;
            border-top: 1px solid #e5e7eb;
            margin-top: 30px;
          }
          .button {
            display: inline-block;
            background-color: #f97316;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">ABC MANUFACTURING</div>
            <div>Industrial ERP System</div>
          </div>
          <div class="content">
            ${data.content || 'This is an automated email from ABC Manufacturing ERP System.'}
            <br><br>
            <a href="${data.actionUrl || '#'}" class="button">
              ${data.actionText || 'Take Action'}
            </a>
          </div>
          <div class="footer">
            © ${data.year || new Date().getFullYear()} ABC Manufacturing Pvt. Ltd.<br>
            123 Industrial Estate, Chennai - 600032<br>
            Phone: +91 44 1234 5678 | Email: info@abcmfg.com<br>
            This is an automated email. Please do not reply.
          </div>
        </div>
      </body>
      </html>
    `;
    }
}
