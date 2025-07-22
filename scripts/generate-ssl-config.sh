#!/bin/bash

# SSL/TLS Configuration Generator
# Generates optimized SSL configurations for different scenarios

set -e

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
CONFIG_TYPE=${1:-modern}  # modern, intermediate, or old
OUTPUT_DIR="./nginx/ssl-configs"

# Create output directory
mkdir -p "$OUTPUT_DIR"

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

# Generate modern configuration (TLS 1.3 only)
generate_modern_config() {
    log_info "Generating modern SSL configuration (TLS 1.3 only)..."
    
    cat > "$OUTPUT_DIR/ssl-modern.conf" << 'EOF'
# Modern SSL Configuration
# Supports: Firefox 63+, Chrome 70+, Safari 12.1+

# SSL/TLS settings
ssl_protocols TLSv1.3;
ssl_prefer_server_ciphers off;

# SSL session settings
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:10m;
ssl_session_tickets off;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;

# Security headers
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; connect-src 'self' https: wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';" always;
add_header Permissions-Policy "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()" always;

# Certificate settings
ssl_certificate /etc/nginx/ssl/cert.pem;
ssl_certificate_key /etc/nginx/ssl/key.pem;
ssl_trusted_certificate /etc/nginx/ssl/cert.pem;
EOF
    
    log_info "Modern configuration generated ✓"
}

# Generate intermediate configuration (TLS 1.2+)
generate_intermediate_config() {
    log_info "Generating intermediate SSL configuration (TLS 1.2+)..."
    
    cat > "$OUTPUT_DIR/ssl-intermediate.conf" << 'EOF'
# Intermediate SSL Configuration
# Supports: Firefox 27+, Chrome 30+, Safari 9+, Edge 12+

# SSL/TLS settings
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;

# DH parameters (generate with: openssl dhparam -out dhparam.pem 2048)
ssl_dhparam /etc/nginx/ssl/dhparam.pem;

# SSL session settings
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:10m;
ssl_session_tickets off;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;

# Security headers
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; connect-src 'self' https: wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';" always;
add_header Permissions-Policy "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()" always;

# Certificate settings
ssl_certificate /etc/nginx/ssl/cert.pem;
ssl_certificate_key /etc/nginx/ssl/key.pem;
ssl_trusted_certificate /etc/nginx/ssl/cert.pem;
EOF
    
    log_info "Intermediate configuration generated ✓"
}

# Generate old configuration (TLS 1.0+) - NOT RECOMMENDED
generate_old_config() {
    log_info "Generating old SSL configuration (TLS 1.0+) - NOT RECOMMENDED..."
    
    cat > "$OUTPUT_DIR/ssl-old.conf" << 'EOF'
# Old SSL Configuration - NOT RECOMMENDED FOR PRODUCTION
# Supports: Firefox 1+, Chrome 1+, Safari 1+, IE 8+ on Windows 7

# WARNING: This configuration includes weak protocols and ciphers
# Only use if you absolutely must support very old clients

# SSL/TLS settings
ssl_protocols TLSv1 TLSv1.1 TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384:DHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA:ECDHE-RSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES256-SHA256:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA:DES-CBC3-SHA;
ssl_prefer_server_ciphers on;

# DH parameters
ssl_dhparam /etc/nginx/ssl/dhparam.pem;

# SSL session settings
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:10m;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;

# Security headers (reduced for compatibility)
add_header Strict-Transport-Security "max-age=63072000" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;

# Certificate settings
ssl_certificate /etc/nginx/ssl/cert.pem;
ssl_certificate_key /etc/nginx/ssl/key.pem;
ssl_trusted_certificate /etc/nginx/ssl/cert.pem;
EOF
    
    log_info "Old configuration generated ⚠️"
    log_info "WARNING: This configuration includes weak protocols for compatibility"
}

# Generate CloudFlare configuration
generate_cloudflare_config() {
    log_info "Generating CloudFlare-optimized SSL configuration..."
    
    cat > "$OUTPUT_DIR/ssl-cloudflare.conf" << 'EOF'
# CloudFlare-Optimized SSL Configuration
# For use when CloudFlare is proxying traffic

# SSL/TLS settings (CloudFlare will handle client SSL)
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305;
ssl_prefer_server_ciphers off;

# SSL session settings
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:10m;
ssl_session_tickets off;

# CloudFlare authenticated origin pulls
# Download CF certificates: https://developers.cloudflare.com/ssl/origin-configuration/authenticated-origin-pull/
# ssl_client_certificate /etc/nginx/ssl/cloudflare.crt;
# ssl_verify_client on;

# Security headers (some handled by CloudFlare)
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# Real IP from CloudFlare
set_real_ip_from 173.245.48.0/20;
set_real_ip_from 103.21.244.0/22;
set_real_ip_from 103.22.200.0/22;
set_real_ip_from 103.31.4.0/22;
set_real_ip_from 141.101.64.0/18;
set_real_ip_from 108.162.192.0/18;
set_real_ip_from 190.93.240.0/20;
set_real_ip_from 188.114.96.0/20;
set_real_ip_from 197.234.240.0/22;
set_real_ip_from 198.41.128.0/17;
set_real_ip_from 162.158.0.0/15;
set_real_ip_from 104.16.0.0/13;
set_real_ip_from 104.24.0.0/14;
set_real_ip_from 172.64.0.0/13;
set_real_ip_from 131.0.72.0/22;
set_real_ip_from 2400:cb00::/32;
set_real_ip_from 2606:4700::/32;
set_real_ip_from 2803:f800::/32;
set_real_ip_from 2405:b500::/32;
set_real_ip_from 2405:8100::/32;
set_real_ip_from 2a06:98c0::/29;
set_real_ip_from 2c0f:f248::/32;
real_ip_header CF-Connecting-IP;

# Certificate settings
ssl_certificate /etc/nginx/ssl/cert.pem;
ssl_certificate_key /etc/nginx/ssl/key.pem;
EOF
    
    log_info "CloudFlare configuration generated ✓"
}

# Generate development configuration
generate_dev_config() {
    log_info "Generating development SSL configuration..."
    
    cat > "$OUTPUT_DIR/ssl-dev.conf" << 'EOF'
# Development SSL Configuration
# For local development with self-signed certificates

# SSL/TLS settings
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
ssl_prefer_server_ciphers on;

# SSL session settings
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:10m;

# Development-friendly headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Access-Control-Allow-Origin "*" always;
add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization" always;

# Certificate settings (self-signed)
ssl_certificate /etc/nginx/ssl/cert.pem;
ssl_certificate_key /etc/nginx/ssl/key.pem;
EOF
    
    log_info "Development configuration generated ✓"
}

# Generate include snippet
generate_include_snippet() {
    log_info "Generating include snippet..."
    
    cat > "$OUTPUT_DIR/README.md" << EOF
# SSL Configuration Files

This directory contains various SSL configuration templates for different use cases.

## Available Configurations

- \`ssl-modern.conf\` - Modern configuration (TLS 1.3 only)
- \`ssl-intermediate.conf\` - Intermediate configuration (TLS 1.2+) - RECOMMENDED
- \`ssl-old.conf\` - Old configuration (TLS 1.0+) - NOT RECOMMENDED
- \`ssl-cloudflare.conf\` - CloudFlare-optimized configuration
- \`ssl-dev.conf\` - Development configuration

## Usage

To use a configuration, include it in your server block:

\`\`\`nginx
server {
    listen 443 ssl http2;
    server_name example.com;
    
    # Include SSL configuration
    include /etc/nginx/ssl-configs/ssl-intermediate.conf;
    
    # Your other server configurations...
}
\`\`\`

## Recommendations

1. **Production**: Use \`ssl-intermediate.conf\` for best compatibility
2. **Modern Apps**: Use \`ssl-modern.conf\` if you don't need legacy support
3. **Behind CloudFlare**: Use \`ssl-cloudflare.conf\`
4. **Development**: Use \`ssl-dev.conf\` with self-signed certificates

## Testing Your Configuration

After applying a configuration, test it with:
- SSL Labs: https://www.ssllabs.com/ssltest/
- Security Headers: https://securityheaders.com/

## Updating Configurations

These configurations are based on Mozilla SSL Configuration Generator.
Check for updates at: https://ssl-config.mozilla.org/
EOF
    
    log_info "README generated ✓"
}

# Main execution
main() {
    log_info "Generating SSL configurations..."
    
    case "$CONFIG_TYPE" in
        "all")
            generate_modern_config
            generate_intermediate_config
            generate_old_config
            generate_cloudflare_config
            generate_dev_config
            ;;
        "modern")
            generate_modern_config
            ;;
        "intermediate")
            generate_intermediate_config
            ;;
        "old")
            generate_old_config
            ;;
        "cloudflare")
            generate_cloudflare_config
            ;;
        "dev")
            generate_dev_config
            ;;
        *)
            log_info "Generating all configurations..."
            generate_modern_config
            generate_intermediate_config
            generate_old_config
            generate_cloudflare_config
            generate_dev_config
            ;;
    esac
    
    generate_include_snippet
    
    echo -e "${BLUE}========================================${NC}"
    log_info "SSL configurations generated in: $OUTPUT_DIR"
    log_info "Review the README.md for usage instructions"
    echo -e "${BLUE}========================================${NC}"
}

# Show usage
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    echo "Usage: $0 [config-type]"
    echo ""
    echo "Config types:"
    echo "  all          - Generate all configurations (default)"
    echo "  modern       - TLS 1.3 only"
    echo "  intermediate - TLS 1.2+ (RECOMMENDED)"
    echo "  old          - TLS 1.0+ (NOT RECOMMENDED)"
    echo "  cloudflare   - CloudFlare-optimized"
    echo "  dev          - Development environment"
    echo ""
    echo "Example:"
    echo "  $0 intermediate"
    exit 0
fi

# Run main function
main