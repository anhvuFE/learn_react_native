const { withEntitlementsPlist, withInfoPlist } = require("@expo/config-plugins");

const APP_GROUP = "group.com.screenmindr.shield";

const withFamilyControls = (config) => {
  config = withEntitlementsPlist(config, (cfg) => {
    cfg.modResults["com.apple.developer.family-controls"] = true;
    const existingGroups =
      cfg.modResults["com.apple.security.application-groups"] || [];
    if (!existingGroups.includes(APP_GROUP)) {
      cfg.modResults["com.apple.security.application-groups"] = [
        ...existingGroups,
        APP_GROUP,
      ];
    }
    return cfg;
  });

  // Force iOS deployment target to 16+ since FamilyControls requires it
  config = withInfoPlist(config, (cfg) => {
    return cfg;
  });

  return config;
};

module.exports = withFamilyControls;
