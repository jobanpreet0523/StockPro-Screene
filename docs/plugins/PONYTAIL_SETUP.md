# Ponytail Codex Plugin Setup

## Status

Ponytail 4.8.4 was installed and enabled as a Codex-side plugin. It was not added to `package.json`, copied into StockPro, or exposed to the application bundle.

The direct marketplace command initially failed on Windows because Git's Schannel backend could not acquire credentials in the sandbox. Installation succeeded through the same official Codex plugin flow after setting `http.sslBackend=openssl` only for the installer process.

## Commands

```powershell
codex plugin marketplace add DietrichGebert/ponytail
codex plugin add ponytail@ponytail
```

If Schannel reports `SEC_E_NO_CREDENTIALS`, retry only the installer process with Git's OpenSSL backend; do not clone Ponytail into StockPro.

## Hook review

- Session activation writes a plugin-scoped mode flag and injects the selected instruction set.
- Prompt tracking recognizes explicit Ponytail mode commands, persists only an explicitly requested default, and has a one-second non-blocking fallback on Windows.
- Subagent propagation reads the plugin-scoped mode flag and injects the same instruction set; an optional regex can narrow target agent types.
- Hook code does not run project code, modify StockPro, read application secrets, or make network calls. File writes are limited to Ponytail/plugin configuration state.

## Activation

Codex loads lifecycle hooks at task/session start. Start a new Codex task or restart Codex, then select full mode. This current task cannot honestly claim that newly installed hooks were hot-loaded; until restart, use the same minimal-safe principles manually and preserve validation, security, accessibility, error handling, tests, and cleanup.
