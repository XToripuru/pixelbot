import { PixelpixelClient, loadImage } from "pixelpixel";
import { program } from "commander";

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

if (!options.image) {
  console.error("Error: Please specify an image path using the -i option.");
  process.exit(1);
}

async function start() {
  const image = await loadImage(options.image);
  if (image.channels != 4) {
    throw new Error("Image must be in RGBA format");
  }

  const getImagePixel = ([x, y]) => {
    const idx = image.channels * (image.width * y + x);
    return [
      image.buffer[idx], // R
      image.buffer[idx + 1], // G
      image.buffer[idx + 2], // B
      image.buffer[idx + 3], // A
    ];
  };

  console.log("Connecting");

  const drawImage = (client, image, [x, y]) => {
    const base = { x, y };
    const offset = { x: 0, y: 0 };
    const goToNextPixel = () => {
      offset.x += 1;
      if (offset.x == image.width) {
        offset.x = 0;
        offset.y += 1;
        if (offset.y == image.height) offset.y = 0;
      }
    };
    const drawPixel = () => {
      const [r, g, b, a] = getImagePixel([offset.x, offset.y]);
      // Skip if any transparency
      if (a < 255) {
        goToNextPixel();
        return;
      }
      client.setPixel([r, g, b], [base.x + offset.x, base.y + offset.y]);
      goToNextPixel();
    };
    setInterval(() => drawPixel(), 25);
  };

  const client = new PixelpixelClient({
    pk: options.pk,
    api_key: options.key,
    onOpen: () => {
      console.log("Connected");
    },
    onVerify: (user) => {
      console.log("Verified");
      console.log(`${user.pixels} pixels`);
      console.log(`${user.tokens} $PXPX`);
      drawImage(client, image, options.position.split(",").map(Number));
    },
    onClose: () => console.log("Disconnected"),
    onSetPixel: ([r, g, b], [x, y]) => {
      console.log(`Someone set [${r},${g},${b}] at [${x},${y}]`);
    },
  });
}

start();
