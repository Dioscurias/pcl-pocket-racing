import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeAudioPreferences,musicState,RACE_MUSIC_PROFILE,scheduleEnvelope} from '../src/audio.js';

test('audio preferences clamp volume and preserve mute state',()=>{
 assert.deepEqual(normalizeAudioPreferences({enabled:false,volume:4}),{enabled:false,volume:1});
 assert.deepEqual(normalizeAudioPreferences({enabled:'yes',volume:-2}),{enabled:true,volume:0});
});

test('music state separates menu, race and final-lap intensity',()=>{
 assert.deepEqual(musicState({mode:'menu'}),{track:'menu',intensity:0});
 assert.deepEqual(musicState({mode:'race',speed:12,finalLap:false}),{track:'race',intensity:0});
 assert.deepEqual(musicState({mode:'race',speed:34,finalLap:true}),{track:'race',intensity:1});
});

test('race score uses a 140 BPM half-time pattern with a denser final lap',()=>{
 assert.equal(RACE_MUSIC_PROFILE.bpm,140);
 assert.equal(RACE_MUSIC_PROFILE.steps,16);
 assert.deepEqual(RACE_MUSIC_PROFILE.snareSteps,[8]);
 assert.equal(RACE_MUSIC_PROFILE.finalLapHatStep,1);
 assert.ok(RACE_MUSIC_PROFILE.kickSteps.length>=3);
});

test('every synthesized sound fades in and out instead of clicking the speaker',()=>{
 const events=[],gain={cancelScheduledValues:t=>events.push(['cancel',t]),setValueAtTime:(v,t)=>events.push(['set',v,t]),exponentialRampToValueAtTime:(v,t)=>events.push(['ramp',v,t])};
 scheduleEnvelope(gain,10,.12,.2);
 assert.deepEqual(events,[['cancel',10],['set',.0001,10],['ramp',.12,10.006],['ramp',.0001,10.2]]);
});
