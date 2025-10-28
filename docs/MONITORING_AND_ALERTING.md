# OSGB System Monitoring and Alerting Setup

## Overview

This document describes how to set up monitoring and alerting for the OSGB System in production. Proper monitoring is essential for maintaining system reliability and quickly identifying issues.

## Monitoring Components

### 1. Application Performance Monitoring (APM)

#### Backend Services
- Response time monitoring
- Error rate tracking
- Database query performance
- API endpoint latency
- Memory and CPU usage

#### Frontend Application
- Page load times
- JavaScript errors
- User experience metrics
- Resource loading performance

### 2. Infrastructure Monitoring

#### Docker Containers
- Container health status
- Resource utilization (CPU, memory, disk)
- Container restarts
- Network I/O

#### Host System
- System load
- Disk space usage
- Memory usage
- Network connectivity

#### Database
- Connection pool status
- Query performance
- Database size
- Backup status

### 3. Business Metrics

#### User Activity
- Active user count
- Login frequency
- Feature usage
- Session duration

#### System Usage
- API request volume
- Data processing volume
- Storage utilization
- Bandwidth usage

## Monitoring Solutions

### Open Source Options

#### Prometheus + Grafana
1. Install Prometheus for metrics collection
2. Install Grafana for dashboard visualization
3. Configure exporters for Docker, MySQL, and Node.js
4. Set up alerting rules in Prometheus
5. Create dashboards in Grafana

#### ELK Stack (Elasticsearch, Logstash, Kibana)
1. Install Elasticsearch for log storage
2. Install Logstash for log processing
3. Install Kibana for log visualization
4. Configure log collection from containers
5. Set up alerts based on log patterns

### Commercial Options

#### Datadog
- Comprehensive monitoring platform
- Built-in integrations with Docker, MySQL, etc.
- APM capabilities
- Alerting and notification features

#### New Relic
- Full-stack observability platform
- Infrastructure and application monitoring
- Synthetic monitoring
- AI-powered insights

## Implementation Steps

### 1. Container Monitoring Setup

Add monitoring agents to docker-compose.prod.yml:

```yaml
services:
  # Add Prometheus Node Exporter for host metrics
  node-exporter:
    image: prom/node-exporter
    container_name: osgb_node_exporter
    ports:
      - "9100:9100"
    volumes:
      - /proc:/proc:ro
      - /sys:/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/proc'
      - '--path.sysfs=/sys'
      - '--collector.filesystem.ignored-mount-points=^/(sys|proc|dev|host|etc)($$|/)'
    networks:
      - osgb_network

  # Add cAdvisor for container metrics
  cadvisor:
    image: gcr.io/cadvisor/cadvisor
    container_name: osgb_cadvisor
    ports:
      - "8080:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    devices:
      - /dev/kmsg
    networks:
      - osgb_network
```

### 2. Application Logging Enhancement

Update backend logging in server.js:

```javascript
// Add structured logging
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Use logger instead of console.log
logger.info('Server started', { port: PORT, environment: process.env.NODE_ENV });
```

### 3. Health Check Enhancement

Update health check endpoint in server.js:

```javascript
// Enhanced health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    const dbStatus = await sequelize.authenticate();
    
    // Check disk space
    const diskSpace = checkDiskSpace();
    
    // Check memory usage
    const memoryUsage = process.memoryUsage();
    
    res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'Connected',
      diskSpace: diskSpace,
      memoryUsage: memoryUsage,
      version: process.env.APP_VERSION || '1.0.0'
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});
```

### 4. Alerting Rules

#### Critical Alerts
- Service downtime (5 minutes)
- Database connection failure (1 minute)
- High error rate (>5% for 5 minutes)
- High CPU usage (>80% for 10 minutes)
- Low disk space (<10% remaining)

#### Warning Alerts
- Moderate CPU usage (>60% for 30 minutes)
- High memory usage (>75% for 15 minutes)
- Slow response times (>2 seconds average for 10 minutes)
- Failed login attempts (>10 in 5 minutes)

## Notification Channels

### Email
- System administrator
- Development team
- Management team

### SMS
- Critical alerts only
- 24/7 on-call personnel

### Slack/Discord
- Channel for operational alerts
- Integration with incident management

### Webhooks
- Integration with ticketing systems
- Custom notification systems

## Dashboard Examples

### 1. System Overview Dashboard
- Overall system health status
- Key performance indicators
- Recent alerts
- Resource utilization summary

### 2. Application Performance Dashboard
- API response times
- Error rates
- Throughput metrics
- User activity trends

### 3. Database Dashboard
- Query performance
- Connection statistics
- Storage utilization
- Backup status

### 4. Infrastructure Dashboard
- Container health
- Host resource usage
- Network statistics
- Disk I/O performance

## Best Practices

### 1. Alert Design
- Avoid alert fatigue with meaningful thresholds
- Use escalation policies for critical alerts
- Regularly review and tune alert rules
- Document alert meanings and response procedures

### 2. Metric Collection
- Collect metrics at appropriate intervals
- Store metrics for sufficient historical analysis
- Use consistent naming conventions
- Include relevant metadata with metrics

### 3. Dashboard Design
- Focus on actionable information
- Use appropriate visualization types
- Regularly update dashboards
- Provide context for metrics

### 4. Log Management
- Structure logs for easy parsing
- Include correlation IDs for request tracing
- Retain logs according to compliance requirements
- Secure sensitive information in logs

## Incident Response

### 1. Alert Triage
- Classify alerts by severity
- Determine impact scope
- Assign response priority

### 2. Investigation Process
- Check system dashboards
- Review recent logs
- Identify recent changes
- Reproduce issue if possible

### 3. Resolution Steps
- Implement temporary fixes if needed
- Apply permanent solutions
- Verify resolution
- Document incident

### 4. Post-Incident Review
- Analyze root cause
- Identify prevention measures
- Update documentation
- Share lessons learned

## Maintenance

### Regular Tasks
- Review and tune monitoring rules
- Update dashboards based on usage patterns
- Rotate log files and clean old data
- Test alerting systems

### Quarterly Reviews
- Assess monitoring coverage
- Evaluate alert effectiveness
- Review incident response procedures
- Update monitoring tools and configurations

---

**Version:** 1.0
**Last Updated:** October 2025