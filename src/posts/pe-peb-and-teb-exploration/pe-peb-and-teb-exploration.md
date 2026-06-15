---
title: PE, PEB and TEB Exploration
date: 2026-06-15
image: cover.svg
tags: [Windows Internals, Malware Development]
excerpt: A deep dive into the Portable Executable format, the Process Environment Block and the Thread Environment Block - the three fundamental Windows structures every malware developer and analyst must understand.
---

# PE, PEB and TEB Exploration

Understanding how Windows loads and executes code is the foundation of both offensive and defensive security on Windows. Before you can write a shellcode loader, bypass a security product, or analyse a malware sample, you need a solid mental model of the PE format, the PEB, and the TEB. This post walks through all three in depth.

---

# Understanding PE

## What does it mean?

The Portable Executable (PE) format is the standard file format used for executables, object code, dynamic-link libraries (DLLs), and other binary files on both 32-bit and 64-bit versions of Windows, as well as in UEFI environments. It serves as the primary format for executable files on Windows NT-based systems, including file types such as `.exe`, `.dll`, `.sys` (system drivers), and `.mui`.

**Essentially, the PE format is a structured data container that provides the Windows loader with all the necessary information to correctly handle and execute the code.** This includes references to dynamic libraries, import and export tables for APIs, resource data, and thread-local storage (TLS) details.

The name "Portable" comes from the original goal of the format being usable across multiple architectures. In practice today it is Windows-exclusive, but the same binary layout supports x86, x64, ARM and ARM64 with only minor field differences.

Basically PE format is a fundamental format for executable files, object code, DLLs and other types of native files on Windows. It consists of a number of headers and sections that tell the **Windows Loader** how to map the file into memory and prepare it to run.

The loader's job is roughly: read the headers, reserve virtual address space, map each section into memory at the correct offset, fix up relocations if needed, resolve imports by loading dependent DLLs and filling in the IAT, then transfer execution to the entry point.

## Portable Executable (PE) Structure

{% image6 %}

The PE file is laid out sequentially on disk. From the beginning of the file inward:

1. DOS Header (64 bytes)
2. DOS Stub (variable size)
3. Rich Header (optional, variable size, Microsoft tools only)
4. NT Headers (PE Signature + File Header + Optional Header)
5. Section Headers (one per section)
6. Sections (raw data: code, data, resources, etc.)

Each layer builds on the previous one - the DOS Header points to the NT Headers, the NT Headers describe the sections, and the sections contain the actual content.

### DOS Header

The first part of the PE format is the `IMAGE_DOS_HEADER` (DOS Header), a 64-byte structure that sits at offset 0 of every PE file.

The most important members from a malware development and analysis perspective are:

- `e_magic` - the magic number identifying this as a valid DOS executable
- `e_lfanew` - the file offset of the NT Headers

All other members contain information useful to the original DOS loader (segment offsets, checksum, overlay information) and are largely irrelevant on modern Windows. However, some obfuscated malware intentionally corrupts or zeroes out these fields to confuse tools that validate them strictly.

```cpp
typedef struct _IMAGE_DOS_HEADER
{
     WORD e_magic;      // Magic number - all valid PE files have 0x5A4D ("MZ")
     WORD e_cblp;       // Bytes on last page of file
     WORD e_cp;         // Pages in file
     WORD e_crlc;       // Relocations
     WORD e_cparhdr;    // Size of header in paragraphs
     WORD e_minalloc;   // Minimum extra paragraphs needed
     WORD e_maxalloc;   // Maximum extra paragraphs needed
     WORD e_ss;         // Initial (relative) SS value
     WORD e_sp;         // Initial SP value
     WORD e_csum;       // Checksum
     WORD e_ip;         // Initial IP value
     WORD e_cs;         // Initial (relative) CS value
     WORD e_lfarlc;     // File address of relocation table
     WORD e_ovno;       // Overlay number
     WORD e_res[4];     // Reserved words
     WORD e_oemid;      // OEM identifier
     WORD e_oeminfo;    // OEM information
     WORD e_res2[10];   // Reserved words
     LONG e_lfanew;     // File offset to the NT Headers (_IMAGE_NT_HEADERS)
} IMAGE_DOS_HEADER, *PIMAGE_DOS_HEADER;
```

**`e_magic`** is always `0x5A4D` which in ASCII is `MZ` - the initials of Mark Zbikowski, one of the architects of MS-DOS. Any tool parsing a PE file checks this value first. If it doesn't match, the file is not a valid PE.

**`e_lfanew`** is the only truly critical field for modern usage. It is a 4-byte offset from the start of the file to the `IMAGE_NT_HEADERS` structure. The Windows loader jumps directly to this offset to begin parsing the actual PE metadata. A simple way to find the NT Headers in code:

```cpp
PIMAGE_DOS_HEADER pDosHeader = (PIMAGE_DOS_HEADER)baseAddress;
PIMAGE_NT_HEADERS pNtHeaders = (PIMAGE_NT_HEADERS)(
    (BYTE*)baseAddress + pDosHeader->e_lfanew
);
```

Size of types (on typical Windows platforms):

- `WORD` = 2 bytes
- `LONG` = 4 bytes

The `IMAGE_DOS_HEADER` is exactly **64 bytes** because it contains only fixed-size data types with no padding required. Layout:

```
2 * 14  (first 14 WORD fields)  = 28 bytes
+ 8     (e_res[4])
+ 2     (e_oemid)
+ 2     (e_oeminfo)
+ 20    (e_res2[10])
+ 4     (e_lfanew)
= 64 bytes
```

The DOS Header is what makes the PE file technically an MS-DOS executable as well - a design choice made for backward compatibility in the early 1990s.

### DOS Stub

Immediately following the DOS Header is the DOS Stub. While PE files maintain backward compatibility for historical reasons, modern Windows PE files are not designed to run in a DOS environment. Instead they include a DOS stub - a small piece of x86 real-mode code that prints an error message and exits cleanly if the file is executed under MS-DOS.

By default, when you compile any program with MSVC or MinGW, the stub contains the 16-bit program that prints: `"This program cannot be run in DOS mode."`

{% image7 %}

The stub is entirely skippable from a Windows perspective - the loader jumps straight to `e_lfanew` and never executes the DOS stub. This region is sometimes abused by malware authors to hide data, signatures, or configuration because it is largely ignored by both the OS loader and many analysis tools.

The size of the DOS stub is not fixed - anything between the end of the `IMAGE_DOS_HEADER` and the offset stored in `e_lfanew` is considered part of the stub. Custom or hand-crafted PE files often make this region tiny (or even zero bytes) to minimise file size.

### Rich Header

Present in executables built with Microsoft development tools, the Rich Header is an undocumented structure that sits between the DOS Stub and the NT Headers. It contains metadata about the build environment - specifically, the compiler product IDs, version numbers and build counts of the tools (MSVC, linker, assembler, resource compiler) used to produce the binary.

{% image8 %}

The Rich Header starts with the XOR-encrypted signature `"Rich"` and ends with `"DanS"` (the initials of Dan Salvatore, a Microsoft developer). The XOR key is the checksum stored in the header itself.

From an analyst's perspective the Rich Header is valuable because:

- It can fingerprint the exact version of the compiler used, helping attribute samples.
- It can distinguish hand-crafted or Go/Rust binaries (which have no Rich Header) from MSVC-compiled malware.
- Comparing Rich Headers between samples helps cluster related malware families.

From a malware author's perspective, the Rich Header can be removed or forged to frustrate attribution. Many packers strip it automatically.

### NT Headers

After the DOS stub (and optional Rich Header) comes the actual PE metadata, rooted in the `IMAGE_NT_HEADERS` structure:

```cpp
typedef struct _IMAGE_NT_HEADERS64 {
    DWORD                   Signature;      // Always 0x00004550 ("PE\0\0")
    IMAGE_FILE_HEADER       FileHeader;     // COFF File Header
    IMAGE_OPTIONAL_HEADER64 OptionalHeader; // Loader-facing metadata
} IMAGE_NT_HEADERS64, *PIMAGE_NT_HEADERS64;
```

There are two variants depending on architecture:

1. `IMAGE_NT_HEADERS` - for x86 (PE32)
2. `IMAGE_NT_HEADERS64` - for x64 (PE32+)

The NT Headers contain three main parts:

- **PE Signature** - a 4-byte `DWORD` that marks the file as a PE image. It always holds the value `0x00004550`, which corresponds to the ASCII string `"PE\0\0"`. The loader verifies this before proceeding.
- **File Header** - a standard COFF File Header with seven fields holding key information about the PE file: machine architecture, time-date stamp, section count, optional header size, and file characteristics.
- **Optional Header** - despite its name, this is mandatory for executable images (`.exe` files). It is called "optional" because it can be omitted in object files (`.obj`). It provides the OS loader with everything it needs to map and start the image - entry point, preferred base address, section alignment, and the Data Directories.

### NT Headers - File Header

```cpp
typedef struct _IMAGE_FILE_HEADER {
    WORD  Machine;              // Target CPU architecture
    WORD  NumberOfSections;     // Number of sections in the PE file
    DWORD TimeDateStamp;        // UNIX timestamp of when the file was linked
    DWORD PointerToSymbolTable; // Offset to COFF symbol table (0 in modern PEs)
    DWORD NumberOfSymbols;      // Number of symbol table entries (0 in modern PEs)
    WORD  SizeOfOptionalHeader; // Size of the Optional Header in bytes
    WORD  Characteristics;      // Flags describing file attributes
} IMAGE_FILE_HEADER, *PIMAGE_FILE_HEADER;
```

This structure is also referred to as the **COFF File Header** (Common Object File Format).

Key fields worth understanding in depth:

**`Machine`** - specifies the CPU architecture the binary targets. Common values:

| Value    | Architecture       |
| -------- | ------------------ |
| `0x014C` | x86 (i386)         |
| `0x8664` | x64 (AMD64)        |
| `0x01C4` | ARM (Thumb-2)      |
| `0xAA64` | ARM64              |

**`TimeDateStamp`** - a UNIX timestamp set at link time. Useful for malware analysis because it can reveal approximate build dates - though many malware families forge this field to 0 or a far-future date to confuse analysts.

**`Characteristics`** - a bitmask of flags. The most relevant:

| Flag               | Value    | Meaning                                   |
| ------------------ | -------- | ----------------------------------------- |
| `IMAGE_FILE_EXECUTABLE_IMAGE` | `0x0002` | File is executable (not an object file) |
| `IMAGE_FILE_DLL`   | `0x2000` | File is a DLL                             |
| `IMAGE_FILE_LARGE_ADDRESS_AWARE` | `0x0020` | App can handle addresses > 2 GB     |

**`NumberOfSections`** - tells the loader how many `IMAGE_SECTION_HEADER` entries follow the Optional Header. The loader uses this to build its map of sections.

### NT Headers - Optional Header

There are two variants of Optional Header:

1. `_IMAGE_OPTIONAL_HEADER` - for x86 (PE32), `Magic` = `0x10B`
2. `_IMAGE_OPTIONAL_HEADER64` - for x64 (PE32+), `Magic` = `0x20B`

```cpp
typedef struct _IMAGE_OPTIONAL_HEADER64 {
    WORD                 Magic;                  // 0x10B = PE32, 0x20B = PE32+
    BYTE                 MajorLinkerVersion;
    BYTE                 MinorLinkerVersion;
    DWORD                SizeOfCode;             // Size of all code sections combined
    DWORD                SizeOfInitializedData;
    DWORD                SizeOfUninitializedData;
    DWORD                AddressOfEntryPoint;    // RVA to the first instruction executed
    DWORD                BaseOfCode;             // RVA to the start of the code section
    ULONGLONG            ImageBase;              // Preferred load address in virtual memory
    DWORD                SectionAlignment;       // Alignment of sections in memory (usually 0x1000)
    DWORD                FileAlignment;          // Alignment of sections on disk (usually 0x200)
    WORD                 MajorOperatingSystemVersion;
    WORD                 MinorOperatingSystemVersion;
    WORD                 MajorImageVersion;
    WORD                 MinorImageVersion;
    WORD                 MajorSubsystemVersion;
    WORD                 MinorSubsystemVersion;
    DWORD                Win32VersionValue;
    DWORD                SizeOfImage;            // Total size of the image in memory
    DWORD                SizeOfHeaders;          // Size of all headers (DOS+NT+section headers), rounded up to FileAlignment
    DWORD                CheckSum;               // Checksum for integrity (required for drivers)
    WORD                 Subsystem;              // GUI, console, native, EFI, etc.
    WORD                 DllCharacteristics;     // Security flags (ASLR, DEP, CFG, etc.)
    ULONGLONG            SizeOfStackReserve;
    ULONGLONG            SizeOfStackCommit;
    ULONGLONG            SizeOfHeapReserve;
    ULONGLONG            SizeOfHeapCommit;
    DWORD                LoaderFlags;
    DWORD                NumberOfRvaAndSizes;    // Number of valid DataDirectory entries
    IMAGE_DATA_DIRECTORY DataDirectory[IMAGE_NUMBEROF_DIRECTORY_ENTRIES];
} IMAGE_OPTIONAL_HEADER64, *PIMAGE_OPTIONAL_HEADER64;
```

Fields that matter most in practice:

**`AddressOfEntryPoint`** - a Relative Virtual Address (RVA) pointing to the first instruction the loader will execute after the image is mapped. For executables this is typically the CRT startup stub, not `main`. For DLLs it points to `DllMain`. Malware injectors often patch this field to redirect execution.

**`ImageBase`** - the preferred base address where the loader tries to map the image. For executables the default is `0x400000` (x86) or `0x140000000` (x64). For DLLs it is `0x10000000`. If the address is already occupied, the loader applies base relocations from the `.reloc` section. ASLR randomises this at load time for images built with `DYNAMIC_BASE`.

**`SectionAlignment` vs `FileAlignment`** - sections are padded to `SectionAlignment` (typically a page, `0x1000`) in virtual memory and to `FileAlignment` (typically a disk sector, `0x200`) on disk. This is why the same section can be a different size in memory vs on disk.

**`DllCharacteristics`** - security feature flags:

| Flag | Meaning |
| ---- | ------- |
| `0x0040` | DYNAMIC_BASE (ASLR enabled) |
| `0x0100` | NX_COMPAT (DEP enabled) |
| `0x4000` | GUARD_CF (Control Flow Guard enabled) |
| `0x0020` | HIGH_ENTROPY_VA (64-bit ASLR) |

These are what EDRs and vulnerability scanners check when they say a binary "lacks ASLR" or "lacks DEP."

### Optional Header - Data Directories

`DataDirectory` is one of the most important members of the Optional Header. It is an array of `IMAGE_DATA_DIRECTORY` structures that point to important sub-structures within the image.

{% image9 %}

```cpp
IMAGE_DATA_DIRECTORY DataDirectory[IMAGE_NUMBEROF_DIRECTORY_ENTRIES];
```

`IMAGE_NUMBEROF_DIRECTORY_ENTRIES` is defined as the constant `16`. Each entry:

```cpp
typedef struct _IMAGE_DATA_DIRECTORY {
    DWORD VirtualAddress; // RVA to the start of this data directory
    DWORD Size;           // Size of the data directory in bytes
} IMAGE_DATA_DIRECTORY, *PIMAGE_DATA_DIRECTORY;
```

- **`VirtualAddress`** is a relative virtual address (RVA) pointing to the start of the data directory.
- **`Size`** is the size of the data directory in bytes.

Data directories store information essential to the PE loader. Each entry is identified by an index constant. The most important ones:

| Index | Constant | Purpose |
| ----- | -------- | ------- |
| 0 | `IMAGE_DIRECTORY_ENTRY_EXPORT` | Export table (function names + addresses the DLL exports) |
| 1 | `IMAGE_DIRECTORY_ENTRY_IMPORT` | Import table (DLLs and functions this image needs) |
| 2 | `IMAGE_DIRECTORY_ENTRY_RESOURCE` | Embedded resources (icons, strings, manifests) |
| 5 | `IMAGE_DIRECTORY_ENTRY_BASERELOC` | Base relocation table for ASLR |
| 9 | `IMAGE_DIRECTORY_ENTRY_TLS` | Thread Local Storage callbacks |
| 12 | `IMAGE_DIRECTORY_ENTRY_IAT` | Import Address Table (patched by the loader at runtime) |

**Export Directory** (`index 0`) - found in DLLs. It contains a table of exported function names, ordinals and their addresses. When you call `GetProcAddress("MessageBoxA")`, Windows is reading this table. In PEB walk techniques (covered below), malware parses this table manually to avoid calling `GetProcAddress` directly.

**Import Directory** (`index 1`) - describes every DLL and function the binary needs at load time. The loader walks this table, loads each DLL and writes function addresses into the IAT. Analysing the Import Directory quickly reveals what a binary is capable of doing.

**TLS Directory** (`index 9`) - TLS callbacks execute *before* the entry point. This is a known anti-debug trick - malware can run anti-analysis checks in a TLS callback and the debugger will not catch it at the entry point unless you set a breakpoint earlier.

### Section Headers

Following the Optional Header and preceding the actual section data are the **Section Headers**. Each section header is represented by `IMAGE_SECTION_HEADER`:

```cpp
typedef struct _IMAGE_SECTION_HEADER {
    BYTE  Name[IMAGE_SIZEOF_SHORT_NAME]; // 8-byte null-padded ASCII name
    union {
        DWORD PhysicalAddress;
        DWORD VirtualSize;               // Actual size of section data in memory
    } Misc;
    DWORD VirtualAddress;                // RVA where this section is loaded in memory
    DWORD SizeOfRawData;                 // Size of section data on disk (aligned to FileAlignment)
    DWORD PointerToRawData;              // File offset to the raw section data
    DWORD PointerToRelocations;
    DWORD PointerToLinenumbers;
    WORD  NumberOfRelocations;
    WORD  NumberOfLinenumbers;
    DWORD Characteristics;               // Flags: executable, readable, writable, etc.
} IMAGE_SECTION_HEADER, *PIMAGE_SECTION_HEADER;
```

The `Characteristics` field is critical. It tells the loader what memory protection to apply when mapping this section:

| Flag | Value | Meaning |
| ---- | ----- | ------- |
| `IMAGE_SCN_MEM_EXECUTE` | `0x20000000` | Section is executable |
| `IMAGE_SCN_MEM_READ`    | `0x40000000` | Section is readable |
| `IMAGE_SCN_MEM_WRITE`   | `0x80000000` | Section is writable |
| `IMAGE_SCN_CNT_CODE`    | `0x00000020` | Section contains executable code |

The combination of `MEM_WRITE | MEM_EXECUTE` (`RWX`) on a section is a common malware indicator - legitimate compilers never produce RWX sections, but shellcode loaders that write then execute shellcode often create them.

The `VirtualAddress` vs `PointerToRawData` distinction is important when you parse a PE from disk vs from memory. On disk you use `PointerToRawData` as the file offset. In memory you use `VirtualAddress` (as an RVA from `ImageBase`). Many PE-parsing tools have to handle both cases.

### Sections

Sections hold the actual data of the executable and make up the remainder of the PE file following the headers. Some sections have special names that reflect their purpose:

- **.text** - holds the program's executable code. Memory protection: `RX` (read + execute, not writable).
- **.data** - stores initialized global and static variables. Memory protection: `RW` (read + write, not executable).
- **.bss** - contains uninitialized data that is zeroed at runtime. Often merged into `.data` by modern compilers.
- **.rdata** - contains read-only initialized data such as string literals, constants and the import/export tables. Memory protection: `R` (read-only).
- **.edata** - holds the export table for DLLs (often merged into `.rdata` in modern builds).
- **.idata** - stores the import table including the IAT. The loader writes function addresses here at load time.
- **.reloc** - contains base relocation information. When the image cannot load at `ImageBase`, the loader reads this section to fix up absolute addresses.
- **.rsrc** - includes application resources such as icons, images, dialogs, version information, and embedded binaries. Malware often hides payloads here.

{% image10 %}

Certain malware families add custom sections (e.g., `.upx0`, `.themida`, `.vmp0`) to signal the presence of a packer or protector. Analysts check section names and their entropy - high entropy in a `.text` section suggests packed or encrypted code.

## Resources

- [Guided Hacking - PE Format (YouTube)](https://www.youtube.com/watch?v=OkX2lIf9YEM) - excellent walkthrough of the full structure
- [0xRick - PE Format Series](https://0xrick.github.io/win-internals/pe1/)
- [Microsoft PE Format Specification](https://learn.microsoft.com/en-us/windows/win32/debug/pe-format)

---

# Understanding the PEB

The **Process Environment Block** (PEB) is a user-mode data structure that Windows maintains for every running process. It sits at the boundary between user mode and kernel mode: it has the highest-level knowledge of a process from the kernel's perspective, and the lowest-level representation available in user mode.

The PEB holds a wide range of process-level information:

- Whether the process is being debugged (`BeingDebugged`)
- The image base address
- A pointer to the loader's module list (`Ldr`) - all loaded DLLs
- Process parameters (command line, environment variables, working directory)
- Heap information
- Flags used by the loader and runtime

The official (abbreviated) structure from the Windows SDK:

```cpp
typedef struct _PEB {
    BYTE                          Reserved1[2];
    BYTE                          BeingDebugged;          // 1 if a debugger is attached
    BYTE                          Reserved2[1];
    PVOID                         Reserved3[2];
    PPEB_LDR_DATA                 Ldr;                    // Pointer to loader data (module list)
    PRTL_USER_PROCESS_PARAMETERS  ProcessParameters;      // Command line, env vars, etc.
    PVOID                         Reserved4[3];
    PVOID                         AtlThunkSListPtr;
    PVOID                         Reserved5;
    ULONG                         Reserved6;
    PVOID                         Reserved7;
    ULONG                         Reserved8;
    ULONG                         AtlThunkSListPtr32;
    PVOID                         Reserved9[45];
    BYTE                          Reserved10[96];
    PPS_POST_PROCESS_INIT_ROUTINE PostProcessInitRoutine;
    BYTE                          Reserved11[128];
    PVOID                         Reserved12[1];
    ULONG                         SessionId;
} PEB, *PPEB;
```

> [!NOTE]
> The official SDK definition hides most fields behind `Reserved` names. The full undocumented layout (with fields like `NtGlobalFlag`, `HeapFlags`, `OSMajorVersion`, `FlsBitmap`, etc.) is documented by projects like [Vergilius](https://www.vergiliusproject.com/) and in WinDbg via `dt nt!_PEB`.

**`BeingDebugged`** is the most well-known field from an anti-debug perspective. The Windows API `IsDebuggerPresent()` does nothing more than read this single byte from the PEB. Malware routinely checks this directly - and some read it from the TEB/PEB rather than calling `IsDebuggerPresent` to avoid easy hooking.

**`Ldr`** is the field malware developers care most about. It points to a `PEB_LDR_DATA` structure that contains three doubly-linked lists of all modules (EXEs and DLLs) loaded into the process. Walking this list is the foundation of the PEB walk technique used to resolve API addresses without touching the Import Directory.

### How to Access the PEB

To access the PEB you go through the **TEB** (Thread Environment Block). The TEB is a per-thread structure - every thread has its own TEB, and every TEB contains a pointer to the process-wide PEB.

The structure of the TEB (Thread Environment Block):

```cpp
typedef struct _TEB {
    PVOID Reserved1[12];
    PPEB  ProcessEnvironmentBlock; // Pointer to the PEB - offset 0x60 on x64
    PVOID Reserved2[399];
    BYTE  Reserved3[1952];
    PVOID TlsSlots[64];
    BYTE  Reserved4[8];
    PVOID Reserved5[26];
    PVOID ReservedForOle;
    PVOID Reserved6[4];
    PVOID TlsExpansionSlots;
} TEB, *PTEB;
```

{% image %}

Each thread has its own TEB. Like the PEB, the TEB contains a directory of information about the thread - exception handling chain, stack limits, TLS slots, and the pointer to the PEB.

The most important field in the TEB is `ProcessEnvironmentBlock` - a direct pointer to the process PEB shared by all threads. This is how you reach the PEB from any thread without an API call.

### How to Access the TEB

Reference: [Win32 Thread Information Block (Wikipedia)](https://en.wikipedia.org/wiki/Win32_Thread_Information_Block)

{% image2 %}

The TEB address is always available through the segment registers - no API call needed. Windows keeps the TEB base in a segment register that is always pointing to the current thread's TEB:

- **x64**: `GS` segment register base = TEB address
- **x86**: `FS` segment register base = TEB address

#### Via assembly (x86)

On x86 the TEB base is directly accessible at `FS:[0x18]` (self-referential pointer), and the PEB pointer is at `FS:[0x30]`:

```cpp
// Read the TEB base address itself
PVOID teb_address;
__asm {
    mov eax, fs:[0x18]   // FS:[0x18] = self pointer to TEB base
    mov teb_address, eax
}

// Or read the PEB pointer directly from the TEB
PVOID peb_address;
__asm {
    mov eax, fs:[0x30]   // FS:[0x30] = TEB->ProcessEnvironmentBlock (x86)
    mov peb_address, eax
}
```

#### Via assembly (x64, MASM)

MSVC does not support inline `__asm` on x64. You need a separate `.asm` file or use intrinsics. A MASM example:

```nasm
; GetTebAddress.asm
GetTebAddress PROC
    mov rax, gs:[018h]   ; GS:[0x18] = self pointer to TEB (x64)
    ret
GetTebAddress ENDP

GetPebAddress PROC
    mov rax, gs:[060h]   ; GS:[0x60] = TEB->ProcessEnvironmentBlock (x64)
    ret
GetPebAddress ENDP
```

#### Via compiler intrinsics (recommended for x64)

MSVC provides `__readgsqword` and `__readfsdword` to read from segment-relative offsets without inline asm:

```cpp
#include <windows.h>
#include <winternl.h>

// --- x64 ---

// Option 1 - NtCurrentTeb() macro (cleanest, compiles to the same intrinsic)
PTEB pTeb = NtCurrentTeb();
PPEB pPeb = pTeb->ProcessEnvironmentBlock;

// Option 2 - raw intrinsic, read TEB base
PTEB pTeb64 = (PTEB)__readgsqword(0x30);  // GS:[0x30] on x64 = TEB self pointer

// Option 3 - read PEB address directly, skipping the explicit TEB cast
PPEB pPeb_direct = (PPEB)__readgsqword(0x60); // GS:[0x60] = TEB->PEB on x64

// --- x86 ---

// Read TEB base
PTEB pTeb32 = (PTEB)__readfsdword(0x18);  // FS:[0x18] = self pointer to TEB
PPEB pPeb32 = pTeb32->ProcessEnvironmentBlock;

// Or read PEB directly
PPEB pPeb_direct32 = (PPEB)__readfsdword(0x30); // FS:[0x30] = TEB->PEB on x86
```

#### Key TEB offsets at a glance

| Field | x64 offset | x86 offset |
| ----- | ---------- | ---------- |
| ExceptionList (SEH chain head) | `GS:[0x00]` | `FS:[0x00]` |
| StackBase | `GS:[0x08]` | `FS:[0x04]` |
| StackLimit | `GS:[0x10]` | `FS:[0x08]` |
| Self (pointer to TEB) | `GS:[0x18]` | `FS:[0x18]` |
| ProcessEnvironmentBlock (PEB) | `GS:[0x60]` | `FS:[0x30]` |
| LastErrorValue | `GS:[0x68]` | `FS:[0x34]` |
| ThreadId | `GS:[0x48]` | `FS:[0x24]` |

> [!NOTE]
> `NtCurrentTeb()` is the cleanest C++ approach and works on both x86 and x64 without architecture conditionals. Under the hood it compiles to the same `GS:`/`FS:` segment read - just a macro around the intrinsic. Prefer it over raw offsets unless you are writing position-independent shellcode.

These intrinsics are how malware reads the PEB without any Windows API call, making it invisible to IAT-based API monitoring hooks.

### PEB Walking Technique

The PEB walk follows this chain:

***TEB -> PEB -> Ldr (PEB_LDR_DATA) -> InMemoryOrderModuleList -> currentProgram -> ntdll -> kernel32.BaseDll***

References:
- [PEB Walk and API Obfuscation - Offensive-Panda](https://github.com/Offensive-Panda/PEB_WALK_AND_API_OBFUSCATION_INJECTION)
- [Locating Modules via the PEB (x64) - MalwareTech](https://malwaretech.com/wiki/locating-modules-via-the-peb-x64)
- [PEB Walk - fareedfauzi](https://fareedfauzi.github.io/2024/07/13/PEB-Walk.html)
- [Shellcode and PEB Walking - dev.to](https://dev.to/windasunnie/shellcode-2h4j)

The full process for resolving `LoadLibraryA` and `GetProcAddress` via PEB walk:

1. Obtain the PEB address via GS/FS register intrinsics.
2. Navigate to the `PEB_LDR_DATA` structure using `PEB->Ldr`.
3. Iterate through the `InLoadOrderModuleList` to find the `LDR_DATA_TABLE_ENTRY` for `kernel32.dll`.
4. Extract the `DllBase` (base address) of `kernel32.dll`.
5. Manually parse `kernel32.dll`'s Export Directory to resolve the addresses of `LoadLibraryA` and `GetProcAddress`.

{% image3 %}

**Why not just call `GetProcAddress` directly?** Because `GetProcAddress` is itself an export of `kernel32.dll` - you need its address to use it. More importantly, EDRs routinely hook `GetProcAddress`, `LoadLibraryA`, and other high-value APIs by patching the first bytes of those functions. Walking the PEB and parsing the export table gives you the *raw* address before any hook, bypassing that layer of monitoring entirely.

From the PEB structure, the `Ldr` member points to a `PEB_LDR_DATA` structure:

```cpp
typedef struct _PEB_LDR_DATA {
    ULONG    Length;
    BOOLEAN  Initialized;
    HANDLE   SsHandle;
    LIST_ENTRY InLoadOrderModuleList;       // Ordered by load time
    LIST_ENTRY InMemoryOrderModuleList;     // Ordered by address in memory
    LIST_ENTRY InInitializationOrderModuleList; // Ordered by initialization
} PEB_LDR_DATA, *PPEB_LDR_DATA;
```

This structure contains three doubly-linked lists. Each node in the list is a `LIST_ENTRY` embedded inside an `LDR_DATA_TABLE_ENTRY`, which holds the actual module information.

{% image4 %}

Each module in the list is represented by an `LDR_DATA_TABLE_ENTRY`:

```cpp
typedef struct _LDR_DATA_TABLE_ENTRY {
    LIST_ENTRY InLoadOrderLinks;
    LIST_ENTRY InMemoryOrderLinks;
    LIST_ENTRY InInitializationOrderLinks;
    PVOID      DllBase;                 // Base address of the loaded DLL
    PVOID      EntryPoint;             // DllMain / module entry point
    ULONG      SizeOfImage;
    UNICODE_STRING FullDllName;        // Full path: C:\Windows\System32\kernel32.dll
    UNICODE_STRING BaseDllName;        // Just the name: kernel32.dll
    ULONG      Flags;
    USHORT     LoadCount;
    USHORT     TlsIndex;
    LIST_ENTRY HashLinks;
    PVOID      SectionPointer;
    ULONG      CheckSum;
    ULONG      TimeDateStamp;
    PVOID      LoadedImports;
    PVOID      EntryPointActivationContext;
    PVOID      PatchInformation;
} LDR_DATA_TABLE_ENTRY, *PLDR_DATA_TABLE_ENTRY;
```

{% image5 %}

The `BaseDllName` field is what you compare against `"kernel32.dll"` when iterating the list. Once you find the entry, `DllBase` gives you the in-memory base address of the DLL, from which you can parse its PE headers to find the Export Directory and resolve any function by name.

If you use WinDbg and type `!peb`, the `Ldr.InMemoryOrderModuleList` field shows the list of DLLs loaded for the current process:

```
0:007> !peb
PEB at 000000e8561f3000
    InheritedAddressSpace:    No
    ReadImageFileExecOptions: No
    BeingDebugged:            Yes
    ImageBaseAddress:         00007ff6fd930000
    NtGlobalFlag:             0
    NtGlobalFlag2:            0
    Ldr                       00007ffda341c4c0
    Ldr.Initialized:          Yes
    Ldr.InInitializationOrderModuleList: 00000231c3282dd0 . 00000231c32af100
    Ldr.InLoadOrderModuleList:           00000231c3282f40 . 00000231c32af470
    Ldr.InMemoryOrderModuleList:         00000231c3282f50 . 00000231c32af480
                    Base TimeStamp                     Module
            7ff6fd930000 61fc30c0 Feb 04 03:45:04 2022 C:\Windows\system32\notepad.exe
            7ffda32b0000 8a1bb6f3 Jun 05 07:08:35 2043 C:\Windows\SYSTEM32\ntdll.dll
            7ffda15b0000 9ec9da27 Jun 02 23:58:31 2054 C:\Windows\System32\KERNEL32.DLL
            7ffda0ef0000 f7a99bd4 Sep 02 15:03:48 2101 C:\Windows\System32\KERNELBASE.dll
            7ffda3240000 660e896d Apr 04 19:05:17 2024 C:\Program Files (x86)\Common Files\X.dll
            7ffda1dc0000 d8a41a47 Mar 05 20:21:27 2085 C:\Windows\System32\GDI32.dll
            7ffda1260000 c6e09c3a Sep 25 11:47:06 2075 C:\Windows\System32\win32u.dll
            7ffda0940000 4894be87 Aug 03 04:07:35 2008 C:\Windows\System32\gdi32full.dll
            7ffda0a60000 39255ccf May 19 23:25:03 2000 C:\Windows\System32\msvcp_win.dll
            7ffda0d10000 81cf5d89 Jan 05 22:32:41 2039 C:\Windows\System32\ucrtbase.dll
            7ffda1ab0000 95bf155e Aug 12 04:53:50 2049 C:\Windows\System32\USER32.dll
            7ffda1750000 c16ed6b5 Nov 02 06:56:53 2072 C:\Windows\System32\combase.dll
            7ffda2ed0000 582ed2ab Nov 18 18:06:35 2016 C:\Windows\System32\RPCRT4.dll
<--- snippet --->
```

The three entries that almost always appear first are `ntdll.dll`, `KERNEL32.DLL` and `KERNELBASE.dll` - they are loaded into every Windows process. The PEB walk targets `kernel32.dll` because it exports `LoadLibraryA` and `GetProcAddress`, the two functions that let you load any other DLL and resolve any other function dynamically.

In a malware context, the PEB walk for resolving API addresses works like this:

1. Obtain and access the PEB structure of the current process.
2. Navigate to the `PEB_LDR_DATA` structure using the `Ldr` member of the PEB.
3. Iterate through the `InLoadOrderModuleList` to find the `LDR_DATA_TABLE_ENTRY` for `kernel32.dll`.
4. Once the entry for `kernel32.dll` is found, extract its base address.
5. Manually parse the Export Directory of `kernel32.dll` to resolve the addresses of `LoadLibraryA` and `GetProcAddress`.
6. Load `user32.dll` using `LoadLibraryA`.
7. Get the address of `MessageBoxA` from `user32.dll` using `GetProcAddress`.
8. Call `MessageBoxA` to display a message box - confirming the walk succeeded.

Full implementation (x86 - uses inline `asm` to read `fs:[0x30]`):

```cpp
#include <stdio.h>
#include <windows.h>

typedef struct _UNICODE_STRING {
    USHORT Length;
    USHORT MaximumLength;
    PWSTR  Buffer;
} UNICODE_STRING, *PUNICODE_STRING;

typedef struct _LDR_DATA_TABLE_ENTRY {
    LIST_ENTRY InLoadOrderLinks;
    LIST_ENTRY InMemoryOrderLinks;
    LIST_ENTRY InInitializationOrderLinks;
    PVOID      DllBase;
    PVOID      EntryPoint;
    ULONG      SizeOfImage;
    UNICODE_STRING FullDllName;
    UNICODE_STRING BaseDllName;
    ULONG      Flags;
    USHORT     LoadCount;
    USHORT     TlsIndex;
    LIST_ENTRY HashLinks;
    PVOID      SectionPointer;
    ULONG      CheckSum;
    ULONG      TimeDateStamp;
    PVOID      LoadedImports;
    PVOID      EntryPointActivationContext;
    PVOID      PatchInformation;
} LDR_DATA_TABLE_ENTRY, *PLDR_DATA_TABLE_ENTRY;

typedef struct _PEB_LDR_DATA {
    ULONG     Length;
    BOOLEAN   Initialized;
    HANDLE    SsHandle;
    LIST_ENTRY InLoadOrderModuleList;
    LIST_ENTRY InMemoryOrderModuleList;
    LIST_ENTRY InInitializationOrderModuleList;
} PEB_LDR_DATA, *PPEB_LDR_DATA;

typedef struct _PEB {
    BOOLEAN InheritedAddressSpace;
    BOOLEAN ReadImageFileExecOptions;
    BOOLEAN BeingDebugged;
    BOOLEAN SpareBool;
    HANDLE  Mutant;
    PVOID   ImageBaseAddress;
    PPEB_LDR_DATA Ldr;
} PEB, *PPEB;

typedef FARPROC  (WINAPI *GETPROCADDRESS)(HMODULE, LPCSTR);
typedef HMODULE  (WINAPI *LOADLIBRARYA)(LPCSTR);
typedef int      (WINAPI *MESSAGEBOXA)(HWND, LPCSTR, LPCSTR, UINT);

// Manual export-table resolver - avoids calling GetProcAddress itself.
PVOID GetProcAddressKernel32(HMODULE hModule, LPCSTR lpProcName) {
    PIMAGE_DOS_HEADER pDOSHeader = (PIMAGE_DOS_HEADER)hModule;
    PIMAGE_NT_HEADERS pNTHeaders = (PIMAGE_NT_HEADERS)(
        (BYTE*)hModule + pDOSHeader->e_lfanew
    );
    PIMAGE_EXPORT_DIRECTORY pExportDir = (PIMAGE_EXPORT_DIRECTORY)(
        (BYTE*)hModule +
        pNTHeaders->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_EXPORT].VirtualAddress
    );

    DWORD *pFunctions   = (DWORD*)((BYTE*)hModule + pExportDir->AddressOfFunctions);
    DWORD *pNames       = (DWORD*)((BYTE*)hModule + pExportDir->AddressOfNames);
    WORD  *pOrdinals    = (WORD*) ((BYTE*)hModule + pExportDir->AddressOfNameOrdinals);

    for (DWORD i = 0; i < pExportDir->NumberOfNames; i++) {
        char *funcName = (char*)((BYTE*)hModule + pNames[i]);
        if (strcmp(funcName, lpProcName) == 0) {
            return (PVOID)((BYTE*)hModule + pFunctions[pOrdinals[i]]);
        }
    }
    return NULL;
}

int main() {
    PEB               *peb = NULL;
    PLDR_DATA_TABLE_ENTRY module;
    LIST_ENTRY        *listEntry;
    HMODULE            kernel32base  = NULL;
    GETPROCADDRESS     pGetProcAddr  = NULL;
    LOADLIBRARYA       pLoadLibA     = NULL;
    MESSAGEBOXA        pMessageBoxA  = NULL;

    // Read PEB address from FS:[0x30] (x86)
    __asm {
        mov eax, fs:[0x30]
        mov peb, eax
    }

    // Walk InLoadOrderModuleList to find kernel32.dll
    listEntry = peb->Ldr->InLoadOrderModuleList.Flink;
    do {
        module = CONTAINING_RECORD(listEntry, LDR_DATA_TABLE_ENTRY, InLoadOrderLinks);

        // Convert wide BaseDllName to narrow for comparison
        char name[256];
        int i;
        for (i = 0;
             i < module->BaseDllName.Length / sizeof(WCHAR) && i < 255;
             i++) {
            name[i] = (char)module->BaseDllName.Buffer[i];
        }
        name[i] = '\0';

        if (_stricmp(name, "kernel32.dll") == 0) {
            kernel32base = (HMODULE)module->DllBase;
        }

        listEntry = listEntry->Flink;
    } while (listEntry != &peb->Ldr->InLoadOrderModuleList);

    if (kernel32base) {
        // Resolve the two loader functions we need
        pGetProcAddr = (GETPROCADDRESS)GetProcAddressKernel32(kernel32base, "GetProcAddress");
        pLoadLibA    = (LOADLIBRARYA)  GetProcAddressKernel32(kernel32base, "LoadLibraryA");

        // Now use them to reach user32.dll and MessageBoxA
        HMODULE user32 = pLoadLibA("user32.dll");
        pMessageBoxA   = (MESSAGEBOXA)pGetProcAddr(user32, "MessageBoxA");
        pMessageBoxA(NULL, "PEB walk success", "Success", MB_OK);
    }
    return 0;
}
```

> [!EXPLOIT]
> This technique is the backbone of shellcode and position-independent code (PIC). Since shellcode cannot have an IAT, it must find API addresses at runtime. The PEB walk is the standard way to bootstrap: find `kernel32.dll`, parse its exports manually, get `LoadLibraryA` and `GetProcAddress`, then load whatever else is needed.

> [!NOTE]
> AV/EDR products are aware of PEB walking and flag the GS/FS intrinsic patterns. Evasion techniques like hashing function names (djb2, ror13) instead of comparing plain strings are the next layer - the export table walk stays the same but you compare hashes instead of strings, making static signature matching harder.
