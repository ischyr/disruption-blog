---
title: HackTheBox - Sweep
date: 2026-06-24
image: cover.png
tags: [HackTheBox, Medium, Windows, Active Directory]
platform: HackTheBox
os: Windows
difficulty: Medium
points: 65
released: 2025-08-14
ip: 10.129.234.177
boxAvatar: htb-cover.png
excerpt: Sweep is a medium difficulty Windows box that involves Active Directory and Lansweeper, a technology asset intelligence tool. The attacker abuses an enabled guest account to gain access to Lansweeper, which has Map Credentials configured, which are login/password combinations for accessing and scanning network assets remotely. The attacker deploys a honeypot SSH server to read the configured credentials. The compromised account is a member of the Lansweeper Discovery group, which has GenericAll ACL over the Lansweeper Admins group. Any account member of the Lansweeper Admins group has administrator privileges on the Lansweeper dashboard. The attacker creates and deploys a package on the Domain Controller to gain complete control.
---

# Sweep

### NMAP Scanning

```cpp
PORT      STATE SERVICE       REASON          VERSION
53/tcp    open  domain        syn-ack ttl 127 Simple DNS Plus
81/tcp    open  http          syn-ack ttl 127 Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
| http-title: Lansweeper - Login
|_Requested resource was /login.aspx
|_http-favicon: Unknown favicon MD5: 0A60C945E674EC7B953429B515519567
| http-methods:
|_  Supported Methods: HEAD POST OPTIONS
82/tcp    open  ssl/http      syn-ack ttl 127 Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-favicon: Unknown favicon MD5: 0A60C945E674EC7B953429B515519567
| http-methods:
|_  Supported Methods: POST OPTIONS
| tls-alpn:
|_  http/1.1
| ssl-cert: Subject: commonName=Lansweeper Secure Website
| Subject Alternative Name: DNS:localhost, DNS:localhost, DNS:localhost
| Issuer: commonName=Lansweeper Secure Website
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha512WithRSAEncryption
| Not valid before: 2021-11-21T09:22:27
| Not valid after:  2121-12-21T09:22:27
| MD5:   0a77:f256:6e45:3ce0:dc6b:78e9:a3fc:1bf7
| SHA-1: 645f:63c0:c4ab:2111:5aa1:f41f:23a3:3791:a45b:78cc
| -----BEGIN CERTIFICATE-----
| MIIDUDCCAjigAwIBAgIQHwy8C6IE9oREp36CbWp5JjANBgkqhkiG9w0BAQ0FADAk
| MSIwIAYDVQQDDBlMYW5zd2VlcGVyIFNlY3VyZSBXZWJzaXRlMCAXDTIxMTEyMTA5
| MjIyN1oYDzIxMjExMjIxMDkyMjI3WjAkMSIwIAYDVQQDDBlMYW5zd2VlcGVyIFNl
| Y3VyZSBXZWJzaXRlMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzO2C
| Jfp7sqAELYNZU+2p+jtRQB4GF0ovTRNiY5lR2FhGBZNOVCD6ZKk2UJFv9kn3bbCd
| bpV9XBaE921aU6qUQ0W2iakErQHc2K/c/PZVR2yJ041BnSFYOMLpFS8YDmattexp
| euJbaWjSu+p6tgi740BSxC+McekQ9R+o5zbBNzCsi0wHYcu0jUvR8KcDaEQK2r+r
| W7uxsNtehx8QcE+z1gaM8cD/GtaYLAKfLKqEHG/c+fODsk9pnrIu6qUhFt+pKaQ1
| q10t48PcSasT+V1Qc/yOZ9ar8xewvnkN8lB0xgpG6j6JXq+X/pKx6fPYg0T04bRa
| wYlhT+vSlm7tPxlohQIDAQABo3wwejAdBgNVHSUEFjAUBggrBgEFBQcDAgYIKwYB
| BQUHAwEwDgYDVR0PAQH/BAQDAgSwMCoGA1UdEQQjMCGCCWxvY2FsaG9zdIIJbG9j
| YWxob3N0gglsb2NhbGhvc3QwHQYDVR0OBBYEFBIHEhpltFOvyWpyTKtPcbzTXfTg
| MA0GCSqGSIb3DQEBDQUAA4IBAQCmbQLVl/hZOOjBGKlegHsEeg/UsjyslZBJuTkr
| Kfj10mbOZS4emvCeeKaxznP3D4GlGzaqJNm0D9R0QbGDl6krKEA75joIyD6RQpLZ
| D+5HweTEJUp5EtQLFd4IRljXSaZjYxdMkYkvDpNnMBaqbxYALOsLd6rycVFyKa/J
| kaBanOVk0IaDN43WTAYoihuQyICFqBmXOkhEscPfQdACdlFjpz1y6GE0qmZUW81I
| NiBczynApftsGxahNA82ryOVudBnwLWzL8+C9T2ZYj7I5HMVT1zbv9kKfbY6v9DZ
| SY462ERWkZvek2obx9ShzQ7mj7Cl1GIehVodk7F3fszltBY6
|_-----END CERTIFICATE-----
|_ssl-date: TLS randomness does not represent time
88/tcp    open  kerberos-sec  syn-ack ttl 127 Microsoft Windows Kerberos (server time: 2026-06-23 16:26:38Z)
135/tcp   open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
139/tcp   open  netbios-ssn   syn-ack ttl 127 Microsoft Windows netbios-ssn
389/tcp   open  ldap          syn-ack ttl 127 Microsoft Windows Active Directory LDAP (Domain: sweep.vl0., Site: Default-First-Site-Name)
445/tcp   open  microsoft-ds? syn-ack ttl 127
464/tcp   open  kpasswd5?     syn-ack ttl 127
593/tcp   open  ncacn_http    syn-ack ttl 127 Microsoft Windows RPC over HTTP 1.0
636/tcp   open  tcpwrapped    syn-ack ttl 127
3268/tcp  open  ldap          syn-ack ttl 127 Microsoft Windows Active Directory LDAP (Domain: sweep.vl0., Site: Default-First-Site-Name)
3269/tcp  open  tcpwrapped    syn-ack ttl 127
3389/tcp  open  ms-wbt-server syn-ack ttl 127 Microsoft Terminal Services
|_ssl-date: 2026-06-23T16:28:19+00:00; +2s from scanner time.
| rdp-ntlm-info:
|   Target_Name: SWEEP
|   NetBIOS_Domain_Name: SWEEP
|   NetBIOS_Computer_Name: INVENTORY
|   DNS_Domain_Name: sweep.vl
|   DNS_Computer_Name: inventory.sweep.vl
|   DNS_Tree_Name: sweep.vl
|   Product_Version: 10.0.20348
|_  System_Time: 2026-06-23T16:27:26+00:00
| ssl-cert: Subject: commonName=inventory.sweep.vl
| Issuer: commonName=inventory.sweep.vl
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2026-06-22T16:10:03
| Not valid after:  2026-12-22T16:10:03
| MD5:   6c86:9c4c:85cd:f52a:d0d3:bbad:6704:65c6
| SHA-1: ccb7:e47d:b8c3:d21e:e2fa:fa38:570e:da1e:3b3b:bf10
| -----BEGIN CERTIFICATE-----
| MIIC6DCCAdCgAwIBAgIQcxKV6orcAbNMoToW9fXdODANBgkqhkiG9w0BAQsFADAd
| MRswGQYDVQQDExJpbnZlbnRvcnkuc3dlZXAudmwwHhcNMjYwNjIyMTYxMDAzWhcN
| MjYxMjIyMTYxMDAzWjAdMRswGQYDVQQDExJpbnZlbnRvcnkuc3dlZXAudmwwggEi
| MA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDoJNgstxZDNvipJNwQyz/cDJNC
| zikYuXlk4+rUPV5vrlea6yT4U5YWhE9bme8VdAaF6k7/0RxTxRzFVqaAlaQpZmTN
| GNg6b+9rOGe3pkA5ZuajkWxSLuV45U5m1PrLDeU9Uia/Prl05dIYJORtJXCe6dW9
| 9ccjFHaVzGdACu1E1y0o9czRyB72ZEKP2t+OluFKuJ4H6s8ylIQG3pb9nI3dTP5H
| bRjCRseEzDJDXh2TjmT41vbkxB6eoOQogH3GmHI4stQJUEMYoMm5ZyjaySd0yEt8
| vvqyVEBbY3BV7z5tXvKcPvred7YnRWBrAwPl580zEeFhSBqOkzNQHqXrAVhpAgMB
| AAGjJDAiMBMGA1UdJQQMMAoGCCsGAQUFBwMBMAsGA1UdDwQEAwIEMDANBgkqhkiG
| 9w0BAQsFAAOCAQEAj3EFPIQoUR3+wy8rRxR8Rr3+TlAU+SBY/8z8ZZEWq4j0LnfQ
| EAFYm2smvZIf2K7XNx68wTJWjiwAARJ8MWTWiN+AWnoBavgFFUOCNWE60RuNOX7H
| wQswq+NGc1xey+BN94xZcU/0PFYhZVYLljDnJn55WHZlTEHtBiDAzFcBR0CQiQx3
| RW2HDtM0rXjsX4k7/PiWTyRyvbb+lfJ85T+6sfRTp8daTl+6OpbGwAD+x0jLL5cs
| YfezEnpSrY4hceYbtORRkp5kQHI2aLLMEDtWDHLiRgAJoFIfAyJn18Z30/P7Jkh2
| 07slm340GJsnT25cg+N2IL/9oIRK2aN28VX2hg==
|_-----END CERTIFICATE-----
5985/tcp  open  http          syn-ack ttl 127 Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Not Found
|_http-server-header: Microsoft-HTTPAPI/2.0
9389/tcp  open  mc-nmf        syn-ack ttl 127 .NET Message Framing
9524/tcp  open  ssl/http      syn-ack ttl 127 Microsoft Kestrel httpd
|_http-server-header: Kestrel
| http-methods:
|_  Supported Methods: GET
|_http-title: Site doesn't have a title (text/html).
| tls-alpn:
|   h2
|_  http/1.1
|_ssl-date: 2026-06-23T16:28:19+00:00; +2s from scanner time.
| ssl-cert: Subject: commonName=lansweeper-server-communication
| Subject Alternative Name: DNS:localhost, DNS:INVENTORY, DNS:inventory.sweep.vl, IP Address:192.168.115.145
| Issuer: commonName=lansweeper-server-communication
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2024-02-08T19:51:08
| Not valid after:  3024-02-08T19:51:08
| MD5:   0447:ee4f:e716:9f45:b4f7:6919:5b0d:3e3f
| SHA-1: 76d9:1ed8:8d9c:2236:d97f:c7e0:fe7b:08b1:eccc:a64d
| -----BEGIN CERTIFICATE-----
| MIIDODCCAiCgAwIBAgIJAI7r4Kd2W2kUMA0GCSqGSIb3DQEBCwUAMCoxKDAmBgNV
| BAMTH2xhbnN3ZWVwZXItc2VydmVyLWNvbW11bmljYXRpb24wIBcNMjQwMjA4MTk1
| MTA4WhgPMzAyNDAyMDgxOTUxMDhaMCoxKDAmBgNVBAMTH2xhbnN3ZWVwZXItc2Vy
| dmVyLWNvbW11bmljYXRpb24wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIB
| AQDK2bR/LOcQyTOc8Yokfb6Ezsv4ndOWpNiF6Fw9mtwQoeKoh50QtiCzhj7LvG1W
| 0qSy/Jy09RJ35z1f6a2XVwjHShhsW44IrXN3lHMwiko92Ri5X4MAy7xQLragxaaN
| tYoxCxJCAGmER4NXyrtik5SSNOszA626OyQ8gv1X5C9D/8t5S9B0CdpjOQUT4jbb
| yvL9qcdW10mq5ASD1tylEzc/g9JCAQtI6P3vuaFWIW47r4JKSxCUskbgUAP8Zio2
| 3bC87xjt26RhzpmAzCdkEWZYojqZvQMED1MaPmXELqnMgkHMLkVjWkSLXiK+c0YS
| lFdEpbtHVkzoFhrQnmfzeQw1AgMBAAGjXzBdMDkGA1UdEQQyMDCCCWxvY2FsaG9z
| dIIJSU5WRU5UT1JZghJpbnZlbnRvcnkuc3dlZXAudmyHBMCoc5EwEwYDVR0lBAww
| CgYIKwYBBQUHAwEwCwYDVR0PBAQDAgWgMA0GCSqGSIb3DQEBCwUAA4IBAQA6R8oC
| oFWAksgwgFHhMpkwQNeIsvaQZ0eOarLv41VEgqviw4fc1aPeFqnQ0R/nAL7IzE0l
| 2VNVN/TSeHVEan09Ezq6WSUKlSBcinNOhHMq1axfxhW4lgr6RnPj4mlhsefnjGcl
| PVh+1e013UrOinhfqvJNwbkQYsvLCkDQ/DKbu90j0hURrn6Dp9z65jZuQf9IMfyk
| ljvqzm9z2mBLihnwspTzstA/EE8dkeVVvhcXnSTKcRjSNe0S4wDpPqt9tWs4/0Hd
| 4Ys+yTEt96ZtLlN9JDXWhNvspyMQ3M+bsAgJvx63jo8QLrhfWHUd59HCfw+EWvoD
| WXVfhGHqdj3IgU/u
|_-----END CERTIFICATE-----
49664/tcp open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
49667/tcp open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
54847/tcp open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
57569/tcp open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
57581/tcp open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
59548/tcp open  ncacn_http    syn-ack ttl 127 Microsoft Windows RPC over HTTP 1.0
59549/tcp open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
Service Info: Host: INVENTORY; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time:
|   date: 2026-06-23T16:27:27
|_  start_date: N/A
|_clock-skew: mean: 1s, deviation: 0s, median: 1s
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required
| p2p-conficker:
|   Checking for Conficker.C or higher...
|   Check 1 (port 61081/tcp): CLEAN (Timeout)
|   Check 2 (port 56208/tcp): CLEAN (Timeout)
|   Check 3 (port 11691/udp): CLEAN (Timeout)
|   Check 4 (port 13243/udp): CLEAN (Timeout)
|_  0/4 checks are positive: Host is CLEAN or ports are blocked
```

### RPC Enumeration

Null session RPC access is blocked - anonymous enumeration of users and printers returns `NT_STATUS_ACCESS_DENIED`:

```cpp
➜  sweep rpcclient -U "" -N 10.129.234.177
rpcclient $> enumdomusers
result was NT_STATUS_ACCESS_DENIED
rpcclient $> enumprinters
do_cmd: Could not initialise spoolss. Error was NT_STATUS_ACCESS_DENIED
rpcclient $>
```

→ rpcdump: `rpcdump 10.129.234.177`

```cpp
Impacket v0.13.0 - Copyright Fortra, LLC and its affiliated companies

[*] Retrieving endpoint list from 10.129.234.177
Protocol: [MS-NRPC]: Netlogon Remote Protocol
Provider: netlogon.dll
UUID    : 12345678-1234-ABCD-EF00-01234567CFFB v1.0
Bindings:
          ncacn_ip_tcp:10.129.234.177[54847]
          ncalrpc:[NETLOGON_LRPC]
          ncacn_np:\\INVENTORY[\pipe\ac473f1ec49c021c]
          ncacn_http:10.129.234.177[59548]
          ncalrpc:[NTDS_LPC]
          ncalrpc:[OLE90610C6DC6CE25240CBD8EEC132D]
          ncacn_ip_tcp:10.129.234.177[49667]
          ncacn_ip_tcp:10.129.234.177[49664]
          ncalrpc:[MicrosoftLaps_LRPC_0fb2f016-fe45-4a08-a7f9-a467f5e5fa0b]
          ncalrpc:[samss lpc]
          ncalrpc:[SidKey Local End Point]
          ncalrpc:[protected_storage]
          ncalrpc:[lsasspirpc]
          ncalrpc:[lsapolicylookup]
          ncalrpc:[LSA_EAS_ENDPOINT]
          ncalrpc:[lsacap]
          ncalrpc:[LSARPC_ENDPOINT]
```

The endpoint mapper confirms this is a domain controller - `netlogon.dll` and `NTDS_LPC` endpoints are registered. The presence of `MicrosoftLaps_LRPC` indicates LAPS is deployed, meaning local administrator passwords are managed and rotated automatically. This rules out reusing any default or static local admin credential later.

### Port 81 - Lansweeper

Port 81 hosts the Lansweeper web interface - an enterprise IT asset management platform used to discover, inventory, and monitor devices across a network. From an attacker's perspective, Lansweeper is high-value because it stores credentials for every service it scans. If those stored credentials can be retrieved, they represent direct access to machines across the entire environment:

{% image %}

Searching for known vulnerabilities against this version surfaces a single unauthenticated vector - an SQL injection:

{% image2 %}

Attempting exploitation yields no results. The injection either requires conditions not met by this configuration or has been mitigated at the application layer. Direct exploitation of the web application is a dead end for now.

### SMB Enumeration - Guest Authentication

The Guest account is enabled on the target, allowing unauthenticated SMB enumeration without requiring valid domain credentials:

{% image3 %}

→ RID Brute Force:

```cpp
➜  NetExec git:(main) ✗ poetry run NetExec smb 10.129.234.177 -u 'Guest' -p '' --rid-brute
SMB         10.129.234.177  445    INVENTORY        [*] Windows Server 2022 Build 20348 x64 (name:INVENTORY) (domain:sweep.vl) (signing:True) (SMBv1:None) (Null Auth:True)
SMB         10.129.234.177  445    INVENTORY        [+] sweep.vl\Guest:
SMB         10.129.234.177  445    INVENTORY        498: SWEEP\Enterprise Read-only Domain Controllers (SidTypeGroup)
SMB         10.129.234.177  445    INVENTORY        500: SWEEP\Administrator (SidTypeUser)
SMB         10.129.234.177  445    INVENTORY        501: SWEEP\Guest (SidTypeUser)
SMB         10.129.234.177  445    INVENTORY        502: SWEEP\krbtgt (SidTypeUser)
SMB         10.129.234.177  445    INVENTORY        512: SWEEP\Domain Admins (SidTypeGroup)
SMB         10.129.234.177  445    INVENTORY        513: SWEEP\Domain Users (SidTypeGroup)
SMB         10.129.234.177  445    INVENTORY        514: SWEEP\Domain Guests (SidTypeGroup)
SMB         10.129.234.177  445    INVENTORY        515: SWEEP\Domain Computers (SidTypeGroup)
SMB         10.129.234.177  445    INVENTORY        516: SWEEP\Domain Controllers (SidTypeGroup)
SMB         10.129.234.177  445    INVENTORY        517: SWEEP\Cert Publishers (SidTypeAlias)
SMB         10.129.234.177  445    INVENTORY        518: SWEEP\Schema Admins (SidTypeGroup)
SMB         10.129.234.177  445    INVENTORY        519: SWEEP\Enterprise Admins (SidTypeGroup)
SMB         10.129.234.177  445    INVENTORY        520: SWEEP\Group Policy Creator Owners (SidTypeGroup)
SMB         10.129.234.177  445    INVENTORY        521: SWEEP\Read-only Domain Controllers (SidTypeGroup)
SMB         10.129.234.177  445    INVENTORY        522: SWEEP\Cloneable Domain Controllers (SidTypeGroup)
SMB         10.129.234.177  445    INVENTORY        525: SWEEP\Protected Users (SidTypeGroup)
SMB         10.129.234.177  445    INVENTORY        526: SWEEP\Key Admins (SidTypeGroup)
SMB         10.129.234.177  445    INVENTORY        527: SWEEP\Enterprise Key Admins (SidTypeGroup)
SMB         10.129.234.177  445    INVENTORY        553: SWEEP\RAS and IAS Servers (SidTypeAlias)
SMB         10.129.234.177  445    INVENTORY        571: SWEEP\Allowed RODC Password Replication Group (SidTypeAlias)
SMB         10.129.234.177  445    INVENTORY        572: SWEEP\Denied RODC Password Replication Group (SidTypeAlias)
SMB         10.129.234.177  445    INVENTORY        1000: SWEEP\INVENTORY$ (SidTypeUser)
SMB         10.129.234.177  445    INVENTORY        1101: SWEEP\DnsAdmins (SidTypeAlias)
SMB         10.129.234.177  445    INVENTORY        1102: SWEEP\DnsUpdateProxy (SidTypeGroup)
SMB         10.129.234.177  445    INVENTORY        1103: SWEEP\Lansweeper Admins (SidTypeGroup)
SMB         10.129.234.177  445    INVENTORY        1113: SWEEP\jgre808 (SidTypeUser)
SMB         10.129.234.177  445    INVENTORY        1114: SWEEP\bcla614 (SidTypeUser)
SMB         10.129.234.177  445    INVENTORY        1115: SWEEP\hmar648 (SidTypeUser)
SMB         10.129.234.177  445    INVENTORY        1116: SWEEP\jgar931 (SidTypeUser)
SMB         10.129.234.177  445    INVENTORY        1117: SWEEP\fcla801 (SidTypeUser)
SMB         10.129.234.177  445    INVENTORY        1118: SWEEP\jwil197 (SidTypeUser)
SMB         10.129.234.177  445    INVENTORY        1119: SWEEP\grob171 (SidTypeUser)
SMB         10.129.234.177  445    INVENTORY        1120: SWEEP\fdav736 (SidTypeUser)
SMB         10.129.234.177  445    INVENTORY        1121: SWEEP\jsmi791 (SidTypeUser)
SMB         10.129.234.177  445    INVENTORY        1122: SWEEP\hjoh690 (SidTypeUser)
SMB         10.129.234.177  445    INVENTORY        1123: SWEEP\svc_inventory_win (SidTypeUser)
SMB         10.129.234.177  445    INVENTORY        1124: SWEEP\svc_inventory_lnx (SidTypeUser)
SMB         10.129.234.177  445    INVENTORY        1125: SWEEP\intern (SidTypeUser)
SMB         10.129.234.177  445    INVENTORY        3101: SWEEP\Lansweeper Discovery (SidTypeGroup)
```

The output reveals the full domain user set along with two notable custom groups - `Lansweeper Admins` and `Lansweeper Discovery`. Two service accounts, `svc_inventory_win` and `svc_inventory_lnx`, are clearly tied to the Lansweeper scanning infrastructure. Parsing the output into a clean username list for downstream attacks:

```cpp
➜  sweep cat smb_rid_brute.txt | grep SidTypeUser | awk '{print $6}' | cut -d '\' -f 2 > domain_users.txt
Administrator
Guest
krbtgt
INVENTORY$
jgre808
bcla614
hmar648
jgar931
fcla801
jwil197
grob171
fdav736
jsmi791
hjoh690
svc_inventory_win
svc_inventory_lnx
intern
```

### AS-REP Roasting

```cpp
➜  sweep impacket-GetNPUsers -no-pass -usersfile domain_users.txt sweep.vl/
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[-] User Administrator doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User Guest doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] Kerberos SessionError: KDC_ERR_CLIENT_REVOKED(Clients credentials have been revoked)
[-] User INVENTORY$ doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User jgre808 doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User bcla614 doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User hmar648 doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User jgar931 doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User fcla801 doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User jwil197 doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User grob171 doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User fdav736 doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User jsmi791 doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User hjoh690 doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User svc_inventory_win doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User svc_inventory_lnx doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User intern doesn't have UF_DONT_REQUIRE_PREAUTH set
```

No accounts are vulnerable to AS-REP roasting. The `krbtgt` revocation error is expected behavior. Shifting focus to SMB share enumeration, the `DefaultPackageShare$` share is accessible as Guest and warrants inspection:

{% image4 %}

The share contains no immediately actionable data. A password spray against the recovered user list using each username as its own password - a common misconfiguration in managed enterprise environments - returns a valid hit:

{% image5 %}

The `intern` account authenticates with the password `intern`. With valid credentials, additional SMB shares become accessible:

{% image6 %}

Authenticated LDAP enumeration using the `intern` credentials confirms the full user list and surfaces the service account descriptions, validating that `svc_inventory_win` and `svc_inventory_lnx` back the Lansweeper scanning service:

```cpp
➜  NetExec git:(main) ✗ poetry run NetExec ldap 10.129.234.177 -u 'intern' -p 'intern' --users
LDAP        10.129.234.177  389    INVENTORY        [*] Windows Server 2022 Build 20348 (name:INVENTORY) (domain:sweep.vl) (signing:None) (channel binding:No TLS cert)
LDAP        10.129.234.177  389    INVENTORY        [+] sweep.vl\intern:intern
LDAP        10.129.234.177  389    INVENTORY        [*] Enumerated 16 domain users: sweep.vl
LDAP        10.129.234.177  389    INVENTORY        -Username-                    -Last PW Set-       -BadPW-  -Description-
LDAP        10.129.234.177  389    INVENTORY        Administrator                 2024-02-08 22:58:01 1        Built-in account for administering the computer/domain
LDAP        10.129.234.177  389    INVENTORY        Guest                         <never>             1        Built-in account for guest access to the computer/domain
LDAP        10.129.234.177  389    INVENTORY        krbtgt                        2024-02-08 21:09:37 1        Key Distribution Center Service Account
LDAP        10.129.234.177  389    INVENTORY        jgre808                       2024-02-08 21:27:05 1            
LDAP        10.129.234.177  389    INVENTORY        bcla614                       2024-02-08 21:27:05 1            
LDAP        10.129.234.177  389    INVENTORY        hmar648                       2024-02-08 21:27:05 1            
LDAP        10.129.234.177  389    INVENTORY        jgar931                       2024-02-08 21:27:06 1            
LDAP        10.129.234.177  389    INVENTORY        fcla801                       2024-02-08 21:27:06 1            
LDAP        10.129.234.177  389    INVENTORY        jwil197                       2024-02-08 21:27:06 1            
LDAP        10.129.234.177  389    INVENTORY        grob171                       2024-02-08 21:27:06 1            
LDAP        10.129.234.177  389    INVENTORY        fdav736                       2024-02-08 21:27:06 1            
LDAP        10.129.234.177  389    INVENTORY        jsmi791                       2024-02-08 21:27:07 1            
LDAP        10.129.234.177  389    INVENTORY        hjoh690                       2024-02-08 21:27:07 1            
LDAP        10.129.234.177  389    INVENTORY        svc_inventory_win             2024-02-08 21:30:48 1        Service Account for scanning assets.
LDAP        10.129.234.177  389    INVENTORY        svc_inventory_lnx             2024-02-08 21:30:48 1        Service Account for scanning assets.
LDAP        10.129.234.177  389    INVENTORY        intern                        2024-02-08 22:23:03 1
```

Collecting full domain data for BloodHound analysis using `rusthound-ce`: `rusthound-ce --domain sweep.vl --ldapusername intern --ldappassword intern --ldapfqdn INVENTORY.sweep.vl --ldapip 10.129.234.177 --name-server 10.129.234.177 --collectionmethod All --zip`

{% image7 %}

### Lansweeper Share

The Lansweeper share exposes the scanner's utility binaries and supporting libraries:

{% image8 %}

→ The files:

```cpp
drw-rw-rw-          0  Thu Feb  8 21:46:08 2024 .
drw-rw-rw-          0  Thu Feb  8 21:47:43 2024 ..
-rw-rw-rw-        704  Thu Feb  8 21:46:05 2024 changeallowed.vbs
-rw-rw-rw-        604  Thu Feb  8 21:46:05 2024 changepassword.vbs
-rw-rw-rw-     117000  Thu Feb  8 21:46:05 2024 CookComputing.XmlRpcV2.dll
-rw-rw-rw-     859944  Thu Feb  8 21:46:05 2024 Devicetester.exe
-rw-rw-rw-      52520  Thu Feb  8 21:46:05 2024 Heijden.Dns.dll
-rw-rw-rw-        226  Thu Feb  8 21:46:05 2024 mustchangepassword.vbs
-rw-rw-rw-    1180904  Thu Feb  8 21:46:05 2024 putty.exe
-rw-rw-rw-        107  Thu Feb  8 21:46:05 2024 shellexec.vbs
-rw-rw-rw-     327976  Thu Feb  8 21:46:05 2024 SMBLibrary.dll
-rw-rw-rw-     375592  Thu Feb  8 21:46:05 2024 testconnection.exe
-rw-rw-rw-        174  Thu Feb  8 21:46:05 2024 unlock.vbs
-rw-rw-rw-      40232  Thu Feb  8 21:46:05 2024 Utilities.dll
-rw-rw-rw-    1170512  Thu Feb  8 21:46:05 2024 vimservice25.dll
-rw-rw-rw-    4353104  Thu Feb  8 21:46:06 2024 vimservice25.xmlserializers.dll
-rw-rw-rw-    1690704  Thu Feb  8 21:46:06 2024 vimservice40.dll
-rw-rw-rw-    6630480  Thu Feb  8 21:46:06 2024 vimservice40.xmlserializers.dll
-rw-rw-rw-    1813584  Thu Feb  8 21:46:06 2024 vimservice41.dll
-rw-rw-rw-    7085136  Thu Feb  8 21:46:06 2024 vimservice41.xmlserializers.dll
-rw-rw-rw-    2079384  Thu Feb  8 21:46:07 2024 vimservice50.dll
-rw-rw-rw-    7957144  Thu Feb  8 21:46:07 2024 vimservice50.xmlserializers.dll
-rw-rw-rw-    2313296  Thu Feb  8 21:46:07 2024 vimservice51.dll
-rw-rw-rw-    8395856  Thu Feb  8 21:46:07 2024 vimservice51.xmlserializers.dll
-rw-rw-rw-    2448464  Thu Feb  8 21:46:08 2024 vimservice55.dll
-rw-rw-rw-    8862800  Thu Feb  8 21:46:08 2024 vimservice55.xmlserializers.dll
-rw-rw-rw-    1482456  Thu Feb  8 21:46:08 2024 vmware.vim.dll
-rw-rw-rw-     198040  Thu Feb  8 21:46:08 2024 wol.exe
-rw-rw-rw-     818976  Thu Feb  8 21:46:08 2024 XenServer.dll
```

The share is a collection of scanner helpers - VMware VIM service libraries for different API versions, a PuTTY binary, SMB and DNS helper DLLs, VBScript password management scripts, and a wake-on-LAN utility. Nothing directly exploitable is present. Returning to the web application on port 81, the `intern` credentials authenticate against the Lansweeper dashboard:

{% image9 %}

Navigating to Scanning - Scanning Credentials reveals a set of pre-configured credentials mapped to protocols and services across the environment:

{% image10 %}

The SSH credential entry has no login assigned. Lansweeper uses these stored credentials to authenticate when actively scanning remote assets - when it scans a Linux host over SSH, it supplies the `svc_inventory_lnx` credential to whatever SSH server answers. This behavior is exploitable: a honeypot SSH server deployed at an attacker-controlled address will accept the connection, log the submitted credentials in cleartext, and reveal the password. [sshesame](https://github.com/jaksi/sshesame) is purpose-built for this - it accepts any incoming SSH authentication attempt and logs the submitted username and password.

First, a new scanning target pointing to the attacker's machine is registered in Lansweeper:

{% image11 %}

The target is then associated with the SSH credential entry to ensure Lansweeper authenticates using the `svc_inventory_lnx` account when it connects:

{% image12 %}

With the honeypot running and the target mapped, triggering a scan causes Lansweeper to attempt SSH authentication against the attacker's machine:

{% image13 %}

The honeypot captures the submitted credentials in cleartext:

```cpp
authentication for user "svc_inventory_lnx" with password "0|5m-U6?/uAX" accepted
```

The recovered credentials are validated against LDAP to confirm the account is active:

{% image14 %}

### BloodHound Attack Path

Querying BloodHound for the `svc_inventory_lnx` account reveals an outbound object control edge:

{% image15 %}

The account holds `GenericAll` over the `LANSWEEPER ADMINS` group, granting full control including the ability to add arbitrary members. Membership in this group confers administrator privileges on the Lansweeper dashboard, which unlocks the Deployment feature that was inaccessible to standard users. Adding `svc_inventory_lnx` to the group using `bloodyAD`:

{% image16 %}

With the group membership updated, a service sweep against WinRM confirms a shell is now available on the machine:

{% image17 %}

Connecting via `evil-winrm` retrieves the user flag:

{% image18 %}

### Privilege Escalation

Researching Lansweeper vulnerabilities identifies a code execution path through the Deployment feature - packages can contain arbitrary commands that execute on remote machines under the context of the Lansweeper service account. This endpoint is restricted to Lansweeper administrators, which is why it was absent from the dashboard when authenticated as a standard user. Granting administrator access by adding the `intern` account to the `LANSWEEPER ADMINS` group and re-authenticating to the dashboard:

{% image19 %}

The administrator view exposes the Deployment section along with additional management capabilities. A new deployment package is created targeting the Domain Controller:

{% image20 %}

The package is configured with execution steps - a command payload that runs on the target machine under the Lansweeper service's elevated context:

{% image21 %}

Before deploying, credentials with sufficient access to the Domain Controller are mapped to the deployment target, mirroring the credential mapping step used earlier. Deploying the package executes the payload on the Domain Controller and returns the root flag:

{% image22 %}
