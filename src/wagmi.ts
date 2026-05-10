import { http, createConfig } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { type Chain } from 'viem';

export const arcTestnet = {
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
  testnet: true,
} as const satisfies Chain;

export const config = createConfig({
  chains: [arcTestnet, mainnet],
  transports: {
    [arcTestnet.id]: http(),
    [mainnet.id]: http(),
  },
});
