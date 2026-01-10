import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

export class RFIDService {
    private port: SerialPort | null = null;
    private parser: any = null;
    private isConnected = false;
    private onTagCallback: ((tagId: string, data: any) => void) | null = null;

    /**
     * Connect to RFID reader
     */
    async connect(portPath: string = '/dev/ttyUSB0', baudRate: number = 9600): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                this.port = new SerialPort({
                    path: portPath,
                    baudRate: baudRate,
                    dataBits: 8,
                    parity: 'none',
                    stopBits: 1
                });

                this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

                this.port.on('open', () => {
                    this.isConnected = true;
                    console.log(`RFID Reader connected on ${portPath}`);
                    this.setupReader();
                    resolve(true);
                });

                this.port.on('error', (error) => {
                    console.error('RFID Reader error:', error);
                    this.isConnected = false;
                    reject(error);
                });

                this.port.on('close', () => {
                    this.isConnected = false;
                    console.log('RFID Reader disconnected');
                });

                // Handle incoming data
                this.parser.on('data', (data: string) => {
                    this.handleRFIDData(data.trim());
                });

            } catch (error) {
                console.error('Failed to connect RFID reader:', error);
                reject(error);
            }
        });
    }

    /**
     * Setup RFID reader configuration
     */
    private setupReader() {
        if (!this.port || !this.isConnected) return;

        // Send configuration commands
        const commands = [
            'SET ANTENNA 1',      // Use antenna 1
            'SET POWER 30',       // Set power to 30dBm
            'SET SESSION S0',     // Set session to S0
            'SET TAGPOPULATION 50', // Expected tag population
            'SET TAGDATABASE ON'  // Enable tag database
        ];

        commands.forEach(command => {
            this.sendCommand(command);
        });
    }

    /**
     * Send command to RFID reader
     */
    private sendCommand(command: string): void {
        if (!this.port || !this.isConnected) return;

        this.port.write(`${command}\r\n`, (error) => {
            if (error) {
                console.error('Failed to send command:', error);
            }
        });
    }

    /**
     * Handle incoming RFID data
     */
    private handleRFIDData(data: string): void {
        if (!data || data.length === 0) return;

        console.log('RFID Data received:', data);

        // Parse different RFID data formats
        try {
            // Format 1: Simple tag ID
            if (data.startsWith('E200')) {
                const tagId = data;
                this.processTag(tagId, { timestamp: new Date() });
            }
            // Format 2: JSON data from smart tags
            else if (data.startsWith('{')) {
                const tagData = JSON.parse(data);
                this.processTag(tagData.id, tagData);
            }
            // Format 3: CSV format
            else if (data.includes(',')) {
                const parts = data.split(',');
                if (parts.length >= 2) {
                    this.processTag(parts[0], {
                        rssi: parts[1],
                        antenna: parts[2],
                        timestamp: new Date()
                    });
                }
            }
        } catch (error) {
            console.error('Failed to parse RFID data:', error);
        }
    }

    /**
     * Process RFID tag
     */
    private processTag(tagId: string, data: any): void {
        // Add timestamp if not present
        if (!data.timestamp) {
            data.timestamp = new Date();
        }

        // Add location based on reader/antenna
        data.location = this.getLocationFromAntenna(data.antenna);

        // Notify callback
        if (this.onTagCallback) {
            this.onTagCallback(tagId, data);
        }

        // Log the scan
        this.logTagScan(tagId, data);
    }

    /**
     * Start inventory scan
     */
    startInventoryScan(): void {
        if (!this.isConnected) {
            throw new Error('RFID reader not connected');
        }

        this.sendCommand('START INVENTORY');
        console.log('RFID inventory scan started');
    }

    /**
     * Stop inventory scan
     */
    stopInventoryScan(): void {
        if (!this.isConnected) return;

        this.sendCommand('STOP INVENTORY');
        console.log('RFID inventory scan stopped');
    }

    /**
     * Read tag data
     */
    readTagData(tagId: string): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('RFID reader not connected'));
                return;
            }

            this.sendCommand(`READ TAG ${tagId}`);

            // Set up temporary listener for response
            const timeout = setTimeout(() => {
                reject(new Error('Timeout reading tag data'));
            }, 5000);

            const originalCallback = this.onTagCallback;
            this.onTagCallback = (id: string, data: any) => {
                if (id === tagId) {
                    clearTimeout(timeout);
                    this.onTagCallback = originalCallback;
                    resolve(data);
                }
            };
        });
    }

    /**
     * Write data to tag
     */
    writeTagData(tagId: string, data: any): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('RFID reader not connected'));
                return;
            }

            const jsonData = JSON.stringify(data);
            this.sendCommand(`WRITE TAG ${tagId} ${jsonData}`);

            setTimeout(() => {
                resolve(true);
            }, 1000);
        });
    }

    /**
     * Set callback for tag detection
     */
    onTagDetected(callback: (tagId: string, data: any) => void): void {
        this.onTagCallback = callback;
    }

    /**
     * Get location based on antenna number
     */
    private getLocationFromAntenna(antenna: number): string {
        const locations: Record<number, string> = {
            1: 'Receiving Area',
            2: 'Main Store',
            3: 'Assembly Line 1',
            4: 'Assembly Line 2',
            5: 'Packing Area',
            6: 'Dispatch Area'
        };

        return locations[antenna] || 'Unknown Location';
    }

    /**
     * Log tag scan to database
     */
    private async logTagScan(tagId: string, data: any): Promise<void> {
        try {
            // This would save to database in production
            const scanLog = {
                tagId,
                timestamp: data.timestamp,
                location: data.location,
                rssi: data.rssi,
                antenna: data.antenna,
                rawData: data
            };

            console.log('Tag scan logged:', scanLog);

            // Here you would save to MongoDB
            // await RFIDScan.create(scanLog);

        } catch (error) {
            console.error('Failed to log tag scan:', error);
        }
    }

    /**
     * Disconnect from RFID reader
     */
    disconnect(): void {
        if (this.port && this.isConnected) {
            this.stopInventoryScan();
            this.port.close();
            this.isConnected = false;
        }
    }

    /**
     * Get connection status
     */
    getStatus(): { connected: boolean; port: string | null } {
        return {
            connected: this.isConnected,
            port: this.port?.path || null
        };
    }

    /**
     * Scan for available RFID readers
     */
    static async scanForReaders(): Promise<string[]> {
        return new Promise((resolve) => {
            SerialPort.list().then((ports) => {
                const rfidPorts = ports
                    .filter(port =>
                        port.manufacturer?.includes('RFID') ||
                        port.productId?.includes('RFID') ||
                        port.path.includes('USB')
                    )
                    .map(port => port.path);

                resolve(rfidPorts);
            }).catch(() => {
                resolve([]);
            });
        });
    }
}
