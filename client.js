const WebSocket = require("ws");
const sharp = require("sharp");
const { program } = require("commander");
const fs = require("fs");

// Set up command-line arguments
program
  .option("--pk <public key>", "Your wallet address")
  .option("--key <api key>", "Your API key")
  .option(
    "-p, --position <x>,<y>",
    "Where to place the image (top left corner)"
  )
  .option("-i, --image <path>", "Path to the image file")
  .parse(process.argv);

const options = program.opts();

if (!options.position) {
  console.error("Error: Please specify a position for the image.");
  process.exit(1);
}

const [setX, setY] = options.position.split(",").map(Number);

if (!options.image) {
  console.error("Error: Please specify an image path using the -i option.");
  process.exit(1);
}

// Validate image path
if (!fs.existsSync(options.image)) {
  console.error("Error: The specified image path does not exist.");
  process.exit(1);
}

async function getImageRGBContent(imagePath) {
  try {
    const imageBuffer = await sharp(imagePath).ensureAlpha().raw().toBuffer();

    const metadata = await sharp(imagePath).metadata();
    const { width, height, channels } = metadata;

    console.log(`Image loaded: ${width}x${height}, Channels: ${channels}`);
    return { data: imageBuffer, width, height, channels };
  } catch (error) {
    console.error("Error loading image:", error);
    process.exit(1);
  }
}

async function connectWebSocket() {
  const {
    data: rgbaData,
    width: imageWidth,
    height: imageHeight,
    channels,
  } = await getImageRGBContent(options.image);

  console.log("Connecting");

  let pixels = 0;
  let canvas = null;

  const ws = new WebSocket("wss://pixelpixel.io/connect", {
    rejectUnauthorized: false,
  });

  const setPixel = ([r, g, b], [x, y]) => {
    console.log(`Set [${r},${g},${b}] at [${x},${y}]`);
    const xh = x >> 8;
    const xl = x & 0x00ff;
    const yh = y >> 8;
    const yl = y & 0x00ff;
    ws.send(Buffer.from([0, r, g, b, xh, xl, yh, yl]));
  };

  const drawImage = (x, y) => {
    console.log(x, y);
    if (pixels == 0) {
      setTimeout(() => drawImage(x, y), 1000);
      return;
    }
    const canvasIdx = 3 * (1000 * (setY + y) + (setX + x));
    const imageIdx = 4 * (imageWidth * y + x);

    // Skip if  pixel is transparent or if it's already on the canvas
    if (
      rgbaData[imageIdx + 3] < 255 ||
      (canvas[canvasIdx] == rgbaData[imageIdx] &&
        canvas[canvasIdx + 1] == rgbaData[imageIdx + 1] &&
        canvas[canvasIdx + 2] == rgbaData[imageIdx + 2])
    ) {
      setTimeout(() => {
        x += 1;
        if (x == imageWidth) {
          x = 0;
          y += 1;
          if (y == imageHeight) {
            y = 0;
          }
        }
        drawImage(x, y);
      }, 0);
      return;
    }

    // Set the pixel
    setPixel(
      [rgbaData[imageIdx], rgbaData[imageIdx + 1], rgbaData[imageIdx + 2]],
      [setX + x, setY + y]
    );
    pixels -= 1;

    setTimeout(() => {
      x += 1;
      if (x == imageWidth) {
        x = 0;
        y += 1;
        if (y == imageHeight) {
          y = 0;
        }
      }
      drawImage(x, y);
    }, 1000);
  };

  const cbt = {
    Regen: ([amount]) => {
      pixels += amount;
    },
    Set: ([_, r, g, b, xh, xl, yh, yl]) => {
      const x = (xh << 8) + xl;
      const y = (yh << 8) + yl;
      const idx = 1000 * y + x;
      canvas[3 * idx] = r;
      canvas[3 * idx + 1] = g;
      canvas[3 * idx + 2] = b;
    },
    Area: (area) => {
      canvas = area;
    },
    Connected: (user) => {
      console.log("Verified");
      pixels = user.pixels;
      console.log(`$PXPX ${user.tokens}`);
      console.log(`${pixels} pixels`);

      setTimeout(() => drawImage(0, 0), 0);
    },
  };

  ws.on("open", () => {
    console.log("Connected");

    ws.send(
      JSON.stringify({
        ApiConnect: {
          pk: options.pk,
          key: options.key,
        },
      })
    );
  });

  ws.on("message", (event, isBinary) => {
    if (isBinary) {
      const buffer = new Uint8Array(event);
      if (buffer.length == 1) {
        cbt.Regen(buffer);
      } else if (buffer.length == 8) {
        cbt.Set(buffer);
      } else if (buffer.length == 3 * 1000 * 1000) {
        cbt.Area(buffer);
      }
    } else {
      const res = JSON.parse(event.toString());
      const type = Object.keys(res)[0];
      if (type == 0 && cbt[res]) {
        cbt[res]();
      } else if (type != 0 && cbt[type]) {
        cbt[type](Object.values(res)[0]);
      }
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });

  ws.on("close", (code, reason) => {
    console.log(`Connection closed: ${code} - ${reason}`);
  });
}

connectWebSocket();
