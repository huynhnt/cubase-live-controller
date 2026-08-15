# Changelog

Tất cả các thay đổi đáng chú ý của dự án sẽ được ghi lại trong file này.

## [v1.0.6] - 2026-08-15
### 🚀 Tính năng Mới & Cải tiến

#### 1. Nút điều khiển Đa năng (Universal App Toggle) & Tùy biến App
- **Nút YouTube/App:** Bổ sung thêm nút bấm (Logo YouTube) trên thanh tiêu đề để ẩn/hiện nhanh cửa sổ YouTube hoặc bất kỳ ứng dụng nào khác.
- **Tùy biến Ứng dụng:** Bạn có thể đổi đối tượng điều khiển (thay vì YouTube) sang Spotify, OBS, Chrome... thông qua mục Cấu hình Ứng dụng Bổ sung trong phần Cài đặt.
- **Kiến trúc Tối ưu:** Hợp nhất toàn bộ logic thu nhỏ, phóng to, Play/Pause Media vào một file thực thi duy nhất (`ToggleWindow.exe`) nhằm tối ưu hoá hệ thống và dễ dàng bảo trì.

#### 2. App Master Priority (Ưu tiên Đồng bộ từ App)
- **Vấn đề trước đây:** App và Cubase đôi khi bị lệch trạng thái khi khởi động hoặc vừa mở file Project.
- **Bản cập nhật này:** Ngay khi ứng dụng kết nối thành công với cổng MIDI Out của Cubase, App sẽ kích hoạt đồng bộ (Force Sync) để đẩy toàn bộ tham số hiện tại (Volume, Mute, Reverb, Delay, Autotune, v.v.) xuống Cubase. 
- **Kết quả:** Giao diện App hiển thị như thế nào, Cubase sẽ buộc phải kêu y như thế đó ngay từ giây đầu tiên kết nối.

#### 2. Tương tác 2 chiều (2-Way Sync) Mượt mà
- Bất kỳ thao tác kéo thanh trượt (fader) hay thay đổi thông số nào được thực hiện trực tiếp trên Cubase đều sẽ được phản hồi ngay lập tức lên App.
- Giao diện App sẽ tự động di chuyển tương ứng theo thông số thật của Cubase.

#### 3. Công nghệ chống giật thanh trượt (Anti-Jitter Lock)
- **Vấn đề:** Khi bạn kéo thả một thông số (VD: Beat Vol) trên App, tín hiệu MIDI gửi tới Cubase và dội ngược lại App gây ra hiện tượng giật (nhảy số) giữa người dùng và Cubase.
- **Bản cập nhật này:** Đã bổ sung logic phát hiện tương tác (Smart Interaction Lock). Khi người dùng chạm và giữ (`mousedown`, `touchstart`) bất kỳ thanh trượt nào trên App, toàn bộ tín hiệu ghi đè dội về từ Cubase sẽ bị khóa.
- **Kết quả:** Trải nghiệm kéo slider mượt mà tuyệt đối, không còn bị khựng. Ngay khi bạn nhả tay ra, kết nối 2 chiều lại tự động mở lại.

#### 4. Tự động lưu cấu hình thông minh (Auto-Save Debounce)
- Mọi biến động thông số diễn ra do bạn tinh chỉnh từ Cubase sẽ được App lưu trữ ngầm lập tức.
- Áp dụng cơ chế **Debounce (0.5s)**: Giúp phần mềm chỉ ghi file cấu hình 1 lần ngay cả khi bạn kéo thanh trượt liên tục hàng trăm thông số mỗi giây, tối ưu hóa CPU và chống giật lag toàn hệ thống.

#### 5. Hiển thị chuẩn Decibel (dB)
- Cải tiến giao diện thanh trượt: Thay vì hiển thị con số MIDI thô (0-127), App giờ đây hiển thị mức **Decibel (dB)** giống y hệt fader trên Cubase.
- Tích hợp công thức Logarit âm thanh: `0.0 dB` chuẩn (Unity Gain), hiển thị chính xác mức giảm âm lượng (ví dụ: `-6.0 dB`, `-20.0 dB`) và `-∞ dB`. Các chỉ số Plugins (Autotune, Flex) được đổi sang định dạng `0-100%`.

#### 6. Double-Click để Reset nhanh (Reset to Unity Gain)
- Bạn có thể **Nháy đúp chuột (Double-Click)** vào con số hiển thị kế bên bất kỳ thanh trượt nào để lập tức Reset thông số đó về mặc định (`0.0 dB` cho Volume / FX, hoặc `79%` cho Autotune).
- Kết hợp với 2-Way Sync, thao tác này tự động đẩy lệnh điều khiển Cubase về 0 dB ngay lập tức.

### 🛠️ Kỹ thuật
- Bổ sung cờ `interactingSliders` để xác định trạng thái chạm/kéo slider.
- Bổ sung hàm `syncAllStatesToCubase` vào `main.js`.
- Cập nhật event `connectMidi` gọi đồng bộ ép buộc.
- Cập nhật `handleIncomingMidiCC` tích hợp debounce 500ms cho `autoSaveCurrentStates()`.
- Cải thiện `setupEventListeners` để lắng nghe chuẩn xác `mousedown/mouseup/touchstart/touchend`.
