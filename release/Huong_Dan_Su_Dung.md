# 🎛️ CUBASE LIVE CONTROLLER - HƯỚNG DẪN SỬ DỤNG
### 🎁 Phiên bản cộng đồng chia sẻ bởi Hyun Kun (Hyun Cool)
---

**Cubase Live Controller** là ứng dụng điều khiển, tối ưu hóa dành cho các bạn hát livestream, thu âm online trên phần mềm Cubase. Ứng dụng hỗ trợ kết nối và điều khiển hai chiều thời gian thực thông qua tín hiệu MIDI, giúp bạn thao tác nhanh chóng trên giao diện trực quan mà không cần đụng chuột vào Cubase.

---

## 🌟 CÁC TÍNH NĂNG NỔI BẬT

### 1. Điều khiển 2 Chiều Thời Gian Thực
* **Âm lượng (Volume):** Thanh trượt chỉnh Vol Nhạc và Vol Mic mượt mà.
* **Tắt/Mở (Mute):** Các nút bật/tắt nhanh **Tắt Nhạc**, **Tắt Mic**, **Tắt Vang** độc lập. Trạng thái nút bấm tự động đồng bộ 2 chiều (nếu bạn click trên Cubase, nút trên App tự đổi màu theo và ngược lại).

### 2. Chế độ Hát Live & Voice Đối thoại (Thông minh & Độc lập)
* **Hát Live:** Chế độ hát với hiệu ứng vang và autotune đầy đủ. Các thông số được nạp tự động theo cấu hình mặc định hoặc các mẫu preset (Bolero, Pop, Remix...).
* **Voice Đối thoại:** Khi bật, hệ thống sẽ tự động tắt hiệu ứng vang/delay để giọng nói đối thoại khô và rõ ràng. Tuy nhiên, app vẫn giữ lại một lượng **Vang mặc định siêu nhỏ** để giọng nói tự nhiên, không bị quá khô khốc.
* **Tắt Vang độc lập:** Nút **Tắt Vang** hoạt động độc lập 100% và không bị ảnh hưởng hay thay đổi trạng thái khi bạn chuyển đổi qua lại giữa Hát Live và Voice Đối thoại.

### 3. Bộ tùy chỉnh Vang (FX Panel) chi tiết
* Mở rộng bằng nút **Chỉnh Vang ▾** (Cửa sổ mở rộng `310px`).
* Cung cấp 5 thanh trượt chi tiết: **Vang Dài, Vang Ngắn, Delay, Autotune, Flex**.
* Tích hợp hệ thống Preset nhanh: **Mẫu hệ thống** (Mặc định, Bolero, Remix, Lofi) và **Mẫu cá nhân** (Cho phép tự lưu cấu hình hiện tại và đặt tên riêng).

### 4. Bảng Chọn Tone Autotune ngang (Key Selector) độc lập
* Mở rộng bằng nút **Chọn Tone ▾** (Cửa sổ co giãn độc lập về chiều cao tối giản **`165px`**).
* Gồm 12 phím nốt nhạc tròn (`C` đến `B`) và 2 phím giọng (`Trưởng/Major` - `Thứ/Minor`) giúp thay đổi tông bài hát nhanh chóng trên Auto-Tune.
* Tự động lưu trữ tone hát gần nhất và tự động nạp lại khi khởi động ứng dụng.

### 5. Đồng bộ hóa Tự động từ Auto-Key sang Auto-Tune
Tích hợp bộ điều khiển MIDI kết nối trực tiếp với VST **Antares Auto-Key** trên track nhạc nền:
* **Nút [Lấy Tone]:** Khi bấm, nút nhấp nháy cam **"Đang dò..."** để kích hoạt Auto-Key dò tông bài hát tự động.
* **Đồng bộ về App:** Khi Auto-Key nhận diện xong, thông số nốt và giọng sẽ tự động truyền về App qua MIDI CC để hiển thị (Ví dụ: `Auto-Key: C# Minor` sáng màu xanh lá), đồng thời nút **[Gửi Tone]** nhấp nháy báo sẵn sàng.
* **Nút [Gửi Tone]:** Khi bấm, App sẽ phát lệnh gửi tone đã dò được sang tất cả các plugin **Auto-Tune** ở track mic, đồng thời tự động đồng bộ (active sáng đỏ) các nút nốt nhạc thủ công tương ứng trên giao diện App.

### 6. Giao diện Premium & Đa nhiệm
* Hỗ trợ **Chế độ Sáng / Tối (Light/Dark Theme)** linh hoạt.
* Hỗ trợ chỉnh độ mờ đục (Opacity) của nền ứng dụng để làm dạng cửa sổ bán trong suốt đè lên trên Cubase cực kỳ thời thượng.
* Thanh chữ chạy (Marquee) dưới chân trang hiển thị thông tin tác giả Hyun Kun đóng góp phi thương mại vì cộng đồng.

---

## 🛠️ HƯỚNG DẪN CÀI ĐẶT & KẾT NỐI CUBASE

Để ứng dụng có thể truyền và nhận tín hiệu với Cubase, bạn cần cấu hình cổng MIDI ảo theo các bước sau:

### Bước 1: Cài đặt cổng MIDI ảo loopMIDI
1. Tải và cài đặt phần mềm miễn phí [loopMIDI](https://www.tobias-erichsen.de/software/loopmidi.html).
2. Mở loopMIDI lên, nhấn nút **`+`** để tạo một cổng MIDI ảo mới đặt tên là: `loopMIDI Port` (hoặc tên bất kỳ bạn thích).

### Bước 2: Thiết lập Generic Remote trong Cubase
1. Mở phần mềm Cubase, chọn **Studio** -> **Studio Setup** (hoặc Devices Setup).
2. Nhấn nút **`+`** ở góc trên bên trái, chọn **Generic Remote**.
3. Cấu hình cổng MIDI kết nối:
   * **MIDI Input:** Chọn `loopMIDI Port` (để nhận lệnh điều khiển từ App).
   * **MIDI Output:** Chọn `loopMIDI Port` (để gửi tín hiệu đồng bộ ngược lại App).
4. Nhấn nút **Import** ở góc phải, tìm và chọn file cấu hình mẫu đi kèm dự án: [**`Cubase_Live_Controller_Generic_Remote.xml`**](../Cubase_Live_Controller_Generic_Remote.xml).
5. Nhấn **Apply** -> **OK** để hoàn tất.

### Bước 3: Ánh xạ track nhạc và các plugin trong Cubase
Để cấu hình nạp từ XML chạy chính xác, bạn hãy đặt tên các track trên Cubase của mình như sau:
* Đổi tên track chứa Nhạc Beat (Nhạc nền) thành: **`Beat`**
* Đổi tên track chứa Mic (Giọng hát) thành: **`Mic`**
* Đối với Auto-Tune: Hãy cắm plugin **Auto-Tune** (bản Pro hỗ trợ MIDI) ở ô **Insert 1** của track **`Mic`**.
* Đối với Auto-Key: Hãy cắm plugin **Auto-Key** ở ô **Insert 1** của track **`Beat`**.

---

## ⚙️ DANH SÁCH BẢNG ÁNH XẠ MIDI CC MẶC ĐỊNH

Dưới đây là các cổng MIDI CC (Control Change) mặc định được thiết lập sẵn trong ứng dụng. Bạn có thể thay đổi số cổng này bất kỳ lúc nào trong phần **Cài đặt ⚙️** (tab Ánh xạ CC):

| Tên chức năng | Cổng CC | Giá trị gửi đi / Nhận về |
| :--- | :---: | :--- |
| **Âm lượng Nhạc (Beat Volume)** | `20` | `0` (Mute) - `127` (Max) |
| **Bật/Tắt Nhạc (Beat Mute)** | `21` | `>=64` (Tắt) / `<64` (Mở) |
| **Âm lượng Mic (Mic Volume)** | `22` | `0` - `127` |
| **Bật/Tắt Mic (Mic Mute)** | `23` | `>=64` (Tắt) / `<64` (Mở) |
| **Bật/Tắt Vang (FX Mute)** | `24` | `>=64` (Tắt) / `<64` (Mở) |
| **Vang Dài (Reverb Long)** | `25` | `0` - `127` |
| **Vang Ngắn (Reverb Short)** | `26` | `0` - `127` |
| **Delay** | `27` | `0` - `127` |
| **Auto-tune** | `28` | `0` - `127` |
| **Flex** | `29` | `0` - `127` |
| **Chế độ Hát/Voice (Mode Sing/Voice)** | `30` | `127` (Hát Live) / `0` (Voice Đối thoại) |
| **Tông nhạc Autotune (Key)** | `31` | Phân bổ đều `0` - `127` cho 12 nốt nhạc |
| **Điệu Autotune (Scale)** | `32` | `0` (Trưởng - Major) / `127` (Thứ - Minor) |
| **Kích hoạt Dò Tone (Auto-Key Get)** | `33` | `127` (Lệnh kích hoạt dò) |
| **Kích hoạt Gửi Tone (Auto-Key Send)** | `34` | `127` (Lệnh gửi tone sang Auto-Tune) |
| **Nhận Key dò được (Auto-Key Key In)** | `35` | Tín hiệu nhận về từ Auto-Key (`0` - `127`) |
| **Nhận Scale dò được (Auto-Key Scale In)**| `36` | Tín hiệu nhận về từ Auto-Key (`0` - `127`) |

---
*Chúc các bạn có những buổi hát livestream và thu âm thật tuyệt vời cùng **Cubase Live Controller - Phiên bản cộng đồng**!*
*Mọi góp ý hoặc phản hồi vui lòng gửi tới tác giả **Hyun Kun** qua số điện thoại/Zalo **0793360016**.*
