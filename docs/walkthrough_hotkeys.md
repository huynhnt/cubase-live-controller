# Hướng dẫn Kiểm tra & Xác nhận Tính năng Phím tắt tự định nghĩa

Chúng tôi đã hoàn thành tích hợp và phát triển tính năng Phím tắt tự định nghĩa (Global Hotkeys) cho bộ điều khiển Cubase Live Controller trên nhánh `feat-global-hotkeys`. 

Dưới đây là tóm tắt các chỉnh sửa đã thực hiện và hướng dẫn kiểm tra.

---

## 1. Các tệp đã thay đổi

- **[main.js](file:///d:/Working/AI/cubase%20tools/electron/main.js)**: Tích hợp mô-đun `globalShortcut` của Electron, định nghĩa bộ phím tắt 2 phím mặc định (thêm `setSingMode: 'Alt+F7'` và `setVoiceMode: 'Alt+F8'`), viết hàm đăng ký phím tắt khi mở/lưu cấu hình và xử lý phím tắt toggleWindow (Ẩn/Hiện/Đưa lên On-Top).
- **[preload.js](file:///d:/Working/AI/cubase%20tools/electron/preload.js)** & **[preload.cjs](file:///d:/Working/AI/cubase%20tools/electron/preload.cjs)**: Expose API `onShortcutPressed` để Renderer nhận sự kiện nhấn phím từ Main Process.
- **[index.html](file:///d:/Working/AI/cubase%20tools/index.html)**: 
  - Thêm Tab "Phím tắt" mới cùng giao diện nhập và xóa phím tắt ✕.
  - Tách phím tắt đổi chế độ thành 2 mục phím tắt riêng biệt: Bật HÁT LIVE và Bật VOICE.
  - Bổ sung trường nhập thay đổi phần trăm âm lượng Nhạc (`preset-beat-change`) và Mic (`preset-mic-change`) trong phần Preset Chế độ Voice.
- **[style.css](file:///d:/Working/AI/cubase%20tools/src/style.css)**: Định nghĩa các class CSS đẹp mắt cho giao diện phím tắt, hỗ trợ hiệu ứng nhấp nháy `.recording` và hỗ trợ đầy đủ cho Giao diện sáng (Light Theme).
- **[dom.js](file:///d:/Working/AI/cubase%20tools/src/dom.js)**: Mapped DOM của các ô nhập phím tắt mới cùng các trường cài đặt thay đổi âm lượng theo phần trăm.
- **[state.js](file:///d:/Working/AI/cubase%20tools/src/state.js)**: Đồng bộ cấu hình mặc định vào trạng thái ứng dụng (thêm `setSingMode: 'Alt+F7'`, `setVoiceMode: 'Alt+F8'`, `beatChange: -20`), cập nhật `savedSingingValues` và bổ sung cơ chế giả lập phím tắt khi chạy trên môi trường Web.
- **[settings.js](file:///d:/Working/AI/cubase%20tools/src/settings.js)**: Xử lý hiển thị các phím tắt và tham số phần trăm lên form khi mở phần Cài đặt và lưu chúng vào tệp `config.json` khi nhấn "Lưu cài đặt".
- **[main.js (src)](file:///d:/Working/AI/cubase%20tools/src/main.js)**: 
  - Thêm logic capture bàn phím thông qua sự kiện `keydown`, hỗ trợ tự động nhận dạng phím chính cùng modifiers (`Ctrl`, `Alt`, `Shift`) để chuyển thành định dạng Accelerator chuẩn của Electron.
  - Lắng nghe tín hiệu `shortcut-pressed` từ Electron để thực thi các chức năng tương ứng, bao gồm gán phím tắt `setSingMode` để bật chế độ hát live, và phím tắt `setVoiceMode` để bật chế độ voice đối thoại.
  - Định nghĩa hàm `setMode(targetMode)` để xử lý chuyển đổi tường minh giữa 2 chế độ: Lưu lại âm lượng Nhạc & Mic hiện tại trước khi chuyển sang chế độ Voice. Tính toán tăng/giảm âm lượng tự động theo phần trăm cấu hình (trên thang 127) và khôi phục về giá trị trước đó khi quay trở lại chế độ Hát. Ngăn chặn lưu đè âm lượng nếu người dùng nhấn lại cùng một phím tắt chế độ nhiều lần.

---

## 2. Kết quả kiểm thử & Xây dựng (Build)

- Giao diện và các cấu trúc thẻ div lồng nhau đã được sắp xếp chính xác và cân đối.
- Quá trình biên dịch đóng gói frontend bằng **Vite** hoạt động ổn định.

---

## 3. Hướng dẫn Kiểm tra thủ công (Manual Verification)

Bạn có thể chạy thử ứng dụng để trải nghiệm các chức năng sau:

1. **Kiểm tra các phím tắt mặc định**:
   - Nhấn `Alt+F7`: Bật chế độ **Hát Live** (chỉ có tác dụng khi đang ở chế độ khác).
   - Nhấn `Alt+F8`: Bật chế độ **Voice Đối thoại** (chỉ có tác dụng khi đang ở chế độ khác).
   - Nhấn `Alt+F9`: Tắt / mở Nhạc (Beat).
   - Nhấn `Alt+F10`: Tắt / mở Microphone.
   - Nhấn `Alt+F11`: Tắt / mở Vang (Reverb/FX).
   - Nhấn `Alt+F12`:
     - Nếu ứng dụng đang hiển thị -> Nhấn sẽ tự động Thu nhỏ (Minimize) xuống taskbar.
     - Nếu ứng dụng đang bị thu nhỏ hoặc bị đè bởi Cubase, Chrome... -> Nhấn sẽ bật ứng dụng lên trên cùng (Always On Top) và lấy tiêu điểm (Focus) ngay lập tức.
     
2. **Kiểm tra thay đổi âm lượng theo phần trăm (%) khi đổi sang chế độ Voice**:
   - Vào Cài đặt ⚙️ -> Tab **Chung & Chế độ**.
   - Tại phần **Preset Chế độ Voice (Nói chuyện)**, thay đổi các thông số:
     - *Thay đổi Vol Nhạc (%)*: Mặc định là `-20` (giảm 20% âm lượng nhạc khi nói chuyện). Bạn có thể chỉnh lại thành giá trị khác, ví dụ `-30` (giảm sâu hơn).
     - *Thay đổi Vol Mic (%)*: Mặc định là `10` (tăng 10% âm lượng mic để nói rõ hơn).
   - Lưu cài đặt lại.
   - Nhấn `Alt+F8` để đổi sang chế độ **Voice Đối thoại**. Kiểm tra xem thanh trượt Vol Nhạc có giảm đi đúng lượng phần trăm thiết lập và thanh Vol Mic tăng lên đúng phần trăm thiết lập hay không.
   - Nhấn `Alt+F7` để quay về **Hát Live**. Kiểm tra xem cả hai thanh âm lượng có được trả về vị trí ban đầu (vị trí hiện tại trước khi nhấn phím tắt) hay không.
   - Nhấn liên tục phím `Alt+F8` (khi đang ở chế độ Voice) và kiểm tra xem Vol Nhạc/Mic không bị giảm/tăng liên tục vô tội vạ nhờ cơ chế bảo vệ trạng thái của hàm `setMode`.

3. **Kiểm tra gán phím tắt tùy chỉnh trong Cài đặt**:
   - Nhấn nút bánh răng ⚙️ (Cài đặt) -> Chọn tab **Phím tắt**.
   - Nhấp chuột trái vào ô nhập của mục *5. Phím tắt Bật HÁT LIVE* hoặc *6. Phím tắt Bật VOICE*. Lúc này ô nhập sẽ chuyển sang màu đỏ nhấp nháy.
   - Nhấn tổ hợp phím mong muốn (Ví dụ: `Ctrl+Shift+L` hoặc `F7`), ô nhập sẽ hiển thị đúng tên tổ hợp phím đó và tự động thoát focus.
   - Lưu cài đặt, kiểm tra phím tắt mới gán có hoạt động chính xác và được ghi nhớ sau khi khởi động lại ứng dụng hay không.
