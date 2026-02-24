const express = require("express");
const request = require("request");
const { spawn } = require("child_process");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname, "public")));

// Proxy endpoint (no transcoding)
app.get("/proxy", (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("Missing url");

  res.set({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*"
  });

  request(url).pipe(res);
});

// Transcoding endpoint
app.get("/transcode", (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("Missing url");

  res.set({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Content-Type": "video/mp2t"
  });

  const ffmpeg = spawn("ffmpeg", [
    "-i", url,
    "-preset", "veryfast",
    "-vcodec", "libx264",
    "-profile:v", "baseline",
    "-level", "3.0",
    "-acodec", "aac",
    "-ar", "44100",
    "-ac", "2",
    "-f", "mpegts",
    "pipe:1"
  ]);

  ffmpeg.stdout.pipe(res);

  ffmpeg.stderr.on("data", data => {
    console.log("FFmpeg:", data.toString());
  });

  ffmpeg.on("close", () => {
    console.log("FFmpeg closed");
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
