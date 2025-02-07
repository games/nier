import { Asset } from "./core/AssetManager";

export const assets = [
  {
    type: "PositionalAudio",
    name: "playerShot",
    url: "assets/audio/playerShot.ogg.mp3",
    distance: 20,
  },
  {
    type: "PositionalAudio",
    name: "playerHit",
    url: "assets/audio/playerHit.ogg.mp3",
    distance: 20,
  },
  {
    type: "PositionalAudio",
    name: "playerExplode",
    url: "assets/audio/playerExplode.ogg.mp3",
    distance: 20,
  },
  {
    type: "PositionalAudio",
    name: "enemyShot",
    url: "assets/audio/enemyShot.ogg.mp3",
    distance: 20,
  },
  {
    type: "PositionalAudio",
    name: "enemyHit",
    url: "assets/audio/enemyHit.ogg.mp3",
    distance: 20,
  },
  {
    type: "PositionalAudio",
    name: "coreExplode",
    url: "assets/audio/coreExplode.ogg.mp3",
    distance: 20,
  },
  {
    type: "PositionalAudio",
    name: "coreShieldHit",
    url: "assets/audio/coreShieldHit.ogg.mp3",
    distance: 20,
  },
  {
    type: "PositionalAudio",
    name: "coreShieldDestroyed",
    url: "assets/audio/coreShieldDestroyed.ogg.mp3",
    distance: 20,
  },
  {
    type: "PositionalAudio",
    name: "enemyExplode",
    url: "assets/audio/enemyExplode.ogg.mp3",
    distance: 20,
  },
  {
    type: "PositionalAudio",
    name: "buttonClick",
    url: "assets/audio/buttonClick.ogg.mp3",
    distance: 20,
  },
  {
    type: "GLB",
    name: "jet",
    url: "assets/models/jet.gltf",
  },
  {
    type: "GLB",
    name: "obstacle",
    url: "assets/models/obstacle.gltf",
  },
  {
    type: "Texture",
    name: "texture1",
    url: "assets/models/Gemini_Generated_Image_834nb9834nb9834n.jpg",
  },
] as readonly Asset[];
