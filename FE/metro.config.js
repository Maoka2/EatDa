// metro.config.js
const { getDefaultConfig } = require("@expo/metro-config");

const config = getDefaultConfig(__dirname);

// SVG transformer 설정
config.transformer.babelTransformerPath = require.resolve(
  "react-native-svg-transformer"
);
// assetExts에서 svg 제거
config.resolver.assetExts = config.resolver.assetExts.filter(
  (ext) => ext !== "svg"
);
// sourceExts에 svg 추가
config.resolver.sourceExts.push("svg");

// JSON 파일을 asset으로 인식하도록 추가
config.resolver.assetExts.push("json");

module.exports = config;
