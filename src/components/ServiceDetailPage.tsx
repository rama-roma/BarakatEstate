"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BadgeDollarSign,
  Brush,
  Check,
  ClipboardCheck,
  FileCheck2,
  Hammer,
  PackageCheck,
  PaintBucket,
  Plus,
  Ruler,
  ShieldCheck,
  Sparkles,
  SprayCan,
  TimerReset,
  WalletCards,
} from "lucide-react";
import { useState } from "react";

import type { ServiceDetail } from "@/content/service-details";
import { serviceList } from "@/content/service-details";


const serviceIcons = {
  buyout: BadgeDollarSign,
  repair: Hammer,
  putty: PaintBucket,
  design: Brush,
  cleaning: SprayCan,
  documents: FileCheck2,
} satisfies Record<ServiceDetail["theme"], typeof Sparkles>;

const serviceCardImages: Record<string, string> = {
  "Принимаем заявку и фото": "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=640&q=80",
  "Проверяем базовые документы": "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=640&q=80",
  "Согласуем цену и сроки": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=640&q=80",
  "Доводим оформление до конца": "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=640&q=80",
  Квартиры: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=640&q=80",
  Дома: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=640&q=80",
  "Коммерческие помещения": "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=640&q=80",
  "Объекты после ремонта или без отделки": "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=640&q=80",
  "Замер и техническое задание": "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=640&q=80",
  "Черновые и чистовые работы": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=640&q=80",
  "Сантехника и электрика": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=640&q=80",
  "Комплектация и декор": "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=640&q=80",
  "Квартира перед продажей": "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=640&q=80",
  "Объект под аренду": "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=640&q=80",
  "Новостройка без отделки": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=640&q=80",
  "Косметическое обновление": "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=640&q=80",
  "Концепция интерьера": "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=640&q=80",
  "План мебели": "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=640&q=80",
  "Свет и электрика": "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?auto=format&fit=crop&w=640&q=80",
  "Материалы и цветовые решения": "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=640&q=80",
  "Подготовка квартиры к продаже": "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=640&q=80",
  "Интерьер для семьи": "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=640&q=80",
  "Обновление старого фонда": "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=640&q=80",
  "Визуальная упаковка объекта": "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=640&q=80",
  "Генеральная уборка": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=640&q=80",
  "Кухня и санузлы": "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=640&q=80",
  "Удаление пыли после ремонта": "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&w=640&q=80",
  "Подготовка перед заселением": "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=640&q=80",
  Офисы: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=640&q=80",
  "Проверка права собственности": "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=640&q=80",
  "Подготовка пакета": "https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=640&q=80",
  "Сопровождение купли-продажи": "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=640&q=80",
  "Консультация по рискам": "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=640&q=80",
  "Покупка квартиры": "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=640&q=80",
  "Продажа объекта": "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=640&q=80",
  Переоформление: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=640&q=80",
  "Подготовка к сделке": "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=640&q=80",
};

const serviceFallbackImages = {
  buyout: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=640&q=80",
  repair: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=640&q=80",
  putty: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=640&q=80",
  design: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=640&q=80",
  cleaning: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=640&q=80",
  documents: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=640&q=80",
} satisfies Record<ServiceDetail["theme"], string>;

const puttyCardImages: Record<string, string> = {
  "Осмотр объекта": "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=640&q=80",
  "Подбор материалов": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=640&q=80",
  "Шпаклевка стен": "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=640&q=80",
  "Проверка готовой поверхности": "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=640&q=80",
  "Экономия бюджета": "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=640&q=80",
  "Меньше подрядчиков": "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=640&q=80",
  "Быстрый старт ремонта": "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=640&q=80",
  "Понятные сроки работ": "https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=640&q=80",
};

const serviceItemIcons: Record<string, typeof Sparkles> = {
  "Осмотр объекта": Ruler,
  "Подбор материалов": PackageCheck,
  "Шпаклевка стен": Brush,
  "Проверка готовой поверхности": BadgeCheck,
  "Экономия бюджета": WalletCards,
  "Меньше подрядчиков": ShieldCheck,
  "Быстрый старт ремонта": TimerReset,
  "Понятные сроки работ": ClipboardCheck,
};

export default function ServiceDetailPage({ service }: { service: ServiceDetail }) {
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const ServiceIcon = serviceIcons[service.theme];

  return (
    <main className={`service-detail-page service-layout-${service.theme}`} data-theme={service.theme}>
      <section className="service-detail-hero">
        <div className="service-detail-shell service-detail-hero-grid">
          <div className="service-detail-copy">
            <Link className="service-detail-back" href="/services">
              Услуги
            </Link>
            <span className="service-detail-eyebrow">
              <Sparkles size={14} /> {service.eyebrow}
            </span>
            <h1>{service.title}</h1>
            <p>{service.description}</p>
            <div className="service-detail-actions" style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <a className="btn-primary" href="tel:+992055077777">
                Позвонить
              </a>
              <Link className="btn-secondary" href="/listings">
                Смотреть объявления
              </Link>
            </div>
          </div>

          <div className="service-detail-media">
            <Image src={service.image} alt={service.imageAlt} fill priority sizes="(max-width: 1024px) 100vw, 48vw" />
            <div className="service-hero-shapes" aria-hidden="true">
              <span className="service-shape service-shape-one"></span>
              <span className="service-shape service-shape-two"></span>
              <span className="service-shape service-shape-three"></span>
            </div>
            <div className="service-detail-float-card">
              <ServiceIcon size={20} />
              <strong>{service.shortTitle}</strong>
              <span>{service.priceLabel}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="service-detail-band">
        <div className="service-detail-shell service-detail-highlights">
          {service.highlights.map((item, index) => (
            <div key={item}>
              <span className="service-highlight-index">{String(index + 1).padStart(2, "0")}</span>
              <Check size={18} />
              <strong>{item}</strong>
            </div>
          ))}
        </div>
      </section>

      {service.sections.map((section, index) => (
        <section className="service-detail-section" key={section.title}>
          <div className={`service-detail-shell service-detail-info ${index % 2 ? "reverse" : ""}`}>
            <div className="service-detail-text-panel">
              <span className="service-detail-eyebrow">0{index + 1}</span>
              <h2>{section.title}</h2>
              <p>{section.text}</p>
            </div>
            <div className="service-detail-card-grid">
              {section.items.map((item) => {
                const ItemIcon = serviceItemIcons[item] ?? ServiceIcon;
                const image = puttyCardImages[item] ?? serviceCardImages[item] ?? serviceFallbackImages[service.theme];

                return (
                  <article className="service-detail-card" key={item}>
                    <div className="service-card-thumb" aria-hidden="true">
                      <Image src={image} alt="" fill sizes="160px" />
                    </div>
                    <ItemIcon className="service-card-theme-icon" size={22} />
                    <span></span>
                    <strong>{item}</strong>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ))}

      <section className="service-detail-section service-detail-muted">
        <div className="service-detail-shell service-detail-faq">
          <div>
            <span className="service-detail-eyebrow">Вопросы</span>
            <h2>Перед заявкой</h2>
          </div>
          <div className="service-detail-faq-list">
            {service.faq.map((item) => (
              <article className={openFaq === item.question ? "open" : ""} key={item.question}>
                <button
                  aria-expanded={openFaq === item.question}
                  onClick={() => setOpenFaq((current) => (current === item.question ? null : item.question))}
                  type="button"
                >
                  <span>{item.question}</span>
                  <Plus size={20} />
                </button>
                <p>{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>


      <section className="service-detail-section">
        <div className="service-detail-shell">
          <div className="service-detail-more-head">
            <span className="service-detail-eyebrow">Еще услуги</span>
            <h2>Сервисы Barakat Estate</h2>
          </div>
          <div className="service-detail-more-grid">
            {serviceList
              .filter((item) => item.slug !== service.slug)
              .map((item) => (
                <Link className="service-detail-more-card" data-theme={item.theme} href={item.href} key={item.slug}>
                  <strong>{item.shortTitle}</strong>
                  <span>{item.cardText}</span>
                  <b>
                    Подробнее <ArrowRight size={15} />
                  </b>
                </Link>
              ))}
          </div>
        </div>
      </section>
    </main>
  );
}
