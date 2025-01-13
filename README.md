# PixelBot v1.1.1

Implementation of a pixelpixel.io bot using [pixepixel API](https://github.com/XToripuru/pixepixel).

## Prerequisites

### Install Required Packages:

- Ensure you have [Node.js](https://nodejs.org) installed.
- Install the required dependencies using:
  ```bash
  npm install
  ```

Dependencies:

- `pixelpixel`: Official Pixelpixel API library.
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
| `--pk <public key>`      | Your wallet address                               | `--pk 12345abcde`             |
| `--key <api key>`        | Your API key for authentication                   | `--key abcdef12345`           |
| `-p, --position <x>,<y>` | Top-left corner of the image on the canvas (x, y) | `--position 100,200`          |
| `-i, --image <path>`     | Path to the image file                            | `--image ./path/to/image.png` |

\*your API key is visible in browser's console after connecting with wallet

### Example Command

```bash
node index.js --pk YourWalletAddress --key YourApiKey --position 50,50 --image ./flying-eye.png
```

## How it works?

It takes an image and a position and it draws that image on that position on the pixepixel's canvas. This process consumes available pixels from your account as usual. After finishing the image the bot
will try to draw it again thus protecting from intruders.

## Notes

Multiple instances of websocket connections with the same wallet are blocked by the server and this bot is no exception.

## License

This project is open-source and available under the [MIT License](LICENSE).
