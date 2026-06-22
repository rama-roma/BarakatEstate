"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { CheckCircle, Phone, Star } from "lucide-react";

type Seller = {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  whatsapp: string;
  telegram: string;
  instagram: string;
  facebook: string;
  avatar: string;
  bio: string;
  rating: number;
  dealsCount: number;
  experienceYears: number;
  specializations: string;
  role: string;
};

type Listing = {
  id: string;
  slug?: string;
  title: string;
  dealType: "sale" | "rent";
  price: number;
  currency: "USD" | "TJS";
  address: string;
  district: string;
  rooms: number;
  area: number;
  floor?: number;
  totalFloors?: number;
  mainImage: { url: string } | string | null;
  sellerId: string;
  status: "draft" | "published"; 
};

type AuraRuntimeWindow = Window &
  typeof globalThis & {
    mapAdminListing?: (item: Listing) => unknown;
    propCard?: (item: unknown) => string;
    initCardSliders?: () => void;
  };

function formatPrice(value: number, currency: string) {
  let rawPrice = Number(value || 0);
  if (currency === "USD" || !currency) {
    rawPrice = Math.round(rawPrice * 10.6);
  }
  const amount = rawPrice.toLocaleString("ru-RU").replace(/\u00a0/g, " ");
  return `${amount} смн`;
}

void formatPrice;

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "B"
  );
}

function phoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

function socialUrl(type: "telegram" | "instagram", value: string) {
  if (!value) return "";
  if (value.startsWith("http")) return value;
  const clean = value.replace(/^@/, "");
  return type === "telegram" ? `https://t.me/${clean}` : `https://instagram.com/${clean}`;
}

function PropertyCard({ item }: { item: Listing }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const runtimeWindow = window as AuraRuntimeWindow;

    if (runtimeWindow.mapAdminListing && runtimeWindow.propCard) {
      // Use the global parser to match exactly what the rest of the site expects
      const mapped = runtimeWindow.mapAdminListing(item);
      
      if (containerRef.current) {
        // Render the exact same HTML template as the main page
        containerRef.current.innerHTML = runtimeWindow.propCard(mapped);
        
        // Initialize the slider logic for this new card
        setTimeout(() => {
          if (runtimeWindow.initCardSliders) {
            runtimeWindow.initCardSliders();
          }
        }, 50);
      }
    }
  }, [item]);

  // Use display: contents so the injected <a> tag becomes a direct child of the CSS grid
  return <div ref={containerRef} style={{ display: 'contents' }} />;
}

export default function SellerProfilePage() {
  const searchParams = useSearchParams();
  const sellerId = searchParams.get("seller") || "";
  const [seller, setSeller] = useState<Seller | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const baseUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:3001";

    async function loadSeller() {
      if (!sellerId) {
        setError("Продавец не выбран");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [sellerResponse, listingsResponse] = await Promise.all([
          fetch(`/api/sellers/${encodeURIComponent(sellerId)}`, { cache: "no-store" }),
          fetch(`${baseUrl}/api/listings`, { cache: "no-store" }),
        ]);

        if (!sellerResponse.ok) {
          throw new Error("Продавец не найден");
        }

        const sellerPayload = await sellerResponse.json();
        const listingsPayload = await listingsResponse.json();
        const sellerListings = ((listingsPayload.data || []) as Listing[]).filter(
          (item) => item.sellerId === sellerId && item.status !== "draft",
        );

        if (!ignore) {
          setSeller(sellerPayload.data);
          setListings(sellerListings);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : "Не удалось загрузить профиль");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadSeller();

    return () => {
      ignore = true;
    };
  }, [sellerId]);

  if (loading) {
    return (
      <main className="agent-page">
        <section className="listings-section">
          <div className="container">
            <div className="seller-public-empty">Загружаем профиль продавца...</div>
          </div>
        </section>
      </main>
    );
  }

  if (error || !seller) {
    return (
      <main className="agent-page">
        <section className="listings-section">
          <div className="container">
            <div className="seller-public-empty">{error || "Профиль продавца не найден"}</div>
          </div>
        </section>
      </main>
    );
  }

  const avatarText = initials(seller.name);
  const profileLine = seller.bio || `${seller.specializations || "Продавец недвижимости"} · Barakat Estate`;
  const whatsapp = seller.whatsapp || seller.phone;
  const telegramUrl = socialUrl("telegram", seller.telegram);
  const instagramUrl = socialUrl("instagram", seller.instagram);

  return (
    <main className="agent-page">
      <section className="agent-hero">
        <div className="agent-hero-inner">
          <div className="agent-avatar">
            {seller.avatar ? (
              <Image src={seller.avatar} alt={seller.name} width={120} height={120} unoptimized />
            ) : (
              avatarText
            )}
          </div>

          <div className="agent-info">
            <h1>{seller.name}</h1>
            <p>{profileLine}</p>
            <div className="agent-badges">
              <span className="agent-badge">
                <Star size={14} className="lucide-star" /> {seller.rating || 5}
              </span>
              <span className="agent-badge">{seller.dealsCount || 0} сделок</span>
              <span className="agent-badge">
                <CheckCircle size={14} /> Проверен
              </span>
              {seller.specializations ? <span className="agent-badge">{seller.specializations}</span> : null}
            </div>
          </div>

        </div>
      </section>

      <section className="seller-contact-strip">
        <div className="container seller-contact-inner">
          {seller.phone ? (
            <a className="seller-contact-link contact-link-phone" href={`tel:${seller.phone}`}>
              <div className="icon-wrap"><Phone size={18} /></div>
              <span>
                <small>Телефон</small>
                <strong>{seller.phone}</strong>
              </span>
            </a>
          ) : null}
          {whatsapp ? (
            <a className="seller-contact-link contact-link-wa" href={`https://wa.me/${phoneDigits(whatsapp)}`}>
              <div className="icon-wrap"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg></div>
              <span>
                <small>WhatsApp</small>
                <strong>{whatsapp}</strong>
              </span>
            </a>
          ) : null}
          {telegramUrl ? (
            <a className="seller-contact-link contact-link-tg" href={telegramUrl}>
              <div className="icon-wrap"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg></div>
              <span>
                <small>Telegram</small>
                <strong>{seller.telegram}</strong>
              </span>
            </a>
          ) : null}
          {instagramUrl ? (
            <a className="seller-contact-link contact-link-ig" href={instagramUrl}>
              <div className="icon-wrap"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg></div>
              <span>
                <small>Instagram</small>
                <strong>{seller.instagram}</strong>
              </span>
            </a>
          ) : null}
          {seller.email ? (
            <a className="seller-contact-link contact-link-email" href={`mailto:${seller.email}`}>
              <div className="icon-wrap"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/></svg></div>
              <span>
                <small>Email</small>
                <strong>{seller.email}</strong>
              </span>
            </a>
          ) : null}
        </div>
      </section>

      <section className="seller-agent-stats">
        <div className="container seller-agent-stats-inner">
          <div className="stat-item">
            <div className="stat-num">{seller.dealsCount || 0}</div>
            <div className="stat-label">Успешных сделок</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">
              {listings.length}
              <span>+</span>
            </div>
            <div className="stat-label">Активных объявлений</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">
              {seller.rating || 5}
              <span>
                <Star size={18} className="lucide-star" />
              </span>
            </div>
            <div className="stat-label">Средняя оценка</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">
              {seller.experienceYears || 0}
              <span>лет</span>
            </div>
            <div className="stat-label">Опыт работы</div>
          </div>
        </div>
      </section>

      <section className="listings-section">
        <div className="container">
          <div className="section-header seller-agent-section-head">
            <div className="section-eyebrow">Объявления</div>
            <h2 className="section-title">
              Объявления <strong style={{ color: 'var(--gold-dark)', fontWeight: 800, fontSize: '0.85em' }}>{seller.name}</strong>
            </h2>
          </div>

          {listings.length ? (
            <div className="grid-3">
              {listings.map((item) => (
                <PropertyCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="seller-public-empty">У продавца пока нет опубликованных объявлений.</div>
          )}
        </div>
      </section>
    </main>
  );
}
