import React, { useState } from 'react';
import { StyleSheet, Button, View } from 'react-native';
import { Audio } from 'expo-av';

export default function SineWavePlayer() {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  async function playSound() {
    console.log('Loading Sound');
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/sine440.wav'),
      { shouldPlay: true, isLooping: true }
    );
    setSound(sound);
    setIsPlaying(true);

    console.log('Playing Sound');
    await sound.playAsync();
  }

  async function stopSound() {
    console.log('Stopping Sound');
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
    <View style={styles.container}>
      <Button title={isPlaying ? 'Stop' : 'Play'} onPress={handlePlayStop} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
    alignItems: 'center',
  },
});
