#!/bin/bash

# ============================================
# ABC MANUFACTURING ERP - COMPLETE SETUP SCRIPT
# ============================================

echo "🏭 ABC Manufacturing ERP - Complete Setup"
echo "========================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check system requirements
check_requirements() {
    echo -e "${BLUE}Checking system requirements...${NC}"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed${NC}"
        echo -e "${YELLOW}Please install Node.js 18 or higher:${NC}"
        echo "https://nodejs.org/"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm is not installed${NC}"
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${YELLOW}⚠️ Docker is not installed (optional for production)${NC}"
    fi
    
    # Check MongoDB
    if ! command -v mongod &> /dev/null; then
        echo -e "${YELLOW}⚠️ MongoDB is not installed (optional)${NC}"
    fi
    
    echo -e "${GREEN}✅ System requirements check passed${NC}"
}

# Install backend dependencies
install_backend() {
    echo -e "${BLUE}Installing backend dependencies...${NC}"
    cd backend
    
    # Create production environment
    cp .env.production .env
    
    # Install dependencies
    npm ci --only=production
    
    # Create necessary directories
    mkdir -p logs uploads/temp uploads/products uploads/invoices
    
    # Set permissions
    chmod 755 logs uploads
    
    cd ..
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
}

# Install frontend dependencies
install_frontend() {
    echo -e "${BLUE}Installing frontend dependencies...${NC}"
    cd frontend
    
    # Create production environment
    cp .env.production .env
    
    # Install dependencies
    npm ci
    
    # Build the application
    npm run build
    
    # Create uploads directory
    mkdir -p public/uploads
    
    cd ..
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
}

# Setup database
setup_database() {
    echo -e "${BLUE}Setting up database...${NC}"
    
    # Check if MongoDB is running
    if command -v mongod &> /dev/null && pgrep mongod > /dev/null; then
        # Create database and collections
        echo -e "${YELLOW}Creating MongoDB database...${NC}"
        
        # Create initialization script
        cat > backend/mongo-init.js << EOF
// MongoDB initialization script for ABC Manufacturing ERP
db = db.getSiblingDB('factory_erp');

// Create collections
db.createCollection('users');
db.createCollection('raw_materials');
db.createCollection('finished_products');
db.createCollection('invoices');
db.createCollection('production_orders');
db.createCollection('stock_movements');
db.createCollection('customers');
db.createCollection('vendors');
db.createCollection('categories');

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ employeeId: 1 }, { unique: true });
db.users.createIndex({ role: 1 });

db.raw_materials.createIndex({ materialCode: 1 }, { unique: true });
db.raw_materials.createIndex({ category: 1 });
db.raw_materials.createIndex({ currentStock: 1 });

db.finished_products.createIndex({ productCode: 1 }, { unique: true });
db.finished_products.createIndex({ category: 1 });

db.invoices.createIndex({ invoiceNo: 1 }, { unique: true });
db.invoices.createIndex({ date: 1 });
db.invoices.createIndex({ 'customer.name': 1 });

db.production_orders.createIndex({ orderNo: 1 }, { unique: true });
db.production_orders.createIndex({ status: 1 });

// Create admin user
db.users.insertOne({
    employeeId: "MFG-001",
    name: "System Administrator",
    email: "admin@abcmfg.com",
    password: "\$2a\$12\$YourHashedPasswordHere", // admin123
    role: "admin",
    department: "production",
    accessLocations: ["main_store", "godown_1", "godown_2", "assembly_line_1", "assembly_line_2", "packing_area", "dispatch"],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
});

// Create default categories
const categories = [
    {
        code: "RM-ELEC",
        name: "Electronic Components",
        type: "raw_material",
        gstRate: 18,
        unit: "piece",
        isActive: true
    },
    {
        code: "RM-METAL",
        name: "Metal Sheets",
        type: "raw_material",
        gstRate: 18,
        unit: "kg",
        isActive: true
    },
    {
        code: "FP-INDUSTRIAL",
        name: "Industrial Control Panels",
        type: "finished_product",
        gstRate: 18,
        unit: "set",
        isActive: true
    }
];

db.categories.insertMany(categories);

print("✅ Database initialized successfully");
EOF
        
        # Run initialization script
        mongosh --quiet factory_erp backend/mongo-init.js
        
        echo -e "${GREEN}✅ Database setup completed${NC}"
    else
        echo -e "${YELLOW}⚠️ MongoDB not running, skipping database setup${NC}"
        echo -e "${YELLOW}Please start MongoDB and run:${NC}"
        echo -e "${BLUE}mongosh --quiet factory_erp backend/mongo-init.js${NC}"
    fi
}

# Setup barcode/RFID hardware
setup_hardware() {
    echo -e "${BLUE}Setting up barcode/RFID hardware...${NC}"
    
    # Check for connected barcode scanners
    if [ -d "/dev/serial/by-id" ]; then
        echo -e "${YELLOW}Found serial devices:${NC}"
        ls -la /dev/serial/by-id/ || true
    fi
    
    # Install USB utilities
    if command -v apt-get &> /dev/null; then
        echo -e "${YELLOW}Installing USB utilities...${NC}"
        sudo apt-get update
        sudo apt-get install -y usbutils sane-utils
    fi
    
    # Setup udev rules for barcode scanners
    echo -e "${YELLOW}Setting up udev rules...${NC}"
    sudo tee /etc/udev/rules.d/99-barcode-scanner.rules << EOF
# Barcode Scanner Rules
SUBSYSTEM=="usb", ATTRS{idVendor}=="0c2e", ATTRS{idProduct}=="0901", MODE="0666", GROUP="plugdev"
SUBSYSTEM=="usb", ATTRS{idVendor}=="05fe", ATTRS{idProduct}=="1010", MODE="0666", GROUP="plugdev"
SUBSYSTEM=="usb", ATTRS{idVendor}=="1a86", ATTRS{idProduct}=="7523", MODE="0666", GROUP="plugdev"
EOF
    
    # Reload udev rules
    sudo udevadm control --reload-rules
    sudo udevadm trigger
    
    echo -e "${GREEN}✅ Hardware setup completed${NC}"
}

# Setup backup system
setup_backup() {
    echo -e "${BLUE}Setting up backup system...${NC}"
    
    # Create backup directory
    mkdir -p /var/backups/factory-erp
    chmod 700 /var/backups/factory-erp
    
    # Create backup script
    sudo tee /usr/local/bin/backup-factory-erp.sh << 'EOF'
#!/bin/bash
# Factory ERP Backup Script

BACKUP_DIR="/var/backups/factory-erp"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/factory_erp_$DATE.tar.gz"

# MongoDB backup
mongodump --db factory_erp --out $BACKUP_DIR/mongodb_$DATE

# File uploads backup
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C /path/to/factory-erp/backend/uploads .

# Logs backup
tar -czf $BACKUP_DIR/logs_$DATE.tar.gz -C /path/to/factory-erp/backend/logs .

# Create complete backup
tar -czf $BACKUP_FILE \
    $BACKUP_DIR/mongodb_$DATE \
    $BACKUP_DIR/uploads_$DATE.tar.gz \
    $BACKUP_DIR/logs_$DATE.tar.gz

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "factory_erp_*.tar.gz" -mtime +30 -delete
find $BACKUP_DIR -name "mongodb_*" -type d -mtime +7 -exec rm -rf {} \;
find $BACKUP_DIR -name "*.tar.gz" ! -name "factory_erp_*.tar.gz" -mtime +7 -delete

# Sync to remote backup (optional)
# rsync -avz $BACKUP_FILE backup@remote-server:/backups/

echo "Backup completed: $BACKUP_FILE"
EOF
    
    sudo chmod +x /usr/local/bin/backup-factory-erp.sh
    
    # Setup cron job for daily backups at 2 AM
    (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-factory-erp.sh") | crontab -
    
    echo -e "${GREEN}✅ Backup system setup completed${NC}"
}

# Setup monitoring
setup_monitoring() {
    echo -e "${BLUE}Setting up monitoring...${NC}"
    
    # Install PM2 for process management
    npm install -g pm2
    
    # Create PM2 ecosystem file
    cat > backend/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'factory-erp-backend',
    script: 'dist/app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_file: 'logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    wait_ready: true,
    listen_timeout: 10000,
    kill_timeout: 5000
  }]
};
EOF
    
    # Create monitoring dashboard
    pm2 install pm2-logrotate
    pm2 set pm2-logrotate:max_size 10M
    pm2 set pm2-logrotate:retain 30
    
    echo -e "${GREEN}✅ Monitoring setup completed${NC}"
}

# Print completion message
print_completion() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}🎉 ABC Manufacturing ERP Setup Complete!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo ""
    echo -e "1. ${BLUE}Start the application:${NC}"
    echo -e "   cd backend && npm start"
    echo ""
    echo -e "2. ${BLUE}Access the application:${NC}"
    echo -e "   Frontend: ${GREEN}http://localhost:3000${NC}"
    echo -e "   Backend API: ${GREEN}http://localhost:5000${NC}"
    echo ""
    echo -e "3. ${BLUE}Default Login Credentials:${NC}"
    echo -e "   Employee ID: ${GREEN}MFG-001${NC}"
    echo -e "   Password: ${GREEN}admin123${NC}"
    echo ""
    echo -e "4. ${BLUE}Configure your settings:${NC}"
    echo -e "   - Update .env files with your API keys"
    echo -e "   - Add your company logo to frontend/public"
    echo -e "   - Configure GST rates in GSTService.ts"
    echo ""
    echo -e "5. ${BLUE}For production deployment:${NC}"
    echo -e "   docker-compose up -d"
    echo ""
    echo -e "${YELLOW}Support:${NC}"
    echo -e "📧 Email: support@abcmfg.com"
    echo -e "📞 Phone: +91 44 1234 5678"
    echo ""
}

# Main execution
main() {
    echo -e "${BLUE}Starting ABC Manufacturing ERP setup...${NC}"
    
    check_requirements
    install_backend
    install_frontend
    setup_database
    setup_hardware
    setup_backup
    setup_monitoring
    print_completion
}

# Run main function
main "$@"
