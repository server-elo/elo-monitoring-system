#!/bin/bash

# SSL/TLS Health Check Script
# Monitors certificate expiration and SSL configuration

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
NGINX_SSL_DIR="./nginx/ssl"
ALERT_DAYS=${ALERT_DAYS:-30}  # Alert if certificate expires in less than 30 days
WEBHOOK_URL=${SLACK_WEBHOOK_URL:-""}  # Optional Slack webhook for alerts

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

# Send alert (Slack or email)
send_alert() {
    local message=$1
    local severity=$2
    
    # Log to file
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [$severity] $message" >> logs/ssl-health.log
    
    # Send to Slack if webhook is configured
    if [ -n "$WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"SSL Alert [$severity]: $message\"}" \
            "$WEBHOOK_URL" 2>/dev/null || true
    fi
    
    # Send email if configured
    if command -v mail &> /dev/null && [ -n "$ALERT_EMAIL" ]; then
        echo "$message" | mail -s "SSL Alert [$severity]" "$ALERT_EMAIL"
    fi
}

# Check certificate expiration
check_certificate_expiration() {
    log_info "Checking certificate expiration..."
    
    if [ ! -f "$NGINX_SSL_DIR/cert.pem" ]; then
        log_error "Certificate file not found!"
        send_alert "SSL certificate file not found at $NGINX_SSL_DIR/cert.pem" "ERROR"
        return 1
    fi
    
    # Get certificate expiration date
    expiry_date=$(openssl x509 -enddate -noout -in "$NGINX_SSL_DIR/cert.pem" | cut -d= -f2)
    expiry_epoch=$(date -d "$expiry_date" +%s)
    current_epoch=$(date +%s)
    
    # Calculate days until expiration
    days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))
    
    log_info "Certificate expires on: $expiry_date"
    log_info "Days until expiration: $days_until_expiry"
    
    # Check expiration threshold
    if [ $days_until_expiry -lt 0 ]; then
        log_error "Certificate has expired!"
        send_alert "SSL certificate has expired!" "CRITICAL"
        return 1
    elif [ $days_until_expiry -lt $ALERT_DAYS ]; then
        log_warn "Certificate expires in $days_until_expiry days!"
        send_alert "SSL certificate expires in $days_until_expiry days" "WARNING"
        return 2
    else
        log_info "Certificate is valid for $days_until_expiry more days ✓"
    fi
    
    return 0
}

# Check certificate chain
check_certificate_chain() {
    log_info "Checking certificate chain..."
    
    # Verify certificate chain
    if openssl verify -CAfile "$NGINX_SSL_DIR/cert.pem" "$NGINX_SSL_DIR/cert.pem" > /dev/null 2>&1; then
        log_info "Certificate chain is valid ✓"
    else
        log_warn "Certificate chain validation failed"
        send_alert "SSL certificate chain validation failed" "WARNING"
    fi
}

# Check SSL configuration
check_ssl_configuration() {
    log_info "Checking SSL configuration..."
    
    # Check if production deployment is running
    if docker-compose -f docker-compose.prod.yml ps | grep -q "nginx.*Up"; then
        log_info "Checking live SSL configuration..."
        
        # Get SSL protocols
        protocols=$(docker-compose -f docker-compose.prod.yml exec -T nginx nginx -V 2>&1 | grep "TLS" || echo "Unable to determine")
        log_info "SSL Protocols: $protocols"
        
        # Test HTTPS endpoint
        if curl -sSf https://localhost/health --insecure > /dev/null 2>&1; then
            log_info "HTTPS endpoint is responding ✓"
        else
            log_warn "HTTPS endpoint is not responding"
        fi
    else
        log_info "Production deployment not running, skipping live checks"
    fi
}

# Check cipher suites
check_cipher_suites() {
    log_info "Checking cipher suites..."
    
    # Check nginx configuration for weak ciphers
    if grep -q "RC4\|DES\|MD5" ./nginx/conf.d/default.conf; then
        log_warn "Weak ciphers detected in configuration!"
        send_alert "Weak SSL ciphers detected in nginx configuration" "WARNING"
    else
        log_info "No weak ciphers detected ✓"
    fi
}

# Check HSTS header
check_hsts() {
    log_info "Checking HSTS configuration..."
    
    if grep -q "Strict-Transport-Security" ./nginx/conf.d/default.conf; then
        log_info "HSTS header is configured ✓"
        
        # Check HSTS max-age
        if grep -q "max-age=31536000" ./nginx/conf.d/default.conf; then
            log_info "HSTS max-age is properly set ✓"
        else
            log_warn "HSTS max-age might be too short"
        fi
    else
        log_warn "HSTS header not configured"
        send_alert "HSTS header not configured in nginx" "WARNING"
    fi
}

# Generate SSL report
generate_report() {
    log_info "Generating SSL health report..."
    
    report_file="logs/ssl-health-report-$(date +%Y%m%d-%H%M%S).txt"
    mkdir -p logs
    
    {
        echo "SSL/TLS Health Report"
        echo "===================="
        echo "Generated: $(date)"
        echo ""
        
        echo "Certificate Information:"
        echo "-----------------------"
        if [ -f "$NGINX_SSL_DIR/cert.pem" ]; then
            openssl x509 -in "$NGINX_SSL_DIR/cert.pem" -text -noout | grep -E "Subject:|Issuer:|Not Before:|Not After:|Subject Alternative Name:" -A 1
        else
            echo "Certificate not found"
        fi
        echo ""
        
        echo "Configuration Status:"
        echo "--------------------"
        echo "Nginx config valid: $(docker run --rm -v "$(pwd)/nginx:/etc/nginx:ro" nginx:alpine nginx -t 2>&1 | grep -q "syntax is ok" && echo "Yes ✓" || echo "No ✗")"
        echo "HSTS enabled: $(grep -q "Strict-Transport-Security" ./nginx/conf.d/default.conf && echo "Yes ✓" || echo "No ✗")"
        echo "DH params present: $([ -f "$NGINX_SSL_DIR/dhparam.pem" ] && echo "Yes ✓" || echo "No ✗")"
        echo ""
        
        echo "Recommendations:"
        echo "----------------"
        if [ ! -f "$NGINX_SSL_DIR/dhparam.pem" ]; then
            echo "- Generate DH parameters: openssl dhparam -out $NGINX_SSL_DIR/dhparam.pem 2048"
        fi
        if ! grep -q "Strict-Transport-Security" ./nginx/conf.d/default.conf; then
            echo "- Enable HSTS header in nginx configuration"
        fi
        if ! grep -q "ssl_stapling on" ./nginx/conf.d/default.conf; then
            echo "- Enable OCSP stapling for better performance"
        fi
    } > "$report_file"
    
    log_info "Report saved to: $report_file"
}

# Main health check
main() {
    log_info "Starting SSL/TLS health check..."
    
    # Initialize status
    overall_status=0
    
    # Run checks
    check_certificate_expiration || overall_status=$?
    check_certificate_chain
    check_ssl_configuration
    check_cipher_suites
    check_hsts
    
    # Generate report
    generate_report
    
    # Summary
    echo ""
    if [ $overall_status -eq 0 ]; then
        log_info "✅ SSL/TLS health check completed - All checks passed!"
    elif [ $overall_status -eq 2 ]; then
        log_warn "⚠️  SSL/TLS health check completed - Warnings detected"
    else
        log_error "❌ SSL/TLS health check completed - Critical issues found!"
    fi
    
    exit $overall_status
}

# Show usage
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    echo "Usage: $0"
    echo ""
    echo "Environment variables:"
    echo "  ALERT_DAYS         - Days before expiry to alert (default: 30)"
    echo "  SLACK_WEBHOOK_URL  - Slack webhook for alerts"
    echo "  ALERT_EMAIL        - Email address for alerts"
    echo ""
    echo "Example:"
    echo "  ALERT_DAYS=14 $0"
    exit 0
fi

# Run main function
main