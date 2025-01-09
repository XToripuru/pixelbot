# PixelBot

Implementation of an API compliant pixelpixel.io bot.

## Prerequisites

### Install Required Packages:

- Ensure you have [Node.js](https://nodejs.org) installed.
- Install the required dependencies using:
  ```bash
  npm install
  ```

Dependencies:

- `ws`: WebSocket client library.
- `sharp`: For image processing and retrieving pixel data.
- `commander`: For command-line argument parsing.
- `fs`: Built-in module for file system operations.

---

## Usage

### Command-Line Arguments

You can use the following command-line arguments to customize the app's behavior:

| Option                   | Description                                       | Example                       |
| ------------------------ | ------------------------------------------------- | ----------------------------- |
| `--pk <public key>`      | Your wallet address                               | `--pk 0x12345abcde`           |
| `--key <api key>`        | Your API key for authentication                   | `--key abcdef12345`           |
| `-p, --position <x>,<y>` | Top-left corner of the image on the canvas (x, y) | `--position 100,200`          |
| `-i, --image <path>`     | Path to the image file                            | `--image ./path/to/image.png` |

\*your API key is visible in browser's console after connecting with wallet

### Example Command

```bash
node app.js --pk 0xYourWalletAddress --key YourApiKey --position 50,50 --image ./image.png
```

### Notes

- **Position (`--position`)**: Specify the top-left corner (x, y) where the image should be placed on the canvas.
- **Image Path (`--image`)**: Provide a valid path to the image file (supports `.png`, `.jpg`, etc.).
- Ensure the image exists and is accessible.

---

## How It Works

1. **Image Loading**:

   - Loads the specified image using the `sharp` library.
   - Extracts RGBA pixel data and dimensions.

2. **WebSocket Connection**:

   - Connects to `wss://pixelpixel.io/connect`.
   - Authenticates using the provided public key and API key.
   - Receives canvas updates and pixel placement permissions.

3. **Drawing Logic**:
   - Iterates over the image pixel-by-pixel.
   - Skips transparent or redundant pixels already present on the canvas.
   - Sends pixel placement commands to the server.

## Notes

Multiple instances of websocket connections with the same wallet are blocked by the server and this bot is no exception.

## License

This project is open-source and available under the [MIT License](LICENSE).
