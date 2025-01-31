import { Asset } from "./core/AssetManager";

export const assets = [
  {
    type: "PositionalAudio",
    name: "playerShot",
    url: "assets/audio/playerShot.ogg",
    distance: 20,
  },
  {
    type: "PositionalAudio",
    name: "playerHit",
    url: "assets/audio/playerHit.ogg",
    distance: 20,
  },
  {
    type: "PositionalAudio",
    name: "playerExplode",
    url: "assets/audio/playerExplode.ogg",
    distance: 20,
  },
  {
    type: "PositionalAudio",
    name: "enemyShot",
    url: "assets/audio/enemyShot.ogg",
    distance: 20,
  },
  {
    type: "PositionalAudio",
    name: "enemyHit",
    url: "assets/audio/enemyHit.ogg",
    distance: 20,
  },
  {
    type: "PositionalAudio",
    name: "coreExplode",
    url: "assets/audio/coreExplode.ogg",
    distance: 20,
  },
  {
    type: "PositionalAudio",
    name: "coreShieldHit",
    url: "assets/audio/coreShieldHit.ogg",
    distance: 20,
  },
  {
    type: "PositionalAudio",
    name: "coreShieldDestroyed",
    url: "assets/audio/coreShieldDestroyed.ogg",
    distance: 20,
  },
  {
    type: "PositionalAudio",
    name: "enemyExplode",
    url: "assets/audio/enemyExplode.ogg",
    distance: 20,
  },
  {
    type: "PositionalAudio",
    name: "buttonClick",
    url: "assets/audio/buttonClick.ogg",
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
