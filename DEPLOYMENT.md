# Workbench UI Deployment Guide

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run tests once
npm run test:run

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Docker Deployment

### Single Container
```bash
# Build Docker image
docker build -t workbench-ui .

# Run container
docker run -p 3000:80 workbench-ui
```

### Docker Compose (Full Stack)
```bash
# Start both frontend and API
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Environment Variables

### Development (.env.development)
```
VITE_API_BASE_URL=http://localhost:8000
VITE_API_WRITE_TOKEN=development-token
```

### Production (.env.production)
```
VITE_API_BASE_URL=https://workbenchapi.ethicic.com
VITE_API_WRITE_TOKEN=your_production_token_here
```

## Nginx Configuration

The included `nginx.conf` provides:
- Static asset serving with caching
- React Router support (SPA routing)
- API proxy to backend
- Gzip compression
- Health check endpoint

## Architecture

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS with custom brand theme
- **State Management**: React Query for API state
- **Charts**: Plotly.js for financial visualization
- **Testing**: Vitest + React Testing Library
- **Build**: Vite with optimized production bundles

## Features

✅ **Responsive Design**: Works on desktop and mobile
✅ **Real-time Data**: React Query for caching and synchronization
✅ **Autosave**: Tick scores save automatically with 400ms debounce
✅ **Keyboard Navigation**: Arrow keys in universe panel, S/X shortcuts
✅ **Search & Filters**: Real-time universe filtering
✅ **Charts**: Interactive Plotly charts with synchronized x-axis
✅ **Notes**: Markdown support with formatting toolbar
✅ **Error Handling**: Toast notifications for user feedback

## API Integration

The frontend expects these API endpoints:

### Read Endpoints
- `GET /api/securities/` - List securities with filters
- `GET /api/securities/{symbol}/chart` - OHLC and SMA data
- `GET /api/securities/{symbol}/fundamentals` - Financial metrics
- `GET /api/securities/{symbol}/tick-history` - Historical tick scores
- `GET /api/tick/{symbol}` - Current tick score
- `GET /api/notes/{symbol}` - Security notes

### Write Endpoints (Bearer token required)
- `PUT /api/tick/{symbol}` - Update tick score
- `POST /api/notes/{symbol}` - Create note

## Performance

- **Bundle Size**: ~1.6MB gzipped (mainly Plotly.js)
- **Code Splitting**: Consider dynamic imports for Plotly
- **Caching**: React Query with 5-minute stale time
- **Debouncing**: Search and autosave optimized

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Monitoring

- Health check: `GET /health` (returns 200 OK)
- Logs: Available via `docker-compose logs workbench-ui`
- Metrics: Consider adding analytics/monitoring