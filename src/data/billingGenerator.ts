import type { BillingRecord, Project, Resource } from '@/types';
import { resolveProjectId, getTagIssues } from '@/lib/tags';
import {
  BILLING_MONTHS,
  DATA_TRANSFER_RATE_BY_MONTH,
  RESOURCE_USAGE_SEEDS,
  SAMPLE_PROJECTS,
  SAMPLE_RESOURCES,
  SERVICE_PRICING,
} from '@/data/sampleCatalog';

const SPIKE_MONTH = '2026-10';
const SPIKE_MULTIPLIER = 2.2;
const MONTHLY_GROWTH = 0.015;
const WEEKEND_FACTOR = 0.94;

function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function daysInMonth(month: string): number {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
}

function rateFor(resource: Resource, month: string): number {
  if (resource.service === 'Data Transfer') return DATA_TRANSFER_RATE_BY_MONTH[month];
  return SERVICE_PRICING[resource.service].rate;
}

export function generateBillingRecords(resources: Resource[], projects: Project[]): BillingRecord[] {
  const random = createRandom(20261031);
  const records: BillingRecord[] = [];
  const attribution = new Map(
    resources.map((resource) => [
      resource.id,
      {
        projectId: resolveProjectId(resource.projectTag, projects),
        ownershipStatus: getTagIssues(resource, projects)[0] ?? ('Tagged' as const),
      },
    ]),
  );

  BILLING_MONTHS.forEach((month, monthIndex) => {
    const [year, monthNumber] = month.split('-').map(Number);
    for (let day = 1; day <= daysInMonth(month); day++) {
      const date = new Date(Date.UTC(year, monthNumber - 1, day));
      const billingDate = date.toISOString().slice(0, 10);
      const isWeekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;

      for (const resource of resources) {
        const seed = RESOURCE_USAGE_SEEDS[resource.id];
        const growth = 1 + monthIndex * MONTHLY_GROWTH;
        const spike = seed.spike && month === SPIKE_MONTH ? SPIKE_MULTIPLIER : 1;
        const weekend = isWeekend ? WEEKEND_FACTOR : 1;
        const noise = 0.92 + random() * 0.16;
        const usage = Math.round(seed.usagePerDay * growth * spike * weekend * noise * 100) / 100;
        const cost = Math.round(usage * rateFor(resource, month) * 100) / 100;
        const attributed = attribution.get(resource.id);

        records.push({
          id: `${resource.id}-${billingDate}`,
          billingDate,
          billingMonth: month,
          resourceId: resource.id,
          projectId: attributed?.projectId ?? 'unallocated',
          service: resource.service,
          usageQuantity: usage,
          usageUnit: SERVICE_PRICING[resource.service].unit,
          cost,
          ownershipStatus: attributed?.ownershipStatus ?? 'Tagged',
        });
      }
    }
  });

  return records;
}

export const SAMPLE_BILLING_RECORDS = generateBillingRecords(SAMPLE_RESOURCES, SAMPLE_PROJECTS);
