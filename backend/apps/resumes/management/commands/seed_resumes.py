"""
Management command to seed two detailed, production-grade resumes in CVstart.
"""

from django.core.management.base import BaseCommand
from backend.apps.resumes.models import Resume, ResumeVersion
from backend.apps.latex.generator import generate_latex_resume
from backend.apps.latex.compiler import compile_latex_to_pdf

RESUME_1_DATA = {
    "personal": {
        "full_name": "Alex Morgan",
        "title": "Principal Systems Architect & Cloud Infrastructure Lead",
        "email": "alex.morgan@alumni.berkeley.edu",
        "phone": "+1 (415) 890-3421",
        "location": "San Francisco, CA",
        "website": "https://alexmorgan.systems",
        "github": "https://github.com/alexmorgan-eng",
        "linkedin": "https://linkedin.com/in/alex-morgan-systems"
    },
    "summary": "Distinguished Systems Architect and Infrastructure Engineer with 9+ years of experience spearheading distributed cloud platforms, multi-region Kubernetes topologies, and high-throughput real-time processing pipelines. Proven track record driving 99.999% SLA availability across critical fintech and SaaS architectures, optimizing p99 microservice latency by 45%, and guiding engineering organizations through massive scale.",
    "experience": [
        {
            "company": "Aether Cloud Platforms",
            "role": "Principal Infrastructure Architect",
            "location": "San Francisco, CA",
            "start_date": "2022-03",
            "end_date": "",
            "current": True,
            "description": "Architect and lead core global infrastructure spanning 14 hybrid cloud regions serving 35M+ daily active requests.",
            "highlights": [
                "Architected and deployed a multi-tenant service mesh across 24 Kubernetes clusters using Cilium eBPF, reducing cross-zone egress costs by $420K annually.",
                "Engineered an event-driven telemetry pipeline using Apache Kafka, Apache Flink, and ClickHouse processing 1.8M events/sec with sub-second query latency.",
                "Spearheaded zero-trust identity federation and automated mTLS rotation across 450+ microservices, successfully passing SOC 2 Type II and ISO 27001 audits.",
                "Mentored 18 senior and staff engineers across 4 cross-functional platform pods; established company-wide RFC and architecture review standards."
            ]
        },
        {
            "company": "FinEdge Global Payments",
            "role": "Senior Staff Software Engineer",
            "location": "Palo Alto, CA",
            "start_date": "2019-06",
            "end_date": "2022-02",
            "current": False,
            "description": "Led the core transaction settlement engine handling $18B in annualized transaction volume across distributed ledgers.",
            "highlights": [
                "Redesigned the distributed ledger ledger-balancing engine in Go and PostgreSQL, improving transaction throughput from 2,400 to 14,000 TPS with strict ACID compliance.",
                "Implemented real-time fraud mitigation microservices leveraging Redis clusters and gRPC, reducing fraudulent clearing attempts by 38% ($4.2M prevented losses).",
                "Decomposed a legacy monolithic payment gateway into domain-driven Go microservices with zero downtime during active trading hours."
            ]
        },
        {
            "company": "Nexus Data Systems",
            "role": "Senior Software Engineer",
            "location": "Mountain View, CA",
            "start_date": "2016-08",
            "end_date": "2019-05",
            "current": False,
            "description": "Built distributed storage abstractions, real-time replication adapters, and developer platform tooling.",
            "highlights": [
                "Developed automated CI/CD canary deployment pipelines using ArgoCD and GitHub Actions, cutting release failure rates by 65% and cycle time from 3 days to 25 minutes.",
                "Optimized database connection pooling and query caching layers in Python and C++, trimming p99 API response times from 340ms to 48ms under peak load."
            ]
        }
    ],
    "projects": [
        {
            "name": "KubeFlowMesh",
            "url": "https://github.com/alexmorgan-eng/kubeflowmesh",
            "technologies": ["Go", "Kubernetes", "eBPF", "Cilium", "Prometheus", "gRPC"],
            "start_date": "2023-01",
            "end_date": "2023-11",
            "description": "Open-source eBPF-powered network observability and traffic orchestration tool for multi-cluster Kubernetes deployments.",
            "highlights": [
                "Featured on Hacker News front page; adopted by 800+ GitHub stargazers and deployed in production across 40+ enterprise staging clusters.",
                "Delivered kernel-level L4/L7 packet tracing with negligible CPU overhead (<1.2%), providing instant visual distributed traces without code instrumentation."
            ]
        },
        {
            "name": "StreamSync Core",
            "url": "https://github.com/alexmorgan-eng/streamsync-core",
            "technologies": ["Rust", "Apache Arrow", "Tokio", "WebSockets"],
            "start_date": "2022-04",
            "end_date": "2022-12",
            "description": "High-throughput in-memory zero-copy pub/sub streaming buffer designed for high-frequency financial feeds.",
            "highlights": [
                "Benchmarked sustained throughput of 4.2M messages/sec with median latency of 14 microseconds on standard commodity hardware.",
                "Built custom memory allocators with zero garbage collection pauses and comprehensive SIMD vectorization."
            ]
        }
    ],
    "education": [
        {
            "institution": "University of California, Berkeley",
            "degree": "Bachelor of Science",
            "field_of_study": "Computer Science & Engineering",
            "start_date": "2012-08",
            "end_date": "2016-05",
            "gpa": "3.89 / 4.00",
            "coursework": ["Distributed Systems", "Operating Systems", "Database Internals", "Computer Networks", "Algorithms & Complexity"],
            "highlights": [
                "EECS Departmental Honors; Dean's Honor List all semesters",
                "Head Teaching Assistant for CS 162 (Operating Systems and Systems Programming)"
            ]
        }
    ],
    "skills": {
        "languages": ["Go", "Rust", "Python", "TypeScript", "C++", "SQL", "Bash"],
        "frameworks": ["gRPC", "Protobuf", "FastAPI", "React", "Node.js", "Next.js"],
        "developer_tools": ["Kubernetes", "Docker", "Terraform", "Cilium eBPF", "ArgoCD", "Helm", "Git", "Linux Kernel"],
        "libraries": ["Apache Kafka", "PostgreSQL", "Redis", "ClickHouse", "Prometheus", "Grafana", "OpenTelemetry"]
    },
    "certifications": [
        {
            "name": "AWS Certified Solutions Architect -- Professional",
            "issuer": "Amazon Web Services",
            "date": "2024-02",
            "url": "https://aws.amazon.com/verification"
        },
        {
            "name": "Certified Kubernetes Administrator (CKA)",
            "issuer": "Cloud Native Computing Foundation (CNCF)",
            "date": "2023-08",
            "url": "https://cncf.io/verification"
        }
    ],
    "achievements": [
        {
            "title": "Open Source Contributor of the Year",
            "description": "Recognized by CNCF for key contributions to cloud observability tooling.",
            "date": "2023-10"
        },
        {
            "title": "FinEdge Innovation Excellence Award",
            "description": "Awarded for patent-pending distributed zero-loss ledger settlement algorithm.",
            "date": "2021-04"
        }
    ],
    "publications": [],
    "custom_sections": []
}

RESUME_2_DATA = {
    "personal": {
        "full_name": "Dr. Elena Rostova",
        "title": "Senior AI Systems Architect & Security Operations Lead",
        "email": "e.rostova@cantab.net",
        "phone": "+1 (617) 495-2180",
        "location": "Boston, MA",
        "website": "https://elenarostova.ai",
        "github": "https://github.com/elena-rostova-sec",
        "linkedin": "https://linkedin.com/in/elena-rostova-phd"
    },
    "summary": "Forward-thinking AI Systems Architect and Cybersecurity Specialist with 8+ years of technical leadership bridging local-first generative AI models, agentic reasoning loops, and enterprise Security Operations Center (SOC) defense. Deep expertise in automated vulnerability mitigation, intrusion detection pipelines, and high-performance LLM inference pipelines with strict privacy guarantees.",
    "experience": [
        {
            "company": "Cognitive Defense Systems",
            "role": "Lead AI & Security Architect",
            "location": "Boston, MA",
            "start_date": "2022-05",
            "end_date": "",
            "current": True,
            "description": "Lead an 11-person engineering squad developing autonomous SOC agent systems that ingest 40M daily security logs for real-time threat hunting.",
            "highlights": [
                "Engineered an automated SOC response agent using quantized local open-weight LLMs and Ollama, cutting Mean Time to Detect (MTTD) from 4.5 hours to 3.2 minutes.",
                "Implemented privacy-preserving differential privacy layers and model guardrails that prevent prompt injection and unauthorized sensitive PII exfiltration across 120 enterprise tenants.",
                "Architected real-time log ingestion pipeline across ElasticSearch, Suricata IDS, and Kafka, handling 25,000 EPS with zero packet drops under live attack conditions.",
                "Published internal standard for red-teaming generative AI applications adopted by 400+ developers company-wide."
            ]
        },
        {
            "company": "Vanguard Cybersecurity Labs",
            "role": "Senior Security Operations & Threat Hunting Engineer",
            "location": "Cambridge, MA",
            "start_date": "2019-09",
            "end_date": "2022-04",
            "current": False,
            "description": "Directed Tier 3 incident response investigations and automated security playbooks for high-consequence cloud environments.",
            "highlights": [
                "Designed and deployed 85+ automated SOAR playbooks in Python and Splunk Phantom, eliminating 70% of repetitive Tier-1 alert triages and saving 200 analyst hours monthly.",
                "Spearheaded enterprise threat hunting across AWS multi-account landing zones; intercepted and neutralized 3 targeted APT ransomware reconnaissance campaigns before lateral movement occurred.",
                "Built custom SIEM correlation rules mapped to MITRE ATT&CK framework, boosting detection coverage across initial access, privilege escalation, and exfiltration vectors by 62%."
            ]
        },
        {
            "company": "MIT Lincoln Laboratory",
            "role": "Cyber Systems Research Engineer",
            "location": "Lexington, MA",
            "start_date": "2017-06",
            "end_date": "2019-08",
            "current": False,
            "description": "Researched automated network anomaly detection, cryptographic authentication protocols, and hardware security.",
            "highlights": [
                "Developed graph neural network models to identify anomalous traffic flows across encrypted software-defined networks with 97.4% precision.",
                "Co-authored 3 peer-reviewed research papers in IEEE S&P and ACM CCS on resilient distributed consensus and intrusion prevention."
            ]
        }
    ],
    "projects": [
        {
            "name": "SentinelAgent",
            "url": "https://github.com/elena-rostova-sec/sentinel-agent",
            "technologies": ["Python", "Ollama", "FastAPI", "LangGraph", "ChromaDB", "Docker"],
            "start_date": "2023-04",
            "end_date": "2024-01",
            "description": "Open-source local-first AI Security Analyst that connects directly to local Ollama models to parse Zeek and Suricata network logs.",
            "highlights": [
                "Achieved 1,200+ stars on GitHub; integrated by 15 security consulting firms as an air-gapped forensic log investigation assistant.",
                "Synthesizes incident timelines, generates remediation scripts, and correlates IoCs with zero external cloud dependencies or API fee leakage."
            ]
        },
        {
            "name": "ZeroTrust-Mesh",
            "url": "https://github.com/elena-rostova-sec/zerotrust-mesh",
            "technologies": ["Rust", "WireGuard", "eBPF", "SQLite", "TLS 1.3"],
            "start_date": "2022-01",
            "end_date": "2022-10",
            "description": "Lightweight peer-to-peer overlay network with continuous cryptographic identity attestation and kernel-level firewall enforcement.",
            "highlights": [
                "Secured sub-millisecond connection handshakes using noise protocol framework and hardware TPM attestation keys."
            ]
        }
    ],
    "education": [
        {
            "institution": "Massachusetts Institute of Technology (MIT)",
            "degree": "Ph.D.",
            "field_of_study": "Computer Science & Cybersecurity",
            "start_date": "2013-09",
            "end_date": "2017-05",
            "gpa": "3.96 / 4.00",
            "coursework": ["Advanced Cryptography", "Network Security", "Machine Learning Systems", "Formal Verification", "Distributed Consensus"],
            "highlights": [
                "Doctoral Dissertation: Autonomous Defense Topologies in Adversarial Environments",
                "National Science Foundation (NSF) Graduate Research Fellow"
            ]
        },
        {
            "institution": "Carnegie Mellon University",
            "degree": "Bachelor of Science",
            "field_of_study": "Computer Science (Minor in Mathematics)",
            "start_date": "2009-08",
            "end_date": "2013-05",
            "gpa": "3.92 / 4.00",
            "coursework": ["Systems Programming", "Data Structures", "Algorithm Design", "Computer Architecture"],
            "highlights": [
                "Graduated with University Honors (Summa Cum Laude)"
            ]
        }
    ],
    "skills": {
        "languages": ["Python", "Rust", "Go", "C/C++", "SQL", "Bash", "LaTeX"],
        "frameworks": ["PyTorch", "LangChain", "LangGraph", "HuggingFace", "FastAPI", "Django REST Framework"],
        "developer_tools": ["Splunk", "ElasticSearch", "Wireshark", "Suricata", "Zeek", "Docker", "Kubernetes", "Git"],
        "libraries": ["ChromaDB", "Ollama", "Kafka", "Redis", "NumPy", "Pandas", "Scikit-Learn"]
    },
    "certifications": [
        {
            "name": "Certified Information Systems Security Professional (CISSP)",
            "issuer": "(ISC)²",
            "date": "2023-05",
            "url": "https://isc2.org/verification"
        },
        {
            "name": "GIAC Certified Incident Handler (GCIH)",
            "issuer": "SANS / GIAC",
            "date": "2021-11",
            "url": "https://giac.org/verification"
        }
    ],
    "achievements": [
        {
            "title": "DEF CON CTF Finalist",
            "description": "Placed 4th globally in DEF CON Black Badge capture-the-flag finals competing against top international red teams.",
            "date": "2022-08"
        },
        {
            "title": "MIT Cybersecurity Innovation Prize",
            "description": "First place award for autonomous network intrusion defense and honey-mesh architecture.",
            "date": "2017-04"
        }
    ],
    "publications": [],
    "custom_sections": []
}


class Command(BaseCommand):
    help = "Seeds two detailed, production-grade resumes in CVstart."

    def handle(self, *args, **options):
        self.stdout.write("Seeding two detailed, production-grade resumes...")

        # Also remove or update any old placeholder resumes
        old_placeholders = Resume.objects.filter(title__in=["Untitled Resume", "Security Engineer Resume"])
        if old_placeholders.exists():
            old_placeholders.delete()

        # Resume 1: Alex Morgan
        r1, created1 = Resume.objects.update_or_create(
            title="Alex Morgan - Principal Systems Architect",
            defaults={
                "target_role": "Staff / Principal Software Engineer",
                "selected_template": "modern_technical",
                "preferred_page_size": "letter",
                "structured_data": RESUME_1_DATA,
                "version": 1
            }
        )

        # Generate LaTeX and compile PDF for Resume 1
        tex1 = generate_latex_resume(RESUME_1_DATA, template_name="modern_technical")
        r1.current_latex = tex1
        comp1 = compile_latex_to_pdf(tex1, str(r1.id))
        if comp1.get("success") and comp1.get("pdf_path"):
            r1.latest_pdf_path = comp1["pdf_path"]
            self.stdout.write(self.style.SUCCESS(f"Compiled PDF for '{r1.title}': {comp1['pdf_path']}"))
        else:
            self.stdout.write(self.style.WARNING(f"PDF compilation notice for '{r1.title}': {comp1.get('log')}"))
        r1.save()

        ResumeVersion.objects.update_or_create(
            resume=r1,
            version_number=1,
            defaults={
                "change_summary": "Initial comprehensive profile with verified systems experience, projects, and certifications.",
                "structured_data": RESUME_1_DATA,
                "latex_source": tex1,
                "pdf_path": r1.latest_pdf_path
            }
        )
        self.stdout.write(self.style.SUCCESS(f"Seeded Resume 1: {r1.title} ({r1.id})"))

        # Resume 2: Dr. Elena Rostova
        r2, created2 = Resume.objects.update_or_create(
            title="Dr. Elena Rostova - Senior AI & Security Systems Lead",
            defaults={
                "target_role": "Staff AI Systems & Security Operations Engineer",
                "selected_template": "executive",
                "preferred_page_size": "letter",
                "structured_data": RESUME_2_DATA,
                "version": 1
            }
        )

        # Generate LaTeX and compile PDF for Resume 2
        tex2 = generate_latex_resume(RESUME_2_DATA, template_name="executive")
        r2.current_latex = tex2
        comp2 = compile_latex_to_pdf(tex2, str(r2.id))
        if comp2.get("success") and comp2.get("pdf_path"):
            r2.latest_pdf_path = comp2["pdf_path"]
            self.stdout.write(self.style.SUCCESS(f"Compiled PDF for '{r2.title}': {comp2['pdf_path']}"))
        else:
            self.stdout.write(self.style.WARNING(f"PDF compilation notice for '{r2.title}': {comp2.get('log')}"))
        r2.save()

        ResumeVersion.objects.update_or_create(
            resume=r2,
            version_number=1,
            defaults={
                "change_summary": "Initial comprehensive profile with AI/ML security architecture, research, and publications.",
                "structured_data": RESUME_2_DATA,
                "latex_source": tex2,
                "pdf_path": r2.latest_pdf_path
            }
        )
        self.stdout.write(self.style.SUCCESS(f"Seeded Resume 2: {r2.title} ({r2.id})"))

        # Clean up any duplicate versions or old version records
        Resume.objects.filter(title="Alex Morgan - Master Resume").delete()

        self.stdout.write(self.style.SUCCESS("Successfully seeded both resumes with full details and compiled PDFs!"))
