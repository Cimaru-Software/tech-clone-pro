import { join } from "path";

export function getPublicDir(): string {
  return process.env.PUBLIC_DIR || join(process.cwd(), "public");
}
