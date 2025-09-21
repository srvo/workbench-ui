import React, { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Plot from 'react-plotly.js';
import { securitiesApi } from '../../api/securities';
import { tickApi } from '../../api/tick';

interface SecurityChartsProps {
  symbol: string | null;
}

const SecurityCharts: React.FC<SecurityChartsProps> = ({ symbol }) => {
  const [xRange, setXRange] = useState<[any, any] | null>(null);

  // Fetch all data in parallel
  const { data: chartData } = useQuery({
    queryKey: ['chart', symbol],
    queryFn: () => securitiesApi.getChart(symbol!),
    enabled: !!symbol,
  });

  const { data: tickHistory } = useQuery({
    queryKey: ['tickHistory', symbol],
    queryFn: () => securitiesApi.getTickHistory(symbol!),
    enabled: !!symbol,
  });

  const { data: fundamentals } = useQuery({
    queryKey: ['fundamentals', symbol],
    queryFn: () => securitiesApi.getFundamentals(symbol!),
    enabled: !!symbol,
  });

  const { data: currentTick } = useQuery({
    queryKey: ['tick', symbol],
    queryFn: () => tickApi.get(symbol!),
    enabled: !!symbol,
  });

  // Handle x-axis sync across charts
  const handleRelayout = useCallback((e: any) => {
    if (e['xaxis.range[0]'] && e['xaxis.range[1]']) {
      setXRange([e['xaxis.range[0]'], e['xaxis.range[1]']]);
    } else if (e['xaxis.autorange']) {
      setXRange(null);
    }
  }, []);

  const commonLayout = useMemo(() => ({
    autosize: true,
    margin: { t: 30, r: 60, b: 40, l: 60 },
    font: { family: 'system-ui' },
    plot_bgcolor: 'white',
    paper_bgcolor: 'white',
    xaxis: xRange ? { range: xRange } : {},
  }), [xRange]);

  if (!symbol) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Select a security to view charts
      </div>
    );
  }

  if (!chartData || Array.isArray(chartData) && chartData.length === 0 || !chartData.ohlc) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No chart data available
      </div>
    );
  }

  // Convert timestamp to dates
  const dates = chartData.ohlc?.t?.map(t => new Date(t * 1000).toISOString().split('T')[0]) || [];
  const tickDates = tickHistory?.t?.map(t => new Date(t * 1000).toISOString().split('T')[0]) || [];

  return (
    <div className="grid grid-cols-1 gap-4">
      {/* Chart 1: Candles + SMA200 + Tick History */}
      <div className="panel p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Price & Tick Score</h3>
        <Plot
          data={[
            {
              type: 'candlestick',
              x: dates,
              open: chartData.ohlc.o,
              high: chartData.ohlc.h,
              low: chartData.ohlc.l,
              close: chartData.ohlc.c,
              name: 'Price',
              increasing: { line: { color: '#14b8a6' } },
              decreasing: { line: { color: '#581c87' } },
            },
            ...(chartData.sma200 ? [{
              type: 'scatter' as const,
              mode: 'lines' as const,
              x: dates,
              y: chartData.sma200,
              name: 'SMA 200',
              line: { color: '#581c87', width: 2 },
            }] : []),
            ...(tickHistory?.v ? [{
              type: 'scatter' as const,
              mode: 'lines+markers' as const,
              x: tickDates,
              y: tickHistory.v,
              name: 'Tick Score',
              yaxis: 'y2',
              line: { color: '#14b8a6', width: 2 },
              marker: currentTick?.score ? {
                size: [
                  ...new Array(tickDates.length - 1).fill(4),
                  10 // Highlight latest
                ]
              } : { size: 4 },
            }] : []),
          ]}
          layout={{
            ...commonLayout,
            height: 400,
            yaxis: { title: 'Price ($)', side: 'left' },
            yaxis2: {
              title: 'Tick Score',
              overlaying: 'y',
              side: 'right',
              range: tickHistory?.v && tickHistory.v.length > 0 ? [
                Math.min(...tickHistory.v) - 10,
                Math.max(...tickHistory.v) + 10
              ] : [-100, 100],
            },
          }}
          onRelayout={handleRelayout}
          config={{ responsive: true }}
        />
      </div>

      {/* Chart 2: Valuations */}
      {fundamentals?.series && (
        <div className="panel p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Valuations</h3>
          <Plot
            data={[
              ...['pb', 'ps', 'ptbv', 'pe'].map(metric => ({
                type: 'scatter' as const,
                mode: 'lines' as const,
                x: fundamentals.series?.[metric]?.t?.map(t =>
                  new Date(t * 1000).toISOString().split('T')[0]
                ) || [],
                y: fundamentals.series?.[metric]?.v || [],
                name: metric.toUpperCase(),
              })),
            ]}
            layout={{
              ...commonLayout,
              height: 300,
              yaxis: { title: 'Multiple' },
              legend: { orientation: 'h', y: -0.2 },
            }}
            onRelayout={handleRelayout}
            config={{ responsive: true }}
          />
        </div>
      )}

      {/* Chart 3: Yields */}
      {fundamentals?.series && (
        <div className="panel p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Shareholder Yields</h3>
          <Plot
            data={[
              ...['shy', 'fcf_yield'].map(metric => ({
                type: 'scatter' as const,
                mode: 'lines' as const,
                x: fundamentals.series?.[metric]?.t?.map(t =>
                  new Date(t * 1000).toISOString().split('T')[0]
                ) || [],
                y: fundamentals.series?.[metric]?.v || [],
                name: metric === 'shy' ? 'Shareholder Yield' : 'FCF Yield',
              })),
            ]}
            layout={{
              ...commonLayout,
              height: 300,
              yaxis: { title: 'Yield (%)' },
              legend: { orientation: 'h', y: -0.2 },
            }}
            onRelayout={handleRelayout}
            config={{ responsive: true }}
          />
        </div>
      )}

      {/* Chart 4: Growth */}
      {fundamentals?.series && (
        <div className="panel p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Growth Metrics</h3>
          <Plot
            data={[
              ...['rev_cagr_5y', 'fcf_cagr_5y', 'rev_yoy', 'cor_yoy'].map(metric => ({
                type: 'scatter' as const,
                mode: 'lines' as const,
                x: fundamentals.series?.[metric]?.t?.map(t =>
                  new Date(t * 1000).toISOString().split('T')[0]
                ) || [],
                y: fundamentals.series?.[metric]?.v || [],
                name: metric.includes('cagr') ? `${metric.split('_')[0].toUpperCase()} CAGR 5Y` :
                      `${metric.split('_')[0].toUpperCase()} YoY`,
              })),
            ]}
            layout={{
              ...commonLayout,
              height: 300,
              yaxis: { title: 'Growth (%)' },
              legend: { orientation: 'h', y: -0.2 },
            }}
            onRelayout={handleRelayout}
            config={{ responsive: true }}
          />
        </div>
      )}
    </div>
  );
};

export default SecurityCharts;