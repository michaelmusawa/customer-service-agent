// Helper to extract filename from path
export function basename(path: string): string {
  return path.split("/").pop() || path;
}
