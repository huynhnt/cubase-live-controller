/**
 * Thư viện điều khiển Web MIDI API cho Cubase Live Controller
 */

class MidiEngine {
  constructor() {
    this.midiAccess = null;
    this.midiOutPort = null;
    this.midiInPort = null;
    this.channel = 0; // 0-indexed (Kênh 1 = 0)
    this.onCCCallback = null;
  }

  // Khởi tạo truy cập Web MIDI API
  async initialize() {
    if (!navigator.requestMIDIAccess) {
      throw new Error('Trình duyệt hoặc Electron không hỗ trợ Web MIDI API.');
    }
    this.midiAccess = await navigator.requestMIDIAccess({ sysex: true });
    this.midiAccess.onstatechange = (e) => {
      if (typeof window.onMidiStateChange === 'function') {
        window.onMidiStateChange(e);
      }
    };
    return this.midiAccess;
  }

  // Lấy danh sách các cổng MIDI Out khả dụng
  getOutputPorts() {
    if (!this.midiAccess) return [];
    const ports = [];
    this.midiAccess.outputs.forEach((port) => {
      ports.push({ id: port.id, name: port.name, state: port.state });
    });
    return ports;
  }

  // Lấy danh sách các cổng MIDI In khả dụng
  getInputPorts() {
    if (!this.midiAccess) return [];
    const ports = [];
    this.midiAccess.inputs.forEach((port) => {
      ports.push({ id: port.id, name: port.name, state: port.state });
    });
    return ports;
  }

  // Đặt kênh MIDI (1 - 16)
  setChannel(channelNumber) {
    this.channel = Math.max(0, Math.min(15, channelNumber - 1));
  }

  // Kết nối tới cổng MIDI Out bằng tên hoặc ID
  connectOutput(portIdOrName) {
    this.midiOutPort = null;
    if (!this.midiAccess || !portIdOrName) return false;

    for (const [id, port] of this.midiAccess.outputs) {
      if (port.id === portIdOrName || port.name === portIdOrName) {
        this.midiOutPort = port;
        return true;
      }
    }
    return false;
  }

  // Kết nối tới cổng MIDI In bằng tên hoặc ID để lắng nghe đồng bộ
  connectInput(portIdOrName, onCCReceived) {
    // Ngắt kết nối cổng cũ nếu có
    if (this.midiInPort) {
      this.midiInPort.onmidimessage = null;
      this.midiInPort = null;
    }

    if (!this.midiAccess || !portIdOrName) return false;
    this.onCCCallback = onCCReceived;

    for (const [id, port] of this.midiAccess.inputs) {
      if (port.id === portIdOrName || port.name === portIdOrName) {
        this.midiInPort = port;
        this.midiInPort.onmidimessage = this._handleMidiMessage.bind(this);
        return true;
      }
    }
    return false;
  }

  // Gửi tín hiệu Control Change (CC) sang Cubase
  sendCC(ccNumber, value) {
    if (!this.midiOutPort) {
      return false;
    }
    // Giới hạn giá trị trong khoảng 0 - 127
    const cc = Math.max(0, Math.min(127, ccNumber));
    const val = Math.max(0, Math.min(127, Math.round(value)));
    
    // Status byte cho Control Change: 0xB0 | channel
    const statusByte = 0xB0 | this.channel;
    
    try {
      this.midiOutPort.send([statusByte, cc, val]);
      return true;
    } catch (e) {
      console.error('Lỗi khi gửi dữ liệu MIDI:', e);
      return false;
    }
  }

  // Xử lý gói tin MIDI nhận được từ Cubase (để đồng bộ 2 chiều)
  _handleMidiMessage(event) {
    if (!this.onCCCallback || !event.data || event.data.length < 3) return;

    const status = event.data[0];
    const ccNumber = event.data[1];
    const value = event.data[2];

    // Kiểm tra xem có đúng là lệnh Control Change (0xB0 - 0xBF tương ứng cho 16 kênh)
    const isCC = (status & 0xF0) === 0xB0;
    const channelMatches = (status & 0x0F) === this.channel;

    if (isCC && channelMatches) {
      this.onCCCallback({
        cc: ccNumber,
        value: value
      });
    }
  }
}

export const midi = new MidiEngine();
