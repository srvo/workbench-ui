# Backtests Monitoring Feature

**Status**: ✅ Complete
**Route**: `/backtests`
**API Integration**: PortQL API (rawls:8001)

## Overview

Real-time backtest monitoring dashboard integrated into the Workbench UI, providing visibility into running backtests and historical results.

## Features

### 1. **Live Event Feed**
- Shows last 10 backtest events in real-time
- Color-coded status badges (RUNNING, QUEUED, COMPLETE, FAILED)
- Displays strategy name, scenario, and time period
- Auto-scrolling feed of recent activity

### 2. **Results Table (Grouped by Study)**
- Aggregates completed backtests by study/run tag
- Automatic grouping (e.g., "S&P 500 Tracking Study", "Alpha Strategies")
- Key metrics displayed:
  - Total Return (%)
  - Sharpe Ratio
  - Max Drawdown (%)
- Scenario comparison (baseline vs comprehensive exclusions)

### 3. **Active Jobs Monitor**
- Real-time status of running/queued jobs
- Progress indicators when available
- Visual distinction for RUNNING vs QUEUED jobs

## Architecture

### Frontend (React + TypeScript)
```
src/
├── api/backtests.ts          # PortQL API client
├── pages/Backtests.tsx        # Main monitoring page
├── App.tsx                    # Route registration
└── components/
    └── Layout/
        └── WorkbenchLayout.tsx  # Nav link + full-width support
```

### API Integration
```typescript
// Environment Config
VITE_PORTQL_API_URL=https://portql.ec1c.com

// API Endpoints Used
GET  /status/{runId}    # Get job status
POST /enqueue           # Submit new backtest
POST /cancel/{runId}    # Cancel running job
```

### Data Flow
```
1. Page loads → Fetches job IDs from localStorage/API
2. For each job ID → GET /status/{runId}
3. Parse response → Group by study tag
4. Display in tables → Auto-refresh every 10s
```

## Usage

### Accessing the Page
1. Navigate to Workbench UI
2. Click "📊 Backtests" in top navigation
3. View live updates of running jobs

### Understanding the Display

**Event Feed** (Left Column):
- Most recent events at top
- Status badge shows job state
- Abbreviated run ID for reference

**Results Table** (Right Column):
- Grouped by study name
- Each row = one backtest run
- Compare scenarios side-by-side

**Active Jobs** (Bottom):
- Blue background = currently running
- Gray background = queued
- Shows progress when available

## Example: S&P 500 Tracking Study

The page currently shows 8 S&P 500 tracking backtests:

| Strategy | Scenario | Return | Sharpe | Drawdown |
|----------|----------|--------|--------|----------|
| S&P 500 Equal | baseline | X.XX% | X.XX | -X.XX% |
| S&P 500 Equal | comprehensive | X.XX% | X.XX | -X.XX% |
| S&P 500 Mcap | baseline | X.XX% | X.XX | -X.XX% |
| S&P 500 Mcap | comprehensive | X.XX% | X.XX | -X.XX% |
| ... | ... | ... | ... | ... |

## Configuration

### Environment Variables
```bash
# .env.local
VITE_PORTQL_API_URL=https://portql.ec1c.com  # Production
# VITE_PORTQL_API_URL=http://localhost:8001  # Local development
```

### Job ID Storage
Currently uses hardcoded S&P 500 study run IDs in `getRecentJobIds()`:
```typescript
// TODO: Replace with localStorage or API fetch
function getRecentJobIds(): string[] {
  return [
    '20251006093522_256e0d49c2f9e151',
    '20251006093606_40fbb45ed359b7f7',
    // ...
  ];
}
```

**Future Enhancement**: Store job IDs in localStorage when enqueued, or fetch from a `/recent-jobs` endpoint.

## Future Improvements

### Near-term (Next Sprint)
- [ ] Add job enqueue form (submit new backtests from UI)
- [ ] Implement job cancellation (button to cancel running jobs)
- [ ] Store job IDs in localStorage (persist across sessions)
- [ ] Add date/time filters for results table

### Medium-term (Q1 2026)
- [ ] WebSocket integration for real-time updates (eliminate polling)
- [ ] Export results to CSV/JSON
- [ ] Detailed metrics view (click row to see full results)
- [ ] Chart visualization of strategy performance

### Long-term (Q2 2026)
- [ ] Backtest comparison tool (side-by-side metric comparison)
- [ ] Historical trend charts (strategy performance over time)
- [ ] Alert notifications (Slack/email when jobs complete)
- [ ] Saved backtest configurations (rerun with one click)

## API Requirements

The page expects PortQL API to return:

```typescript
interface BacktestJob {
  runId: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETE' | 'FAILED' | 'FINISHED';
  request?: {
    strategy: string;
    start_date: string;
    end_date: string;
    exclusion_scenario: string;
  };
  result?: {
    metrics: {
      total_return: number;
      sharpe_ratio: number;
      max_drawdown: number;
    };
  };
}
```

## Deployment Notes

1. **CORS**: PortQL API must allow requests from workbench.ec1c.com
2. **Auth**: Currently no authentication (add Cloudflare Access headers if needed)
3. **SSL**: Production uses https://portql.ec1c.com (tunneled from rawls:8001)

## Testing

### Manual Testing
1. Navigate to `/backtests`
2. Verify S&P 500 study jobs display
3. Check auto-refresh (jobs update every 10s)
4. Confirm metrics display correctly

### Test Job Submission
```bash
# Submit test job via PortQL API
curl -X POST https://portql.ec1c.com/enqueue \
  -H "Content-Type: application/json" \
  -d '{
    "strategy": "alpha_001_value",
    "start_date": "2022-01-01",
    "end_date": "2024-12-31",
    "exclusion_scenario": "baseline"
  }'
```

## Troubleshooting

**Jobs not showing?**
- Check browser console for API errors
- Verify VITE_PORTQL_API_URL in .env.local
- Confirm PortQL API is accessible (curl test)

**Metrics showing as dashes?**
- Job may still be running (wait for COMPLETE status)
- API response may be missing `result.metrics`
- Check browser network tab for API response format

**Auto-refresh not working?**
- Check browser console for interval errors
- Verify component is mounted (React DevTools)
- Clear browser cache and reload

## Related Documentation

- [PortQL API Endpoints](/Users/srvo/dev/monocloud/backtest/api/main.py)
- [S&P 500 Tracking Study](/Users/srvo/dev/monocloud/backtest/backtests/sp500_tracking.py)
- [Workbench UI Architecture](/Users/srvo/dev/workbench/workbench-ui/README.md)
