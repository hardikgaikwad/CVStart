# CVstart User Guide

Welcome to **CVstart**, your local-first, AI-powered agentic LaTeX resume builder. This guide walks you through every feature of the application.

---

## 1. Getting Started

When you launch CVstart (`CVstart`), your default web browser opens to the **Dashboard** (`http://127.0.0.1:9999`).

### 1.1 Welcome & Onboarding
If this is your first time using CVstart, the interactive onboarding modal will guide you through:
1. **Ollama AI Status:** Verifying that your local Ollama instance is active and detecting installed models.
2. **LaTeX Compiler Status:** Checking that Tectonic or another supported compiler is ready for compilation.
3. **Quick Start:** Giving you the option to create a blank resume or start with pre-populated sample engineering data.

---

## 2. Managing Resumes

### 2.1 Dashboard Features
- **Create New Resume:** Click **+ New Resume** in the top navigation or on the dashboard card.
- **Duplicate Resume:** Click the duplicate icon to create an exact clone of any existing resume for tailoring to different job postings.
- **Delete Resume:** Click the trash icon to permanently remove a resume, its version history, and compiled PDF artifacts.
- **Resume Metadata:** View the template name, page size, model used, and last updated timestamp for each resume card.

---

## 3. The Resume Editor

Opening a resume takes you to the **Workspace**, which features a split-pane layout: the Editor on the left and the live PDF Preview on the right.

### 3.1 Structured Form Tabs
The editor provides dedicated, structured tabs so you never have to deal with raw LaTeX code:

1. **Personal Info:** Full name, target role/title, email, phone, location, portfolio website, GitHub, and LinkedIn handles.
2. **Summary:** A rich professional summary describing your background, core strengths, and career highlights.
3. **Experience:** Repeatable job entries with company name, position, location, start/end dates, current position checkbox, and bullet points.
4. **Projects:** Portfolio projects with project name, live/repo URL, technologies used, start/end dates, and descriptive bullet points.
5. **Education:** School/University, degree, field of study, graduation dates, GPA/grade, and relevant coursework.
6. **Skills:** Categorized skill groups (e.g., *Programming Languages*, *Frameworks*, *Cloud & DevOps*, *Tools*).
7. **Custom Sections:** Add arbitrary custom sections such as *Certifications*, *Publications*, *Awards*, or *Volunteering*.

### 3.2 LaTeX Source Editor Mode
Toggle between the structured form and the raw LaTeX source editor using the **Source Editor** button in the editor toolbar:
- **Syntax Highlighting & Line Numbers:** View clean, human-readable LaTeX code.
- **Live Validation:** Click **Validate Syntax** to check for missing closing environments, unbalanced braces, or disallowed commands.
- **Restore Last Valid Version:** Revert accidental edits at any time with a single click.
- **Export `.tex`:** Download the exact LaTeX source file for external use.

---

## 4. PDF Preview & Inspection Drawer

### 4.1 Interactive Viewer
- **Zoom Controls:** Zoom in, zoom out, fit-to-width, or fit-to-page.
- **Status Indicator:**
  - `Current`: PDF matches the current resume data.
  - `Outdated`: Changes have been made to the data or source that haven't been compiled yet.
  - `Compiling`: Tectonic is building the PDF in the background.
  - `Failed`: Compilation failed; click the diagnostic message to inspect errors.

### 4.2 Geometry Inspection Drawer
Click **Inspect Geometry** to open the real-time layout analysis drawer:
- **Page Count & Target:** Shows actual pages vs. target page count.
- **Page Density:** Computes the percentage of printable area filled with text.
- **Margins & Bounding Boxes:** Displays measured top, bottom, left, and right margins in inches.
- **Layout Warnings:** Flags single-line page spills, cramped sections, or excessive vertical whitespace.

---

## 5. The AI Assistant & Change Review

Click the **AI Assistant** button in the header to open the interactive agent panel.

### 5.1 Natural Language Prompts
Type any instruction in plain English. Examples:
- *"Tighten spacing to make this fit comfortably on one page."*
- *"Improve the bullet points in my senior engineer role to focus on quantifiable business impact."*
- *"Move the technical skills section above work experience."*
- *"Tailor this resume for a distributed systems and cloud infrastructure role."*

### 5.2 Quick Action Chips
Click any of the one-tap suggestion chips above the chat box to trigger common optimization workflows instantly.

### 5.3 Auditable Diff Review
Whenever the AI proposes modifications to your resume:
1. An interactive **Diff Review** card appears displaying:
   - Green highlights for added content.
   - Red strikethroughs for removed content.
   - Blue badges for modified fields.
2. Review the changes.
3. Click **Accept Changes** to commit the modifications to your resume, or click **Reject** to discard them.

### 5.4 Iterative Compile-Inspect Loop
When requesting layout changes (such as fitting onto one page):
- The agent enters a bounded feedback loop (up to 3 iterations).
- It adjusts spacing parameters, recompiles via Tectonic, inspects the resulting PDF geometry with PyMuPDF, and verifies that the page spill has been eliminated before presenting the final result.

---

## 6. Template & Model Settings

### 6.1 Template Selection
Navigate to the **Templates** tab in the navigation bar to choose between:
- **Modern Technical:** Clean single-column layout with subtle section rules and emphasized job titles, ideal for engineering and tech roles.
- **Minimalist:** Classic typographic hierarchy focusing on pure readability and compact spacing.
- **Executive:** Elegant serif styling with refined margins, tailored for senior leadership and management positions.

### 6.2 Model Settings
Navigate to the **Models** tab to:
- Check connection status to your local Ollama server.
- View all installed models with parameter sizes and vision capabilities.
- Select your preferred model for resume drafting and layout planning.
- View helpful `ollama pull` commands for downloading additional models.
