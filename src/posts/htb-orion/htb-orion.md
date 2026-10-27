---
title: HackTheBox - Orion
date: 2026-10-27
image: cover.png
tags: [HackTheBox, Easy, Linux]
platform: HackTheBox
os: Linux
difficulty: Easy
points: 45
released: 2026-06-23
ip: 10.129.244.146
boxAvatar: htb-cover.png
excerpt: An easy Linux box running a telecom company's public site on Craft CMS. A pre-auth RCE chain against the admin panel's outdated Craft CMS version gives a www-data shell, and database credentials sitting in a Craft .env file crack a bcrypt hash to pivot to a real user. From there, a vulnerable local telnet binary accepts an authentication bypass through a crafted USER environment variable, handing over root directly.
---

# Orion

Orion is an easy-rated Linux machine built around a single public-facing site, "Orion Telecom," running Craft CMS behind an nginx front end. The path is short but realistic: an outdated CMS admin panel gives up a pre-authentication RCE, the application's own `.env` file leaks database credentials that in turn expose a crackable password hash, and a locally listening, outdated `telnet` binary turns that user into root through a straightforward authentication bypass. Every credential, hash, and IP below belongs to the lab and has no meaning outside of it.

### NMAP Scanning

```bash
PORT   STATE SERVICE REASON         VERSION
22/tcp open  ssh     syn-ack ttl 63 OpenSSH 8.9p1 Ubuntu 3ubuntu0.15 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 3e:ea:45:4b:c5:d1:6d:6f:e2:d4:d1:3b:0a:3d:a9:4f (ECDSA)
| ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBJ+m7rYl1vRtnm789pH3IRhxI4CNCANVj+N5kovboNzcw9vHsBwvPX3KYA3cxGbKiA0VqbKRpOHnpsMuHEXEVJc=
|   256 64:cc:75:de:4a:e6:a5:b4:73:eb:3f:1b:cf:b4:e3:94 (ED25519)
|_ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOtuEdoYxTohG80Bo6YCqSzUY9+qbnAFnhsk4yAZNqhM
80/tcp open  http    syn-ack ttl 63 nginx 1.18.0 (Ubuntu)
|_http-server-header: nginx/1.18.0 (Ubuntu)
|_http-title: Did not follow redirect to http://orion.htb/
| http-methods:
|_  Supported Methods: GET HEAD POST OPTIONS
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

The redirect points to `orion.htb`, so we add it to `/etc/hosts`:

```bash
➜  orion cat /etc/hosts
127.0.0.1	localhost
127.0.1.1	kali
::1		localhost ip6-localhost ip6-loopback
ff02::1		ip6-allnodes
ff02::2		ip6-allrouters

10.129.244.146	orion.htb
```

### Web Server

The vhost is a landing page for "Orion Telecom," a fictional telecom/ISP company:

{% image %}

A `feroxbuster` scan against it turns up a handful of routes:

{% image2 %}

The only interesting entry is `/admin`. Before digging into it, we also run a subdomain scan in case there's anything hiding behind a vhost:

```bash
ffuf -u http://orion.htb/ -H 'Host: FUZZ.orion.htb' -w /usr/share/wordlists/seclists/Discovery/DNS/bitquark-subdomains-top100000.txt --fw 4
```

{% image3 %}

No hits, so we move on with what `/admin` gives us.

### Admin - Orion Telecom

The `/admin` route is a login page titled "Orion Telecom Administration," running Craft CMS 5.6.16:

{% image4 %}

That version is vulnerable to a pre-authentication remote code execution bug, [CVE-2025-32432](https://github.com/c0gnit00/CVE-2025-32432), which also has a public PoC available. Running it with a simple `id` first confirms code execution as `www-data`:

{% image5 %}

We then reuse it to drop and run a reverse shell, landing a proper callback:

{% image6 %}

### Privilege Escalation - www-data

Inside the `craft` application folder, the `.env` file holds the application's configuration - including its database credentials:

```bash
$ cat .env
# Read about configuration, here:
# https://craftcms.com/docs/5.x/configure.html

# The application ID used to to uniquely store session and cache data, mutex locks, and more
CRAFT_APP_ID=CraftCMS--67912ad2-1f1b-4993-bfec-e64daa5c23ff

# The environment Craft is currently running in (dev, staging, production, etc.)
CRAFT_ENVIRONMENT=dev

# General settings
CRAFT_SECURITY_KEY=RRS86F6i2JQKdC6kfEI7frVxA47WVMx8
CRAFT_DEV_MODE=true
CRAFT_ALLOW_ADMIN_CHANGES=true
CRAFT_DISALLOW_ROBOTS=true
CRAFT_DB_DRIVER=mysql
CRAFT_DB_SERVER=127.0.0.1
CRAFT_DB_PORT=3306
CRAFT_DB_DATABASE=orion
CRAFT_DB_USER=root
CRAFT_DB_PASSWORD=SuperSecureCraft123Pass!
CRAFT_DB_SCHEMA=
CRAFT_DB_TABLE_PREFIX=
```

Checking local listeners with `netstat -tulpn` confirms MySQL is bound to localhost:

{% image7 %}

So we connect to it with the leaked root credentials:

```bash
mysql -u root -p
```

{% image8 %}

Switching to the application's database and listing its tables:

```bash
use orion;
show TABLES;
```

{% image9 %}

The `users` table looks worth a look, so we dump it:

```bash
MariaDB [orion]> select * from users;
select * from users;
+----+---------+------------------+--------+---------+--------+-----------+-------+----------+----------+-----------+----------+----------------+--------------------------------------------------------------+---------------------+--------------------+-------------------------+-------------------+----------------------+-------------+--------------+------------------+----------------------------+-----------------+-----------------------+------------------------+---------------------+---------------------+
| id | photoId | affiliatedSiteId | active | pending | locked | suspended | admin | username | fullName | firstName | lastName | email          | password                                                     | lastLoginDate       | lastLoginAttemptIp | invalidLoginWindowStart | invalidLoginCount | lastInvalidLoginDate | lockoutDate | hasDashboard | verificationCode | verificationCodeIssuedDate | unverifiedEmail | passwordResetRequired | lastPasswordChangeDate | dateCreated         | dateUpdated         |
+----+---------+------------------+--------+---------+--------+-----------+-------+----------+----------+-----------+----------+----------------+--------------------------------------------------------------+---------------------+--------------------+-------------------------+-------------------+----------------------+-------------+--------------+------------------+----------------------------+-----------------+-----------------------+------------------------+---------------------+---------------------+
|  1 |    NULL |             NULL |      1 |       0 |      0 |         0 |     1 | admin    | NULL     | NULL      | NULL     | adam@orion.htb | $2y$13$e9zuohgFZzGtbQalcn9Mz.5PJbjxobO0GMbXo8NHp3P/B42LUg0lS | 2026-03-12 11:25:04 | NULL               | NULL                    |              NULL | NULL                 | NULL        |            1 | NULL             | NULL                       | NULL            |                     0 | 2026-03-12 11:24:51    | 2026-03-06 11:24:45 | 2026-03-12 11:25:04 |
+----+---------+------------------+--------+---------+--------+-----------+-------+----------+----------+-----------+----------+----------------+--------------------------------------------------------------+---------------------+--------------------+-------------------------+-------------------+----------------------+-------------+--------------+------------------+----------------------------+-----------------+-----------------------+------------------------+---------------------+---------------------+
1 row in set (0.000 sec)
```

The admin account's email points at a real system user, `adam`. The password column is a bcrypt hash, which cracks quickly against rockyou:

{% image10 %}

With the cracked password in hand, a simple `su - adam` from the `www-data` shell gets us onto the account:

{% image11 %}

### Privilege Escalation - adam

Looking at the local ports again as `adam`, a `telnet` service is listening on loopback only:

{% image12 %}

```bash
adam@orion:~$ telnet --version
telnet (GNU inetutils) 2.7
Copyright (C) 2025 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <https://gnu.org/licenses/gpl.html>.
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.

Written by many authors.
adam@orion:~$
```

This build of `inetutils` telnet is vulnerable to `CVE-2026-24061`, a remote authentication bypass: the client trusts a `-f <user>` value smuggled in through the `USER` environment variable and uses it to select the login identity on the other end, skipping the normal authentication prompt entirely. Setting `USER="-f root"` before connecting to the local telnet listener logs us straight in as root, without a password:

{% image13 %}

Orion is a short box, but it strings together two unrelated classes of bug - a web application pre-auth RCE and a decades-old protocol client vulnerable to argument injection through an environment variable - into a clean two-hop path from an anonymous HTTP request straight to root. The lesson in the middle is just as relevant as either exploit: a `.env` file left reachable after a web shell is often the fastest way to the next account, long before any kernel exploit is needed.
