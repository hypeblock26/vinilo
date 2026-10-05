# vinilo

![Node.js](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)
![Discord](https://img.shields.io/badge/Discord-bot-5865F2?logo=discord&logoColor=white)
![Slash commands](https://img.shields.io/badge/slash%20commands-supported-5865F2)
![yt-dlp](https://img.shields.io/badge/powered%20by-yt--dlp-FF0000?logo=youtube&logoColor=white)
![FFmpeg](https://img.shields.io/badge/FFmpeg-required-007808?logo=ffmpeg&logoColor=white)
![YouTube](https://img.shields.io/badge/YouTube-supported-FF0000?logo=youtube&logoColor=white)
![SoundCloud](https://img.shields.io/badge/SoundCloud-supported-FF5500?logo=soundcloud&logoColor=white)

A Discord music bot with a playback queue, slash commands, and audio streaming through yt-dlp.

## Features

- Plays audio from YouTube and SoundCloud in voice channels
- Queue management: skip, skip to, previous, remove, insert, shuffle, loop, clear
- Playback controls: pause, resume, stop, seek, volume, audio filters
- Lyrics lookup
- Discord slash commands

## Requirements

- [Node.js](https://nodejs.org/) 18 or newer
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) available in the `PATH`
- [FFmpeg](https://ffmpeg.org/) available in the `PATH`
- A bot application from the [Discord Developer Portal](https://discord.com/developers/applications)

## Installation

```bash
git clone https://github.com/hypeblock26/vinilo.git
cd vinilo
npm install
```

## Configuration

### Environment variables

Copy `.env.example` to `.env` and fill in the values:

```env
BOT_TOKEN=
CLIENT_ID=
```

| Variable | Description |
| --- | --- |
| `BOT_TOKEN` | Bot token (Developer Portal → Bot → Reset Token) |
| `CLIENT_ID` | Application ID (Developer Portal → General Information) |

### YouTube cookies

yt-dlp reads YouTube cookies from a Netscape-format `cookies.txt` file in the project root. This prevents YouTube from asking for bot verification during playback.

To create the file:

1. Sign in to YouTube in a private browser window. A dedicated Google account is recommended.
2. Export the `youtube.com` cookies in Netscape format, for example with the "Get cookies.txt LOCALLY" extension.
3. Save the result as `cookies.txt` in the project root.
4. Close the private window.

The cookies grant access to the Google account they were exported from. `cookies.txt` is excluded by `.gitignore` and should stay out of version control.

## Usage

Register the slash commands (first run, or after adding commands):

```bash
node Deploy.js
```

Start the bot:

```bash
node index.js
```

## Commands

Each command lives in its own file under `commands/`:

`play`, `pause`, `resume`, `stop`, `skip`, `skipto`, `previous`, `queue`, `nowplaying`, `remove`, `insert`, `clearqueue`, `shuffle`, `loop`, `seek`, `volume`, `filter`, `lyrics`, `join`, `ping`

## Project structure

```
.
├── commands/        Slash command definitions
├── Deploy.js        Registers slash commands with Discord
├── Musicqueue.js    Queue and playback logic
├── index.js         Bot entry point
├── .env.example     Example environment variables
└── package.json
```



## 🤝 Contributing
[Fork the repository](https://github.com/hypeblock26/vinilo/fork)

1. Clone your fork: `git clone https://github.com/your-username/vinilo.git`
2. Create your feature branch: `git checkout -b my-new-feature`
3. Stage changes: `git add .`
4. Commit your changes: `git commit -m "Add my new feature"`
5. Push to the branch: `git push origin my-new-feature`
6. Submit a pull request
