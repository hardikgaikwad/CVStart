# CVstart Security and Privacy Architecture

## 1. Threat Model & Design Principles

Resume management tools handle high-value personal data, including full names, contact information, employment histories, and educational credentials. Furthermore, compiling arbitrary LaTeX documents introduces serious potential risks (arbitrary command execution via `\write18`, filesystem traversal via `\input`, or resource exhaustion loops).

CVstart implements defense-in-depth across five threat surfaces:

1. **Local Data Isolation:** All user data, templates, database records, and compiled PDFs remain strictly on the user's local machine. No external cloud inference or telemetry is used.
2. **Strict Compiler Sandboxing:** LaTeX compilation executes in controlled subprocesses with zero shell execution and disallowed I/O macros.
3. **Structured AST & Command Validation:** All LaTeX source is validated for malicious or dangerous commands before passing to the compiler.
4. **Agent Tool Authorization:** The AI assistant cannot run arbitrary shell commands, access the host filesystem, or execute Python code.
5. **Factual Integrity Guardrails:** The AI cannot fabricate employers, institutions, or metrics without warning the user.

---

## 2. LaTeX Sandboxing & Execution Safety

### 2.1 Prevention of Shell Escape
- In traditional TeX engines, `\write18{command}` enables executing arbitrary system shell commands.
- **Enforcement:**
  - CVstart executes compilers exclusively with `--shell-escape=false` or equivalents (Tectonic natively prevents shell escapes and disables `\write18`).
  - The AST validator in `backend/apps/latex/validator.py` scans all user-supplied and AI-generated LaTeX before compilation. Any document containing `\write18`, `\immediate\write`, or `\catcode` modifications is rejected before reaching the compiler.

### 2.2 Filesystem Isolation
- Arbitrary file reads or writes via `\input`, `\include`, `\openin`, or `\openout` are strictly blocked.
- Compilations run in ephemeral, isolated directories created via Python's `tempfile.mkdtemp()`.
- The compiler process cannot read files outside the temporary directory, and all temporary build artifacts (auxiliary files, logs) are cleaned up after the PDF is safely copied to `workspace/builds/`.

### 2.3 Process Limits & Resource Exhaustion Protection
- **Timeout Enforcement:** All compiler processes are wrapped in a strict 30-second timeout. If a document enters an infinite TeX macro loop, the process is terminated immediately.
- **Fixed Subprocess Arguments:** Subprocesses are invoked with explicit argument lists (`subprocess.run([compiler_path, ...], shell=False)`). User input is never interpolated into shell strings.

---

## 3. Input Sanitization & LaTeX Escaping

All user input fields (names, job titles, summaries, bullet points) pass through `backend/apps/latex/escaper.py` before template rendering:

| Character | Escaped Representation | Security Purpose |
|---|---|---|
| `\` | `\textbackslash{}` | Prevents unauthorized macro injection |
| `$` | `\$` | Prevents unintended math-mode switches |
| `%` | `\%` | Prevents line commenting and hidden content |
| `&` | `\&` | Prevents tabular column misalignment |
| `#` | `\#` | Prevents macro parameter definition |
| `_` | `\_` | Prevents subscript errors in text mode |
| `{` | `\{` | Prevents argument boundary manipulation |
| `}` | `\}` | Prevents argument boundary manipulation |
| `~` | `\textasciitilde{}` | Prevents non-breaking space expansion |
| `^` | `\textasciicircum{}` | Prevents superscript errors |

URLs in contact links or project entries are validated and sanitized to permit only safe protocols (`http`, `https`, `mailto`), blocking `file://`, `javascript:`, or raw TeX macros.

---

## 4. AI Agent Safety & Tool Constraints

### 4.1 Restricted Tool Registry
The AI assistant interacts with the application exclusively through 13 predefined, strongly typed tools registered in `backend/apps/ai/tool_registry.py`:
- `get_resume_data`
- `plan_resume_changes`
- `update_resume_data`
- `generate_latex`
- `validate_latex`
- `compile_latex`
- `render_pdf`
- `inspect_pdf`
- `inspect_layout`
- `edit_latex`
- `get_compile_diagnostics`
- `save_resume_version`
- `export_resume`

**Never Exposed:** The tool registry does not expose arbitrary Python execution, bash/PowerShell shells, directory traversal, or file deletion tools to the LLM.

### 4.2 Factual Integrity Verification
When an AI model proposes changes to work experience or education:
- The system extracts all entity names (employers, schools, degrees).
- If the AI introduces an organization not present in the user's original resume or prompt, the change planner flags a high-priority warning:
  `"Warning: The proposed change mentions organizations not present in your verified resume."`
- The user must explicitly approve the diff in the visual review dialog before any changes are committed.

---

## 5. Network & Deployment Security

- **Loopback Binding:** By default, CVstart binds exclusively to `127.0.0.1`. It does not listen on `0.0.0.0` or expose open network ports to the local network or internet.
- **CORS Protection:** Cross-Origin Resource Sharing is locked down to localhost development ports and disabled in production builds.
- **Data Retention & Workspace Cleanup:** User data is stored in the local SQLite file `workspace/cvstart.sqlite3`. Deleting a resume via the UI deletes the corresponding database record, its version history, and associated compiled PDF files from disk.
