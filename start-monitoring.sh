#!/bin/bash

echo "🚀 Starting PRP Monitoring Service..."

# Check if monitoring service is already running
if pgrep -f "monitoring-service.js" > /dev/null; then
    echo "⚠️  Monitoring service is already running!"
    echo "To stop it, run: pkill -f monitoring-service.js"
    exit 1
fi

# Start the monitoring service
nohup node monitoring-service.js > monitoring.log 2>&1 &
MONITOR_PID=$!

echo "✅ Monitoring service started with PID: $MONITOR_PID"
echo "📄 Logs are being written to: monitoring.log"
echo ""
echo "📊 Access points:"
echo "   - Metrics API: http://localhost:3002/metrics"
echo "   - Health Check: http://localhost:3002/health"
echo "   - Dashboard: http://localhost:3002/dashboard"
echo ""
echo "To stop the monitoring service, run:"
echo "   kill $MONITOR_PID"
echo "   # or"
echo "   pkill -f monitoring-service.js"