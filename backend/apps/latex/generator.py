"""
LaTeX Document Generator for CVstart.
Renders structured resume data into clean, professional, ATS-friendly LaTeX source code.
"""

from typing import Dict, Any, List, Optional
from .escaper import escape_latex, sanitize_url

def render_bullet_points(items: List[str]) -> str:
    """Format a list of highlight strings into an itemize block."""
    if not items:
        return ""
    bullets = []
    for item in items:
        if not item or not str(item).strip():
            continue
        bullets.append(f"    \\item {escape_latex(item)}")
    if not bullets:
        return ""
    return "\\begin{itemize}[leftmargin=*,noitemsep,topsep=1pt]\n" + "\n".join(bullets) + "\n\\end{itemize}"

def generate_latex_resume(data: Dict[str, Any], template_name: str = "modern_technical", options: Optional[Dict[str, Any]] = None) -> str:
    """
    Generate complete LaTeX source from structured resume data.
    """
    options = options or {}
    paper_size = options.get('paper_size', 'letter') + 'paper' # 'letterpaper' or 'a4paper'
    font_size = options.get('font_size', '10pt') # '10pt', '11pt'
    margin = options.get('margin', '0.5in') # e.g. '0.5in', '0.6in'

    personal = data.get('personal', {})
    summary = data.get('summary', '').strip()
    education = data.get('education', [])
    experience = data.get('experience', [])
    projects = data.get('projects', [])
    skills = data.get('skills', {})
    certifications = data.get('certifications', [])
    achievements = data.get('achievements', [])
    publications = data.get('publications', [])
    custom_sections = data.get('custom_sections', [])

    full_name = escape_latex(personal.get('full_name', ''))
    title = escape_latex(personal.get('title', ''))
    email = personal.get('email', '').strip()
    phone = escape_latex(personal.get('phone', '').strip())
    location = escape_latex(personal.get('location', '').strip())
    website = personal.get('website', '').strip()
    github = personal.get('github', '').strip()
    linkedin = personal.get('linkedin', '').strip()

    # Build header contact items
    contact_parts = []
    if email:
        contact_parts.append(f"\\href{{mailto:{sanitize_url(email)}}}{{{escape_latex(email)}}}")
    if phone:
        contact_parts.append(phone)
    if location:
        contact_parts.append(location)
    if website:
        clean_web = website.replace('https://', '').replace('http://', '').rstrip('/')
        contact_parts.append(f"\\href{{{sanitize_url(website)}}}{{{escape_latex(clean_web)}}}")
    if github:
        clean_gh = github.replace('https://github.com/', '').replace('http://github.com/', '')
        contact_parts.append(f"\\href{{{sanitize_url(github)}}}{{github.com/{escape_latex(clean_gh)}}}")
    if linkedin:
        clean_li = linkedin.replace('https://linkedin.com/in/', '').replace('https://www.linkedin.com/in/', '')
        contact_parts.append(f"\\href{{{sanitize_url(linkedin)}}}{{linkedin.com/in/{escape_latex(clean_li)}}}")

    contact_line = " $\\vert$ ".join(contact_parts)

    # Accent color based on template
    if template_name == "minimalist":
        primary_color = "0.0, 0.0, 0.0"
        rule_color = "0.7, 0.7, 0.7"
    elif template_name == "executive":
        primary_color = "0.1, 0.2, 0.35"
        rule_color = "0.3, 0.4, 0.5"
    else: # modern_technical
        primary_color = "0.08, 0.28, 0.55"
        rule_color = "0.75, 0.8, 0.85"

    tex = [
        f"% CVstart Generated Resume - Template: {template_name}",
        f"\\documentclass[{paper_size},{font_size}]{{article}}",
        "\\usepackage[utf8]{inputenc}",
        "\\usepackage[T1]{fontenc}",
        "\\usepackage{lmodern}",
        f"\\usepackage[{paper_size},margin={margin}]{{geometry}}",
        "\\usepackage{xcolor}",
        "\\usepackage{enumitem}",
        "\\usepackage{tabularx}",
        "\\usepackage{titlesec}",
        "\\usepackage[hidelinks]{hyperref}",
        "",
        "% Styling configurations",
        f"\\definecolor{{PrimaryColor}}{{rgb}}{{{primary_color}}}",
        f"\\definecolor{{RuleColor}}{{rgb}}{{{rule_color}}}",
        "\\pagestyle{empty}",
        "\\raggedbottom",
        "\\raggedright",
        "\\setlength{\\tabcolsep}{0in}",
        "",
        "% Section formatting",
        "\\titleformat{\\section}{",
        "  \\vspace{-4pt}\\scshape\\raggedright\\large\\color{PrimaryColor}",
        "}{}{0em}{}[\\color{RuleColor}\\titlerule \\vspace{-3pt}]",
        "",
        "% Custom entry formatting macros",
        "\\newcommand{\\resumeItem}[1]{\\item\\small{#1}}",
        "\\newcommand{\\resumeSubheading}[4]{",
        "  \\vspace{-1pt}\\item[]",
        "    \\begin{tabular*}{1.0\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}",
        "      \\textbf{#1} & \\textbf{\\small #2} \\\\",
        "      \\textit{\\small#3} & \\textit{\\small #4} \\\\",
        "    \\end{tabular*}\\vspace{-4pt}",
        "}",
        "\\newcommand{\\resumeProjectHeading}[2]{",
        "  \\vspace{-1pt}\\item[]",
        "    \\begin{tabular*}{1.0\\textwidth}{l@{\\extracolsep{\\fill}}r}",
        "      #1 & \\textbf{\\small #2} \\\\",
        "    \\end{tabular*}\\vspace{-4pt}",
        "}",
        "",
        "\\begin{document}",
        "",
        "% --- HEADER ---",
        "\\begin{center}",
        f"    {{\\Huge \\textbf{{\\color{{PrimaryColor}} {full_name}}}}} \\\\ \\vspace{{2pt}}",
    ]

    if title:
        tex.append(f"    {{\\large \\textit{{{title}}}}} \\\\ \\vspace{{3pt}}")

    if contact_line:
        tex.append(f"    {{\\small {contact_line}}}")

    tex.append("\\end{center}")
    tex.append("\\vspace{-6pt}")

    # --- SUMMARY ---
    if summary:
        tex.append("\n% --- SUMMARY ---")
        tex.append("\\section{Professional Summary}")
        tex.append(f"\\small{{{escape_latex(summary)}}}")
        tex.append("\\vspace{2pt}")

    # --- EXPERIENCE ---
    if experience:
        tex.append("\n% --- EXPERIENCE ---")
        tex.append("\\section{Work Experience}")
        tex.append("\\begin{itemize}[leftmargin=0in, label={}]")
        for exp in experience:
            company = escape_latex(exp.get('company', ''))
            role = escape_latex(exp.get('role', ''))
            loc = escape_latex(exp.get('location', ''))
            s_date = escape_latex(exp.get('start_date', ''))
            e_date = "Present" if exp.get('current') else escape_latex(exp.get('end_date', ''))
            date_range = f"{s_date} -- {e_date}" if s_date and e_date else (s_date or e_date)

            tex.append(f"  \\resumeSubheading{{{role}}}{{{date_range}}}{{{company}}}{{{loc}}}")

            desc = exp.get('description', '')
            highlights = exp.get('highlights', [])
            all_points = []
            if desc and desc.strip():
                all_points.append(desc.strip())
            if isinstance(highlights, list):
                all_points.extend([h for h in highlights if h and str(h).strip()])

            if all_points:
                tex.append(render_bullet_points(all_points))
            tex.append("  \\vspace{2pt}")
        tex.append("\\end{itemize}")

    # --- PROJECTS ---
    if projects:
        tex.append("\n% --- PROJECTS ---")
        tex.append("\\section{Projects}")
        tex.append("\\begin{itemize}[leftmargin=0in, label={}]")
        for proj in projects:
            p_name = escape_latex(proj.get('name', ''))
            p_url = proj.get('url', '').strip()
            p_tech = proj.get('technologies', [])
            if isinstance(p_tech, list):
                p_tech_str = ", ".join([escape_latex(t) for t in p_tech if t])
            else:
                p_tech_str = escape_latex(str(p_tech))

            s_date = escape_latex(proj.get('start_date', ''))
            e_date = escape_latex(proj.get('end_date', ''))
            date_range = f"{s_date} -- {e_date}" if s_date and e_date else (s_date or e_date)

            heading_left = f"\\textbf{{{p_name}}}"
            if p_tech_str:
                heading_left += f" $\\vert$ \\textit{{\\small {p_tech_str}}}"
            if p_url:
                clean_url = p_url.replace('https://', '').replace('http://', '').rstrip('/')
                heading_left += f" [\\href{{{sanitize_url(p_url)}}}{{\\small {escape_latex(clean_url)}}}]"

            tex.append(f"  \\resumeProjectHeading{{{heading_left}}}{{{date_range}}}")

            desc = proj.get('description', '')
            highlights = proj.get('highlights', [])
            all_points = []
            if desc and desc.strip():
                all_points.append(desc.strip())
            if isinstance(highlights, list):
                all_points.extend([h for h in highlights if h and str(h).strip()])

            if all_points:
                tex.append(render_bullet_points(all_points))
            tex.append("  \\vspace{2pt}")
        tex.append("\\end{itemize}")

    # --- EDUCATION ---
    if education:
        tex.append("\n% --- EDUCATION ---")
        tex.append("\\section{Education}")
        tex.append("\\begin{itemize}[leftmargin=0in, label={}]")
        for edu in education:
            inst = escape_latex(edu.get('institution', ''))
            degree = escape_latex(edu.get('degree', ''))
            field = escape_latex(edu.get('field_of_study', ''))
            degree_str = f"{degree} in {field}" if degree and field else (degree or field)
            s_date = escape_latex(edu.get('start_date', ''))
            e_date = escape_latex(edu.get('end_date', ''))
            date_range = f"{s_date} -- {e_date}" if s_date and e_date else (s_date or e_date)
            gpa = escape_latex(edu.get('gpa', ''))

            tex.append(f"  \\resumeSubheading{{{inst}}}{{{date_range}}}{{{degree_str}}}{{}}")

            details = []
            if gpa:
                details.append(f"GPA: {gpa}")
            c_work = edu.get('coursework', [])
            if c_work:
                if isinstance(c_work, list):
                    c_str = ", ".join([escape_latex(c) for c in c_work if c])
                else:
                    c_str = escape_latex(str(c_work))
                details.append(f"Relevant Coursework: {c_str}")

            highlights = edu.get('highlights', [])
            if isinstance(highlights, list):
                details.extend([h for h in highlights if h and str(h).strip()])

            if details:
                tex.append(render_bullet_points(details))
            tex.append("  \\vspace{2pt}")
        tex.append("\\end{itemize}")

    # --- TECHNICAL SKILLS ---
    has_skills = False
    skill_rows = []
    if isinstance(skills, dict):
        for cat_key, items in skills.items():
            if items:
                has_skills = True
                cat_label = escape_latex(cat_key.replace('_', ' ').title())
                if isinstance(items, list):
                    items_str = ", ".join([escape_latex(i) for i in items if i])
                else:
                    items_str = escape_latex(str(items))
                skill_rows.append(f"  \\textbf{{{cat_label}}}: {items_str} \\\\")

    if has_skills and skill_rows:
        tex.append("\n% --- TECHNICAL SKILLS ---")
        tex.append("\\section{Technical Skills}")
        tex.append("\\begin{itemize}[leftmargin=0in, label={}]")
        tex.append("  \\small{\\item{")
        tex.append("\n".join(skill_rows))
        tex.append("  }}")
        tex.append("\\end{itemize}")

    # --- CERTIFICATIONS ---
    if certifications:
        tex.append("\n% --- CERTIFICATIONS ---")
        tex.append("\\section{Certifications}")
        tex.append("\\begin{itemize}[leftmargin=0in, label={}]")
        for cert in certifications:
            c_name = escape_latex(cert.get('name', ''))
            c_issuer = escape_latex(cert.get('issuer', ''))
            c_date = escape_latex(cert.get('date', ''))
            c_url = cert.get('url', '').strip()

            line_left = f"\\textbf{{{c_name}}}"
            if c_issuer:
                line_left += f" $\\vert$ {c_issuer}"
            if c_url:
                line_left += f" [\\href{{{sanitize_url(c_url)}}}{{Verify}}]"
            tex.append(f"  \\resumeProjectHeading{{{line_left}}}{{{c_date}}}")
        tex.append("\\end{itemize}")

    # --- ACHIEVEMENTS ---
    if achievements:
        tex.append("\n% --- ACHIEVEMENTS & AWARDS ---")
        tex.append("\\section{Achievements \\& Honors}")
        tex.append("\\begin{itemize}[leftmargin=*,noitemsep,topsep=1pt]")
        for ach in achievements:
            if isinstance(ach, dict):
                a_title = escape_latex(ach.get('title', ''))
                a_desc = escape_latex(ach.get('description', ''))
                a_date = escape_latex(ach.get('date', ''))
                line = f"\\textbf{{{a_title}}}"
                if a_date:
                    line += f" ({a_date})"
                if a_desc:
                    line += f": {a_desc}"
                tex.append(f"  \\item {line}")
            elif isinstance(ach, str) and ach.strip():
                tex.append(f"  \\item {escape_latex(ach.strip())}")
        tex.append("\\end{itemize}")

    # --- PUBLICATIONS ---
    if publications:
        tex.append("\n% --- PUBLICATIONS ---")
        tex.append("\\section{Publications}")
        tex.append("\\begin{itemize}[leftmargin=*,noitemsep,topsep=1pt]")
        for pub in publications:
            p_title = escape_latex(pub.get('title', ''))
            p_pub = escape_latex(pub.get('publisher', ''))
            p_date = escape_latex(pub.get('date', ''))
            p_url = pub.get('url', '').strip()
            line = f"\\textbf{{{p_title}}}"
            if p_pub:
                line += f", \\textit{{{p_pub}}}"
            if p_date:
                line += f" ({p_date})"
            if p_url:
                line += f" [\\href{{{sanitize_url(p_url)}}}{{Link}}]"
            tex.append(f"  \\item {line}")
        tex.append("\\end{itemize}")

    # --- CUSTOM SECTIONS ---
    if custom_sections:
        for csec in custom_sections:
            c_heading = escape_latex(csec.get('heading', 'Additional Section'))
            c_items = csec.get('items', [])
            tex.append(f"\n% --- {c_heading.upper()} ---")
            tex.append(f"\\section{{{c_heading}}}")
            if c_items:
                tex.append("\\begin{itemize}[leftmargin=*,noitemsep,topsep=1pt]")
                for item in c_items:
                    if isinstance(item, dict):
                        tex.append(f"  \\item \\textbf{{{escape_latex(item.get('title', ''))}}}: {escape_latex(item.get('description', ''))}")
                    else:
                        tex.append(f"  \\item {escape_latex(str(item))}")
                tex.append("\\end{itemize}")

    tex.append("\n\\end{document}\n")
    return "\n".join(tex)
