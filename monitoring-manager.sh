#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
MONITORING_SCRIPT="$SCRIPT_DIR/monitoring-service.js"
PID_FILE="$SCRIPT_DIR/.monitoring.pid"
LOG_FILE="$SCRIPT_DIR/monitoring.log"

start_monitoring() {
    if [ -f "$PID_FILE" ] && ps -p $(cat "$PID_FILE") > /dev/null 2>&1; then
        echo "⚠️  Monitoring service is already running (PID: $(cat $PID_FILE))"
        return 1
    fi
    
    echo "🚀 Starting PRP Monitoring Service..."
    nohup node "$MONITORING_SCRIPT" > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    
    # Wait a moment and check if it started successfully
    sleep 2
    if ps -p $(cat "$PID_FILE") > /dev/null 2>&1; then
        echo "✅ Monitoring service started successfully (PID: $(cat $PID_FILE))"
        echo "📄 Logs: $LOG_FILE"
        echo "📊 Dashboard: http://localhost:3002/dashboard"
        echo "📈 Metrics: http://localhost:3002/metrics"
    else
        echo "❌ Failed to start monitoring service"
        rm -f "$PID_FILE"
        return 1
    fi
}

stop_monitoring() {
    if [ ! -f "$PID_FILE" ]; then
        echo "⚠️  No PID file found. Monitoring service may not be running."
        return 1
    fi
    
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "🛑 Stopping monitoring service (PID: $PID)..."
        kill "$PID"
        sleep 2
        
        if ps -p "$PID" > /dev/null 2>&1; then
            echo "⚠️  Process still running, force killing..."
            kill -9 "$PID"
        fi
        
        rm -f "$PID_FILE"
        echo "✅ Monitoring service stopped"
    else
        echo "⚠️  Process not found, cleaning up PID file"
        rm -f "$PID_FILE"
    fi
}

status_monitoring() {
    if [ -f "$PID_FILE" ] && ps -p $(cat "$PID_FILE") > /dev/null 2>&1; then
        echo "✅ Monitoring service is running (PID: $(cat $PID_FILE))"
        echo "📊 Access points:"
        echo "   - Dashboard: http://localhost:3002/dashboard"
        echo "   - Metrics: http://localhost:3002/metrics"
        echo "   - Health: http://localhost:3002/health"
        echo "📄 Logs: $LOG_FILE"
    else
        echo "❌ Monitoring service is not running"
        [ -f "$PID_FILE" ] && rm -f "$PID_FILE"
    fi
}

restart_monitoring() {
    echo "🔄 Restarting monitoring service..."
    stop_monitoring
    sleep 1
    start_monitoring
}

case "$1" in
    start)
        start_monitoring
        ;;
    stop)
        stop_monitoring
        ;;
    status)
        status_monitoring
        ;;
    restart)
        restart_monitoring
        ;;
    logs)
        if [ -f "$LOG_FILE" ]; then
            tail -f "$LOG_FILE"
        else
            echo "❌ No log file found"
        fi
        ;;
    *)
        echo "Usage: $0 {start|stop|status|restart|logs}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the monitoring service"
        echo "  stop    - Stop the monitoring service"
        echo "  status  - Check if service is running"
        echo "  restart - Restart the service"
        echo "  logs    - Follow the log file"
        exit 1
        ;;
esac