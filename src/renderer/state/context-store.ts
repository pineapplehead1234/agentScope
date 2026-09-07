export type ContextStats = {
  tokenUsage: number;
  cost: number;
  contextUsagePercent: number;
  isCompacting: boolean;
  summary: string;
};

export type MarkdownPreviewState = {
  path: string;
  content: string;
};

export type ContextPanelState = {
  stats: ContextStats;
  markdownPreview: MarkdownPreviewState | null;
};

export const initialContextPanelState: ContextPanelState = {
  stats: {
    tokenUsage: 0,
    cost: 0,
    contextUsagePercent: 0,
    isCompacting: false,
    summary: "No context summary yet",
  },
  markdownPreview: null,
};
