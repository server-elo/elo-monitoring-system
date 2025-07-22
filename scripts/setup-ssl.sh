#!/bin/bash

# SSL/TLS Certificate Setup Script
# Supports both Let's Encrypt (production) and self-signed (development)

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
CERT_TYPE=${1:-letsencrypt}  # letsencrypt or self-signed
DOMAIN=${2:-your-domain.com}
EMAIL=${3:-admin@your-domain.com}
SSL_DIR="./ssl"
NGINX_SSL_DIR="./nginx/ssl"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create SSL directories
create_ssl_directories() {
    log_info "Creating SSL directories..."
    mkdir -p "$SSL_DIR"
    mkdir -p "$NGINX_SSL_DIR"
    mkdir -p "./certbot/conf"
    mkdir -p "./certbot/www"
    log_info "SSL directories created ✓"
}

# Generate self-signed certificate
generate_self_signed() {
    log_info "Generating self-signed certificate for development..."
    
    # Generate private key
    openssl genrsa -out "$SSL_DIR/key.pem" 2048
    
    # Generate certificate signing request
    openssl req -new -key "$SSL_DIR/key.pem" \
        -out "$SSL_DIR/csr.pem" \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN"
    
    # Generate self-signed certificate (valid for 365 days)
    openssl x509 -req -days 365 \
        -in "$SSL_DIR/csr.pem" \
        -signkey "$SSL_DIR/key.pem" \
        -out "$SSL_DIR/cert.pem"
    
    # Copy to nginx directory
    cp "$SSL_DIR/cert.pem" "$NGINX_SSL_DIR/cert.pem"
    cp "$SSL_DIR/key.pem" "$NGINX_SSL_DIR/key.pem"
    
    # Set permissions
    chmod 644 "$NGINX_SSL_DIR/cert.pem"
    chmod 600 "$NGINX_SSL_DIR/key.pem"
    
    log_info "Self-signed certificate generated ✓"
    log_warn "This certificate is for development only!"
}

# Setup Let's Encrypt
setup_letsencrypt() {
    log_info "Setting up Let's Encrypt certificates..."
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    # Create docker-compose for certbot
    cat > docker-compose.certbot.yml << EOF
version: '3.8'

services:
  nginx-certbot:
    image: nginx:alpine
    container_name: nginx-certbot
    ports:
      - "80:80"
    volumes:
      - ./certbot/www:/var/www/certbot:ro
      - ./nginx/conf.d/certbot.conf:/etc/nginx/conf.d/default.conf:ro
    networks:
      - certbot_network

  certbot:
    image: certbot/certbot
    container_name: certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    depends_on:
      - nginx-certbot
    networks:
      - certbot_network

networks:
  certbot_network:
    driver: bridge
EOF

    # Create nginx config for certbot
    cat > ./nginx/conf.d/certbot.conf << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$server_name\$request_uri;
    }
}
EOF

    # Start nginx for certbot
    log_info "Starting nginx for certificate validation..."
    docker-compose -f docker-compose.certbot.yml up -d nginx-certbot
    
    # Wait for nginx to start
    sleep 5
    
    # Request certificate
    log_info "Requesting certificate from Let's Encrypt..."
    docker-compose -f docker-compose.certbot.yml run --rm certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        -d "$DOMAIN" \
        -d "www.$DOMAIN"
    
    # Check if certificate was obtained
    if [ -f "./certbot/conf/live/$DOMAIN/fullchain.pem" ]; then
        log_info "Certificate obtained successfully ✓"
        
        # Copy certificates to nginx directory
        cp "./certbot/conf/live/$DOMAIN/fullchain.pem" "$NGINX_SSL_DIR/cert.pem"
        cp "./certbot/conf/live/$DOMAIN/privkey.pem" "$NGINX_SSL_DIR/key.pem"
        
        # Set permissions
        chmod 644 "$NGINX_SSL_DIR/cert.pem"
        chmod 600 "$NGINX_SSL_DIR/key.pem"
        
        log_info "Certificates copied to nginx directory ✓"
    else
        log_error "Failed to obtain certificate"
        docker-compose -f docker-compose.certbot.yml logs certbot
        cleanup_certbot
        exit 1
    fi
    
    # Cleanup
    cleanup_certbot
}

# Setup certificate renewal
setup_renewal() {
    log_info "Setting up automatic certificate renewal..."
    
    # Create renewal script
    cat > "$SSL_DIR/renew-certificates.sh" << 'EOF'
#!/bin/bash

# Certificate renewal script
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Function to log with timestamp
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log "Starting certificate renewal..."

# Run certbot renewal
docker run --rm \
    -v ./certbot/conf:/etc/letsencrypt \
    -v ./certbot/www:/var/www/certbot \
    certbot/certbot renew --quiet

# Check if renewal was successful
if [ $? -eq 0 ]; then
    log "Certificate renewal successful"
    
    # Copy new certificates
    cp ./certbot/conf/live/*/fullchain.pem ./nginx/ssl/cert.pem
    cp ./certbot/conf/live/*/privkey.pem ./nginx/ssl/key.pem
    
    # Reload nginx
    docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
    
    log "Nginx reloaded with new certificates"
else
    log "Certificate renewal failed"
    exit 1
fi
EOF

    chmod +x "$SSL_DIR/renew-certificates.sh"
    
    # Create systemd timer (if systemd is available)
    if command -v systemctl &> /dev/null; then
        log_info "Creating systemd timer for automatic renewal..."
        
        # Create service file
        sudo tee /etc/systemd/system/certbot-renewal.service > /dev/null << EOF
[Unit]
Description=Certbot Renewal
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
ExecStart=$(pwd)/$SSL_DIR/renew-certificates.sh
User=$USER
Group=$USER
EOF

        # Create timer file
        sudo tee /etc/systemd/system/certbot-renewal.timer > /dev/null << EOF
[Unit]
Description=Run Certbot Renewal twice daily
Requires=certbot-renewal.service

[Timer]
OnCalendar=*-*-* 00,12:00:00
RandomizedDelaySec=1h
Persistent=true

[Install]
WantedBy=timers.target
EOF

        # Enable timer
        sudo systemctl daemon-reload
        sudo systemctl enable certbot-renewal.timer
        sudo systemctl start certbot-renewal.timer
        
        log_info "Systemd timer created and enabled ✓"
    else
        log_info "Creating cron job for automatic renewal..."
        
        # Add cron job
        (crontab -l 2>/dev/null; echo "0 0,12 * * * $(pwd)/$SSL_DIR/renew-certificates.sh >> $(pwd)/logs/certbot-renewal.log 2>&1") | crontab -
        
        log_info "Cron job created ✓"
    fi
}

# Cleanup certbot containers
cleanup_certbot() {
    log_info "Cleaning up certbot containers..."
    docker-compose -f docker-compose.certbot.yml down
    rm -f docker-compose.certbot.yml
    rm -f ./nginx/conf.d/certbot.conf
}

# Generate Diffie-Hellman parameters
generate_dhparam() {
    log_info "Generating Diffie-Hellman parameters..."
    
    if [ ! -f "$NGINX_SSL_DIR/dhparam.pem" ]; then
        openssl dhparam -out "$NGINX_SSL_DIR/dhparam.pem" 2048
        log_info "DH parameters generated ✓"
    else
        log_info "DH parameters already exist ✓"
    fi
}

# Update nginx configuration
update_nginx_config() {
    log_info "Updating nginx configuration..."
    
    # Check if domain placeholder needs to be replaced
    if grep -q "your-domain.com" ./nginx/conf.d/default.conf; then
        log_info "Updating domain in nginx configuration..."
        sed -i "s/your-domain.com/$DOMAIN/g" ./nginx/conf.d/default.conf
        log_info "Domain updated ✓"
    fi
    
    # Add DH parameters to nginx config if not present
    if ! grep -q "ssl_dhparam" ./nginx/conf.d/default.conf; then
        log_info "Adding DH parameters to nginx configuration..."
        sed -i '/ssl_prefer_server_ciphers on;/a\    ssl_dhparam /etc/nginx/ssl/dhparam.pem;' ./nginx/conf.d/default.conf
        log_info "DH parameters added ✓"
    fi
}

# Verify SSL configuration
verify_ssl() {
    log_info "Verifying SSL configuration..."
    
    # Check if certificate files exist
    if [ -f "$NGINX_SSL_DIR/cert.pem" ] && [ -f "$NGINX_SSL_DIR/key.pem" ]; then
        log_info "Certificate files found ✓"
        
        # Verify certificate
        openssl x509 -in "$NGINX_SSL_DIR/cert.pem" -text -noout | grep -E "Subject:|Not After" || true
        
        # Test nginx configuration
        if docker run --rm -v "$(pwd)/nginx:/etc/nginx:ro" nginx:alpine nginx -t; then
            log_info "Nginx configuration is valid ✓"
        else
            log_error "Nginx configuration is invalid"
            exit 1
        fi
    else
        log_error "Certificate files not found"
        exit 1
    fi
}

# Main execution
main() {
    log_info "Starting SSL/TLS setup..."
    log_info "Certificate type: $CERT_TYPE"
    log_info "Domain: $DOMAIN"
    
    # Create directories
    create_ssl_directories
    
    # Generate certificates based on type
    case "$CERT_TYPE" in
        "self-signed")
            generate_self_signed
            ;;
        "letsencrypt")
            setup_letsencrypt
            setup_renewal
            ;;
        *)
            log_error "Invalid certificate type. Use 'self-signed' or 'letsencrypt'"
            exit 1
            ;;
    esac
    
    # Generate DH parameters
    generate_dhparam
    
    # Update nginx configuration
    update_nginx_config
    
    # Verify configuration
    verify_ssl
    
    log_info "🔒 SSL/TLS setup completed successfully!"
    
    if [ "$CERT_TYPE" = "self-signed" ]; then
        log_warn "You are using a self-signed certificate. Browsers will show security warnings."
        log_info "For production, run: ./scripts/setup-ssl.sh letsencrypt $DOMAIN $EMAIL"
    else
        log_info "Let's Encrypt certificate installed and automatic renewal configured."
        log_info "Certificate will be renewed automatically every 12 hours."
    fi
}

# Show usage
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    echo "Usage: $0 [certificate-type] [domain] [email]"
    echo ""
    echo "Certificate types:"
    echo "  self-signed  - Generate self-signed certificate (development)"
    echo "  letsencrypt  - Use Let's Encrypt (production)"
    echo ""
    echo "Examples:"
    echo "  $0 self-signed localhost"
    echo "  $0 letsencrypt example.com admin@example.com"
    exit 0
fi

# Run main function
main