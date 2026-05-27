import { useState } from 'react';
import { Box, Container, Stack, Typography } from '@mui/material';
import type { GameState, HandCard } from '../../game/types';
import { currentTurnPlayerId, isCurrentTrickComplete, playCard } from '../../game/lifecycle';
import { writeGameState } from '../../hooks/useGameState';
import FirePoints from '../FirePoints';
import type { PlayerMeta } from '../big-screen/playerMeta';

interface Props {
  roomId: string;
  gameState: GameState;
  myId: number;
  meta: Record<number, PlayerMeta>;
}

export default function PhoneCardPlay({ roomId, gameState, myId, meta }: Props) {
  const round = gameState.rounds[gameState.currentRoundIndex]!;
  const myHand = round.perPlayer[myId]?.hand ?? [];
  const myCategoryChoice = round.perPlayer[myId]?.categoryAssigned ?? null;
  const myCategory = myCategoryChoice
    ? `${myCategoryChoice.emoji} ${myCategoryChoice.name}`
    : '—';
  const myHearts = gameState.hearts[myId] ?? 0;
  const me = meta[myId];

  const trick = round.tricks[round.currentTrickIndex];
  const turnPlayerId = currentTurnPlayerId(gameState);
  const isMyTurn = turnPlayerId === myId;
  const trickComplete = isCurrentTrickComplete(gameState);
  const trickResolved = trick.winnerId !== null;
  const iAlreadyPlayedThisTrick = trick.plays.some((p) => p.playerId === myId);

  const [pendingCardId, setPendingCardId] = useState<string | null>(null);

  async function handlePlay(card: HandCard) {
    if (!isMyTurn || card.played) return;
    setPendingCardId(card.id);
    try {
      await writeGameState(roomId, playCard(gameState, myId, card.id));
    } catch {
      setPendingCardId(null);
    }
  }

  // Status line text
  let statusTitle = '';
  let statusSubtitle = '';
  if (trickResolved) {
    const winnerName = meta[trick.winnerId!]?.name ?? `Player ${trick.winnerId}`;
    if (trick.winnerId === myId) {
      statusTitle = trick.fBeatsS ? 'UPSET — YOU TOOK IT' : 'YOU WON THE TRICK';
    } else {
      statusTitle = trick.fBeatsS ? `${winnerName} UPSET` : `${winnerName} TOOK IT`;
    }
    statusSubtitle = `Round ${round.number} · Trick ${round.currentTrickIndex + 1} / 5`;
  } else if (trickComplete) {
    statusTitle = 'REVEALING…';
    statusSubtitle = 'Watch the big screen.';
  } else if (isMyTurn) {
    statusTitle = 'YOUR TURN';
    statusSubtitle = 'Tap a card to play it.';
  } else if (iAlreadyPlayedThisTrick) {
    const next = turnPlayerId ? (meta[turnPlayerId]?.name ?? `Player ${turnPlayerId}`) : '';
    statusTitle = 'PLAYED';
    statusSubtitle = next ? `Waiting for ${next}.` : 'Waiting for others.';
  } else {
    const next = turnPlayerId ? (meta[turnPlayerId]?.name ?? `Player ${turnPlayerId}`) : '';
    statusTitle = 'WAITING';
    statusSubtitle = next ? `${next}'s turn.` : '';
  }

  return (
    <Container maxWidth="xs" sx={{ py: 3 }}>
      <Stack spacing={3}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Typography variant="overline" color="text.secondary">
            R{round.number} · TRICK {round.currentTrickIndex + 1}/5
          </Typography>
          <Typography
            sx={{ color: 'error.main',  fontSize: '0.75rem' }}
          >
            <FirePoints points={myHearts} invert size="0.8rem" />
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="h5"
            sx={{
              color: isMyTurn && !trickComplete ? me?.colorHex : 'primary.main',
              animation: isMyTurn && !trickComplete ? 'pulse 0.9s ease-in-out infinite' : 'none',
              '@keyframes pulse': {
                '0%, 100%': { transform: 'scale(1)', opacity: 1 },
                '50%': { transform: 'scale(0.97)', opacity: 0.7 },
              },
            }}
          >
            {statusTitle}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: '0.85rem' }}>
            {statusSubtitle}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, fontSize: '0.8rem' }}>
            Your hand: <strong>{myCategory}</strong>
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.25 }}>
          {myHand.map((card) => {
            const isMine = !card.played;
            const isPending = pendingCardId === card.id;
            const tappable = isMyTurn && !card.played && !trickComplete;
            return (
              <Box
                key={card.id}
                role={tappable ? 'button' : undefined}
                onClick={tappable ? () => void handlePlay(card) : undefined}
                sx={{
                  minHeight: 110,
                  p: 1.5,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  bgcolor: card.played ? 'transparent' : 'background.paper',
                  border: '2px solid',
                  borderColor: tappable ? me?.colorHex ?? 'primary.main' : 'rgba(255,255,255,0.12)',
                  borderRadius: 1,
                  cursor: tappable ? 'pointer' : 'default',
                  opacity: card.played ? 0.25 : isPending ? 0.6 : 1,
                  transition: 'transform 120ms, box-shadow 120ms',
                  boxShadow: tappable ? `0 0 18px ${me?.colorHex ?? '#3ce0ff'}33` : 'none',
                  '&:active': tappable ? { transform: 'scale(0.97)' } : undefined,
                  textAlign: 'center',
                  position: 'relative',
                }}
              >
                <Typography
                  sx={{
                    
                    fontSize: '1.4rem',
                    color: card.played ? 'text.secondary' : 'text.secondary',
                    opacity: 0.6,
                    lineHeight: 1,
                  }}
                >
                  ?
                </Typography>
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    wordBreak: 'break-word',
                  }}
                >
                  {card.item}
                </Typography>
                {card.played && (
                  <Typography
                    variant="overline"
                    sx={{
                      position: 'absolute',
                      bottom: 4,
                      left: 0,
                      right: 0,
                      color: 'text.secondary',
                      fontSize: '0.55rem',
                    }}
                  >
                    PLAYED
                  </Typography>
                )}
                {isMine && tappable && (
                  <Typography
                    variant="overline"
                    sx={{
                      position: 'absolute',
                      bottom: 4,
                      left: 0,
                      right: 0,
                      color: me?.colorHex ?? 'primary.main',
                      fontSize: '0.55rem',
                    }}
                  >
                    TAP TO PLAY
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>
      </Stack>
    </Container>
  );
}
