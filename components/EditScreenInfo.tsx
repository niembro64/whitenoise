import React, { useState } from 'react';
import { Button } from 'react-native';

import { ExternalLink } from './ExternalLink';
import { MonoText } from './StyledText';
import { Text, View } from './Themed';

import Colors from '@/constants/Colors';

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';

export default function EditScreenInfo({ path }: { path: string }) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  function generateSineWave(
    frequency: number,
    sampleRate: number,
    duration: number
  ): Int16Array {
    const samples = sampleRate * duration;
    const sampleArray = new Int16Array(samples);

    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      const sample = Math.sin(2 * Math.PI * frequency * t);
      sampleArray[i] = sample * 32767; // Scale to Int16 range
    }

    return sampleArray;
  }

  function createWAVFile(samples: Int16Array, sampleRate: number): ArrayBuffer {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    // RIFF chunk descriptor
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true); // File size minus 8 bytes
    writeString(view, 8, 'WAVE');

    // FMT sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, 1, true); // NumChannels (1 for mono)
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * 2, true); // ByteRate
    view.setUint16(32, 2, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample

    // Data sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true); // Subchunk2Size

    // Write PCM samples
    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
      view.setInt16(offset, samples[i], true);
    }

    return buffer;
  }

  function writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  async function saveWAVFile(
    buffer: ArrayBuffer,
    filename: string
  ): Promise<string> {
    const base64Data = Buffer.from(buffer).toString('base64');
    const fileUri = FileSystem.documentDirectory + filename;

    await FileSystem.writeAsStringAsync(fileUri, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return fileUri;
  }

  async function playSound() {
    const sampleRate = 44100;
    const duration = 5; // seconds
    const frequency = 440; // Hz

    // Generate PCM data and create WAV file buffer
    const samples = generateSineWave(frequency, sampleRate, duration);
    const wavBuffer = createWAVFile(samples, sampleRate);

    // Save WAV file to the file system
    const fileUri = await saveWAVFile(wavBuffer, 'sine440.wav');

    // Load and play the sound
    const { sound } = await Audio.Sound.createAsync({ uri: fileUri });
    setSound(sound);
    setIsPlaying(true);

    await sound.playAsync();
  }

  async function stopSound() {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
    }
  }

  const handlePlayStop = () => {
    if (isPlaying) {
      stopSound();
    } else {
      playSound();
    }
  };

  return (
    <View>
      <View style={{ marginTop: 20, alignItems: 'center' }}>
        <Button title={isPlaying ? 'Stop' : 'Play'} onPress={handlePlayStop} />
      </View>
    </View>
  );
}
