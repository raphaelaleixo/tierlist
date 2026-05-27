import { useLayoutEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import type { PlayerColor, Tier } from "../game/types";
import { openMojiBlackUrl } from "../utils/openMoji";
import { blobBorderRadius, pastel } from "../utils/blob";
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
  /** Optional entry/exit animation:
   *  - "drop-in":   scales down from 2× while falling into place (when played)
   *  - "pop-in":    scales up from 0 (when arriving in the live tier list)
   *  - "scale-out": scales to 0 + fades (when leaving a cell during migration)
   */
  animation?: 'drop-in' | 'pop-in' | 'scale-out';
  /** Compact form: drops the top category label and the bottom tier banner.
   *  Used for thumbnail/history views where only the emoji + item are needed. */
  compact?: boolean;
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
  animation,
  compact = false,
}: TierCardProps) {
  const accent = revealed ? TIER_COLORS[tier] : "#9a9a9a";
  const tokens = VARIANT_TOKENS[variant];
  const holderHex = PLAYER_COLOR_HEX[holderColor];

  // Shrink-to-fit on the item text. We only care about ONE case: a single
  // word that's wider than the available horizontal space (multi-word text
  // already wraps naturally). `scrollWidth` doesn't catch this when overflow
  // is `visible`, so we use canvas `measureText` to find the widest word and
  // compare it to the parent's inline-size.
  const itemRef = useRef<HTMLDivElement>(null);
  const [itemScale, setItemScale] = useState(1);
  useLayoutEffect(() => {
    const el = itemRef.current;
    if (!el) return;
    const measure = () => {
      const parent = el.parentElement;
      if (!parent) return;
      const cs = window.getComputedStyle(el);
      const fontSize = parseFloat(cs.fontSize);
      const fontFamily = cs.fontFamily;
      const fontWeight = cs.fontWeight || "400";
      const letterSpacing = parseFloat(cs.letterSpacing) || 0;
      if (!fontSize || !Number.isFinite(fontSize)) return;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      const words = item.toUpperCase().split(/\s+/).filter(Boolean);
      let widest = 0;
      for (const word of words) {
        const w =
          ctx.measureText(word).width +
          Math.max(0, word.length - 1) * letterSpacing;
        if (w > widest) widest = w;
      }
      // Available width is the parent (item wrapper) clientWidth.
      const available = parent.clientWidth;
      if (widest > available && widest > 0) {
        setItemScale(Math.max(0.4, (available / widest) * 0.97));
      } else {
        setItemScale(1);
      }
    };
    let raf = requestAnimationFrame(measure);
    if ("fonts" in document) {
      document.fonts.ready.then(measure).catch(() => {});
    }
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    });
    ro.observe(el);
    if (el.parentElement) ro.observe(el.parentElement);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [item]);
  // Both the card body and the blob tint in the holder's colour, at different
  // opacities so the blob still reads as a distinct shape inside the card.
  const cardBg = variant === "dark" ? "#0a0a14" : "#ffffff";
  const blobBg = variant === "dark" ? holderHex : pastel(holderHex, 0.3);
  // Compact cards drop the blob, so use the brighter `blobBg` for the card
  // body itself — keeps the holder colour readable at small sizes.
  const bodyBg = compact ? blobBg : cardBg;
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
          bgcolor: bodyBg,
          borderRadius: "7.5cqi",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 3cqi 8cqi rgba(0, 0, 0, 0.45)",
          aspectRatio: "5/7",
          p: "10cqi",
          pb: compact ? "10cqi" : "0",
          transformOrigin: "center center",
          ...(animation === "drop-in" && {
            animation: "tierCardDropIn 600ms cubic-bezier(0.22, 1, 0.36, 1) both",
            "@keyframes tierCardDropIn": {
              "0%": { transform: "translateY(-110vh)", opacity: 0 },
              "10%": { opacity: 1 },
              "100%": { transform: "translateY(0)", opacity: 1 },
            },
          }),
          ...(animation === "pop-in" && {
            animation: "tierCardPopIn 300ms cubic-bezier(0.34, 1.5, 0.64, 1) both",
            "@keyframes tierCardPopIn": {
              "0%": { transform: "scale(0)", opacity: 0 },
              "100%": { transform: "scale(1)", opacity: 1 },
            },
          }),
          ...(animation === "scale-out" && {
            animation: "tierCardScaleOut 320ms cubic-bezier(0.4, 0, 0.7, 0.3) both",
            "@keyframes tierCardScaleOut": {
              "0%": { transform: "scale(1)", opacity: 1 },
              "100%": { transform: "scale(0)", opacity: 0 },
            },
          }),
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
            backgroundColor: bodyBg,
          }}
        >
          {/* Category top label */}
          {!compact && (
            <Box
              sx={{
                fontSize: "4cqi",
                fontWeight: 600,
                letterSpacing: 2,
                color: tokens.textPrimary,
                bgcolor: bodyBg,
                textTransform: "uppercase",
              }}
            >
              {category}
            </Box>
          )}
          {/* Emoji block — OpenMoji black SVG over a deterministic blob.
              Absolutely centered so the item text can grow/wrap without
              shifting the focal artwork. */}
          <Box
            sx={{
              position: "absolute",
              top: compact ? "36%" : "42%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "60cqi",
              aspectRatio: "1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {!compact && (
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
            )}
            <Box
              component="img"
              src={openMojiBlackUrl(emoji)}
              alt={emoji}
              sx={{
                position: "relative",
                zIndex: 1,
                width: compact ? "60cqi" : "40cqi",
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
              mt: "auto",
              mb: "10cqi",
            }}
          >
            <Box
              ref={itemRef}
              sx={{
                fontSize: compact ? "15cqi" : "12cqi",
                fontWeight: "900",
                color: tokens.textPrimary,
                textAlign: "center",
                letterSpacing: "-0.5px",
                textTransform: "uppercase",
                lineHeight: "0.8",
                transform: `scale(${itemScale})`,
                transformOrigin: "center center",
              }}
            >
              {item}
            </Box>
          </Box>
        </Box>

        {/* Bottom tier banner */}
        {!compact && (
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
              transform: revealed ? "none" : "translateY(110%)",
              transition: "transform 420ms cubic-bezier(0.34, 1.2, 0.64, 1)",
              WebkitTextStroke: "1.5cqi rgba(0,0,0,0.35)",
              paintOrder: "stroke fill",
            }}
          >
            {revealed ? tier : "?"}
          </Box>
        )}
      </Box>
    </Box>
  );
}
