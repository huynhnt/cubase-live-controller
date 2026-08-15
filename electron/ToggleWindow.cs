using System;
using System.Diagnostics;
using System.Runtime.InteropServices;

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

    const int SW_RESTORE = 9;
    const int SW_MINIMIZE = 6;
    const byte VK_MEDIA_PLAY_PAUSE = 0xB3;

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
                isMatch = p.ProcessName.IndexOf("Cubase", StringComparison.OrdinalIgnoreCase) >= 0;
            } else if (action == "youtube") {
                isMatch = p.MainWindowTitle.IndexOf("YouTube", StringComparison.OrdinalIgnoreCase) >= 0;
            }
            
            if (isMatch) {
                IntPtr hWnd = p.MainWindowHandle;
                if (hWnd != IntPtr.Zero) {
                    IntPtr fg = GetForegroundWindow();
                    if (hWnd == fg) {
                        ShowWindow(hWnd, SW_MINIMIZE);
                    } else {
                        if (IsIconic(hWnd)) {
                            ShowWindow(hWnd, SW_RESTORE);
                        }
                        SetForegroundWindow(hWnd);
                    }
                    return; // Done toggling
                }
            }
        }
    }
}
