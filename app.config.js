// Permite inyectar EAS project ID desde .env para tokens push de Expo.
const appJson = require("./app.json");

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  ...appJson.expo,
  extra: {
    ...appJson.expo.extra,
    eas: {
      projectId:
        process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim() ||
        appJson.expo?.extra?.eas?.projectId ||
        "",
    },
  },
};
