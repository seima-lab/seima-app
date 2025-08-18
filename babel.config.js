module.exports = {
  presets: [
    'babel-preset-expo',
    '@babel/preset-typescript'
  ],
  plugins: [
    'react-native-reanimated/plugin',
    ["module:react-native-dotenv", {
        "moduleName": "@env",
        "path": ".env",
        "blacklist": null,
        "whitelist": null,
        "safe": false,
        "allowUndefined": true
    }]
  ]
}; 