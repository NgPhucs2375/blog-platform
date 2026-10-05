import api from '@/lib/axios';

export type ModerationRuleType = 'keyword' | 'regex';
export interface ModerationRule {
  id: number;
  name: string;
  pattern: string;
  ruleType: ModerationRuleType;
  reason: string;
  isEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}
export interface ModerationResult {
  outcome: 'pass' | 'reject' | 'error';
  reason: string | null;
  matchedRules: ModerationRule[];
}

function unwrap<T>(response: { data: { data?: T } }): T | undefined {
  return response.data.data;
}

export const moderationApi = {
  list: async (): Promise<ModerationRule[]> => unwrap<ModerationRule[]>(await api.get('/v1/admin/moderation-rules')) ?? [],
  create: async (rule: Omit<ModerationRule, 'id'>): Promise<ModerationRule> => unwrap<ModerationRule>(await api.post('/v1/admin/moderation-rules', rule)) as ModerationRule,
  update: async (id: number, rule: Omit<ModerationRule, 'id'>): Promise<ModerationRule> => unwrap<ModerationRule>(await api.put(`/v1/admin/moderation-rules/${id}`, rule)) as ModerationRule,
  toggle: async (id: number): Promise<ModerationRule> => unwrap<ModerationRule>(await api.patch(`/v1/admin/moderation-rules/${id}/toggle`)) as ModerationRule,
  remove: async (id: number): Promise<void> => { await api.delete(`/v1/admin/moderation-rules/${id}`); },
  test: async (title: string, content: string): Promise<ModerationResult> => unwrap<ModerationResult>(await api.post('/v1/admin/moderation-rules/test', { title, content })) as ModerationResult,
};
