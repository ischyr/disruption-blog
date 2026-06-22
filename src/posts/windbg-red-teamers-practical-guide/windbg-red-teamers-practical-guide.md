---
title: WinDbg for Red Teamers - A Practical Guide
date: 2026-06-20
image: cover.svg
tags: [Windows Internals, Red Team]
excerpt: A practical guide to WinDbg from a red team perspective - covering essential commands, process inspection, live EDR hook detection, IAT analysis, and step-by-step investigation workflows for identifying what a security product is watching inside your process.
---

# WinDbg for Red Teamers - A Practical Guide

Most red teamers treat WinDbg as a defensive tool - something malware analysts and kernel developers use. That is a mistake. A debugger attached to a target process gives you a live, ground-truth view of everything happening in memory: which modules are loaded, which functions are hooked, where suspicious code lives, and exactly what a security product is watching. If you are developing BOFs, shellcode, or evasion techniques and you are not validating your assumptions in WinDbg, you are guessing.

This guide is structured progressively. Part 1 covers setup and orientation. Part 2 is a command reference you will actually use. Parts 3 through 6 cover increasingly practical red team scenarios, ending with how to determine exactly what an EDR is monitoring inside a given process.

---

## Part 1 - Setup and Orientation

### Installing WinDbg

There are two versions worth knowing about. WinDbg Preview is available from the Microsoft Store and has a better UI. The classic WinDbg ships with the Windows SDK. Both work identically from the command perspective - the difference is purely cosmetic. For scripting and automation, the classic version is easier to invoke headlessly.

WinDbg Preview from the Store:
- Open Microsoft Store and search "WinDbg"
- Install and launch - no PATH setup required

Classic WinDbg via SDK:
```
winget install Microsoft.WindowsSDK
```

After installation the 64-bit debugger is at:
```
C:\Program Files (x86)\Windows Kits\10\Debuggers\x64\windbg.exe
```

### Symbol Path Setup

Symbols are what make WinDbg readable. Without them you see raw addresses. With them you see `ntdll!NtAllocateVirtualMemory`. Set the symbol path before doing anything serious.

The environment variable approach persists across sessions:
```
setx _NT_SYMBOL_PATH "srv*C:\Symbols*https://msdl.microsoft.com/download/symbols"
```

Or set it inside WinDbg at any time:
```
.sympath srv*C:\Symbols*https://msdl.microsoft.com/download/symbols
.reload
```

The `.reload` command forces WinDbg to reload symbols for all currently loaded modules. The first time you use a new symbol it downloads and caches to `C:\Symbols`.

### Attaching to a Process

**Live process - attach by PID:**
```
windbg.exe -p <PID>
```

Or from inside WinDbg: `File -> Attach to Process` (F6), pick from the list.

**Live process - attach by name at launch:**
```
windbg.exe -pn notepad.exe
```

**Open a memory dump:**
```
windbg.exe -z C:\dumps\lsass.dmp
```

**Non-invasive attach** - useful when you want to inspect without fully controlling execution:
```
windbg.exe -pv -p <PID>
```

A non-invasive attach lets you read memory and inspect state without suspending threads or setting breakpoints. It is the least disruptive way to inspect a running process.

When you attach, WinDbg breaks into the process. You will see a prompt like:
```
(1a4c.1b08): Break instruction exception - code 80000003
```

The numbers in parentheses are the process ID and thread ID in hex. The process is now suspended and waiting for your commands.

### The Basic Workflow

WinDbg has one input bar. You type commands and press Enter. Output appears above. The `g` command resumes execution. The most important thing to know early on is how to get back to a prompt after resuming - use `Ctrl+Break` to break back in.

```
g                   resume execution
Ctrl+Break          break back in
q                   quit and detach
.detach             detach without quitting
```

---

## Part 2 - Essential Commands

### Displaying Memory

These commands read raw bytes from any address:

```
db <addr>           display bytes (hex + ASCII sidebar)
dw <addr>           display words (2 bytes)
dd <addr>           display dwords (4 bytes)
dq <addr>           display qwords (8 bytes)
dp <addr>           display pointer-sized values (4 or 8 bytes depending on arch)
```

All accept an optional length argument:
```
db 7fff`12340000 L100     display 0x100 bytes starting at that address
dq ntdll L10             display first 0x10 qwords at ntdll's base
```

To display as a string:
```
da <addr>           display ANSI string
du <addr>           display Unicode string
```

### Disassembling Code

```
u <addr>            unassemble starting at addr (shows ~8 instructions)
u <addr> L20        unassemble 0x20 instructions
uf <addr>           unassemble entire function (follows jumps)
uf /c <addr>        unassemble function and show calls only
```

Using symbols instead of raw addresses:
```
u ntdll!NtAllocateVirtualMemory
uf ntdll!LdrLoadDll
```

### Listing Modules

```
lm                  list all loaded modules
lmf                 list modules with file paths
lm m ntdll          show only ntdll
lm m *edr*          wildcard search across loaded module names
```

The output columns are: start address, end address, module name. The start address is the base where the DLL is mapped in this process.

### Examining Symbols

```
x ntdll!Nt*                  list all symbols in ntdll starting with Nt
x ntdll!*CreateThread*       wildcard search
x /a ntdll!Nt*               sort by address
ln <addr>                    what symbol is nearest to this address
```

`x` is one of the most useful commands for red teamers. It lets you find the address of any exported function by name and browse what a module exposes.

### Inspecting Types and Structures

```
dt _PEB                      display the PEB type layout
dt _PEB @$peb                display the PEB struct filled with live values
dt _EPROCESS                 kernel type (requires kernel debugging)
dt ntdll!_LDR_DATA_TABLE_ENTRY   display the loader entry struct
```

`dt` combined with symbols gives you a live view of any Windows internal structure. You do not need to memorize field offsets - WinDbg reads them from the PDB.

### Process and Thread Information

```
!peb                         display the Process Environment Block
!teb                         display the Thread Environment Block for current thread
!peb -p <pid>                PEB for another process (kernel mode)
!threads                     list all threads
~                            list threads (user mode shorthand)
~0s                          switch to thread 0
~*k                          stack trace for all threads
```

### Memory Region Analysis

```
!address                     dump all virtual memory regions in the process
!address <addr>              describe the region containing that address
!address -f:MEM_COMMIT       filter to committed regions only
!address -f:PAGE_EXECUTE_READWRITE   filter to RWX regions
!vprot <addr>                show protection flags for a region
```

### Searching Memory

```
s -b <start> <end> <bytes>   search for byte pattern
s -a <start> <end> "string"  search for ASCII string
s -u <start> <end> "string"  search for Unicode string
```

Example - search all memory for the MZ header signature:
```
s -b 0 L?80000000 4d 5a
```

### Breakpoints

```
bp <addr>                    software breakpoint at address
bp ntdll!LdrLoadDll          breakpoint by symbol name
ba r4 <addr>                 hardware breakpoint on read of 4 bytes at addr
ba w4 <addr>                 hardware breakpoint on write of 4 bytes
bl                           list breakpoints
bc *                         clear all breakpoints
bd 0                         disable breakpoint 0
be 0                         enable breakpoint 0
```

Hardware breakpoints (`ba`) do not modify code - they use CPU debug registers. Four hardware breakpoints maximum per thread. Useful when you cannot modify the target memory (read-only sections, etc.).

### Stack and Registers

```
k                            stack trace
kb                           stack trace with first three arguments
kv                           stack trace with frame pointer and calling convention
r                            display all registers
r rax                        display rax only
r rax=0                      set rax to 0
```

---

## Part 3 - Inspecting a Process

### Walking the PEB and Module List

The PEB is your starting point for understanding what is loaded in a process. WinDbg makes this trivial:

```
!peb
```

Output (abbreviated):
```
PEB at 000000d3e3c72000
    Ldr                       00007fff9a2c53c0
    Base Image:               C:\Windows\System32\notepad.exe
    Ldr.Initialized:          Yes
    Ldr.InLoadOrderModuleList: { ntdll.dll, kernel32.dll, ... }
```

To walk the module list manually and see full detail on each entry:

```
dt ntdll!_PEB_LDR_DATA @$peb->Ldr
```

Then follow the `InLoadOrderModuleList` forward links:
```
dt ntdll!_LDR_DATA_TABLE_ENTRY <addr of first entry>
```

Or use `lm` which does all of this automatically and presents it cleanly.

### Finding a Module Base Address

```
lm m kernel32
```

Output:
```
Browse full module list
start             end                 module name
00007fff`9a0e0000 00007fff`9a1d0000   KERNEL32
```

That start address is where kernel32.dll is mapped in this process. Every RVA in the PE adds to that base.

### Reading the Export Address Table

To find where a specific export lives:

```
x kernel32!VirtualAlloc
```

Output:
```
00007fff`9a0f1234 KERNEL32!VirtualAlloc
```

To see all exports starting with a prefix:

```
x kernel32!Virtual*
```

### Reading the Import Address Table

The IAT is the table of pointers that a module uses to call external functions. When a DLL is loaded, the loader patches each IAT entry to point to the actual function in the target DLL.

To inspect the IAT of a specific module, first find its base:
```
lm m notepad
```

Then look at the import descriptors. The IAT starts after the PE headers. The easiest approach is to use the `!dh` command to parse the headers:
```
!dh <module_base>
```

This dumps every PE header field including the import directory RVA. Add that RVA to the module base to reach the `IMAGE_IMPORT_DESCRIPTOR` array.

For a quicker read of what a module imports without manually parsing PE structures:
```
!imports <module_base>
```

Note that `!imports` requires the `mex` or `sosex` extension in some WinDbg versions. If it is not available, you can search for the IAT region by looking for a writable section in the module's memory and checking whether pointers inside it resolve to symbol names.

### Searching for Patterns in Memory

To find every location in memory that looks like a PE header:
```
s -b 0 L?7fffffff 4d 5a 90 00
```

This is useful for finding reflectively loaded modules that do not appear in the PEB module list because they never went through the normal loader.

---

## Part 4 - Detecting EDR Presence

### Checking Loaded Modules for EDR DLLs

The first and most obvious indicator is looking at what DLLs are loaded in the process. Every user-mode EDR injects at least one DLL to install hooks.

```
lmf
```

Scroll through the output looking for anything that does not belong - DLLs that are not part of the standard Windows installation and are not the application itself. Common patterns:

```
lm m *edr*
lm m *guard*
lm m *protect*
lm m *agent*
lm m *sense*       (Windows Defender for Endpoint)
lm m *cylance*
lm m *cb*          (CrowdStrike)
lm m *mfe*         (McAfee)
```

More reliably, look at every module whose path is not under `C:\Windows`:
```
lmf
```

Anything loading from a vendor-specific directory in `C:\Program Files` or with a suspicious name is worth inspecting further.

### Identifying Modules Not Backed by a File on Disk

Reflectively injected DLLs and manually mapped code often appear in memory but have no corresponding file path. They show up in `!address` output as private committed memory with execute permissions rather than as a file-backed mapping.

```
!address -f:PAGE_EXECUTE
```

For each region in the output, check whether it is backed by a file (`MEM_MAPPED` or `MEM_IMAGE`) or is private (`MEM_PRIVATE`). An executable `MEM_PRIVATE` region that is not the stack and not a JIT compiler artifact is worth investigating.

To check a specific region:
```
!address 00007fff`12340000
```

Output includes `Type` (MEM_IMAGE vs MEM_PRIVATE) and `State`. A legitimate DLL will show `MEM_IMAGE`. An injected region will show `MEM_PRIVATE`.

### Finding RWX Memory Regions

Memory that is simultaneously readable, writable, and executable is a common indicator of shellcode or a hook trampoline. Legitimate code regions are almost always `PAGE_EXECUTE_READ` - the write permission is dropped after the loader finishes.

```
!address -f:PAGE_EXECUTE_READWRITE
```

Each result is a candidate for inspection. Dump the first few bytes to see what is there:
```
db <region_start> L40
u <region_start>
```

If it starts with `4C 8B D1` (`mov r10, rcx`) or `E9` (a near jump), it is almost certainly a syscall stub or hook trampoline.

### Checking Thread Origins

EDR products often run monitoring threads inside your process. You can see all threads and where their current execution is:

```
~*k
```

This prints a stack trace for every thread. Threads that show EDR module names in their call stacks are the product's monitoring infrastructure. Threads whose start address resolves to an EDR DLL symbol are threads the EDR created inside your process.

To see the start address of each thread:
```
~*e r rip
```

Or to see thread start functions specifically, look at the `Win32StartAddr` field in the TEB for each thread - this is where the thread's top-level function is.

---

## Part 5 - Detecting API Hooks

### How Inline Hooks Look

An inline hook works by overwriting the first few bytes of a target function with a jump instruction that redirects execution to the EDR's monitoring code. The original bytes are saved in a trampoline so the function can still work after inspection.

A clean NTDLL syscall stub looks like this:
```
u ntdll!NtAllocateVirtualMemory

ntdll!NtAllocateVirtualMemory:
00007fff`99b31234 4c8bd1          mov     r10,rcx
00007fff`99b31237 b818000000      mov     eax,18h
00007fff`99b3123c f604250803fe7f01 test    byte ptr [SharedUserData+0x308],1
00007fff`99b31244 7503            jne     ntdll!NtAllocateVirtualMemory+0x13
00007fff`99b31246 0f05            syscall
00007fff`99b31248 c3              ret
```

The pattern is always: `mov r10, rcx` then `mov eax, <syscall_number>` then `syscall` then `ret`. If you see something different at byte 0 of any NTDLL Nt* function, it is hooked.

A hooked stub looks like this:
```
u ntdll!NtAllocateVirtualMemory

ntdll!NtAllocateVirtualMemory:
00007fff`99b31234 e9cb1234ab      jmp     00007fff`abe744ff
00007fff`99b31239 90              nop
```

The `E9` at byte 0 is a near jump. The target of that jump (`00007fff`abe744ff`) is the EDR's hook handler. Every call to `NtAllocateVirtualMemory` now goes there first.

### Checking a Single Function for Hooks

```
u ntdll!NtAllocateVirtualMemory L6
```

Read the first instruction. If it is not `mov r10, rcx` (bytes `4C 8B D1`), the function is hooked.

To check the raw bytes directly:
```
db ntdll!NtAllocateVirtualMemory L10
```

A clean stub starts with `4c 8b d1 b8`. An `e9` or `ff 25` at offset 0 means a hook is present.

### Bulk Checking All Nt* Functions

You can check every NTDLL syscall stub in sequence using WinDbg's scripting. First get a list of all Nt* symbols:

```
x ntdll!Nt*
```

Then for each one that looks like a syscall (not a data symbol), check the first byte:

```
db ntdll!NtCreateFile L1
db ntdll!NtOpenProcess L1
db ntdll!NtWriteVirtualMemory L1
db ntdll!NtProtectVirtualMemory L1
db ntdll!NtCreateThreadEx L1
db ntdll!NtQueueApcThread L1
db ntdll!NtReadVirtualMemory L1
db ntdll!NtMapViewOfSection L1
```

Any function where the first byte is not `4C` is hooked. The byte `E9` is a relative jump, `FF 25` is an indirect jump through a pointer, `E8` is a call - all of these redirect execution away from the real function.

### Following a Hook to Its Destination

When you find a hooked function, follow the jump to see where it goes:

```
u ntdll!NtAllocateVirtualMemory
```

Note the jump target address. Then:

```
ln <jump_target>
```

`ln` resolves the nearest symbol to that address. If it resolves to a symbol inside an EDR DLL, you have identified the hook handler and which product placed it.

Then disassemble the handler to see what it does:
```
uf <jump_target>
```

This shows the full monitoring function - what arguments it inspects, what logging it performs, and where it eventually calls the real function. Reading this tells you exactly what the EDR considers suspicious.

### Detecting IAT Hooks

An IAT hook replaces the pointer in a module's import table rather than modifying the function itself. The function in NTDLL is untouched, but when your code calls `VirtualAlloc`, the IAT entry points somewhere else.

To detect IAT hooks, compare each IAT pointer against the expected module range.

First, find kernel32's address range:
```
lm m kernel32
```

Note the start and end addresses. Then look at a module's IAT entries that should resolve to kernel32:

```
u poi(notepad+<IAT_offset_for_VirtualAlloc>)
```

If that address falls outside the `kernel32` range shown by `lm`, the IAT entry is hooked.

A more direct approach - look at the raw pointer in the IAT and check what module it points into:

```
ln poi(<iat_entry_address>)
```

If `ln` resolves to a symbol inside `notepad.exe` or an EDR module rather than `KERNEL32!VirtualAlloc`, the IAT is tampered with.

### Comparing In-Memory NTDLL Against the File on Disk

The most thorough hook detection method is byte-for-byte comparison of the in-memory NTDLL `.text` section against the clean copy on disk. The on-disk file has never been touched by the EDR.

First, find the in-memory NTDLL base:
```
lm m ntdll
```

Get the base address. Then open the file on disk as a separate mapping and compare the `.text` section. In WinDbg, you can open a second file mapping using:

```
.opendump C:\Windows\System32\ntdll.dll
```

Then compare specific regions. The manual approach is to read the first bytes of key functions from both sources and look for differences:

From memory:
```
db ntdll!NtAllocateVirtualMemory L20
```

From the file on disk (after computing the file offset from the RVA):
```
db <file_mapping_base + text_section_rva + function_rva> L20
```

Any difference is a hook, a patch, or corruption.

### Spotting Trampoline Patterns

When an EDR hooks a function it saves the original bytes in a trampoline - a small stub that executes the overwritten instructions and then jumps back to continue the real function. The trampoline is usually allocated in a private RWX region near the hooked DLL.

Find trampolines with:
```
!address -f:PAGE_EXECUTE_READWRITE
```

For each RWX region, disassemble the start:
```
u <region_base>
```

A trampoline looks like the original function prologue followed by a jump back into the middle of the hooked function:

```
mov r10, rcx
mov eax, 18h
jmp 00007fff`99b3123c      (jumps back past the hook's own jmp)
```

Finding a trampoline confirms a hook is active and shows you both ends of the redirection.

---

## Part 6 - Practical Investigation Scenarios

### Scenario 1 - Is This Process Hooked?

A systematic 5-minute checklist to determine if an EDR is actively hooking a process:

**Step 1** - List all loaded modules and flag anything non-standard:
```
lmf
```

**Step 2** - Check for RWX memory regions:
```
!address -f:PAGE_EXECUTE_READWRITE
```

**Step 3** - Check the first byte of the most commonly hooked NTDLL functions:
```
db ntdll!NtAllocateVirtualMemory L1
db ntdll!NtWriteVirtualMemory L1
db ntdll!NtCreateThreadEx L1
db ntdll!NtOpenProcess L1
db ntdll!NtProtectVirtualMemory L1
db ntdll!NtMapViewOfSection L1
db ntdll!NtQueueApcThread L1
db ntdll!NtCreateFile L1
```

Expected first byte for a clean stub: `4C`. Anything else is a hook.

**Step 4** - List all threads and check their origins:
```
~*k
```

Look for threads whose stacks show EDR module names.

**Step 5** - For any hook found, follow the jump and identify the destination module:
```
ln <hook_destination_address>
```

This five-step sequence gives you a complete picture of the hooking landscape in any process within minutes.

### Scenario 2 - What Is the EDR Actually Watching?

Once you have found that a function is hooked and identified the destination, you can read the hook handler to understand what triggers an alert.

Disassemble the handler:
```
uf <hook_handler_address>
```

Look for:
- Comparisons against argument values (what sizes, what flags are suspicious)
- String comparisons against known bad process names or paths
- Calls to logging functions
- Conditional paths - what causes the handler to block vs allow

This kind of analysis on a test machine tells you exactly what behavior the product is keying on and how to structure your operations to avoid triggering it.

### Scenario 3 - Finding Injected Code in a Suspicious Process

When analyzing a compromised process or testing whether your own injection leaves detectable artifacts:

**Step 1** - List all executable regions not backed by a file:
```
!address -f:PAGE_EXECUTE
```

Check the `Type` column for each. `MEM_PRIVATE` with execute permission is suspicious.

**Step 2** - For each suspicious region, check what is there:
```
db <region_base> L20
u <region_base>
```

Shellcode often starts with a relative call (`E8`) to find its own address, or with a common stub pattern. Reflective loaders start with an MZ header (`4D 5A`).

**Step 3** - Check whether the region appears in the PEB module list:
```
lm
```

An in-memory PE that does not appear in `lm` was loaded without going through the standard loader - a classic indicator of reflective injection.

**Step 4** - If it looks like a DLL, try to resolve its exports:
```
!dh <region_base>
```

This parses the PE headers and shows the export directory RVA. From there you can find the export name table and identify what the injected module is.

### Scenario 4 - Extracting a Credential from an LSASS Dump

With a full memory dump of lsass.exe, you can locate credential structures without running Mimikatz - useful when the tool itself is detected but the dump is available.

Open the dump:
```
windbg.exe -z lsass.dmp
```

Load the dump as a process context:
```
.sympath srv*C:\Symbols*https://msdl.microsoft.com/download/symbols
.reload
```

Find the wdigest module base:
```
lm m wdigest
```

The credential cache in wdigest is a linked list of `_KIWI_WDIGEST_LIST_ENTRY` structures. The root is at a known offset from the wdigest module base that changes with each patch level. Search for it by looking for the characteristic pattern of a doubly-linked list of credential structures:

```
s -b <wdigest_base> <wdigest_end> 02 00 00 00 00 00 00 00
```

Then walk the list entries and look for non-null `UNICODE_STRING` fields that hold the username and encrypted password bytes. The encryption uses a session key stored in the lsass process.

This level of analysis requires knowing the structure layouts for the specific Windows version, which is where symbols and community research on credential internals become essential.

---

## WinDbg Extension Reference

Extensions expand WinDbg's built-in capabilities significantly. Load any extension with `.load`:

```
.load mex.dll
.load sosex.dll
.load netext.dll
```

**Mex** - adds `!mex.grep` for filtering output, improved module and heap commands
**SOS** - .NET debugging, inspect managed objects and CLR internals
**Netext** - network connection analysis, socket inspection

Some useful built-in pseudo-extensions that are always available:

```
!analyze -v        automated crash analysis (useful on dumps)
!heap              heap analysis and corruption detection
!locks             deadlock detection
!token             display security token details for current thread
!sd <addr>         display security descriptor
```

---

## Quick Reference Card

```
SETUP
.sympath srv*C:\Symbols*https://msdl.microsoft.com/download/symbols
.reload

EXECUTION
g                  resume
Ctrl+Break         break in
q                  quit

MEMORY
db <addr> L<n>     display bytes
dq <addr>          display qwords
u <addr>           disassemble
uf <symbol>        disassemble full function

MODULES
lm                 list modules
lmf                list with paths
x ntdll!Nt*        list symbols matching pattern

STRUCTURES
!peb               Process Environment Block
!teb               Thread Environment Block
dt _PEB @$peb      live PEB fields

HOOKS
db ntdll!NtCreateFile L1          first byte check
u ntdll!NtAllocateVirtualMemory   disassemble stub
ln <addr>                          resolve address to symbol
!address -f:PAGE_EXECUTE_READWRITE  RWX regions

THREADS
~*k                all thread stacks
~<n>s              switch to thread n

SEARCH
s -b <start> <end> <bytes>         search bytes
s -a <start> <end> "string"        search ASCII
```

---

## Where to Go From Here

WinDbg's real power comes with time spent reading unfamiliar memory and developing pattern recognition for what clean and tampered code look like. The techniques in this guide are starting points - the investigation itself always surfaces new questions that require adapting.

The WinDbg documentation is thorough. The `!analyze` command with `-v` often points you toward internal commands you did not know existed. Combining WinDbg with live process inspection during BOF development, shellcode testing, and evasion validation turns guesswork into verification.

The cleanest feedback loop: write the technique, run it, attach WinDbg, and confirm that what you see in memory matches what you intended. Assumptions about memory state, hook presence, and execution context can all be verified rather than assumed.
