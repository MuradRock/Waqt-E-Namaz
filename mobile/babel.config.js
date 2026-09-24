module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo (SDK 50+) already includes:
    //   - expo-router transform
    //   - react-native-reanimated plugin (must be last, still auto-applied)
    presets: ['babel-preset-expo'],
  };
};
