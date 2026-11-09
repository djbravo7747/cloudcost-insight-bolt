export type ServiceName =
  | 'Compute'
  | 'Database'
  | 'Object Storage'
  | 'Serverless'
  | 'CDN'
  | 'Kubernetes'
  | 'Cache'
  | 'Data Transfer';

export type TagIssue = 'Missing project tag' | 'Missing owner tag' | 'Inconsistent project name';

export type OwnershipStatus = 'Tagged' | TagIssue;

export type ReviewFlag = TagIssue | 'Unusual cost';

export type BudgetStatus = 'On track' | 'Warning' | 'Over budget';

export interface Project {
  id: string;
  name: string;
  owner: string;
  ownerEmail: string;
}

export interface Resource {
  id: string;
  name: string;
  service: ServiceName;
  projectTag: string | null;
  ownerTag: string | null;
  region: string;
  deployedOn: string;
}

export interface BillingRecord {
  id: string;
  billingDate: string;
  billingMonth: string;
  resourceId: string;
  projectId: string;
  service: ServiceName;
  usageQuantity: number;
  usageUnit: string;
  cost: number;
  ownershipStatus: OwnershipStatus;
}

export interface Budget {
  id: string;
  scope: 'Project' | 'Service';
  targetId: string;
  name: string;
  monthlyBudget: number;
}

export interface AlertThresholds {
  warningPercent: number;
  criticalPercent: number;
}

export interface UploadedFile {
  id: string;
  fileName: string;
  sizeKb: number;
  uploadedAt: string;
  status: 'Completed' | 'Completed with errors' | 'Failed';
  totalRecords: number;
  validRecords: number;
  rejectedRecords: number;
  missingTagCount: number;
  duplicateCount: number;
}

export type PipelineStage = 'Extract' | 'Validate' | 'Transform' | 'Reconcile' | 'Load' | 'Analyze';

export interface PipelineRun {
  id: string;
  startedAt: string;
  durationSeconds: number;
  sourceFile: string;
  status: 'Succeeded' | 'Succeeded with warnings' | 'Failed';
  recordsProcessed: number;
  failedStage: PipelineStage | null;
}

export interface ValidationError {
  id: string;
  fileName: string;
  row: number;
  column: string;
  message: string;
  occurrences: number;
}

export interface CostSummary {
  totalCost: number;
  monthlyBudget: number;
  budgetUtilization: number;
  untaggedResources: number;
  budgetOverruns: number;
}

export interface PipelineHistory {
  uploads: UploadedFile[];
  runs: PipelineRun[];
  validationErrors: ValidationError[];
}
