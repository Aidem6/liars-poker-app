# Liar's Poker — app

Expo (React Native + web) client for Liar's Poker, a bluffing card game for 2–8 players.
The game server lives in a separate repo: [Firlej/liars-poker](https://github.com/Firlej/liars-poker).

- Website: deployed from `master` by `.github/workflows/deploy.yml`
- Landing page: [`public/home/index.html`](public/home/index.html), at `/home/`. A plain HTML file, separate from the app
- Status and launch checklist: [`public/launch-review.html`](public/launch-review.html), published with the website at `/launch-review.html`

## Run locally

```bash
npm install
npx expo start
```

Press `w` for the browser, `i` / `a` for the iOS or Android simulator.

The app connects to `EXPO_PUBLIC_SOCKET_URL`. For local work put this in `.env.local` and run the server from the other repo:

```bash
EXPO_PUBLIC_SOCKET_URL=http://localhost:4000
```

To test on a phone, use your computer's network address instead of `localhost` and start the server with `--host 0.0.0.0`.

To see a game without other people, tap **Watch bots play** in the lobby: a table of bots that starts a new game after each one ends.

## Checks

```bash
npx tsc --noEmit
npx jest --watchAll=false
```

## How it is built

| Path | What it does |
| --- | --- |
| `net/client.ts` | The one connection to the server. Starts on long-polling and upgrades to WebSocket, reconnects forever and when the app returns to the foreground, keeps a session token, resends moves safely after a dropped connection |
| `net/protocol.ts` | Types for what the server sends, and text for its error codes |
| `net/view.ts` | Turns a server snapshot into what the game screen draws |
| `net/errorReporter.ts` | Sends crashes and unexpected errors to the PocketBase `feedbacks` collection (off in development builds) |
| `socket.tsx` | React provider and hooks around the client |
| `app/game.tsx` | Game screen: waiting room, table, reveal, game over |
| `app/(tabs)/index.tsx` | Lobby |
| `components/game/` | Table, hand panel, bet picker, timeline, turn timer |
| `constants/theme.ts` | Colors, spacing and type tokens |
| `utils/bets.ts`, `utils/dataUtils.js` | The 83 bets in order, their names and card pictures |

The server is the only source of truth. After every change it sends each player the complete room state with a version number; the app draws it as received and never patches state from individual events. A lost message or a reconnect can't leave a player out of sync.

## Releasing

- **Website:** merging into `master` builds and deploys it. The game server must already be running the matching version.
- **Stores:** build with EAS (`eas.json`). Bump `version` in `app.json` first.
