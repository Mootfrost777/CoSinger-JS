# CoSinger-JS
A music Discord bot written in discord.js.

# Installation
Install node.js: <br/>
Windows: https://nodejs.org/en/download/. <br/>
Linux: https://nodejs.org/en/download/package-manager/. <br/>

Install dependencies:
```
npm i discord.js
npm i sodium
npm i ytdl-core
```

You also need to install ffmpeg: <br/>
Windows: https://ffmpeg.org/download.html#build-windows. Just copy all .exe files to project directory. <br/>
Linux: ```npm install ffmpeg```.

Then create new bot in https://discord.com/developers/applications and paste token to config file.

# Config
```
{
  "prefix": "<prefix>",
  "token": "<token>"
}
```

# Run
```
node bot.js
```
