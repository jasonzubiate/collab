"use client";

import { Accordion } from "@heroui/react";
import { ChevronDown } from "lucide-react";

import { FAQ_ITEMS } from "@/lib/marketing/plans";

export function PricingFaq() {
  return (
    <section
      aria-labelledby="pricing-faq-heading"
      className="px-4 pb-16 sm:px-6 sm:pb-20"
    >
      <div className="mx-auto max-w-5xl">
        <h2
          id="pricing-faq-heading"
          className="font-display text-3xl leading-[0.95] font-extrabold tracking-tighter text-balance text-foreground sm:text-4xl"
        >
          Frequently asked questions
        </h2>

        <Accordion hideSeparator className="mt-8 flex w-full flex-col gap-2">
          {FAQ_ITEMS.map((item) => (
            <Accordion.Item
              key={item.question}
              id={item.question}
              className="overflow-hidden rounded-2xl bg-surface transition-colors hover:bg-surface-muted"
            >
              <Accordion.Heading>
                <Accordion.Trigger className="bg-transparent px-5 py-4 hover:bg-transparent! data-[hovered=true]:bg-transparent! sm:px-6">
                  {item.question}
                  <Accordion.Indicator>
                    <ChevronDown className="size-4" />
                  </Accordion.Indicator>
                </Accordion.Trigger>
              </Accordion.Heading>
              <Accordion.Panel className="bg-transparent">
                <Accordion.Body className="bg-transparent px-5 pb-4 text-sm leading-relaxed text-muted-foreground sm:px-6">
                  {item.answer}
                </Accordion.Body>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
