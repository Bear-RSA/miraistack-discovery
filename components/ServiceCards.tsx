'use client';

import { useRouter } from 'next/navigation';
import { SERVICES, type Service } from '@/lib/config';
import { EMPTY_STATE, saveState } from '@/lib/state';
import ServiceIcon from './ServiceIcon';

export default function ServiceCards() {
  const router = useRouter();

  function select(svc: Service) {
    // Picking a service always starts a fresh assessment.
    saveState({ ...EMPTY_STATE, selectedService: svc.id });
    router.push(svc.enterprise ? '/enterprise' : '/quiz');
  }

  return (
    <div className="cards" id="service-cards">
      {SERVICES.map((s) => (
        <button
          key={s.id}
          type="button"
          className={`card ${s.enterprise ? 'card-enterprise' : ''}`}
          onClick={() => select(s)}
        >
          <div className="card-icon"><ServiceIcon name={s.icon} size={17} /></div>
          <div className="card-title title">{s.title}</div>
          <div className="card-desc caption">{s.desc}</div>
        </button>
      ))}
    </div>
  );
}
