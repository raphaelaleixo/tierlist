import { Box } from "@mui/material";
import type { PlayerColor, Tier } from "../game/types";
import { openMojiBlackUrl } from "../utils/openMoji";
import { blobBorderRadius, pastel, pastelOnDark } from "../utils/blob";
import { PLAYER_COLOR_HEX } from "../theme/theme";

// Single played-card visual. Used in:
//   - Big-screen current trick area
//   - Big-screen played-card history
//   - Phone hand display
//   - End-of-game reveal walkthrough

const CARD_FONT =
  '"Bricolage Grotesque", -apple-system, "Helvetica Neue", "Segoe UI", system-ui, sans-serif';

const TIER_COLORS: Record<Tier, string> = {
  S: "#ef3a3a",
  A: "#ff8c1c",
  B: "#ffce1c",
  C: "#3aaf4d",
  D: "#3a7aef",
  F: "#9a3aef",
};

type Variant = "light" | "dark";

const VARIANT_TOKENS: Record<Variant, {
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  emojiFilter: string;
}> = {
  light: {
    cardBg: "#fff",
    textPrimary: "#000",
    textSecondary: "#666",
    emojiFilter: "none",
  },
  dark: {
    cardBg: "#15151f",
    textPrimary: "#fff",
    textSecondary: "rgba(255,255,255,0.55)",
    emojiFilter: "invert(1)",
  },
};

export interface TierCardProps {
  /** Emoji representing the category (chosen by the assigner). */
  emoji: string;
  /** Category name ("Animals", "90s movies", ...). */
  category: string;
  /** Display name of the player who *wrote* this tier list — for an eventual text label. */
  writerName: string;
  /** Colour of the player who HOLDS / plays this card — drives the card body + blob tint. */
  holderColor: PlayerColor;
  /** The item written by the tier-list author. */
  item: string;
  /** The tier this item was assigned to. Hidden when `revealed` is false. */
  tier: Tier;
  /** When false, the tier letter shows as "?" and the emoji is desaturated. */
  revealed: boolean;
  /** Card width in pixels. Defaults to 300; pass smaller for hand/history. */
  width?: number;
  /** When true, ignore `width` and let the card fill its parent's height (5/7 aspect ratio). */
  heightBound?: boolean;
  /** Visual variant. Default "light". */
  variant?: Variant;
}

export default function TierCard({
  emoji,
  category,
  writerName,
  holderColor,
  item,
  tier,
  revealed,
  width = 300,
  heightBound = false,
  variant = "light",
}: TierCardProps) {
  const accent = revealed ? TIER_COLORS[tier] : "#9a9a9a";
  const tokens = VARIANT_TOKENS[variant];
  const holderHex = PLAYER_COLOR_HEX[holderColor];
  // Both the card body and the blob tint in the holder's colour, at different
  // opacities so the blob still reads as a distinct shape inside the card.
  const cardBg = variant === "dark" ? pastelOnDark(holderHex, 0.18) : pastel(holderHex, 0.1);
  const blobBg = variant === "dark" ? pastelOnDark(holderHex, 0.45) : pastel(holderHex, 0.3);
  void writerName; // reserved for a future writer-attribution label

  return (
    <Box
      sx={{
        ...(heightBound ? { height: "100%", aspectRatio: "5/7" } : { width }),
        fontFamily: CARD_FONT,
        containerType: "inline-size",
      }}
    >
      <Box
        sx={{
          bgcolor: cardBg,
          borderRadius: "7.5cqi",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "none",
          aspectRatio: "5/7",
          p: "10cqi",
          pb: "0",
        }}
      >
        <Box
          sx={{
            flex: 1,
            borderRadius: "3.75cqi",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            backgroundColor: cardBg,
          }}
        >
          {/* Category top label */}
          <Box
            sx={{
              fontSize: "4cqi",
              fontWeight: 600,
              letterSpacing: 2,
              color: tokens.textPrimary,
              bgcolor: cardBg,
              textTransform: "uppercase",
            }}
          >
            {category}
          </Box>
          {/* Emoji block — OpenMoji black SVG over a deterministic blob */}
          <Box
            sx={{
              position: "relative",
              width: "60cqi",
              aspectRatio: "1",
              my: "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Box
              aria-hidden
              sx={{
                position: "absolute",
                inset: 0,
                bgcolor: blobBg,
                borderRadius: blobBorderRadius(emoji),
                zIndex: 0,
              }}
            />
            <Box
              component="img"
              src={openMojiBlackUrl(emoji)}
              alt={emoji}
              sx={{
                position: "relative",
                zIndex: 1,
                width: "40cqi",
                aspectRatio: "1",
                userSelect: "none",
                display: "block",
                filter: tokens.emojiFilter,
              }}
            />
          </Box>

          {/* Item — focal hero text */}
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mb: "10cqi",
            }}
          >
            <Box
              sx={{
                fontSize: "12cqi",
                fontWeight: "900",
                color: tokens.textPrimary,
                textAlign: "center",
                letterSpacing: "-0.5px",
                textTransform: "uppercase",
                lineHeight: "0.8",
                maxWidth: "90%",
              }}
            >
              {item}
            </Box>
          </Box>
        </Box>

        {/* Bottom tier banner */}
        <Box
          sx={{
            bgcolor: accent,
            mx: "-10cqi",
            py: "0.5em",
            textAlign: "center",
            color: "#fff",
            fontFamily: CARD_FONT,
            fontSize: "8cqi",
            fontWeight: 900,
            lineHeight: 1,
            transform: revealed ? "none" : "translateY(100%)",
            WebkitTextStroke: "1.5cqi rgba(0,0,0,0.35)",
            paintOrder: "stroke fill",
          }}
        >
          {revealed ? tier : "?"}
        </Box>
      </Box>
    </Box>
  );
}
