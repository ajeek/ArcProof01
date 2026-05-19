import { useAccount } from 'wagmi';
import { EmployerProfile } from '../../App';
import { useState } from 'react';

export function Employer() {
  const { address } = useAccount();
  const [selectedJobId, setSelectedJobId] = useState<bigint | null>(null);

  return (
    <div className="space-y-6">
      <EmployerProfile address={address as `0x${string}`} onSelect={setSelectedJobId} />
    </div>
  );
}
