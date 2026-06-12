// Roadmap shown on /start-here. Two tracks (Penetration Testing &
// Exploitation), each broken into levels with an estimated timeline,
// skills to learn, recommended certifications, and practice resources.
// Edit freely — this is opinionated guidance, not gospel.
export const tracks = [
  {
    id: 'pentest',
    name: 'Penetration Testing',
    blurb:
      'Breaking into networks, web apps and Active Directory — the core offensive-security skill set.',
    levels: [
      {
        level: 'Beginner',
        time: '0–6 months',
        focus: 'Build the fundamentals: how networks, Linux and the web actually work.',
        skills: ['TCP/IP & networking', 'Linux CLI', 'Bash & Python', 'HTTP & web basics', 'Virtualization'],
        certs: [
          { name: 'eJPT', issuer: 'INE' },
          { name: 'PJPT', issuer: 'TCM Security' },
          { name: 'Security+', issuer: 'CompTIA' },
        ],
        resources: [
          { name: 'TryHackMe — Pre Security & Jr Penetration Tester', url: 'https://tryhackme.com' },
          { name: 'OverTheWire — Bandit', url: 'https://overthewire.org/wargames/bandit/' },
          { name: 'HTB Academy — Getting Started', url: 'https://academy.hackthebox.com' },
        ],
      },
      {
        level: 'Intermediate',
        time: '6–18 months',
        focus: 'Run a full engagement: enumeration, exploitation, pivoting and reporting.',
        skills: ['Active Directory', 'Privilege escalation', 'Pivoting & tunneling', 'Web exploitation', 'Report writing'],
        certs: [
          { name: 'OSCP', issuer: 'OffSec' },
          { name: 'PNPT', issuer: 'TCM Security' },
          { name: 'CPTS', issuer: 'Hack The Box' },
          { name: 'eCPPT', issuer: 'INE' },
          { name: 'GPEN', issuer: 'GIAC' },
        ],
        resources: [
          { name: 'OffSec PEN-200 (OSCP)', url: 'https://www.offsec.com/courses/pen-200/' },
          { name: 'Hack The Box — machines & Pro Labs', url: 'https://www.hackthebox.com' },
          { name: 'PortSwigger Web Security Academy', url: 'https://portswigger.net/web-security' },
        ],
      },
      {
        level: 'Advanced',
        time: '18–30 months',
        focus: 'Specialize: AV/EDR evasion, red teaming and modern AD / cloud attacks.',
        skills: ['AV/EDR evasion', 'C2 frameworks', 'AD certificate abuse (ADCS)', 'Cloud (Azure/AWS) attacks', 'Lateral movement at scale'],
        certs: [
          { name: 'OSEP', issuer: 'OffSec' },
          { name: 'CRTO', issuer: 'Zero-Point Security' },
          { name: 'CRTP', issuer: 'Altered Security' },
          { name: 'CBBH', issuer: 'Hack The Box' },
        ],
        resources: [
          { name: 'OffSec PEN-300 (OSEP)', url: 'https://www.offsec.com/courses/pen-300/' },
          { name: 'CRTO — Red Team Ops', url: 'https://training.zeropointsecurity.co.uk' },
          { name: 'Altered Security — AD labs', url: 'https://www.alteredsecurity.com' },
        ],
      },
      {
        level: 'Expert',
        time: '30+ months',
        focus: 'Mastery across web, evasion and research — lead engagements and find the novel bugs.',
        skills: ['Original research', 'Advanced web exploitation', 'Custom tooling', 'Red team leadership'],
        certs: [
          { name: 'OSWE', issuer: 'OffSec' },
          { name: 'OSCE³', issuer: 'OffSec' },
          { name: 'CRTL', issuer: 'Zero-Point Security' },
        ],
        resources: [
          { name: 'OffSec WEB-300 (OSWE)', url: 'https://www.offsec.com/courses/web-300/' },
          { name: 'PortSwigger — all labs', url: 'https://portswigger.net/web-security/all-labs' },
        ],
      },
    ],
  },
  {
    id: 'exploit',
    name: 'Exploitation',
    blurb:
      'Going deeper than using exploits — writing them. Memory corruption, shellcode and mitigation bypasses.',
    levels: [
      {
        level: 'Beginner',
        time: '0–6 months',
        focus: 'The languages and tools exploit dev is built on: C, assembly and debuggers.',
        skills: ['C programming', 'x86/x64 assembly', 'Computer architecture', 'GDB / WinDbg', 'Stack & heap memory'],
        certs: [],
        resources: [
          { name: 'pwn.college', url: 'https://pwn.college' },
          { name: 'LiveOverflow — Binary Exploitation', url: 'https://www.youtube.com/@LiveOverflow' },
          { name: 'Open Security Training', url: 'https://opensecuritytraining.info' },
        ],
      },
      {
        level: 'Intermediate',
        time: '6–18 months',
        focus: 'Classic memory corruption: stack overflows, shellcoding and basic ROP.',
        skills: ['Stack buffer overflows', 'Shellcoding', 'ROP basics', 'ASLR / DEP concepts', 'Format-string bugs'],
        certs: [
          { name: 'OSED', issuer: 'OffSec' },
          { name: 'eCXD', issuer: 'INE' },
        ],
        resources: [
          { name: 'ROP Emporium', url: 'https://ropemporium.com' },
          { name: 'OffSec EXP-301 (OSED)', url: 'https://www.offsec.com/courses/exp-301/' },
          { name: 'Nightmare — intro to pwn', url: 'https://guyinatuxedo.github.io' },
        ],
      },
      {
        level: 'Advanced / Expert',
        time: '18+ months',
        focus: 'Modern exploitation: heap, kernel, mitigation bypasses and original vuln research.',
        skills: ['Heap exploitation', 'Kernel exploitation', 'Mitigation bypasses (CFG/CET)', 'Browser internals', 'Fuzzing & research'],
        certs: [
          { name: 'OSEE', issuer: 'OffSec' },
          { name: 'GXPN', issuer: 'GIAC' },
        ],
        resources: [
          { name: 'OffSec EXP-401 (OSEE / AWE)', url: 'https://www.offsec.com/courses/exp-401/' },
          { name: 'Corelan — exploit writing', url: 'https://www.corelan.be/index.php/articles/' },
          { name: 'Azeria Labs (ARM / exploit)', url: 'https://azeria-labs.com' },
        ],
      },
    ],
  },
]
