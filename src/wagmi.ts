import { http, createConfig, webSocket, fallback } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { type Chain } from 'viem';
import { injected, walletConnect } from 'wagmi/connectors';

export const arcTestnet = {
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: { 
      http: ['https://rpc.testnet.arc.network'],
      webSocket: ['wss://rpc.testnet.arc.network']
    },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
  testnet: true,
} as const satisfies Chain;

export const config = createConfig({
  chains: [arcTestnet, mainnet],
  connectors: [
    injected(),
    walletConnect({
      projectId: '3fcc6bba6f1de962d911bb5b5c3dba68',
      showQrModal: true,
    }),
  ],
  transports: {
    [arcTestnet.id]: fallback([
      webSocket('wss://rpc.testnet.arc.network'),
      http('https://rpc.testnet.arc.network')
    ]),
    [mainnet.id]: http(),
  },
});
