# Cubase Live Controller 🎛️

**Cubase Live Controller** là một ứng dụng Desktop dạng Overlay (luôn nổi trên màn hình) chuyên dụng để điều khiển nhanh các thông số của Cubase khi hát Karaoke hoặc Livestream trên YouTube. Giao diện được thiết kế theo phong cách tối giản, đen/neon sang trọng (Glassmorphism), có khả năng tùy biến độ trong suốt để không che mất màn hình trình duyệt.

---

## 🚀 Các Tính Năng Chính (Giai đoạn 1)

1. **Overlay Luôn Nổi (Always-on-top):** Luôn hiển thị trên cùng, đè lên trình duyệt Web Chrome/Edge khi đang phát YouTube.
2. **Tắt/Mở và Chỉnh Âm Lượng Nhạc (Beat):** Slider & Nút Toggle Mute Nhạc gửi tín hiệu MIDI CC tức thời.
3. **Tắt/Mở và Chỉnh Âm Lượng Mic:** Slider & Nút Toggle Mute Mic.
4. **Tắt/Mở Nhanh Hiệu Ứng (Vang/FX):** Giúp ngắt nhanh echo/delay chỉ bằng 1 click.
5. **Bảng Chỉnh Vang Xổ Xuống (FX Panel):** Nhấn nút "Chỉnh Vang" sẽ mở rộng giao diện điều khiển 5 thông số chi tiết: `Vang Dài`, `Vang Ngắn`, `Delay`, `Auto-Tune`, `Flex`.
6. **Chuyển Chế Độ Nhanh (Hát Live <=> Nói Chuyện/Voice):** 
   - Nhấn nút **HÁT LIVE** sẽ chuyển sang **VOICE ĐỐI THOẠI**.
   - Tự động tắt vang, giảm/tăng âm lượng Mic theo cấu hình cài đặt sẵn để trò chuyện ấm giọng và rõ ràng hơn. Click lại sẽ khôi phục chính xác các thông số cũ để tiếp tục hát.
7. **Đồng Bộ 2 Chiều (2-way Sync):** Khi bạn kéo âm lượng hoặc bật/tắt trong Cubase, thanh trượt trên phần mềm tự động di chuyển theo để đồng bộ trạng thái thực tế.
8. **Tự Động Mở Cubase Project (.cpr):** Cấu hình đường dẫn tệp dự án của bạn để phần mềm tự động kích hoạt Cubase tải project đó lên ngay khi mở tool.
9. **Cửa Sổ Tiện Ích Cài Đặt (Settings):** Cho phép đổi cổng MIDI In/Out, thay đổi kênh MIDI (MIDI Channel), tùy biến số CC (Control Change) cho từng tính năng, chỉnh độ trong suốt của cửa sổ (Opacity) và thiết lập Preset cho chế độ Voice.
10. **Bảng Chọn Tone Autotune Thủ Công:** Nhấn nút "Chọn Tone" để xổ hàng 12 phím Key (C đến B) và 2 phím giọng (Trưởng/Thứ) giúp ca sĩ chuyển tone Autotune tức thời ngay trên màn hình app.

---

## 🛠️ Hướng Dẫn Cài Đặt (Cho Lần Đầu Tiên)

### Bước 1: Khởi tạo các thư viện
Mở Command Prompt / Powershell tại thư mục dự án và chạy lệnh sau để cài đặt Electron và Vite:
```bash
npm install
```

### Bước 2: Tạo cổng MIDI ảo trên Windows (loopMIDI)
Ứng dụng giao tiếp với Cubase qua cổng MIDI ảo.
1. Tải và cài đặt phần mềm miễn phí [loopMIDI](https://www.tobias-erichsen.de/software/loopmidi.html).
2. Mở loopMIDI lên, nhấp vào nút **`+`** (Add port) ở góc dưới bên trái để tạo một cổng MIDI ảo mới.
3. Đặt tên cho cổng (ví dụ: `loopMIDI Port 1` hoặc `Cubase Remote`).
4. Hãy đảm bảo loopMIDI luôn chạy ngầm trong khay hệ thống khi bạn hát livestream.

### Bước 3: Thiết lập thiết bị điều khiển (Generic Remote) trong Cubase
Để Cubase hiểu được lệnh từ Controller:
1. Mở Cubase lên.
2. Vào Menu **Studio** -> **Studio Setup...**
3. Ở góc trên bên trái cửa sổ Studio Setup, nhấn nút **`+` (Add Device)** -> Chọn **Generic Remote**.
4. Chọn cấu hình cho thiết bị:
   - **MIDI Input:** Chọn cổng MIDI ảo bạn vừa tạo ở loopMIDI (ví dụ: `loopMIDI Port 1`).
   - **MIDI Output:** Chọn cổng MIDI ảo tương ứng (để Cubase gửi ngược tín hiệu về giúp đồng bộ 2 chiều).
5. Ở bảng cấu hình phía trên (Upper Table), map các thông số CC tương ứng:
   - **Beat Volume:** CC `20`
   - **Beat Mute:** CC `21`
   - **Mic Volume:** CC `22`
   - **Mic Mute:** CC `23`
   - **FX Mute (Reverb Mute):** CC `24`
   - **Vang Dài (Long Reverb):** CC `25`
   - **Vang Ngắn (Short Reverb):** CC `26`
   - **Delay:** CC `27`
   - **Auto-Tune (Retune Speed/Mix):** CC `28`
   - **Flex:** CC `29`
   - **Sing/Voice Mode Toggle:** CC `30`
   - **Autotune Key:** CC `31`
   - **Autotune Scale:** CC `32`
   - **Lấy Tone (Auto-Key):** CC `33`
   - **Gửi Tone (Auto-Key):** CC `34`
6. Ở bảng cấu hình phía dưới (Lower Table), chọn hành động tương ứng trong Mixer Cubase cho mỗi dòng (ví dụ: CC 20 điều khiển Fader Volume của track tên "Beat", CC 22 điều khiển Fader Volume của track tên "Mic"..., CC 31 điều khiển tham số Key và CC 32 điều khiển tham số Scale của plugin Auto-Tune cắm ở insert, CC 33 kích hoạt nút dò/reset và CC 34 kích hoạt nút Send to Auto-Tune của plugin Auto-Key cắm ở insert).
7. Nhấn **Apply** và **OK**.

---

## 💻 Hướng Dẫn Sử Dụng Hằng Ngày

### Cách 1: Chạy trực tiếp ở chế độ Build (Khuyên dùng)
Trước khi sử dụng lần đầu (hoặc sau khi sửa code), bạn chạy lệnh build để đóng gói giao diện:
```bash
npm run build
```
Sau đó, để khởi động ứng dụng điều khiển, bạn chỉ cần chạy lệnh:
```bash
npm run electron
```
*Lưu ý:* Khi chạy lệnh này, nếu bạn đã thiết lập đường dẫn Cubase Project trong phần Cài đặt và bật "Tự động mở file", phần mềm sẽ tự mở Cubase và load file project đó cho bạn.

### Cách 2: Chạy ở chế độ Phát Triển (Development Mode)
Dành cho lập trình viên muốn thử nghiệm và sửa đổi trực tiếp (hỗ trợ Hot-Reload và DevTools):
1. Terminal 1: Chạy Vite dev server
   ```bash
   npm run dev
   ```
2. Terminal 2: Chạy Electron ở chế độ dev
   ```bash
   npm run electron -- --dev
   ```

---

## ⚙️ Cấu Hình Mặc Định Của Tệp config.json
Mọi cài đặt sẽ được lưu trữ tự động vào tệp `config.json` nằm tại:
`C:\Users\<Tên_User>\AppData\Roaming\cubase-live-controller\config.json`.
Bạn có thể điều chỉnh trực tiếp trong giao diện cài đặt (nhấp vào icon **⚙️** trên header ứng dụng) mà không cần chỉnh sửa tệp thủ công.
