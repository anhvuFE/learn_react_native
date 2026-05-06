import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import React from "react";

interface BrandIconProps {
  name: string;
  size?: number;
  color?: string;
}

export const APP_BRAND_ICON: Record<
  string,
  { lib: "fa5" | "mci" | "ion"; name: string }
> = {
  tiktok: { lib: "fa5", name: "tiktok" },
  instagram: { lib: "fa5", name: "instagram" },
  youtube: { lib: "fa5", name: "youtube" },
  roblox: { lib: "mci", name: "gamepad-variant" },
  snap: { lib: "fa5", name: "snapchat-ghost" },
};

export const AppBrandIcon: React.FC<BrandIconProps> = ({
  name,
  size = 18,
  color,
}) => {
  const def = APP_BRAND_ICON[name];
  if (!def) {
    return <Ionicons name="apps" size={size} color={color} />;
  }
  if (def.lib === "fa5") {
    return <FontAwesome5 name={def.name as any} size={size} color={color} />;
  }
  if (def.lib === "mci") {
    return (
      <MaterialCommunityIcons
        name={def.name as any}
        size={size}
        color={color}
      />
    );
  }
  return <Ionicons name={def.name as any} size={size} color={color} />;
};

export { FontAwesome5, Ionicons, MaterialCommunityIcons };
