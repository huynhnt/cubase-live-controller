using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;

class Program {
    [DllImport("user32.dll")]
    static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    static extern bool IsIconic(IntPtr hWnd);

    [DllImport("user32.dll")]
    static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll")]
    static extern int GetWindowLong(IntPtr hWnd, int nIndex);

    [DllImport("user32.dll")]
    static extern IntPtr GetWindow(IntPtr hWnd, uint uCmd);

    [DllImport("user32.dll")]
    static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll")]
    static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("kernel32.dll")]
    static extern uint GetCurrentThreadId();

    [DllImport("user32.dll")]
    static extern bool AttachThreadInput(uint idAttach, uint idAttachTo, bool fAttach);

    [DllImport("user32.dll")]
    static extern bool BringWindowToTop(IntPtr hWnd);

    const int SW_RESTORE = 9;
    const int SW_MINIMIZE = 6;
    const byte VK_MEDIA_PLAY_PAUSE = 0xB3;
    const int GWL_EXSTYLE = -20;
    const int WS_EX_TOPMOST = 0x0008;
    const uint GW_HWNDNEXT = 2;

    static void ForceForegroundWindow(IntPtr hWnd) {
        IntPtr fg = GetForegroundWindow();
        if (fg == hWnd) return;

        uint dummy;
        uint fgThread = GetWindowThreadProcessId(fg, out dummy);
        uint currentThread = GetCurrentThreadId();

        if (fgThread != currentThread && fgThread != 0) {
            AttachThreadInput(currentThread, fgThread, true);
            SetForegroundWindow(hWnd);
            BringWindowToTop(hWnd);
            AttachThreadInput(currentThread, fgThread, false);
        } else {
            SetForegroundWindow(hWnd);
            BringWindowToTop(hWnd);
        }
    }

    static bool IsTopmost(IntPtr hWnd) {
        return (GetWindowLong(hWnd, GWL_EXSTYLE) & WS_EX_TOPMOST) != 0;
    }

    static string GetTitle(IntPtr hWnd) {
        StringBuilder sb = new StringBuilder(256);
        GetWindowText(hWnd, sb, sb.Capacity);
        return sb.ToString();
    }

    [DllImport("user32.dll")]
    static extern IntPtr GetTopWindow(IntPtr hWnd);

    static bool WasTargetProcessActive(int targetPid) {
        IntPtr current = GetTopWindow(IntPtr.Zero);
        IntPtr fg = GetForegroundWindow();
        
        uint fgPid;
        GetWindowThreadProcessId(fg, out fgPid);
        uint ourPid = (uint)Process.GetCurrentProcess().Id;

        while (current != IntPtr.Zero) {
            if (IsWindowVisible(current)) {
                string title = GetTitle(current);
                if (!string.IsNullOrWhiteSpace(title) && title != "Program Manager") {
                    uint pid;
                    GetWindowThreadProcessId(current, out pid);
                    
                    if (pid != fgPid && pid != ourPid) {
                        if (!IsTopmost(current)) {
                            return pid == (uint)targetPid;
                        }
                    }
                }
            }
            current = GetWindow(current, GW_HWNDNEXT);
        }
        return false;
    }

    static void Main(string[] args) {
        if (args.Length == 0) return;
        
        string action = args[0].ToLower();

        if (action == "playpause") {
            keybd_event(VK_MEDIA_PLAY_PAUSE, 0, 0, 0);
            keybd_event(VK_MEDIA_PLAY_PAUSE, 0, 2, 0);
            return;
        }
        
        Process[] processes = Process.GetProcesses();
        foreach (Process p in processes) {
            bool isMatch = false;
            
            if (action == "cubase") {
                isMatch = p.ProcessName.IndexOf("Cubase", StringComparison.OrdinalIgnoreCase) >= 0 && !string.IsNullOrWhiteSpace(p.MainWindowTitle);
            } else {
                isMatch = (p.ProcessName.IndexOf(args[0], StringComparison.OrdinalIgnoreCase) >= 0 ||
                          p.MainWindowTitle.IndexOf(args[0], StringComparison.OrdinalIgnoreCase) >= 0) &&
                          !string.IsNullOrWhiteSpace(p.MainWindowTitle);
            }
            
            if (isMatch) {
                IntPtr hWnd = p.MainWindowHandle;
                if (hWnd != IntPtr.Zero) {
                    if (IsIconic(hWnd)) {
                        ShowWindow(hWnd, SW_RESTORE);
                        ForceForegroundWindow(hWnd);
                    } else if (WasTargetProcessActive(p.Id)) {
                        ShowWindow(hWnd, SW_MINIMIZE);
                    } else {
                        ForceForegroundWindow(hWnd);
                    }
                    return;
                }
            }
        }
    }
}
