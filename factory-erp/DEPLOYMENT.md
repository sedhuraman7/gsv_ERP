# 🚀 Production Deployment Checklist
Final Deployment Commands

# 1. Clone and setup
git clone https://github.com/abcmfg/factory-erp.git
cd factory-erp
chmod +x setup.sh
./setup.sh

# 2. Production deployment with Docker
docker-compose -f docker-compose.prod.yml up -d

# 3. Setup SSL with Let's Encrypt
docker run -it --rm --name certbot \
  -v "/etc/letsencrypt:/etc/letsencrypt" \
  -v "/var/lib/letsencrypt:/var/lib/letsencrypt" \
  -p 80:80 \
  certbot/certbot certonly \
  --standalone \
  --email admin@abcmfg.com \
  --agree-tos \
  --no-eff-email \
  -d erp.abcmfg.com \
  -d api.abcmfg.com

# 4. Start monitoring
cd backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# 5. Setup automated backups
sudo systemctl enable factory-erp-backup.timer
