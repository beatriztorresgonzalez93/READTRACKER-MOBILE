/**
 * Injects pluginManagement.repositories into android/settings.gradle.
 * Includes Aliyun mirrors as fallbacks when Maven Central / Gradle Plugin Portal return 403.
 */
const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const REPOS_BLOCK = `  repositories {
    maven { url 'https://maven.aliyun.com/repository/public' }
    google()
    maven { url 'https://maven.aliyun.com/repository/google' }
    maven { url 'https://maven.aliyun.com/repository/gradle-plugin' }
    mavenCentral()
    gradlePluginPortal()
  }
`;

function withAndroidGradlePluginRepos(config) {
  return withDangerousMod(config, [
    "android",
    async (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const settingsPath = path.join(projectRoot, "android", "settings.gradle");
      if (!fs.existsSync(settingsPath)) return cfg;

      let contents = fs.readFileSync(settingsPath, "utf8");
      if (contents.includes("maven.aliyun.com/repository/public")) {
        return cfg;
      }

      // Fresh Expo template: no pluginManagement repos yet
      const bare = "pluginManagement {\n  def reactNativeGradlePlugin";
      if (contents.includes(bare)) {
        contents = contents.replace(bare, `pluginManagement {\n${REPOS_BLOCK}  def reactNativeGradlePlugin`);
        fs.writeFileSync(settingsPath, contents, "utf8");
        return cfg;
      }

      // Already has a simple block (older patch): replace it
      const simple = /  repositories \{\s*google\(\)\s*mavenCentral\(\)\s*gradlePluginPortal\(\)\s*\}/s;
      if (simple.test(contents)) {
        contents = contents.replace(simple, REPOS_BLOCK.trimEnd());
        fs.writeFileSync(settingsPath, contents, "utf8");
      }
      return cfg;
    },
  ]);
}

module.exports = withAndroidGradlePluginRepos;
