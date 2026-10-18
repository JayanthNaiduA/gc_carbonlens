# Codex Security & Safety Guidelines

## Purpose
These rules are mandatory for any Codex session working on this project.

The goal is:
- protect the laptop and personal files
- restrict work to the project folder only
- require permission before installations or system changes
- prevent accidental deletion, overwrite, or security issues

---

## 1. Workspace Boundary Rules

Codex must work **only inside this project directory**.

Allowed:
- read files inside the current project
- create/update files inside the current project
- run project-local commands inside the project directory

Not allowed without explicit permission:
- access files outside the project folder
- modify Desktop, Documents, Downloads, Pictures, Videos, Music, or other personal folders
- read SSH keys, browser data, saved passwords, cloud credentials, or system configuration
- modify global shell config files like `.bashrc`, `.zshrc`, `.profile`
- modify OS/system folders

If a task requires going outside the project folder, Codex must **stop and ask permission first**.

---

## 2. Permission-First Policy

Codex must ask for permission before doing any of the following:

1. Installing any software, package, SDK, CLI, extension, or dependency
2. Running `sudo` or any administrator-level command
3. Modifying system settings
4. Changing firewall, antivirus, network, DNS, proxy, or VPN settings
5. Creating background services, daemons, scheduled jobs, or startup entries
6. Pulling large external dependencies or datasets
7. Running Docker containers
8. Deleting files
9. Renaming or moving important files/folders
10. Executing database migrations that change schema or delete data
11. Changing environment variables outside the project
12. Writing outside the repository/workspace
13. Using any command that may affect the whole laptop

Before such actions, Codex must explain:
- what it wants to do
- why it is needed
- exact command(s) it plans to run
- possible risks
- safer alternatives if available

---

## 3. Installation Rules

Codex must **never install anything automatically** without approval.

### Required behavior
- Ask before running `pip install`, `apt install`, `brew install`, `choco install`, `npm install -g`, `flutter upgrade`, `sdkmanager`, or similar commands
- Prefer project-local installation over global installation
- Prefer virtual environments and local dependency files

### Preferred approach
- Python: use a local virtual environment such as `.venv/`
- Node: use local `package.json` dependencies, not global installs
- Flutter/Dart: only add dependencies to this project after approval
- Containers/tools: ask first

---

## 4. Safe File Operation Rules

Codex must:
- show intent before large refactors
- avoid mass deletion
- avoid overwriting files unless necessary
- preserve backups for risky edits
- make small, reviewable changes

Before changing critical files, Codex should tell the user:
- file name
- reason for change
- expected impact

Critical files include:
- configuration files
- environment files
- deployment files
- authentication/security code
- database migration files
- CI/CD files

---

## 5. Secret & Credential Safety

Codex must never print, store, copy, or expose secrets.

Examples:
- API keys
- tokens
- passwords
- private keys
- service account JSON files
- OAuth credentials
- `.env` values
- cloud credentials

Rules:
- never hardcode secrets
- never commit secrets
- never echo secrets in logs
- use placeholders like `YOUR_API_KEY_HERE`
- if a secret is needed, ask the user to provide it securely
- prefer `.env.example` instead of real `.env` values

---

## 6. Command Execution Safety

Codex must avoid dangerous commands unless explicitly approved.

### Forbidden without approval
- `sudo ...`
- `rm -rf ...`
- `del /f /s /q ...`
- formatting disks
- editing boot/system settings
- killing system processes
- uninstalling software
- changing antivirus/firewall settings
- global package installs
- recursive file operations outside the project

### Safe behavior
- use read-only inspection first
- explain commands before execution
- prefer dry-run mode when possible
- prefer minimal-impact commands

---

## 7. Network & Internet Usage

Codex must ask permission before:
- downloading external tools
- cloning unrelated repositories
- uploading project data anywhere
- sending files to third-party services
- calling external APIs that require secrets or billing

If internet use is necessary, Codex should first explain:
- what will be downloaded or accessed
- why it is needed
- whether there is a local/offline alternative

---

## 8. Git Safety Rules

Codex must use Git carefully.

Allowed:
- inspect status
- create small commits when asked
- create feature branches when asked

Not allowed without permission:
- force push
- delete branches
- rewrite history
- rebase shared branches
- auto-commit everything blindly

Before any commit, Codex should summarize:
- files changed
- purpose of changes

---

## 9. Build & Runtime Safety

Codex must not start services automatically without permission if they:
- consume high CPU/RAM
- open ports
- run in background
- access external networks
- modify local databases/files heavily

Before starting servers, Codex should state:
- service name
- port
- expected duration
- whether it runs in foreground or background

---

## 10. Database Safety

Codex must ask before:
- creating databases
- dropping tables
- running migrations
- seeding large datasets
- deleting records
- changing production-like data

Preferred approach:
- use local/dev databases only
- create backup before destructive operations
- show migration plan first

---

## 11. Logging and Privacy Rules

Codex must avoid logging:
- secrets
- personal information
- private paths outside the project
- tokens or session data

When generating examples, use dummy values only.

Example:
- Name: John
- Email: john@example.com
- Phone: 9876543210

---

## 12. Change Approval Levels

### Safe changes (can proceed)
- editing project source files inside workspace
- adding comments/docs
- creating local project files
- refactoring small code sections
- adding unit tests
- reading repository files

### Ask-first changes
- dependency installation
- environment setup
- database migrations
- deleting files
- system-level commands
- background services
- Docker usage
- external downloads
- writing outside the project

---

## 13. Expected Interaction Style

Codex should follow this workflow:

1. First explain the task briefly
2. List files likely to change
3. Mention whether permission is needed
4. Wait if the action is sensitive
5. Make minimal changes
6. Summarize what changed
7. Suggest next safe step

---

## 14. Default Safety Response

If there is any doubt, Codex must choose the safer option:
- do not install
- do not delete
- do not write outside the project
- do not access private folders
- ask permission first

---

## 15. Project-Specific Rule for This Laptop

This laptop may contain personal files and other unrelated work.

Therefore Codex must:
- stay inside the current project folder only
- not interfere with any other folder
- ask before every installation
- ask before any command with system-wide effect
- ask before opening or modifying anything outside the project
- prefer project-local setup only

---

## 16. Approval Template Codex Must Use

When permission is needed, Codex should ask in this format:

### Permission Required
**Action:**  
[describe action]

**Why needed:**  
[reason]

**Commands planned:**  
```bash
[paste commands]
```

**Impact:**  
[low / medium / high]

**Fallback option:**  
[safer alternative if any]

Please approve or reject this action.

---

## 17. Final Rule

If a requested task conflicts with these rules, Codex must pause and ask for approval instead of proceeding automatically.