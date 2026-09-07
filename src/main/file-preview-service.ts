import { readFile, realpath } from "node:fs/promises";
import { extname, isAbsolute, relative, resolve } from "node:path";
import type { MarkdownPreviewData } from "../shared/ipc-contract";

export function createFilePreviewService(options: { workspaceRoot: string }) {
  const workspaceRoot = resolve(options.workspaceRoot);

  return {
    async readMarkdownPreview(path: string): Promise<MarkdownPreviewData> {
      const resolvedPath = resolve(workspaceRoot, path);
      const relativePath = relative(workspaceRoot, resolvedPath);

      if (
        relativePath === "" ||
        relativePath.startsWith("..") ||
        isAbsolute(relativePath)
      ) {
        throw new Error("Preview path must stay inside the workspace");
      }

      if (![".md", ".markdown"].includes(extname(resolvedPath).toLowerCase())) {
        throw new Error("Only markdown files can be previewed");
      }

      const realWorkspaceRoot = await realpath(workspaceRoot);
      const realResolvedPath = await realpath(resolvedPath);
      const realRelativePath = relative(realWorkspaceRoot, realResolvedPath);

      if (![".md", ".markdown"].includes(extname(realResolvedPath).toLowerCase())) {
        throw new Error("Only markdown files can be previewed");
      }

      if (
        realRelativePath === "" ||
        realRelativePath.startsWith("..") ||
        isAbsolute(realRelativePath)
      ) {
        throw new Error("Preview path must stay inside the workspace");
      }

      const content = await readFile(resolvedPath, "utf8");

      return { path: resolvedPath, content };
    },
  };
}

export type FilePreviewService = ReturnType<typeof createFilePreviewService>;
