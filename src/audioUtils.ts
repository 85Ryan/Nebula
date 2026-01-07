// Utility to convert Base64 to Uint8Array
export const base64ToUint8Array = (base64: string): Uint8Array => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Utility to write WAV header
export const createWavFile = (samples: Float32Array, sampleRate: number): Blob => {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // RIFF chunk length
  view.setUint32(4, 36 + samples.length * 2, true);
  // WAVE identifier
  writeString(view, 8, 'WAVE');
  // fmt chunk identifier
  writeString(view, 12, 'fmt ');
  // fmt chunk length
  view.setUint32(16, 16, true);
  // Sample format (1 is PCM)
  view.setUint16(20, 1, true);
  // Channel count
  view.setUint16(22, 1, true); // Mono
  // Sample rate
  view.setUint32(24, sampleRate, true);
  // Byte rate (SampleRate * BlockAlign)
  view.setUint32(28, sampleRate * 2, true);
  // Block align (ChannelCount * BytesPerSample)
  view.setUint16(32, 2, true);
  // Bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, samples.length * 2, true);

  // Write the PCM samples
  floatTo16BitPCM(view, 44, samples);

  return new Blob([view], { type: 'audio/wav' });
};

const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

const floatTo16BitPCM = (output: DataView, offset: number, input: Float32Array) => {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
};
