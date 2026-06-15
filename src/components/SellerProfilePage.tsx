"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Camera, CheckCircle, Mail, MapPin, MessageCircle, Phone, Send, Star, UserRound } from "lucide-react";

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

function imageUrl(value: Listing["mainImage"]) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.url || "";
}

function formatPrice(value: number, currency: string) {
  const amount = Number(value || 0).toLocaleString("ru-RU").replace(/\u00a0/g, " ");
  return currency === "TJS" ? `${amount} TJS` : `$${amount}`;
}

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
            <a className="seller-contact-link primary" href={`tel:${seller.phone}`}>
              <Phone size={18} />
              <span>
                <small>Телефон</small>
                <strong>{seller.phone}</strong>
              </span>
            </a>
          ) : null}
          {whatsapp ? (
            <a className="seller-contact-link" href={`https://wa.me/${phoneDigits(whatsapp)}`}>
              <MessageCircle size={18} />
              <span>
                <small>WhatsApp</small>
                <strong>{whatsapp}</strong>
              </span>
            </a>
          ) : null}
          {telegramUrl ? (
            <a className="seller-contact-link" href={telegramUrl}>
              <Send size={18} />
              <span>
                <small>Telegram</small>
                <strong>{seller.telegram}</strong>
              </span>
            </a>
          ) : null}
          {instagramUrl ? (
            <a className="seller-contact-link" href={instagramUrl}>
              <Camera size={18} />
              <span>
                <small>Instagram</small>
                <strong>{seller.instagram}</strong>
              </span>
            </a>
          ) : null}
          {seller.email ? (
            <a className="seller-contact-link" href={`mailto:${seller.email}`}>
              <Mail size={18} />
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
              Объявления <strong>{seller.name}</strong>
            </h2>
          </div>

          {listings.length ? (
            <div className="grid-3">
              {listings.map((item) => {
                const url = imageUrl(item.mainImage);
                const propertyId = item.slug || item.id;
                return (
                  <a className="prop-card seller-agent-card" href={`/property?id=${encodeURIComponent(propertyId)}`} key={item.id}>
                    <div className="prop-img">
                      {url ? (
                        <Image src={url} alt={item.title} width={420} height={260} unoptimized />
                      ) : (
                        <UserRound size={54} strokeWidth={1.5} />
                      )}
                      <div className="prop-tags">
                        <span className={`tag tag-${item.dealType === "rent" ? "rent" : "sale"}`}>
                          {item.dealType === "rent" ? "Аренда" : "Продажа"}
                        </span>
                      </div>
                    </div>
                    <div className="prop-body">
                      <div className="prop-price">
                        {formatPrice(item.price, item.currency)}{" "}
                        <small>{item.dealType === "rent" ? "Аренда" : "Продажа"}</small>
                      </div>
                      <div className="prop-addr">
                        <MapPin size={14} /> {item.address || item.district || "Душанбе"}
                      </div>
                      <div className="prop-meta">
                        <span>
                          <strong>{item.rooms || 0}</strong> комн
                        </span>
                        <span>
                          <strong>{item.area || 0}</strong> м²
                        </span>
                        <span>
                          <strong>{item.floor && item.totalFloors ? `${item.floor}/${item.totalFloors}` : item.floor || "-"}</strong> эт
                        </span>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="seller-public-empty">У продавца пока нет опубликованных объявлений.</div>
          )}
        </div>
      </section>
    </main>
  );
}

