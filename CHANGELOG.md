# Changelog

Tất cả các thay đổi đáng chú ý của dự án sẽ được ghi lại trong file này.

## [v1.1.0] - 2026-08-17
### 🚀 Tính năng Mới & Cải tiến

#### 1. 📂 Export CC Map 1-Click Chuẩn Cubase (`Generic Remote XML Export`)
- **Xuất File XML Tự Động:** Hỗ trợ xuất 2 file cấu hình XML chuẩn (`Cubase_Live_Features.xml` cho các nút Tính năng & `Cubase_Live_Effects.xml` cho các Hiệu ứng).
- **Tự Động Chuẩn Hóa Tên Kênh:** Định dạng tên Control trong file XML thành dạng `CH X (Tên hiệu ứng)` (Ví dụ: `CH 1 (VANG DAI)`, `Tat CH 1 (VANG DAI)`), giúp người dùng import thẳng vào **Generic Remote** trong Cubase là nhận diện ngay 100%, không cần tự gán/nhập tay lại từng dòng.
- **Tự Động Khử Dấu Tiếng Việt:** Tự động loại bỏ dấu tiếng Việt khi xuất XML để tránh bị lỗi font chữ hoặc sai ký tự khi Cubase đọc file.

#### 2. 🎛️ Dàn Mixer 12+ Kênh Linh Hoạt (`Dynamic 12+ Console Grid`)
- **Giao diện chuẩn 12 Kênh gọn gàng:** Mặc định hiển thị vừa vặn 12 Kênh (`KÊNH 1` -> `KÊNH 12`), ôm vừa khít chiều ngang màn hình mà **không bị xuất hiện thanh cuộn ngang**.
- **Mở rộng không giới hạn:** Khi thêm hiệu ứng vượt quá 12 kênh (`KÊNH 13`, `KÊNH 14`...), bàn Mixer tự động mở rộng linh hoạt mà không bị giới hạn cứng số lượng.
- **Gán hiệu ứng đúng vị trí chọn (`Slot-based Assignment`):** Nhấp vào đúng ô rỗng `KÊNH X` nào thì hiệu ứng mới sẽ được đặt chuẩn xác vào vị trí kênh đó. Khi xóa một hiệu ứng, ô đó trở lại thành ô chờ `KÊNH X` rỗng mà không làm xô lệch các vị trí kênh khác.
- **Quy chuẩn tên Kênh ngắn gọn:** Tên mặc định gợi ý chuyển thành `CH 1`, `CH 2`... hiển thị vừa khít 100% trong khung nhãn Fader đứng, không bị xén chữ.

#### 3. 🔄 Đồng Bộ Trạng Thái Công Tắc ON/OFF Theo Preset
- **Preset 1-Click Toàn Diện:** Mỗi Preset không chỉ lưu mức Fader Volume mà còn **lưu đồng thời cả trạng thái BẬT/TẮT (ON/OFF)** của từng hiệu ứng.
- **Tự động gửi lệnh MIDI CC Toggle:** Chuyển Preset lập tức gửi tín hiệu MIDI CC Toggle (`127` / `0`) sang Cubase để bật/tắt các plugin VST tương ứng.
- **Khóa & Active Preset thông minh khi đổi Voice:**
  - Khi bấm sang **VOICE THOẠI**, nút Preset `Voice` sẽ tự động được highlight active. Trong lúc này, các nút chọn Preset khác sẽ được khóa lại để tránh bấm nhầm.
  - Khi bấm quay lại **HÁT LIVE**, hệ thống tự động trả về đúng Preset bạn đang hát trước đó và highlight lại nút bấm tương ứng.

#### 4. 🖱️ Phím Tắt & Quản Lý Preset Nâng Cao
- **`Ctrl + Click` Cập nhật nhanh Preset:** Giữ phím `Ctrl` + Click chuột trái vào bất kỳ nút Preset nào để ghi đè ngay lập tức các mức Fader & công tắc hiện tại vào Preset đó.
- **Bộ 4 Preset Mặc Định Hệ Thống:** Bổ sung sẵn 4 Preset chuẩn (`Mặc định`, `Nhạc Trẻ`, `Bolero`, `Voice`).
- **Phân quyền Ghi đè & Bảo vệ:** Cho phép người dùng tùy ý ghi đè/chỉnh sửa tất cả các Preset hệ thống, đồng thời khóa xóa để tránh thất lạc cấu hình gốc.

#### 5. 🔠 Chuẩn Hóa Mã CC Liền Kề & Bảng Cài Đặt CC
- **Tự động sinh mã CC liền kề:** Mã CC Bật/Tắt công tắc sẽ tự động lấy luôn số liền kề ngay sau mã CC thanh kéo (`ccValue + 1` - Ví dụ: kéo là `35` -> công tắc tự là `36`), vô cùng logic và liền mạch.
- **Đầy đủ trên bảng Cài đặt CC:** Bảng cài đặt CC luôn luôn hiển thị đầy đủ cả 2 dòng (CC kéo và CC công tắc Tắt/Bật) cho từng hiệu ứng, bất kể hiệu ứng đó đang bật hay tắt.

#### 6. 🛠️ Sửa Lỗi & Tối Ưu Hóa Giao Diện (UI/UX)
- **Xử lý triệt để lỗi giật/tụt giao diện khi Dò âm (`Smart Tone`):** Rút gọn thông báo lỗi âm lượng im lặng thành `Chưa rõ (Im lặng)` + Tooltip chi tiết, kết hợp khóa tràn viền CSS (`text-overflow: ellipsis`), loại bỏ hoàn toàn hiện tượng đẩy dàn nút bấm lặn xuống mép dưới cửa sổ.
- **Chống khóa file lưu cấu hình (`EBUSY Prevention`):** Áp dụng ghi file bất đồng bộ qua tập tin tạm `.tmp` giúp ứng dụng lưu cài đặt liên tục cực kỳ ổn định trên Windows mà không lo bị crash do kẹt tiến trình.

#### 7. ☁️ Hệ Sinh Thái Cloud & Lõi Phân Tích Thế Hệ Mới
- **Kiến trúc lõi phân tích hợp âm (Chord Analysis Core) hoàn toàn mới:** Nâng cấp toàn diện bộ engine phân tích cao độ và hợp âm (Smart Tone V2). Thuật toán thế hệ mới giúp bóc tách và nhận diện các lớp âm thanh phức tạp với độ chính xác tuyệt đối, giảm thiểu tối đa độ trễ trong quá trình xử lý thời gian thực.
- **Tích hợp Cloud & Đồng Thuận Phi Tập Trung (Decentralized Consensus):** Lần đầu tiên mang tư duy của Blockchain vào phần mềm thu âm! Hệ thống nay hoạt động như một mạng lưới phân tán, tự động thu thập và "đồng thuận xác thực" (Consensus) kết quả dò Tone từ hàng ngàn người dùng (Node) khác nhau. Bằng cách đối chiếu chéo (Cross-Validation), kết quả dò Tone/Key giờ đây loại bỏ hoàn toàn sai số cá nhân và đạt độ chính xác tuyệt đối.

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
