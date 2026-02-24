let channels = [];
let filteredChannels = [];
let currentIndex = -1;

const playlistForm = document.getElementById("playlist-form");
const playlistUrlInput = document.getElementById("playlist-url");
const channelsContainer = document.getElementById("channels");
const player = document.getElementById("player");
const statusEl = document.getElementById("status");
const searchInput = document.getElementById("search");

// Load playlist
playlistForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const url = playlistUrlInput.value.trim();
  if (!url) return;

  statusEl.textContent = "Loading playlist...";

  try {
    const res = await fetch(url);
    const text = await res.text();
    channels = parseM3U(text);

    filteredChannels = channels.filter(ch =>
      ch.url.endsWith(".m3u8") ||
      ch.url.endsWith(".ts") ||
      ch.url.startsWith("http")
    );

    renderChannels();
    statusEl.textContent = `Loaded ${filteredChannels.length} channels`;
  } catch (err) {
    statusEl.textContent = "Error loading playlist";
  }
});

// Parse M3U
function parseM3U(text) {
  const lines = text.split("\n");
  const list = [];
  let current = null;

  for (let line of lines) {
    line = line.trim();
    if (line.startsWith("#EXTINF:")) {
      current = { name: line.split(",").pop(), url: "" };
    } else if (current && line && !line.startsWith("#")) {
      current.url = line;
      list.push(current);
      current = null;
    }
  }
  return list;
}

// Render channels
function renderChannels() {
  channelsContainer.innerHTML = "";
  filteredChannels.forEach((ch, i) => {
    const div = document.createElement("div");
    div.className = "channel";
    div.textContent = ch.name;
    div.onclick = () => playChannel(i);
    channelsContainer.appendChild(div);
  });
}

// Play channel
function playChannel(i) {
  const ch = filteredChannels[i];
  statusEl.textContent = "Loading stream...";

  let streamUrl;

  if (ch.url.endsWith(".m3u8")) {
    streamUrl = "/proxy?url=" + encodeURIComponent(ch.url);
  } else {
    streamUrl = "/transcode?url=" + encodeURIComponent(ch.url);
  }

  if (Hls.isSupported() && streamUrl.endsWith(".m3u8")) {
    const hls = new Hls();
    hls.loadSource(streamUrl);
    hls.attachMedia(player);
    hls.on(Hls.Events.MANIFEST_PARSED, () => player.play());
  } else {
    player.src = streamUrl;
    player.load();
    player.play().catch(() => {
      statusEl.textContent = "Stream unsupported";
    });
  }

  statusEl.textContent = "Playing: " + ch.name;
}

// Search
searchInput.addEventListener("input", () => {
  const q = searchInput.value.toLowerCase();
  filteredChannels = channels.filter(ch =>
    ch.name.toLowerCase().includes(q)
  );
  renderChannels();
});
