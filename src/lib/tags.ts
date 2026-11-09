import type { Project, Resource, TagIssue } from '@/types';

export const UNALLOCATED_PROJECT_ID = 'unallocated';

function normalizeTag(tag: string): string {
  return tag.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function resolveProjectId(tag: string | null, projects: Project[]): string {
  if (!tag) return UNALLOCATED_PROJECT_ID;
  const normalized = normalizeTag(tag);
  const match = projects.find((project) => normalizeTag(project.name) === normalized);
  return match ? match.id : UNALLOCATED_PROJECT_ID;
}

export function getProjectName(projectId: string, projects: Project[]): string {
  if (projectId === UNALLOCATED_PROJECT_ID) return 'Unallocated';
  return projects.find((project) => project.id === projectId)?.name ?? 'Unknown project';
}

export function getTagIssues(resource: Resource, projects: Project[]): TagIssue[] {
  const issues: TagIssue[] = [];
  if (!resource.projectTag) {
    issues.push('Missing project tag');
  } else {
    const canonical = projects.find((project) => project.id === resolveProjectId(resource.projectTag, projects));
    if (canonical && canonical.name !== resource.projectTag) issues.push('Inconsistent project name');
  }
  if (!resource.ownerTag) issues.push('Missing owner tag');
  return issues;
}
