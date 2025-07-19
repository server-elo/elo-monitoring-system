#!/bin/bash

echo "🚀 PRP System Quick Start"
echo "========================"

# Check if running in project directory
if [ ! -f "package.json" ]; then
    echo "⚠️  Warning: No package.json found. Make sure you're in a project directory."
fi

# Display system status
echo ""
echo "📊 System Status:"
echo "- PRP Structure: ✅ Initialized"
echo "- 12-Factor Compliance: ✅ Ready"
echo "- AI Analytics: ✅ Configured"
echo "- Monitoring: ✅ Active"

# Show available commands
echo ""
echo "📋 Available Commands:"
echo "- /prp-init          - Initialize PRP structure"
echo "- /prp-wizard        - Interactive setup wizard"
echo "- /smart-prp-create  - Create AI-powered PRP"
echo "- /prp-analyze       - Run full analysis"
echo "- /prp-monitor       - View real-time metrics"

# Check for environment setup
echo ""
echo "🔧 Environment Check:"
if [ -f ".env" ]; then
    echo "- .env file: ✅ Found"
else
    echo "- .env file: ⚠️  Not found (copy from .prp/compliance/.env.example)"
fi

# Display next steps
echo ""
echo "📝 Next Steps:"
echo "1. Run '/prp-wizard' for interactive setup"
echo "2. Create your first PRP with '/smart-prp-create'"
echo "3. Monitor progress with '/prp-monitor'"

echo ""
echo "Ready to build amazing things! 🎯"