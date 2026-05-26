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
      <ul className="flex flex-col gap-4">
        {services.map((service) => {
          const name = locale === 'ar' && service.nameAr ? service.nameAr : service.nameEn;
          const hasTiers = service.tiers && service.tiers.length > 0;

          return (
            <li key={service.id} className="flex flex-col gap-2">
              {/* Service header */}
              <div
                className={cn(
                  'flex items-baseline justify-between gap-3',
                  !hasTiers && 'border-surface/10 border-b pb-2',
                )}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-surface text-sm font-medium">{name}</span>
                  {service.description ? (
                    <span className="text-surface/50 text-xs">{service.description}</span>
                  ) : null}
                </div>
                {!hasTiers ? (
                  <span className="text-surface shrink-0 text-end text-sm font-medium">
                    {currencyFormat(service.priceHalalas)}
                  </span>
                ) : null}
              </div>

              {/* Tier cards */}
              {hasTiers ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {service.tiers!.map((tier) => {
                    const tierName = locale === 'ar' && tier.nameAr ? tier.nameAr : tier.nameEn;
                    return (
                      <div
                        key={tier.id}
                        className="border-surface/10 bg-surface/[0.03] flex flex-col gap-1.5 rounded-lg border p-3"
                      >
                        <span className="text-surface text-xs font-medium">{tierName}</span>
                        <span className="text-accent-secondary text-lg font-bold">
                          {currencyFormat(tier.priceHalalas)}
                        </span>
                        {tier.description ? (
                          <span className="text-surface/50 text-2xs">{tier.description}</span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
