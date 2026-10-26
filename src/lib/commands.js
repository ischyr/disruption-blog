// Extract the shell commands a post runs, in document order, for the
// "Commands used" panel. Commands come from fenced code blocks (one per line)
// and from inline code spans. Output, config files and scripts are filtered
// out by only accepting lines whose first word is a known tool, a PowerShell
// cmdlet or a path to an executable.

const TOOLS = new Set(
  `
  nmap rustscan masscan netexec nxc crackmapexec cme smbclient smbmap rpcclient
  enum4linux enum4linux-ng ldapsearch ldapdomaindump windapsearch kerbrute
  evil-winrm bloodyad bloodhound-python bloodhound-ce-python rusthound rusthound-ce
  certipy certipy-ad hashcat john ffuf feroxbuster gobuster dirsearch wfuzz whatweb
  nikto sqlmap curl wget nc ncat netcat socat ssh scp sshpass xfreerdp xfreerdp3
  rdesktop exiftool chisel ligolo-ng responder ntlmrelayx mitm6 coercer petitpotam
  faketime ntpdate rdate seq msfvenom msfconsole searchsploit git apt pip pipx
  openssl base64 xxd strings binwalk certutil reg net whoami icacls sc schtasks
  powershell iex mimikatz rubeus sharphound seatbelt winpeas linpeas pspy godpotato
  printspoofer sharpdpapi lsassy pypykatz pywhisker showmount mount gpp-decrypt
  ldeep pre2k timeroast username-anarchy namemash cat echo grep chmod export
  psexec wmiexec smbexec dcomexec atexec mssqlclient secretsdump gettgt getst
  getnthash gettgtpkinit targetedkerberoast dacledit owneredit addcomputer rbcd
  lookupsid rpcdump getuserspns getnpusers dpapi keepassxc-cli
  ifcreate route_add tunnel_start
  `
    .split(/\s+/)
    .filter(Boolean)
)

// wrappers that sit in front of the real tool
const WRAPPERS = new Set(['sudo', 'proxychains', 'proxychains4', 'env', 'time'])

// shell prompts copied along with commands
const PROMPTS = [
  /^(?:➜|→)\s+\S+(?:\s+git:\([^)]*\))?(?:\s+✗)?\s+/, // zsh themes: ➜  dir git:(main) ✗
  /^\*Evil-WinRM\*\s+PS\s+[^>]*>\s*/, // *Evil-WinRM* PS C:\...>
  /^PS(?:\s+[A-Za-z]:\\[^>]*)?>\s*/, // PS> / PS C:\...>
  /^[A-Za-z]:\\[^>]*>\s*/, // C:\Users\x>
  /^[\w.-]+@[\w.-]+:[^$#]*[$#]\s+/, // user@host:~$
  /^└─[$#]\s*/, // kali two-line prompt
  /^rpcclient \$>\s*/, // interactive rpcclient
  /^[$#]\s+/, // bare $ / #
]

const CMDLET = /^[A-Z][a-z]+-[A-Z][A-Za-z]+$/

function stripPrompt(line) {
  for (const re of PROMPTS) {
    const m = re.exec(line)
    if (m) return line.slice(m[0].length)
  }
  return line
}

const basename = (token) => token.split(/[\\/]/).pop()

// Name of the tool a command line runs, or null when it isn't a command.
function toolOf(line) {
  const tokens = line.split(/\s+/)
  let i = 0
  for (;;) {
    const t = tokens[i]
    if (!t) return null
    if (WRAPPERS.has(t.toLowerCase())) i += 1
    else if (t === '-q' && i > 0) i += 1 // proxychains -q
    else if (/^[A-Z_][A-Z0-9_]*=[\w./:-]+$/.test(t)) i += 1 // KRB5CCNAME=x cmd
    else if (t === 'poetry' || t === 'uv' || t === 'pipx') i += tokens[i + 1] === 'run' ? 2 : 1
    else break
  }

  // $c = Import-Clixml ... → judge by the right-hand side
  if (/^\$\w+$/.test(tokens[i] ?? '') && tokens[i + 1] === '=') i += 2

  let token = tokens[i]
  if (!token) return null
  // "Mimikatz - inject a ticket", "Evil-WinRM (Linux) - shell": labels, not commands
  if (/^([-–—]|\()$|^\(/.test(tokens[i + 1] ?? '')) return null
  if (/^python[23]?(\.exe)?$/i.test(token)) {
    token = tokens[i + 1]
    if (!token || !/\.py$/i.test(token)) return null
  }

  // PowerShell cmdlets (Get-ADUser, Import-Clixml…), but not a bare list of them
  if (CMDLET.test(token)) return CMDLET.test(tokens[i + 1] ?? '') ? null : token

  const name = basename(token)
  if (!/^[\w.+-]+$/.test(name)) return null
  const hasExt = /\.(exe|py|ps1|sh)$/i.test(name)
  // tool output starts with a capitalised name ("Nmap scan report", "SSH …");
  // commands are typed lower-case unless the binary itself is mixed-case
  if (!hasExt && (/^[A-Z][a-z]+$/.test(name) || /^[A-Z]{2,}$/.test(name))) return null

  const key = name.toLowerCase().replace(/\.(exe|py|ps1|sh)$/, '')
  // a bare echo just prints (usually inside a script); keep it when it writes somewhere
  if (key === 'echo' && !/[>|]/.test(line.replace(/(["'])(?:(?!\1).)*\1/g, ''))) return null
  if (TOOLS.has(key) || key.startsWith('impacket-') || /2john$/.test(key)) return name
  // ./tool and .\tool.exe run a local binary; absolute paths only for scripts
  if (/^\.{1,2}[\\/]/.test(token)) return name
  if (token.startsWith('/') && /\.(py|sh)$/i.test(name)) return name
  return null
}

// A line someone typed at a shell: a known tool / cmdlet / local binary.
// Used by the renderer to give commands a terminal prompt.
export function isCommand(text) {
  const t = text.trim()
  return t.length >= 3 && Boolean(toolOf(stripPrompt(t)))
}

// True when the line already carries its own prompt (➜ dir, PS>, C:\>…).
export function hasPrompt(text) {
  const t = text.trim()
  return stripPrompt(t) !== t
}

function addCommand(list, seen, raw, text) {
  const cmd = stripPrompt(text.trim())
  if (cmd.length < 3 || seen.has(cmd)) return
  const tool = toolOf(cmd)
  if (!tool) return
  seen.add(cmd)
  // what follows the tool name — the panel already shows the tool, so the
  // preview skips wrappers like `sudo` / `poetry run` and the tool itself
  const at = cmd.indexOf(tool)
  const args = at >= 0 ? cmd.slice(at + tool.length).trim() : ''
  // `raw` is the text as rendered on the page, used to find it again on click
  list.push({ tool, cmd, args, raw: raw.trim() })
}

export function extractCommands(markdown) {
  const list = []
  const seen = new Set()
  const lines = markdown.split(/\r?\n/)
  let fence = null // { marker, lang }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const open = /^\s*(```+|~~~+)\s*([\w+#-]*)/.exec(line)
    if (open) {
      if (!fence) fence = { marker: open[1][0], lang: open[2].toLowerCase() }
      else if (open[1][0] === fence.marker) fence = null
      continue
    }

    if (fence) {
      // from a shebang on, the block is a script listing (often printed by a
      // `cat script.sh` on the line before), not commands
      if (line.trim().startsWith('#!')) fence.lang = 'script'
      if (fence.lang === 'mermaid' || fence.lang === 'script') continue
      // join `\` / `^` / backtick continuations into one command
      let text = line
      while (/[\\^`]\s*$/.test(text) && i + 1 < lines.length && !/^\s*(```|~~~)/.test(lines[i + 1])) {
        text = `${text.replace(/[\\^`]\s*$/, '')} ${lines[++i].trim()}`
      }
      addCommand(list, seen, line, text)
      continue
    }

    // inline code spans outside fences — need a space to be a real command
    for (const m of line.matchAll(/`([^`\n]+)`/g)) {
      if (/\s/.test(m[1].trim())) addCommand(list, seen, m[1], m[1])
    }
  }
  return list
}
