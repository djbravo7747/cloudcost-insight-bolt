import type { BillingRecord, Budget, CostSummary, PipelineHistory, Project, Resource, UploadedFile } from '@/types';
import {
  SAMPLE_BUDGETS,
  SAMPLE_PIPELINE_HISTORY,
  SAMPLE_PROJECTS,
  SAMPLE_RESOURCES,
} from '@/data/sampleCatalog';
import { SAMPLE_BILLING_RECORDS } from '@/data/billingGenerator';
import { buildBudgetRows, filterBillingRecords, sumCost } from '@/lib/analytics';
import { getTagIssues } from '@/lib/tags';
import { API_BASE_URL } from '@/config/dataSource';

const SIMULATED_LATENCY_MS = 250;
const SIMULATED_REJECTION_RATE = 0.02;
const SIMULATED_MISSING_TAG_RATE = 0.06;
const OVERRUN_PERCENT = 100;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request<T>(path: string, simulate: () => T | Promise<T>, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) {
    await delay(SIMULATED_LATENCY_MS);
    return simulate();
  }
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  if (!response.ok) {
    throw new Error(`The server could not complete this request (status ${response.status}).`);
  }
  return (await response.json()) as T;
}

export function getBillingRecords(): Promise<BillingRecord[]> {
  return request('/billing-records', () => SAMPLE_BILLING_RECORDS);
}

export function getProjects(): Promise<Project[]> {
  return request('/projects', () => SAMPLE_PROJECTS);
}

export function getResources(): Promise<Resource[]> {
  return request('/resources', () => SAMPLE_RESOURCES);
}

export function getBudgets(): Promise<Budget[]> {
  return request('/budgets', () => SAMPLE_BUDGETS);
}

export function getCostSummary(billingMonth: string, budgets: Budget[]): Promise<CostSummary> {
  return request(`/cost-summary?billing_month=${encodeURIComponent(billingMonth)}`, () => {
    const monthRecords = filterBillingRecords(SAMPLE_BILLING_RECORDS, { billingMonth });
    const monthlyBudget = budgets
      .filter((budget) => budget.scope === 'Project')
      .reduce((total, budget) => total + budget.monthlyBudget, 0);
    const totalCost = sumCost(monthRecords);
    const rows = buildBudgetRows(budgets, SAMPLE_BILLING_RECORDS, billingMonth, {
      warningPercent: OVERRUN_PERCENT,
      criticalPercent: OVERRUN_PERCENT,
    });
    return {
      totalCost,
      monthlyBudget,
      budgetUtilization: monthlyBudget > 0 ? (totalCost / monthlyBudget) * 100 : 0,
      untaggedResources: SAMPLE_RESOURCES.filter((resource) => getTagIssues(resource, SAMPLE_PROJECTS).length > 0)
        .length,
      budgetOverruns: rows.filter((row) => row.status === 'Over budget').length,
    };
  });
}

export function getPipelineHistory(): Promise<PipelineHistory> {
  return request('/pipeline/history', () => SAMPLE_PIPELINE_HISTORY);
}

async function simulateUpload(file: File): Promise<UploadedFile> {
  const text = await file.text();
  const dataRows = Math.max(text.split(/\r?\n/).filter((line) => line.trim().length > 0).length - 1, 0);
  const rejectedRecords = Math.round(dataRows * SIMULATED_REJECTION_RATE);
  return {
    id: `upl-${Date.now()}`,
    fileName: file.name,
    sizeKb: Math.max(Math.round(file.size / 1024), 1),
    uploadedAt: new Date().toISOString(),
    status: rejectedRecords > 0 ? 'Completed with errors' : 'Completed',
    totalRecords: dataRows,
    validRecords: dataRows - rejectedRecords,
    rejectedRecords,
    missingTagCount: Math.round(dataRows * SIMULATED_MISSING_TAG_RATE),
    duplicateCount: 0,
  };
}

export function uploadBillingFile(file: File): Promise<UploadedFile> {
  const body = new FormData();
  body.append('file', file);
  return request('/uploads', () => simulateUpload(file), { method: 'POST', body });
}
