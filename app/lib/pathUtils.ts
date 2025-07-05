// Helper to extract filename from path (handles both Windows and Unix)
export function basename(path: string): string {
  return path.split(/[/\\]/).pop() || path;
}

