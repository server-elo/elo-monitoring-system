#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
CENTRAL_SCRIPT="$SCRIPT_DIR/central-monitoring-service.js"
CENTRAL_PID_FILE="$SCRIPT_DIR/.central-monitoring.pid"
CENTRAL_LOG_FILE="$SCRIPT_DIR/central-monitoring.log"

start_central() {
    if [ -f "$CENTRAL_PID_FILE" ] && ps -p $(cat "$CENTRAL_PID_FILE") > /dev/null 2>&1; then
        echo "⚠️  Central monitoring service is already running (PID: $(cat $CENTRAL_PID_FILE))"
        return 1
    fi
    
    echo "🌐 Starting Central Multi-PC Monitoring Service..."
    nohup node "$CENTRAL_SCRIPT" > "$CENTRAL_LOG_FILE" 2>&1 &
    echo $! > "$CENTRAL_PID_FILE"
    
    # Wait a moment and check if it started successfully
    sleep 3
    if ps -p $(cat "$CENTRAL_PID_FILE") > /dev/null 2>&1; then
        echo "✅ Central monitoring service started successfully (PID: $(cat $CENTRAL_PID_FILE))"
        echo "📄 Logs: $CENTRAL_LOG_FILE"
        echo "🌐 Central Dashboard: http://localhost:3001"
        echo "📊 Aggregated Metrics: http://localhost:3001/metrics"
        echo "💚 Health Check: http://localhost:3001/health"
    else
        echo "❌ Failed to start central monitoring service"
        rm -f "$CENTRAL_PID_FILE"
        return 1
    fi
}

stop_central() {
    if [ ! -f "$CENTRAL_PID_FILE" ]; then
        echo "⚠️  No PID file found. Central monitoring service may not be running."
        return 1
    fi
    
    PID=$(cat "$CENTRAL_PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "🛑 Stopping central monitoring service (PID: $PID)..."
        kill "$PID"
        sleep 3
        
        if ps -p "$PID" > /dev/null 2>&1; then
            echo "⚠️  Process still running, force killing..."
            kill -9 "$PID"
        fi
        
        rm -f "$CENTRAL_PID_FILE"
        echo "✅ Central monitoring service stopped"
    else
        echo "⚠️  Process not found, cleaning up PID file"
        rm -f "$CENTRAL_PID_FILE"
    fi
}

status_central() {
    if [ -f "$CENTRAL_PID_FILE" ] && ps -p $(cat "$CENTRAL_PID_FILE") > /dev/null 2>&1; then
        echo "✅ Central monitoring service is running (PID: $(cat $CENTRAL_PID_FILE))"
        echo "🌐 Access points:"
        echo "   - Central Dashboard: http://localhost:3001"
        echo "   - Aggregated Metrics: http://localhost:3001/metrics"
        echo "   - Health Check: http://localhost:3001/health"
        echo "   - PC Registration: http://localhost:3001/register"
        echo "📄 Logs: $CENTRAL_LOG_FILE"
        
        # Show discovered PCs
        echo ""
        echo "🖥️ Discovered PCs:"
        curl -s http://localhost:3001/health 2>/dev/null | grep -o '"activePCs":[0-9]*' | cut -d: -f2 | xargs -I {} echo "   - Active PCs: {}"
    else
        echo "❌ Central monitoring service is not running"
        [ -f "$CENTRAL_PID_FILE" ] && rm -f "$CENTRAL_PID_FILE"
    fi
}

restart_central() {
    echo "🔄 Restarting central monitoring service..."
    stop_central
    sleep 2
    start_central
}

start_full_system() {
    echo "🚀 Starting complete monitoring system..."
    echo ""
    
    # Start central service first
    echo "1️⃣ Starting central aggregation service..."
    start_central
    sleep 2
    
    # Start individual PC monitoring
    echo ""
    echo "2️⃣ Starting individual PC monitoring..."
    ./monitoring-manager.sh start
    
    echo ""
    echo "🎉 Complete monitoring system started!"
    echo ""
    echo "📊 Access Points:"
    echo "   🌐 Central Dashboard (All PCs): http://localhost:3001"
    echo "   💻 Individual PC Dashboard: http://localhost:3002"
    echo ""
    echo "🎯 What you can see:"
    echo "   - Port 3001: Multi-PC overview with all machines"
    echo "   - Port 3002: This PC's detailed monitoring"
}

stop_full_system() {
    echo "🛑 Stopping complete monitoring system..."
    echo ""
    
    echo "1️⃣ Stopping individual PC monitoring..."
    ./monitoring-manager.sh stop
    
    echo ""
    echo "2️⃣ Stopping central aggregation service..."
    stop_central
    
    echo ""
    echo "✅ Complete monitoring system stopped"
}

status_full_system() {
    echo "📊 Complete Monitoring System Status"
    echo "======================================"
    echo ""
    
    echo "🌐 Central Aggregation Service:"
    status_central
    
    echo ""
    echo "💻 Individual PC Monitoring:"
    ./monitoring-manager.sh status
}

case "$1" in
    start)
        start_central
        ;;
    stop)
        stop_central
        ;;
    status)
        status_central
        ;;
    restart)
        restart_central
        ;;
    logs)
        if [ -f "$CENTRAL_LOG_FILE" ]; then
            tail -f "$CENTRAL_LOG_FILE"
        else
            echo "❌ No central log file found"
        fi
        ;;
    full-start)
        start_full_system
        ;;
    full-stop)
        stop_full_system
        ;;
    full-status)
        status_full_system
        ;;
    *)
        echo "Central Multi-PC Monitoring Manager"
        echo ""
        echo "Usage: $0 {start|stop|status|restart|logs|full-start|full-stop|full-status}"
        echo ""
        echo "Central Service Commands:"
        echo "  start       - Start central aggregation service (port 3001)"
        echo "  stop        - Stop central aggregation service"
        echo "  status      - Check central service status"
        echo "  restart     - Restart central service"
        echo "  logs        - Follow central service logs"
        echo ""
        echo "Full System Commands:"
        echo "  full-start  - Start complete monitoring (central + individual)"
        echo "  full-stop   - Stop complete monitoring"
        echo "  full-status - Check status of entire system"
        echo ""
        echo "🎯 Quick Start Guide:"
        echo "  ./central-monitoring-manager.sh full-start"
        echo "  Then visit: http://localhost:3001 (All PCs) or http://localhost:3002 (This PC)"
        exit 1
        ;;
esac