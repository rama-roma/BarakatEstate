import Image from "next/image";
import Link from "next/link";
import { Phone, Send } from "lucide-react";

const InstagramIcon = ({ size = 24, color = "currentColor" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

export default async function SiteFooter() {
  const baseUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:3001";
  let profile = null;

  try {
    const res = await fetch(`${baseUrl}/api/profile`, { next: { revalidate: 60 } });
    if (res.ok) {
      const payload = await res.json();
      profile = payload.data;
    }
  } catch (error) {
    console.error("Failed to fetch profile for footer:", error);
  }

  const phone = "+992 055 07 77 77";
  const email = profile?.email || "info@barakat.tj";
  const desc = profile?.description || "Платформа по поиску недвижимости в Душанбе. Помогаем найти дом вашей мечты.";
  
  // Clean up links
  const tgLink = profile?.telegram?.startsWith("http") ? profile.telegram : `https://t.me/${profile?.telegram?.replace("@", "") || ""}`;
  const igLink = profile?.instagram?.startsWith("http") ? profile.instagram : `https://instagram.com/${profile?.instagram?.replace("@", "") || ""}`;

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <div>
              <Image src={profile?.logoUrl || "/barakat.PNG"} alt={profile?.name || "Barakat Estate"} width={100} height={78} priority />
            </div>
            <p>{desc}</p>
            <div className="footer-social">
              <a className="soc-btn" href={`tel:${phone.replace(/\s/g, '')}`} aria-label="Телефон">
                <Phone size={16} color="#a97c32" />
              </a>
              {profile?.telegram && (
                <a className="soc-btn" href={tgLink} aria-label="Telegram" target="_blank" rel="noopener noreferrer">
                  <Send size={16} color="#a97c32" />
                </a>
              )}
              <a className="soc-btn" href={profile?.instagram ? igLink : "https://www.instagram.com/barakat.estatee?igsh=b3E3YzBwejJ6bXJt"} aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                <InstagramIcon size={16} color="#a97c32" />
              </a>
            </div>
          </div>

          <div className="footer-col">
            <h4>Каталог</h4>
            <Link href="/listings">Квартиры</Link>
            <Link href="/listings">Дома</Link>
            <Link href="/listings">Студии</Link>
            <Link href="/listings">Коммерческая</Link>
          </div>

          <div className="footer-col">
            <h4>Услуги</h4>
            <Link href="/buy-property">Срочный выкуп</Link>
            <Link href="/repair">Ремонт под ключ</Link>
            <Link href="/design">Дизайн</Link>
            <Link href="/document-registration">Документы</Link>
          </div>

          <div className="footer-col">
            <h4>Контакты</h4>
            <a href={`tel:${phone.replace(/\s/g, '')}`}>{phone}</a>
            <a href={`mailto:${email}`}>{email}</a>
            <Link href="/map">Карта объектов</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} {profile?.name || "Barakat Estate"}. Все права защищены.</p>
          <span>Душанбе, Таджикистан</span>
        </div>
      </div>
    </footer>
  );
}
