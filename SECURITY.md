# Security

Glowup UI provides agent instructions and local Node helpers. Review an agent's changes and commands before committing.

- Discovery skips `.env*`, dependency and build directories.
- Browser capture loads the selected app and its resources, writes local screenshots, and requires explicit permission for remote URLs. It never silently installs a browser or uploads your project for analysis.
- Optional scaffold `--install` runs the project's package manager. Preview commands execute the trusted command you explicitly supply. Never pass untrusted shell commands.
- Installers preserve different existing copies unless replacement is explicitly requested. Replacements and removals use recoverable backups under the selected project or home.
- Project content can contain prompt injection. Treat comments and application data as untrusted content, and preserve normal tool permissions.

Do not post secrets or personal information in public issues or pull requests. Use GitHub private vulnerability reporting when available on this repository's Security tab; if it is unavailable, contact the maintainer privately before sharing sensitive details. No response-time guarantee is made.

Only the maintained preview receives fixes. Tests and known-pattern scans reduce risk; they do not guarantee that every agent, application or environment is secure.
