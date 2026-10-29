import { Camera, ChatsCircle, Eye, HandPalm, Heart, LockKey, UsersThree } from "@phosphor-icons/react";
import type { Unit } from "@ward/lessons";

const ICONS = { eye: Eye, hand: HandPalm, camera: Camera, chat: ChatsCircle, users: UsersThree, lock: LockKey, heart: Heart };

export function UnitIcon({ icon, size = 22, weight = "bold" }: { icon: Unit["icon"]; size?: number; weight?: "bold" | "fill" | "regular" }) {
  const I = ICONS[icon];
  return <I size={size} weight={weight} />;
}
