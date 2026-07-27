---
title: Direct Syscalls
date: 2026-07-27
image: cover.svg
tags: [Windows Internals, Malware Development]
excerpt: Direct syscalls bypass user-mode API hooks by invoking Windows system calls directly from user space. This technique retrieves syscall numbers (SSNs) from ntdll.dll, assembles raw syscall stubs, and calls them directly, defeating EDR hooks that monitor hooked NT functions.
---

# Direct Syscalls

# Introduction

Direct System Calls (syscalls) represent a fundamental technique in Windows exploitation and defensive evasion. At its core, this approach involves invoking kernel-mode services directly from user-mode applications by bypassing the standard Windows API layers, including ntdll.dll's exported functions. This methodology has become increasingly prevalent in both security research and offensive security tooling due to its ability to circumvent user-mode API hooks implemented by security solutions.

Windows implements a layered architecture where user-mode applications typically interact with the kernel through a series of transitions: progressing from high-level Win32 APIs (kernel32.dll), through the Native API layer (ntdll.dll), and finally transitioning to kernel-mode via the system service dispatcher. The `syscall` instruction serves as the gateway between user-mode and kernel-mode, executing a context switch that allows privileged operations to be performed on behalf of the calling process.

Understanding the syscall mechanism is crucial for security professionals and malware analysts alike. While legitimate applications rely on the standard API chain, malicious actors and security researchers leverage direct syscalls to bypass monitoring mechanisms that operate at higher layers of the Windows API stack.

## How a Syscall Stub looks like

A standard syscall stub in Windows follows a consistent pattern across all Native API functions. The stub resides in ntdll.dll and serves as the transition point from user-mode to kernel-mode. Here's the typical implementation for any NT function:

```cpp
mov r10, rcx        ; Move first argument from RCX to R10 (syscall convention)
mov eax, 18h        ; Load System Service Number (SSN) into EAX
syscall             ; Execute the system call instruction
ret                 ; Return to caller
```

The stub architecture is deliberately simple and uniform across all system calls. The `mov r10, rcx` instruction is necessary because the `syscall` instruction expects arguments in r10, rdx, r8, r9 (with additional parameters passed on the stack), while the Windows x64 calling convention uses rcx, rdx, r8, r9. This subtle difference is critical for proper parameter passing and must be preserved when implementing custom syscall stubs.

The SSN (System Service Number) loaded into EAX serves as the identifier that the kernel uses to locate the appropriate handler function within the System Service Dispatch Table (SSDT). Each Windows version and build may have different SSNs assigned to the same functions, which is why dynamic retrieval techniques like Hell's Gate are often necessary for robust implementations.

## Inspecting the Syscall Stub

We can analyze syscall stubs in real-time using debugging tools like x64dbg. By navigating to the Symbols view and selecting `NTDLL` → `NtAllocateVirtualMemory`, we can observe the stub implementation directly:

{% image %}

As demonstrated in the debugger view, the System Service Number (SSN) for NtAllocateVirtualMemory is 0x18 (24 in decimal). The SSN acts as an index into the System Service Dispatch Table (SSDT), which the kernel uses to locate the appropriate handler function for the requested system service.

It's worth noting that while the stub structure remains consistent, the actual SSN values vary across Windows versions and updates. This variability is a key challenge when implementing cross-platform syscall invocations and explains why security researchers maintain comprehensive syscall tables for different Windows builds.

## User-Mode API Hooking

User-mode API hooking is a defensive technique employed by Endpoint Detection and Response (EDR) solutions, antivirus products, and security monitoring tools to intercept and monitor suspicious API calls. The mechanism works by patching the function prologue of targeted functions in ntdll.dll, replacing the initial bytes with a jump instruction (0xE9) that redirects execution to the security product's monitoring DLL. Once the hook logs or blocks the call, execution may return to the original function or proceed to the kernel, depending on the security solution's policy.

When inspecting hooked functions in a debugger like x64dbg, the 0xE9 opcode indicates a relative jump instruction at the function entry:

{% image2 %}

This example shows `NtWriteVirtualMemory`, one of the most commonly hooked functions across EDR platforms. Following the jump instruction to its destination reveals the EDR's monitoring code:

{% image3 %}

Following the call chain further reveals the EDR's internal hook DLL, `bdhkm64.dll`, which handles the actual monitoring logic:

{% image4 %}

System Informer and other module inspection tools reveal all loaded DLLs, including EDR hooking modules. Using System Informer to enumerate the process modules shows the BitDefender hooking DLL among the loaded modules:

{% image5 %}

The DLL's properties and metadata confirm its origin and purpose:

{% image6 %}

# NT APIs

The Native API (NT API) functions form the foundation of Windows system calls. These functions are officially undocumented by Microsoft and provide direct access to kernel services without going through the Win32 API layer. NT functions typically follow the naming convention `Nt<FunctionName>` and are exported by ntdll.dll. Since these functions are undocumented, security researchers maintain comprehensive documentation repositories. The ntdoc project at [https://ntdoc.m417z.com/](https://ntdoc.m417z.com/) provides function signatures, parameters, and return types for NT API functions across various Windows versions

{% image7 %}

As an example, `NtTerminateProcess` takes two parameters: a handle to the target process and an NTSTATUS exit code. The function signature defines the calling convention and parameter types that must be preserved when invoking the syscall directly.

## Function Prototypes Automation

Manually declaring NT function prototypes is error-prone and laborious. Tools like Syswhispers2 ([https://github.com/jthuraisamy/Syswhispers2](https://github.com/jthuraisamy/Syswhispers2)) automate the generation of syscall stubs and function declarations. These tools produce header files with the necessary function prototypes and assembly stubs, ready to be compiled and linked into an implant:

{% image8 %}

The generated `syscalls.h` file contains the function prototype declarations necessary for compilation:

{% image9 %}

# Building the Direct Syscalls Invocation

The implementation process begins by creating a new Visual Studio C++ project and adding the generated `syscalls.h` header file to the project's source files:

{% image10 %}

Next, the System Service Number (SSN) for the target function must be determined. This can be retrieved through multiple methods: manually inspecting ntdll in a debugger like x64dbg, or consulting a pre-compiled system call table such as the one maintained at [https://j00ru.vexillium.org/syscalls/nt/64/](https://j00ru.vexillium.org/syscalls/nt/64/). This resource provides SSN mappings across different Windows versions:

{% image11 %}

To determine the target Windows version, opening a Command Prompt reveals the build number at the top of the window:

{% image12 %}

In this case, the build number is 19045. When using a syscall table, if the exact build does not appear, the nearest build number may be used as a reference, though some SSNs may differ. Once the version is identified, the target NT function can be located in the table:

{% image13 %}

The table shows that across the versions listed, `NtTerminateProcess` consistently has the SSN 0x2c. With the SSN identified, the assembly stub can be created.

## Creating the Syscall Stubs

With the function prototypes and SSN values obtained, the final step is creating the assembly stub file that will invoke the syscall. The `syscalls.asm` file contains inline assembly definitions for each target function:

```cpp
; syscalls.asm
; Assemble with: ml64 /c syscalls.asm

.code

NtTerminateProcess PROC
    mov r10, rcx
    mov eax, 2Ch
    syscall
    ret
NtTerminateProcess ENDP

END
```

{% image14 %}

The assembly file is compiled using `ml64 /c syscalls.asm`, which produces an object file (`.obj`) that can be linked with the C++ code.

With the assembly stubs compiled, the main C++ source file includes the generated header file and invokes the syscall wrapper functions directly:

```cpp
#include <windows.h>
#include "syscalls_prototypes.h"

int main() {
    // Exit with code 0x1337 using direct syscall
    NtTerminateProcess(GetCurrentProcess(), 0x1337);

    // This line will never execute
    return 0;
}
```

{% image15 %}

The compilation process begins by assembling the ASM file using the Visual Studio Developer Command Prompt, which can be accessed via Tools → Command Line:

{% image16 %}

By default, the developer command prompt may be configured for x86 compilation. To target x64 architecture, the compilation environment must be configured. This is accomplished by running the appropriate batch file:

```cpp
C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat
```

{% image18 %}

Once the x64 environment is configured, the assembly file can be compiled:

{% image19 %}

Upon successful compilation, the directory contains the generated object file:

```cpp
C:\Workspace\Malware\direct_syscalls>dir
 Volume in drive C has no label.
 Volume Serial Number is 0050-7481

 Directory of C:\Workspace\Malware\direct_syscalls

07/27/2026  02:11 AM    <DIR>          .
07/27/2026  02:11 AM    <DIR>          ..
07/26/2026  10:17 AM    <DIR>          direct_syscalls
07/27/2026  02:07 AM               232 direct_syscalls.cpp
07/26/2026  10:19 AM             1,098 direct_syscalls.obj
07/26/2026  10:09 AM             1,456 direct_syscalls.sln
07/26/2026  10:17 AM             6,490 direct_syscalls.vcxproj
07/26/2026  10:17 AM             1,104 direct_syscalls.vcxproj.filters
07/26/2026  10:09 AM               168 direct_syscalls.vcxproj.user
07/27/2026  01:59 AM               179 syscalls.asm
07/27/2026  02:12 AM               465 syscalls.obj // <- HERE
07/27/2026  01:51 AM             1,645 syscalls_prototypes.h
07/26/2026  10:17 AM    <DIR>          x64
              10 File(s)        120,869 bytes
               4 Dir(s)  145,863,168,000 bytes free
```

## Compile and Link

The final compilation step links the C++ source with the assembled syscall stubs using the command `cl /nologo direct_syscalls.cpp syscalls.obj`:

{% image20 %}

This generates the executable `direct_syscalls.exe`. When executed, the program invokes `NtTerminateProcess` directly via syscall, terminating the process immediately. To verify successful execution, the exit code can be checked using `echo %errorlevel%`, since the process was created with an explicit exit code:

{% image22 %}

The hexadecimal exit code `0x1337` converts to decimal `4919`:

{% image23 %}

While this implementation demonstrates the fundamental mechanics of direct syscalls, production implants require runtime SSN discovery to remain effective across Windows versions and updates. **Hell’s Gate** is an evasion technique developed by VX-Underground that addresses this limitation by scanning ntdll.dll at runtime to dynamically extract syscall numbers. The technique locates the syscall stub patterns in memory, identifies the SSNs, and caches them for use, eliminating the need for hardcoded SSNs while maintaining full evasion of user-mode hooks. 

# References

- [https://youtu.be/-M2_mZg_2Ew?si=m3g8CZzz2hWH0W_F](https://youtu.be/-M2_mZg_2Ew?si=m3g8CZzz2hWH0W_F)
- [https://redops.at/en/blog/direct-syscalls-vs-indirect-syscalls](https://redops.at/en/blog/direct-syscalls-vs-indirect-syscalls)
- [https://redops.at/en/blog/indirect-syscalls-and-hooked-ssns](https://redops.at/en/blog/indirect-syscalls-and-hooked-ssns)
- [https://redops.at/en/blog/exploring-hells-gate](https://redops.at/en/blog/exploring-hells-gate)
- [https://github.com/VirtualAlllocEx/Direct-Syscalls-vs-Indirect-Syscalls/tree/main](https://github.com/VirtualAlllocEx/Direct-Syscalls-vs-Indirect-Syscalls/tree/main)
- [https://github.com/am0nsec/HellsGate/tree/master](https://github.com/am0nsec/HellsGate/tree/master) ( Original C Implementation )