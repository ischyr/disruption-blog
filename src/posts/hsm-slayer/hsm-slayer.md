---
title: HackSmarter - Slayer
date: 2026-07-04
image: cover.png
tags: [HackSmarter, Easy, Windows]
excerpt: An easy standalone Windows box where phished user credentials lead to RDP access, an administrator password left behind in PowerShell history offers an unintended shortcut to full compromise, and the intended path abuses a weak service permission on SysMgmtAgent to rewrite its binPath and join the local Administrators group.
---

# Slayer

Following a successful social engineering engagement, you have obtained user-level credentials for a corporate workstation. Your objective is to leverage this initial access to perform deep reconnaissance on the internal Windows host. The final goal is to escalate privileges and capture the root flag from the administrator's directory to demonstrate full system compromise.

### Initial Access

```c
tyler.ramsey:P@ssw0rd!
```

### NMAP Scanning

```c
PORT      STATE SERVICE       REASON          VERSION
135/tcp   open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
445/tcp   open  microsoft-ds? syn-ack ttl 126
3389/tcp  open  ms-wbt-server syn-ack ttl 126
| ssl-cert: Subject: commonName=EC2AMAZ-M1LFCNO
| Issuer: commonName=EC2AMAZ-M1LFCNO
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2026-07-03T11:57:27
| Not valid after:  2027-01-02T11:57:27
| MD5:   ea11:995d:54a1:b9f3:95ee:0815:0e7a:2519
| SHA-1: ed81:aba1:3abe:307f:b0e2:2f35:f473:a4f9:2a31:382b
| -----BEGIN CERTIFICATE-----
| MIIC4jCCAcqgAwIBAgIQaIBQUDz1r4JIK6Rq6bMsZzANBgkqhkiG9w0BAQsFADAa
| MRgwFgYDVQQDEw9FQzJBTUFaLU0xTEZDTk8wHhcNMjYwNzAzMTE1NzI3WhcNMjcw
| MTAyMTE1NzI3WjAaMRgwFgYDVQQDEw9FQzJBTUFaLU0xTEZDTk8wggEiMA0GCSqG
| SIb3DQEBAQUAA4IBDwAwggEKAoIBAQDDyk5Ytulmo3GZZlysFlf2gq4vVGWE/pSg
| weKztI7FkhxDhdabR7rBJstGudt9+IkYayWU0HTFzCtG1ur7Whd+viesbUQQFKZw
| vALkNr+7B+NdoWq8dL/uBvwGhi/KM0wxMKZfwYzrMYGLisoW/4LlP0Yq9MuwBaJh
| 6s6w3qD4THKm6ywYzVSUM1KHLlYkmGZQyGhCHTpNPHN0VkJoIzK/yq8phxtuP3ZP
| A4pNwMKPR0wZa9Xby3ZDTSPeomGjhwlP40LIAAoOqDGm46V04LCmPMMPEXmfcPVY
| jJZ82yzzMpe7ciWn8chUZJednRZvrGJ/KVJks5Hgv5R20ocVpS7JAgMBAAGjJDAi
| MBMGA1UdJQQMMAoGCCsGAQUFBwMBMAsGA1UdDwQEAwIEMDANBgkqhkiG9w0BAQsF
| AAOCAQEAZ5DR2Kl4UtP/ClMNXogrTRtnQXhFYm1a8ku/IyYeDwXWgFCTJCvCyUxW
| wGzn06HwbxV8+hfkk3+CWHJZU0rxkDru8jp03S9qcxOL7QubxGYjS19Yr9zY3mjY
| nBlLSFToBfxCBPjoBRZAwSB1YpiAys8+vOqAiiLYV7W7jReKGvCHTYiGnPNqBNVp
| 56VW8vYMjJbj+5aoG6WmOfpj6BBXCa8A/13EIJbLCqa1ZLTiqXLkJKIBl1A448FP
| rt6Jb/SsObiCOThi3L/hLAuC75G4/N63mDavkHbpu/4v6NICfvEnUsmvqdOo+kW8
| xBDrmz7RQstfptBmCz3/FupMB1gLqA==
|_-----END CERTIFICATE-----
| rdp-ntlm-info:
|   Target_Name: EC2AMAZ-M1LFCNO
|   NetBIOS_Domain_Name: EC2AMAZ-M1LFCNO
|   NetBIOS_Computer_Name: EC2AMAZ-M1LFCNO
|   DNS_Domain_Name: EC2AMAZ-M1LFCNO
|   DNS_Computer_Name: EC2AMAZ-M1LFCNO
|   Product_Version: 10.0.26100
|_  System_Time: 2026-07-04T12:04:31+00:00
|_ssl-date: TLS randomness does not represent time
49670/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
1 service unrecognized despite returning data. If you know the service/version, please submit the following fingerprint at https://nmap.org/cgi-bin/submit.cgi?new-service :
SF-Port3389-TCP:V=7.95%I=7%D=7/4%Time=6A48F6A2%P=x86_64-pc-linux-gnu%r(Ter
SF:minalServerCookie,13,"\x03\0\0\x13\x0e\xd0\0\0\x124\0\x02/\x08\0\x02\0\
SF:0\0");
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| p2p-conficker:
|   Checking for Conficker.C or higher...
|   Check 1 (port 52176/tcp): CLEAN (Timeout)
|   Check 2 (port 47916/tcp): CLEAN (Timeout)
|   Check 3 (port 25807/udp): CLEAN (Timeout)
|   Check 4 (port 33684/udp): CLEAN (Timeout)
|_  0/4 checks are positive: Host is CLEAN or ports are blocked
| smb2-time:
|   date: 2026-07-04T12:04:33
|_  start_date: N/A
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled but not required
|_clock-skew: mean: 0s, deviation: 0s, median: 0s
```

### SMB Enumeration

{% image %}

SMB signing is off, and the credentials grant READ access only to the `IPC$` share. That IPC$ access is enough to run an RID brute-force attack with netexec `--rid-brute`, which enumerates local accounts by walking their Security Identifiers:

{% image2 %}

Building a user list from those results and spraying the initial password against them yields no additional hits.

Testing the credentials against other services to see where else this user can reach:

{% image3 %}

### RDP Enumeration

The account logs in over RDP with `xfreerdp3 /u:tyler.ramsey /p:'P@ssw0rd!' /v:10.0.19.232`:

{% image4 %}

The `C:\` drive holds the following folders:

{% image5 %}

One notable detail is that WSL (Windows Subsystem for Linux) is installed:

{% image6 %}

### Unintended Privilege Escalation - PowerShell History

Locating the PowerShell history file with `(Get-PSReadLineOption).HistorySavePath` returns `C:\Users\tyler.ramsey\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt`. This file records every command the user typed, and admins frequently paste credentials into it without realising.

Reading its contents:

{% image7 %}

The history contains the administrator account's password in plaintext. Validating it with a quick SMB query:

{% image8 %}

The query confirms the credentials are valid, granting a connection as the administrator account.

### Privilege Escalation - Intended Path

The `C:\Management` folder holds a number of files. Listing everything, including hidden items, with `Get-ChildItem -Force` reveals a `desktop.ini` file:

{% image9 %}

Reading it exposes credentials for the user `alice.wonderland`: `2wsxzaq1@WSXZAQ!`

{% image10 %}

Logging in as `alice.wonderland` reveals nothing immediately useful, so the next step is enumerating privilege-escalation vectors with `WinPEAS` and `PrivescCheck.ps1`. Both flag a service that is a strong candidate for abuse:

{% image11 %}

Checking the state of the service with `sc.exe query SysMgmtAgent`:

{% image12 %}

Confirming control over the service by starting it and then stopping it again:

{% image13 %}

Because the service configuration is writable, the escalation is to repoint its `binPath` at a command that adds `alice.wonderland` to the local Administrators group. The service runs as SYSTEM, so the command executes with full privileges the next time it starts:

```c
sc.exe config SysMgmtAgent binPath= "cmd.exe /c net localgroup Administrators /add alice.wonderland"
```

{% image14 %}

Validating the new membership with `net localgroup administrators`:

{% image15 %}

With local administrator rights, the flags are now readable through File Explorer:

{% image16 %}