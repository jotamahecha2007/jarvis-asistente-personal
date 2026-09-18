import fs from "fs";
import os from "os";
import path from "path";
import ffmpegPath from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import wavefilePkg from "wavefile";

const WaveFile = wavefilePkg.WaveFile || wavefilePkg;

ffmpeg.setFfmpegPath(ffmpegPath);

let transcriberPromise = null;

/**
 * Carga el modelo Whisper una sola vez (perezoso, se descarga solo la primera
 * vez que se usa, ~150MB). Corre 100% local vía WASM (transformers.js), no
 * necesita compiladores C++ ni GPU, funciona bien en Windows.
 */
function getTranscriber() {
  if (!transcriberPromise) {
    transcriberPromise = import("@huggingface/transformers").then(({ pipeline }) =>
      pipeline("automatic-speech-recognition", "Xenova/whisper-base", { dtype: "fp32" })
    );
  }
  return transcriberPromise;
}

/**
 * Convierte cualquier audio (m4a, caf, 3gp, webm...) a WAV mono 16kHz con ffmpeg,
 * que es el formato que espera Whisper.
 */
function convertToWav(inputPath) {
  return new Promise((resolve, reject) => {
    const outputPath = inputPath + ".wav";
    ffmpeg(inputPath)
      .audioChannels(1)
      .audioFrequency(16000)
      .format("wav")
      .on("end", () => resolve(outputPath))
      .on("error", reject)
      .save(outputPath);
  });
}

/**
 * Transcribe un buffer de audio (el archivo grabado en el celular) a texto en español.
 */
export async function transcribeAudioBuffer(buffer, { extension = "m4a" } = {}) {
  const tmpDir = os.tmpdir();
  const inputPath = path.join(tmpDir, `jarvis-rec-${Date.now()}.${extension}`);
  fs.writeFileSync(inputPath, buffer);

  let wavPath;
  try {
    wavPath = await convertToWav(inputPath);

    const wavBuffer = fs.readFileSync(wavPath);
    const wav = new WaveFile(wavBuffer);
    wav.toBitDepth("32f");
    wav.toSampleRate(16000);
    let audioData = wav.getSamples();
    if (Array.isArray(audioData)) {
      audioData = audioData[0]; // mono, nos quedamos con el primer canal
    }

    const transcriber = await getTranscriber();
    const output = await transcriber(audioData, { language: "spanish", task: "transcribe" });
    return Array.isArray(output) ? output.map((o) => o.text).join(" ") : output.text;
  } finally {
    fs.rm(inputPath, { force: true }, () => {});
    if (wavPath) fs.rm(wavPath, { force: true }, () => {});
  }
}