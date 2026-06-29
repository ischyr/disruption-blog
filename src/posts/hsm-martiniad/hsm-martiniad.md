---
title: HackSmarter - MartiniAD
date: 2026-06-29
image: cover.png
tags: [HackSmarter, Easy, Windows, Active Directory]
excerpt: An easy Active Directory box that starts with anonymous SMB access leaking a set of credentials, moves through LDAP signing restrictions and offline hash cracking to a WinRM foothold, and finishes by spotting password reuse between a service account and a Domain Admin to dump the krbtgt hash from NTDS.
---

# MartiniAD

### NMAP Scanning

```bash
PORT      STATE SERVICE       REASON          VERSION
53/tcp    open  domain        syn-ack ttl 126 Simple DNS Plus
88/tcp    open  kerberos-sec  syn-ack ttl 126 Microsoft Windows Kerberos (server time: 2026-06-29 07:54:15Z)
135/tcp   open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
139/tcp   open  netbios-ssn   syn-ack ttl 126 Microsoft Windows netbios-ssn
389/tcp   open  ldap          syn-ack ttl 126 Microsoft Windows Active Directory LDAP (Domain: DRY.MARTINI.BARS0., Site: Default-First-Site-Name)
445/tcp   open  microsoft-ds? syn-ack ttl 126
464/tcp   open  kpasswd5?     syn-ack ttl 126
593/tcp   open  ncacn_http    syn-ack ttl 126 Microsoft Windows RPC over HTTP 1.0
636/tcp   open  tcpwrapped    syn-ack ttl 126
3268/tcp  open  ldap          syn-ack ttl 126 Microsoft Windows Active Directory LDAP (Domain: DRY.MARTINI.BARS0., Site: Default-First-Site-Name)
3269/tcp  open  tcpwrapped    syn-ack ttl 126
3389/tcp  open  ms-wbt-server syn-ack ttl 126
| rdp-ntlm-info:
|   Target_Name: DRY
|   NetBIOS_Domain_Name: DRY
|   NetBIOS_Computer_Name: DC01
|   DNS_Domain_Name: DRY.MARTINI.BARS
|   DNS_Computer_Name: DC01.DRY.MARTINI.BARS
|   DNS_Tree_Name: DRY.MARTINI.BARS
|   Product_Version: 10.0.26100
|_  System_Time: 2026-06-29T07:55:05+00:00
| ssl-cert: Subject: commonName=DC01.DRY.MARTINI.BARS
| Issuer: commonName=DC01.DRY.MARTINI.BARS
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2026-06-28T07:50:07
| Not valid after:  2026-12-28T07:50:07
| MD5:   36f3:c9a8:4cca:6149:388f:5a3c:5ca4:1d06
| SHA-1: e656:e756:b9b1:04be:c74b:b27e:108a:b890:5886:844b
| -----BEGIN CERTIFICATE-----
| MIIC7jCCAdagAwIBAgIQXGrhfWPj/59MsAZzdNoTXjANBgkqhkiG9w0BAQsFADAg
| MR4wHAYDVQQDExVEQzAxLkRSWS5NQVJUSU5JLkJBUlMwHhcNMjYwNjI4MDc1MDA3
| WhcNMjYxMjI4MDc1MDA3WjAgMR4wHAYDVQQDExVEQzAxLkRSWS5NQVJUSU5JLkJB
| UlMwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDaPBxS9orlN3g9MaSN
| T94kYUZWlhxeUJMGWQZUZExQaum5ujeUWuYTpMgbYrnne7vrgZgOVc9fusXk429C
| zZfPMCIPhkTZLV6CGGyGs0Uu/ZxjkQpB4coS5UctfOVdHt/zZNFRMccLXR9+Mwln
| 2TZXZFjtmhpxX1g47NymXErkgZz2EC2jxvH9RfXaaAGVzllKOTQl76ey0CbeRUxH
| itYU7OFjQCq3lTTQnf2ATAG75d/5JiLClvjsHAd+5rfzi103MtIpY4/XAGj1rRoW
| De8VBCLruudKBT8H/Lv2xV5Gs9v7KVrogmnj+4LmsXEz9EuEnkxZk5+rxZ0ZiXeM
| ZcudAgMBAAGjJDAiMBMGA1UdJQQMMAoGCCsGAQUFBwMBMAsGA1UdDwQEAwIEMDAN
| BgkqhkiG9w0BAQsFAAOCAQEAa4lXiFGSNbXSNGKuvdl8cS5Nw1isyVwlWP2fKv8v
| mMbp8YIspp+AtAqUVUK1lzHLucoLzzSz7kdUvr6CMrKrPbnujt5LpRiesSlZnab9
| tq+8Zx4XeazJ4TSUoj7cxI3XGwqIVyOsVtYbt7A+m8fJBW3r1PzeWamnyaHlMQ/H
| 3ioVMZtmJy72yxgb7azsa4N4PzfvQV3y5j4NjK3SCuHgdCWbNRgtCP4u3SBHSS9p
| WI0i2YQmZpEFus12Nj2MeBULbg0Ym8bQUMU0+cHcPTPiUPpCeGrJMr9Lw0a7GWKK
| 9Vo8MH8fnT9nXxbvobH0PT+zVeSJe4t+Td5DEBehNhIhUg==
|_-----END CERTIFICATE-----
|_ssl-date: TLS randomness does not represent time
5985/tcp  open  http          syn-ack ttl 126 Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Not Found
|_http-server-header: Microsoft-HTTPAPI/2.0
9389/tcp  open  mc-nmf        syn-ack ttl 126 .NET Message Framing
49664/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49666/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49668/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49669/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49673/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49674/tcp open  ncacn_http    syn-ack ttl 126 Microsoft Windows RPC over HTTP 1.0
49693/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49699/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
1 service unrecognized despite returning data. If you know the service/version, please submit the following fingerprint at https://nmap.org/cgi-bin/submit.cgi?new-service :
SF-Port3389-TCP:V=7.95%I=7%D=6/29%Time=6A4224AC%P=x86_64-pc-linux-gnu%r(Te
SF:rminalServerCookie,13,"\x03\0\0\x13\x0e\xd0\0\0\x124\0\x02\?\x08\0\x02\
SF:0\0\0");
Service Info: Host: DC01; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time:
|   date: 2026-06-29T07:55:08
|_  start_date: N/A
| p2p-conficker:
|   Checking for Conficker.C or higher...
|   Check 1 (port 33325/tcp): CLEAN (Timeout)
|   Check 2 (port 64910/tcp): CLEAN (Timeout)
|   Check 3 (port 38149/udp): CLEAN (Timeout)
|   Check 4 (port 37076/udp): CLEAN (Timeout)
|_  0/4 checks are positive: Host is CLEAN or ports are blocked
|_clock-skew: mean: -1s, deviation: 0s, median: -1s
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled but not required
```

### RPC Enumeration

{% image %}

Anonymous RPC enumeration returns `NT_STATUS_ACCESS_DENIED`, confirming that valid domain credentials are required before any meaningful query against the interface succeeds.

### SMB - Guest & NULL Authentication

{% image2 %}

Both guest and null authentication succeed, but only the `Guest` account has access to the `notes` share. The NMAP scan and hostname identify this host as a Domain Controller, yet SMB signing is reported as enabled but not required. This deviates from the secure default, where domain controllers enforce signing, and it leaves the door open to relay-style attacks against the host.

With the domain and hostname identified, map them in the `/etc/hosts` file so name-based authentication resolves correctly:

```bash
10.0.31.49	DC01.DRY.MARTINI.BARS DRY.MARTINI.BARS
```

Accessing the `notes` share through the Guest account to inspect its contents:

```bash
impacket-smbclient DRY.MARTINI.BARS/Guest:''@10.0.31.49
```

{% image3 %}

The share holds a set of credentials. Validating them against the domain with `netexec`:

{% image4 %}

The credentials are valid, which provides the first authenticated foothold and a starting point for mapping the Active Directory environment with `rusthound-ce`.

### Active Directory - Domain Reconnaissance

The command is: `rusthound --domain DRY.MARTINI.BARS --ldapusername 'mprice' --ldappassword '*martini*' --ldapfqdn DC01.DRY.MARTINI.BARS --ldapip 10.0.31.49 --collectionmethod All --zip`

{% image5 %}

The collection fails because LDAP signing is enforced on the domain controller, which rejects the unsigned bind that the collector attempts:

{% image6 %}

One option here is to request a Kerberos ccache and authenticate through it, since SASL/GSS-API signing and sealing are native functions of the Kerberos protocol and satisfy the signing requirement. For this path I continued enumeration directly through `netexec`:

{% image7 %}

The enumeration surfaces a crackable hash. Saving it and recovering the plaintext offline with `john`:

{% image8 %}

Querying the account with PowerView shows it belongs to both the Remote Management Users and Remote Desktop Users groups, which grants interactive access to the host: `python3 /opt/powerview.py/powerview.py DRY.MARTINI.BARS/mprice:'*martini*'@DC01.DRY.MARTINI.BARS`

{% image9 %}

The same account also has a Service Principal Name registered for `HTTP/athena.dry.martini.bar`:

{% image10 %}

Confirming that the credentials authenticate as expected:

{% image11 %}

Connecting over WinRM with the recovered credentials:

{% image12 %}

### Domain Reconnaissance - SharpHound Collector

{% image13 %}

With a session on the host, upload the SharpHound binary and run it with `--collectionmethods All` to gather the domain data from an internal vantage point. Starting the BloodHound CE analyzer with `sudo /opt/bloodhound_ce/bloodhound-cli up` and importing the resulting dump:

{% image14 %}

BloodHound ingests the data and the domain becomes fully queryable:

{% image15 %}

Enumerating Domain Admins returns only two members:

{% image16 %}

### Privilege Escalation

The standard BloodHound paths lead nowhere obvious, so the focus returns to the facts already in hand. Two accounts stand out by naming convention: a service account named `ATHENA_SVC` and a Domain Admin named `ATHENA.T0`. Accounts that follow the same naming scheme frequently share a password, which makes testing the known service-account password against the Domain Admin worth attempting:

{% image17 %}

The password reuse hypothesis lands a successful authentication. Since `ATHENA.T0` is a Domain Admin, it can read the NTDS database directly. Dumping only the target account with `--ntds` and `--just-dc-user krbtgt`, since the objective on this machine is to recover the krbtgt NT hash:

{% image18 %}
