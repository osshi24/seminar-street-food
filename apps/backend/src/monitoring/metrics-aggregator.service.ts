import { Injectable } from '@nestjs/common';

export interface RequestSample {
  durationMs: number;
  statusCode: number;
}

export interface AggregatedWindow {
  total: number;
  errors: number;
  avgLatencyMs: number | null;
  p95LatencyMs: number | null;
}

@Injectable()
export class MetricsAggregator {
  private samples: RequestSample[] = [];

  record(sample: RequestSample): void {
    this.samples.push(sample);
    if (this.samples.length > 10_000) {
      this.samples.splice(0, this.samples.length - 10_000);
    }
  }

  drain(): AggregatedWindow {
    const buf = this.samples;
    this.samples = [];
    if (buf.length === 0) {
      return { total: 0, errors: 0, avgLatencyMs: null, p95LatencyMs: null };
    }
    const errors = buf.filter((s) => s.statusCode >= 500).length;
    const sortedDurations = buf.map((s) => s.durationMs).sort((a, b) => a - b);
    const sum = sortedDurations.reduce((a, b) => a + b, 0);
    const avg = sum / sortedDurations.length;
    const p95Index = Math.min(
      sortedDurations.length - 1,
      Math.floor(sortedDurations.length * 0.95),
    );
    return {
      total: buf.length,
      errors,
      avgLatencyMs: Number(avg.toFixed(3)),
      p95LatencyMs: Number(sortedDurations[p95Index].toFixed(3)),
    };
  }
}
