import { readFile } from "node:fs/promises";

export type MarkdownPreviewData = {
  path: string;
  content: string;
};

export function createFilePreviewService() {
  return {
    async readMarkdownPreview(path: string): Promise<MarkdownPreviewData> {
      const content = await readFile(path, "utf8");

      return { path, content };
    },
  };
}

export type FilePreviewService = ReturnType<typeof createFilePreviewService>;
