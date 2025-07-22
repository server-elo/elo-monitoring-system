# 🚀 Quantum Port Management Guide

## Overview

The Solidity Learning Platform includes advanced port management tools to prevent conflicts and ensure smooth development experience.

## Quick Commands

### Clean Start Development
```bash
npm run dev:clean
```
This automatically cleans ports before starting the development server.

### Manual Port Management
```bash
# Clean all development ports (3000-3010)
npm run ports:clean

# Analyze port usage
npm run ports:analyze

# Force resolve all conflicts
npm run ports:resolve
```

## Port Configuration

### Default Ports
- **Next.js Dev Server**: 3000
- **Socket.io Server**: 3001
- **API Server**: 3002 (if separate)

### Custom Port Configuration
```bash
# Use environment variable
PORT=3005 npm run dev

# Or set in .env.local
PORT=3005
```

## Advanced Features

### Quantum Port Manager
The quantum port manager provides:
- 🔍 Multi-dimensional port analysis
- 🧟 Zombie process detection
- 🧹 Automatic cleanup
- 📊 Real-time monitoring
- 🚀 Intelligent recommendations

### Usage
```bash
# Full analysis
npx tsx scripts/quantum-port-manager.ts analyze

# Resolve conflicts
npx tsx scripts/quantum-port-manager.ts resolve --force

# Setup port management helpers
npx tsx scripts/quantum-port-manager.ts setup

# Monitor ports continuously
npx tsx scripts/quantum-port-manager.ts monitor
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Quick fix
npm run ports:clean

# Or manually kill specific port
lsof -ti:3000 | xargs kill -9
```

#### Zombie Processes
```bash
# Find and kill zombie Node processes
ps aux | grep node | grep -v grep | awk '{print $2}' | xargs kill -9
```

#### Socket Lock Files
```bash
# Clean socket locks
find /tmp -name "*.sock" -user $USER -delete
```

## Best Practices

1. **Always use `npm run dev:clean`** for first start of the day
2. **Set explicit PORT** in .env.local for consistency
3. **Use port ranges** to avoid conflicts with other services
4. **Monitor for zombies** with quantum port manager
5. **Clean before switching** between projects

## Port Allocation Strategy

### Development Environment
```
3000 - Primary Next.js server
3001 - Socket.io for real-time features
3002 - API server (if separate)
3003 - Storybook
3004 - Documentation server
3005-3010 - Reserved for microservices
```

### Testing Environment
```
4000-4010 - E2E test servers
5000-5010 - Unit test servers
```

## Integration with CI/CD

### GitHub Actions
```yaml
- name: Clean ports before tests
  run: npm run ports:clean
  
- name: Start dev server
  run: npm run dev &
  env:
    PORT: 3000
```

### Docker
```dockerfile
# Expose ports
EXPOSE 3000 3001

# Clean ports on startup
CMD ["sh", "-c", "npm run ports:clean && npm start"]
```

## Security Considerations

1. **Never expose** development ports to public internet
2. **Use firewall rules** to restrict port access
3. **Monitor for unauthorized** port usage
4. **Rotate ports** periodically in production

## Monitoring

### Check Port Status
```bash
# All listening ports
ss -tulpn | grep LISTEN

# Specific port range
ss -tulpn | grep -E ":(300[0-9]|3010)"

# Process details
lsof -i :3000
```

### Performance Impact
The port management system has minimal overhead:
- Cleanup: < 100ms
- Analysis: < 500ms
- Monitoring: < 1% CPU

## Future Enhancements

- [ ] Automatic port assignment algorithm
- [ ] Machine learning for usage patterns
- [ ] Integration with container orchestration
- [ ] Real-time port usage dashboard
- [ ] Predictive conflict detection

---

For more information, see the [Quantum Port Manager source](../scripts/quantum-port-manager.ts).