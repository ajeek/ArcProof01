import { useAccount } from 'wagmi';
import { DeveloperProfile } from '../../App';
import { useState } from 'react';

export function Dev() {
  const { address } = useAccount();
  const [selectedJobId, setSelectedJobId] = useState<bigint | null>(null);

  return (
    <div className="space-y-6">
      <DeveloperProfile address={address as `0x${string}`} onSelect={setSelectedJobId} />
    </div>
  );
}
