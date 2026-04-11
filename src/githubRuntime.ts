import type * as GitHubModule from '@actions/github' with { 'resolution-mode': 'import' }
import type { GitHub } from '@actions/github/lib/utils' with { 'resolution-mode': 'import' }

export type GitHubRuntime = typeof GitHubModule
export type OctokitClient = InstanceType<typeof GitHub>

// Preserve native import() so CommonJS-oriented builds can load the ESM-only package at runtime.
const importGitHubRuntime = new Function('return import("@actions/github")') as () => Promise<GitHubRuntime>

export const loadGitHubRuntime = (): Promise<GitHubRuntime> => importGitHubRuntime()
