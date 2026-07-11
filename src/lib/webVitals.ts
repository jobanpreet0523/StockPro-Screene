import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

export type WebVitalsReporter = (metric: Pick<Metric, 'name' | 'value' | 'rating' | 'delta'>) => void;

export function reportWebVitals(reporter?: WebVitalsReporter) {
  if (!reporter) return;
  const send = (metric: Metric) => reporter({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
  });
  onCLS(send);
  onFCP(send);
  onINP(send);
  onLCP(send);
  onTTFB(send);
}
