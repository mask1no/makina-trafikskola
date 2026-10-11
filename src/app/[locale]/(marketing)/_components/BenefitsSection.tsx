import { BenefitMarquee } from "@/components/BenefitMarquee";

type BenefitCard = {
  id: string;
  size: "sm" | "lg";
  title: string;
  body: string;
};

export function BenefitsSection({
  label,
  items,
}: {
  label: string;
  items: BenefitCard[];
}) {
  return (
    <div className="relative z-20 mt-6 border-b border-[var(--line)] bg-page pb-6 lg:mt-8 lg:pb-8">
      <BenefitMarquee label={label} items={items} />
    </div>
  );
}
