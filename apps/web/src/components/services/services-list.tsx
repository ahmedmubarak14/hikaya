import { cn } from '@hikaya/ui';

import type { CreatorService } from '@/lib/services/types';

interface Props {
  services: CreatorService[];
  locale: 'en' | 'ar';
  servicesLabel: string;
  currencyFormat: (halalas: number) => string;
}

export function ServicesList({ services, locale, servicesLabel, currencyFormat }: Props) {
  if (services.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-surface/50 text-sm">{servicesLabel}</h3>
      <ul className="flex flex-col gap-2">
        {services.map((service) => {
          const name = locale === 'ar' && service.nameAr ? service.nameAr : service.nameEn;
          return (
            <li
              key={service.id}
              className={cn(
                'border-surface/10 flex items-baseline justify-between gap-3 border-b pb-2',
                'last:border-0 last:pb-0',
              )}
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-surface text-sm font-medium">{name}</span>
                {service.description ? (
                  <span className="text-surface/50 text-xs">{service.description}</span>
                ) : null}
              </div>
              <span className="text-surface shrink-0 text-end text-sm font-medium">
                {currencyFormat(service.priceHalalas)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
