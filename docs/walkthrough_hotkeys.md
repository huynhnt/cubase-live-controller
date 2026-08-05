# Hướng dẫn Kiểm tra & Xác nhận Tính năng Phím tắt tự định nghĩa

Chúng tôi đã hoàn thành tích hợp và phát triển tính năng Phím tắt tự định nghĩa (Global Hotkeys) cho bộ điều khiển Cubase Live Controller trên nhánh `feat-global-hotkeys`. 

Dưới đây là tóm tắt các chỉnh sửa đã thực hiện và hướng dẫn kiểm tra.

---

## 1. Các tệp đã thay đổi

- **[main.js](file:///d:/Working/AI/cubase%20tools/electron/main.js)**: Tích hợp mô-đun `globalShortcut` của Electron, định nghĩa bộ phím tắt 2 phím mặc định, viết hàm đăng ký phím tắt khi mở/lưu cấu hình và xử lý phím tắt toggleWindow (Ẩn/Hiện/Đưa lên On-Top).
- **[preload.js](file:///d:/Working/AI/cubase%20tools/electron/preload.js)** & **[preload.cjs](file:///d:/Working/AI/cubase%20tools/electron/preload.cjs)**: Expose API `onShortcutPressed` để Renderer nhận sự kiện nhấn phím từ Main Process.
- **[index.html](file:///d:/Working/AI/cubase%20tools/index.html)**: Thêm Tab "Phím tắt" mới cùng giao diện nhập và xóa phím tắt ✕.
- **[style.css](file:///d:/Working/AI/cubase%20tools/src/style.css)**: Định nghĩa các class CSS đẹp mắt cho giao diện phím tắt, hỗ trợ hiệu ứng nhấp nháy `.recording` và hỗ trợ đầy đủ cho Giao diện sáng (Light Theme).
- **[dom.js](file:///d:/Working/AI/cubase%20tools/src/dom.js)**: Mapped DOM của các ô nhập phím tắt mới.
- **[state.js](file:///d:/Working/AI/cubase%20tools/src/state.js)**: Đồng bộ cấu hình mặc định vào trạng thái ứng dụng và bổ sung cơ chế giả lập phím tắt khi chạy trên môi trường Web không qua Electron.
- **[settings.js](file:///d:/Working/AI/cubase%20tools/src/settings.js)**: Xử lý hiển thị phím tắt lên form khi mở phần Cài đặt và lưu chúng vào tệp `config.json` khi nhấn "Lưu cài đặt".
- **[main.js (src)](file:///d:/Working/AI/cubase%20tools/src/main.js)**: 
  - Thêm logic capture bàn phím thông qua sự kiện `keydown`, hỗ trợ tự động nhận dạng phím chính cùng modifiers (`Ctrl`, `Alt`, `Shift`) để chuyển thành định dạng Accelerator chuẩn của Electron.
  - Lắng nghe tín hiệu `shortcut-pressed` từ Electron để thực thi bật/tắt Nhạc, Mic, hoặc Vang tương ứng.

---

## 2. Kết quả kiểm thử & Xây dựng (Build)

- Quá trình biên dịch và đóng gói frontend bằng **Vite** đã thành công không gặp bất cứ lỗi cú pháp hay cảnh báo nào (`npm run build`).

---

## 3. Hướng dẫn Kiểm tra thủ công (Manual Verification)

Bạn có thể chạy thử ứng dụng để trải nghiệm các chức năng sau:

1. **Kiểm tra các phím tắt mặc định**:
   - Nhấn `Alt+F9`: Tắt / mở Nhạc (Beat).
   - Nhấn `Alt+F10`: Tắt / mở Microphone.
   - Nhấn `Alt+F11`: Tắt / mở Vang (Reverb/FX).
   - Nhấn `Alt+F12`:
     - Nếu ứng dụng đang hiển thị -> Nhấn sẽ tự động Thu nhỏ (Minimize) xuống taskbar.
     - Nếu ứng dụng đang bị thu nhỏ hoặc bị đè bởi Cubase, Chrome... -> Nhấn sẽ bật ứng dụng lên trên cùng (Always On Top) và lấy tiêu điểm (Focus) ngay lập tức.
     
2. **Kiểm tra chỉnh sửa phím tắt trong Cài đặt**:
   - Nhấn nút bánh răng ⚙️ (Cài đặt) -> Chọn tab **Phím tắt**.
   - Nhấp chuột trái vào một ô nhập (ví dụ ô *Tắt/mở Mic*). Lúc này ô nhập sẽ chuyển sang màu đỏ và nhấp nháy để thông báo đang ghi nhận phím nhấn.
   - Nhấn tổ hợp phím mong muốn (Ví dụ: `Ctrl+Shift+K` hoặc `F10`), ô nhập sẽ hiển thị đúng tên tổ hợp phím đó và tự động thoát focus.
   - Thử nhấn nút `✕` bên cạnh để xóa phím tắt, ô nhập sẽ chuyển về `Chưa gán`.
   - Nhấn **Lưu cài đặt** để áp dụng. Thử nhấn phím tắt mới xem ứng dụng có thay đổi trạng thái theo ý bạn không.
   
3. **Kiểm tra lưu trữ cấu hình**:
   - Tắt ứng dụng và mở lại, vào cài đặt để xác nhận các phím tắt tự chọn của bạn vẫn được lưu giữ nguyên vẹn.
