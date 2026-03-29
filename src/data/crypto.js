// ═══════════════════════════════════════════════════════
// PRO-MIX PLUGINS — Crypto Payment Config
// ═══════════════════════════════════════════════════════

export const wallets = {
  BTC: {
    name: 'Bitcoin',
    symbol: 'BTC',
    icon: '₿',
    color: '#f7931a',
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    network: 'Bitcoin Mainnet',
    confirmations: 3,
    estimatedTime: '~30 min',
  },
  ETH: {
    name: 'Ethereum',
    symbol: 'ETH',
    icon: 'Ξ',
    color: '#627eea',
    address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    network: 'Ethereum Mainnet (ERC-20)',
    confirmations: 12,
    estimatedTime: '~5 min',
  },
  USDT: {
    name: 'Tether',
    symbol: 'USDT',
    icon: '₮',
    color: '#26a17b',
    address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    network: 'Ethereum Mainnet (ERC-20)',
    confirmations: 12,
    estimatedTime: '~5 min',
  },
};

export const supportedCoins = Object.keys(wallets);

// Generate a simple QR code-like SVG string (placeholder)
export function generateQRCodeSVG(address, size = 200) {
  // Create a deterministic "QR code" pattern from the address
  const hash = address.split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
  const gridSize = 21;
  const cellSize = size / gridSize;
  
  let cells = '';
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      // Position detection patterns (corners)
      const isTopLeft = x < 7 && y < 7;
      const isTopRight = x >= gridSize - 7 && y < 7;
      const isBottomLeft = x < 7 && y >= gridSize - 7;
      
      const isBorder = (isTopLeft || isTopRight || isBottomLeft) && 
        (x === 0 || y === 0 || x === 6 || y === 6 || x === gridSize - 1 || x === gridSize - 7 || y === gridSize - 1 || y === gridSize - 7);
      
      const isInner = (isTopLeft || isTopRight || isBottomLeft) &&
        (x >= 2 && x <= 4 && y >= 2 && y <= 4) ||
        (x >= gridSize - 5 && x <= gridSize - 3 && y >= 2 && y <= 4) ||
        (x >= 2 && x <= 4 && y >= gridSize - 5 && y <= gridSize - 3);

      // Pseudo-random data cells
      const seed = (hash + x * 31 + y * 37 + x * y * 13) & 0xFFFF;
      const isData = !isTopLeft && !isTopRight && !isBottomLeft && (seed % 3 !== 0);

      if (isBorder || isInner || isData) {
        cells += `<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="#000"/>`;
      }
    }
  }
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="#fff"/>
    ${cells}
  </svg>`;
}

export function getPaymentInstructions(coin) {
  const wallet = wallets[coin];
  if (!wallet) return null;
  
  return {
    ...wallet,
    steps: [
      `Open your ${wallet.name} wallet app`,
      `Send the exact amount shown to the address below`,
      `Wait for ${wallet.confirmations} network confirmations`,
      `Your download will be available automatically`,
    ],
  };
}
