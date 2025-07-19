# Database Maintenance System

## Overview

The Database Maintenance System provides comprehensive data cleanup and database maintenance capabilities for the Solidity Learning Platform. It includes automated cleanup operations, scheduled maintenance tasks, migration management, and monitoring tools.

## Features

### 🧹 Data Cleanup Operations
- **Orphaned Data Detection**: Identifies and removes data not linked to active records
- **Expired Data Removal**: Cleans up expired tokens, sessions, and temporary data
- **Cache Management**: Maintains cache consistency and removes stale entries
- **Account Archival**: Handles inactive account cleanup and data archival
- **File Cleanup**: Removes temporary files and orphaned uploads

### 📅 Scheduled Maintenance
- **Automated Scheduling**: Cron-based scheduling with timezone support
- **Flexible Configuration**: Customizable batch sizes, timeouts, and options
- **Notification System**: Email, Slack, and webhook notifications
- **Dry Run Support**: Test operations before execution
- **Performance Monitoring**: System metrics collection and analysis

### 🔄 Migration Management
- **Migration Tracking**: Complete migration history and status
- **Dependency Resolution**: Automatic dependency ordering
- **Rollback Support**: Safe rollback procedures with backups
- **Testing Framework**: Comprehensive migration testing
- **Impact Assessment**: Estimated duration and risk analysis

### 🛡️ Safety Features
- **Automatic Backups**: Pre-operation database backups
- **Transaction Safety**: Atomic operations with rollback capability
- **Confirmation Prompts**: Multi-level confirmation for destructive operations
- **Rate Limiting**: Batch processing with configurable limits
- **Audit Logging**: Complete operation audit trails

## Architecture

### Core Components

```
lib/database/
├── cleanup.ts          # Core cleanup infrastructure
├── orphaned-data.ts    # Orphaned data detection and cleanup
├── data-removal.ts     # Expired and unused data removal
├── migrations.ts       # Database migration management
└── maintenance.ts      # Automated maintenance scheduling
```

### API Endpoints

```
/api/v1/admin/maintenance/
├── GET     # Get maintenance status and operations
├── POST    # Execute maintenance actions
├── schedules/
│   ├── GET     # List maintenance schedules
│   ├── POST    # Create maintenance schedule
│   └── [id]/
│       ├── GET     # Get specific schedule
│       ├── PUT     # Update schedule
│       ├── DELETE  # Delete schedule
│       └── run     # Execute schedule immediately
```

## Usage

### Basic Cleanup Operations

```typescript
import { cleanupManager } from '@/lib/database/cleanup';

// Execute single cleanup operation
const result = await cleanupManager.executeOperation('orphaned_achievements', {
  dryRun: true,
  batchSize: 1000,
  maxExecutionTime: 1800
});

// Execute batch cleanup
const report = await cleanupManager.executeBatch([
  'orphaned_achievements',
  'expired_tokens',
  'cached_data'
], {
  dryRun: false,
  force: false,
  batchSize: 500,
  maxExecutionTime: 3600
});
```

### Scheduled Maintenance

```typescript
import { maintenanceScheduler } from '@/lib/database/maintenance';

// Create maintenance schedule
const schedule = {
  id: 'daily_cleanup',
  name: 'Daily Cleanup',
  description: 'Daily maintenance tasks',
  operations: ['expired_tokens', 'cached_data'],
  schedule: {
    minute: '0',
    hour: '2',
    dayOfMonth: '*',
    month: '*',
    dayOfWeek: '*',
    timezone: 'UTC'
  },
  enabled: true,
  options: {
    dryRun: false,
    batchSize: 1000,
    maxExecutionTime: 1800
  },
  notifications: {
    onSuccess: false,
    onFailure: true,
    onWarnings: true,
    recipients: ['admin@example.com'],
    channels: ['email']
  }
};

await maintenanceScheduler.addSchedule(schedule);
```

### Migration Management

```typescript
import { migrationManager } from '@/lib/database/migrations';

// Get migration status
const status = await migrationManager.getMigrationStatus();

// Test migration
const testResult = await migrationManager.testMigration('migration_001');

// Apply migration
const result = await migrationManager.applyMigration('migration_001', false);

// Apply all pending migrations
const results = await migrationManager.applyPendingMigrations(false);
```

## Available Cleanup Operations

### Orphaned Data Operations

| Operation | Description | Severity | Backup Required |
|-----------|-------------|----------|-----------------|
| `orphaned_achievements` | Remove achievements not linked to active users/courses | MEDIUM | Yes |
| `orphaned_progress` | Remove progress records for deleted lessons/users | HIGH | Yes |
| `orphaned_leaderboard` | Remove leaderboard entries for inactive users | MEDIUM | Yes |
| `orphaned_prerequisites` | Remove lesson prerequisites pointing to non-existent lessons | HIGH | Yes |

### Data Removal Operations

| Operation | Description | Severity | Backup Required |
|-----------|-------------|----------|-----------------|
| `expired_tokens` | Remove expired JWT refresh tokens and sessions | LOW | No |
| `old_logs` | Remove API logs beyond retention period (1 year) | MEDIUM | Yes |
| `cached_data` | Remove invalid and expired cached data | LOW | No |
| `inactive_accounts` | Archive/delete inactive accounts (suspended >6 months) | CRITICAL | Yes |
| `temporary_files` | Clean up temporary files and orphaned uploads | MEDIUM | No |

## Default Maintenance Schedules

### Daily Cleanup
- **Schedule**: Every day at 2:00 AM UTC
- **Operations**: `expired_tokens`, `cached_data`
- **Duration**: ~2 minutes
- **Notifications**: Failures and warnings only

### Weekly Deep Clean
- **Schedule**: Every Sunday at 1:00 AM UTC
- **Operations**: All orphaned data operations, `old_logs`
- **Duration**: ~15 minutes
- **Notifications**: All events

### Monthly Archive
- **Schedule**: 1st of every month at 3:00 AM UTC
- **Operations**: `inactive_accounts`, `temporary_files`
- **Duration**: ~30 minutes
- **Notifications**: All events

## API Usage Examples

### Get Maintenance Status

```bash
curl -X GET \
  'https://api.example.com/v1/admin/maintenance?action=status' \
  -H 'Authorization: Bearer <admin-token>'
```

### Execute Cleanup Operation

```bash
curl -X POST \
  'https://api.example.com/v1/admin/maintenance' \
  -H 'Authorization: Bearer <admin-token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "run_cleanup",
    "target": "orphaned_achievements",
    "options": {
      "dryRun": true,
      "batchSize": 500
    }
  }'
```

### Create Maintenance Schedule

```bash
curl -X POST \
  'https://api.example.com/v1/admin/maintenance/schedules' \
  -H 'Authorization: Bearer <admin-token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Custom Cleanup",
    "description": "Custom maintenance schedule",
    "operations": ["expired_tokens", "cached_data"],
    "schedule": {
      "minute": "30",
      "hour": "3",
      "dayOfMonth": "*",
      "month": "*",
      "dayOfWeek": "*",
      "timezone": "UTC"
    },
    "enabled": true,
    "options": {
      "dryRun": false,
      "batchSize": 1000,
      "maxExecutionTime": 1800
    },
    "notifications": {
      "onSuccess": true,
      "onFailure": true,
      "onWarnings": true,
      "recipients": ["admin@example.com"],
      "channels": ["email"]
    }
  }'
```

## Safety Guidelines

### Before Running Cleanup Operations

1. **Always test with dry run first**
   ```typescript
   const result = await cleanupManager.executeOperation('operation_id', {
     dryRun: true,
     batchSize: 100
   });
   ```

2. **Review operation details**
   - Check estimated duration
   - Verify backup requirements
   - Understand data impact

3. **Ensure adequate resources**
   - Sufficient disk space for backups
   - Low system load period
   - Maintenance window availability

### During Operations

1. **Monitor system performance**
   - Database connection count
   - CPU and memory usage
   - Disk I/O metrics

2. **Watch for errors**
   - Check operation logs
   - Monitor error rates
   - Verify backup creation

3. **Be prepared to stop**
   - Have rollback procedures ready
   - Monitor operation progress
   - Set appropriate timeouts

### After Operations

1. **Verify results**
   - Check operation reports
   - Validate data integrity
   - Test application functionality

2. **Review recommendations**
   - Analyze system metrics
   - Implement suggested improvements
   - Update maintenance schedules

3. **Document outcomes**
   - Record operation results
   - Note any issues encountered
   - Update procedures if needed

## Monitoring and Alerts

### System Metrics Collected

- **Database Size**: Total database size and growth trends
- **Table Statistics**: Row counts, sizes, and fragmentation levels
- **Index Efficiency**: Index usage and performance metrics
- **Query Performance**: Slow query identification and optimization
- **Disk Usage**: Available space and usage patterns
- **Memory Usage**: Buffer and cache utilization

### Alert Conditions

- **High Disk Usage**: >80% disk space used
- **Low Index Efficiency**: <90% index efficiency
- **Operation Failures**: Any cleanup operation failures
- **Long Execution Times**: Operations exceeding expected duration
- **High Error Rates**: >5% error rate in cleanup operations

### Notification Channels

- **Email**: Detailed reports and alerts
- **Slack**: Real-time notifications and summaries
- **Webhooks**: Integration with external monitoring systems

## Troubleshooting

### Common Issues

1. **Operation Timeouts**
   - Increase `maxExecutionTime`
   - Reduce `batchSize`
   - Run during low-traffic periods

2. **Backup Failures**
   - Check disk space availability
   - Verify database permissions
   - Review backup service logs

3. **Migration Conflicts**
   - Resolve dependency issues
   - Check for schema conflicts
   - Validate migration scripts

4. **Schedule Not Running**
   - Verify scheduler is started
   - Check schedule configuration
   - Review system timezone settings

### Recovery Procedures

1. **Failed Cleanup Operation**
   ```typescript
   // Restore from backup if needed
   await backupService.restoreBackup('backup_path');
   
   // Re-run with smaller batch size
   await cleanupManager.executeOperation('operation_id', {
     dryRun: false,
     batchSize: 100,
     maxExecutionTime: 3600
   });
   ```

2. **Failed Migration**
   ```typescript
   // Rollback migration
   await migrationManager.rollbackMigration('migration_id');
   
   // Restore from backup
   await backupService.restoreBackup('migration_backup_path');
   ```

## Best Practices

1. **Regular Monitoring**
   - Review maintenance reports weekly
   - Monitor system metrics daily
   - Update schedules based on usage patterns

2. **Backup Management**
   - Verify backup integrity regularly
   - Maintain backup retention policies
   - Test restore procedures monthly

3. **Performance Optimization**
   - Run maintenance during low-traffic periods
   - Use appropriate batch sizes
   - Monitor resource usage

4. **Documentation**
   - Keep maintenance logs
   - Document custom procedures
   - Update runbooks regularly

5. **Testing**
   - Test all operations in staging first
   - Validate migration scripts thoroughly
   - Perform regular disaster recovery drills
