/*
 * Drizzle Kit 0.31 loads tsx, whose Windows temporary-directory helper calls
 * os.userInfo(). In this environment that Node API fails with
 * uv_os_get_passwd ENOMEM even though homedir/tmpdir work. Exposing geteuid
 * makes tsx use its POSIX-safe branch. This runs only in the migration CLI
 * process; it does not affect the application runtime or authentication.
 */
if (process.platform === "win32" && typeof process.geteuid !== "function") {
  process.geteuid = () => process.env.USERNAME || "samarthloan";

  // Drizzle invokes a child tsx process to load TypeScript schemas. Propagate
  // this same shim so that child does not call the broken os.userInfo() path.
  const required = `--require=${__filename}`;
  if (!process.env.NODE_OPTIONS?.includes(required)) {
    process.env.NODE_OPTIONS = [process.env.NODE_OPTIONS, required]
      .filter(Boolean)
      .join(" ");
  }
}
