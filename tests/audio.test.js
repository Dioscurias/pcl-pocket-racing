import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeAudioPreferences,musicState} from '../src/audio.js';

test('audio preferences clamp volume and preserve mute state',()=>{
 assert.deepEqual(normalizeAudioPreferences({enabled:false,volume:4}),{enabled:false,volume:1});
 assert.deepEqual(normalizeAudioPreferences({enabled:'yes',volume:-2}),{enabled:true,volume:0});
});

test('music state separates menu, race and final-lap intensity',()=>{
 assert.deepEqual(musicState({mode:'menu'}),{track:'menu',intensity:0});
 assert.deepEqual(musicState({mode:'race',speed:12,finalLap:false}),{track:'race',intensity:0});
 assert.deepEqual(musicState({mode:'race',speed:34,finalLap:true}),{track:'race',intensity:1});
});
