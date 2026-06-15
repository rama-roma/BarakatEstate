import Image from "next/image";
import Link from "next/link";
import { Camera, Phone, Send } from "lucide-react";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <div>
              <Image src="/barakat.PNG" alt="Barakat Estate" width={100} height={78} priority />
            </div>
            <p>Платформа по поиску недвижимости в Душанбе. Помогаем найти дом вашей мечты.</p>
            <div className="footer-social">
              <a className="soc-btn" href="tel:+992000000000" aria-label="Телефон">
                <Phone size={16} color="#a97c32" />
              </a>
              <a className="soc-btn" href="https://t.me/" aria-label="Telegram">
                <Send size={16} color="#a97c32" />
              </a>
              <a className="soc-btn" href="https://instagram.com/" aria-label="Instagram">
                <Camera size={16} color="#a97c32" />
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
            <a href="tel:+992000000000">+992 000 00 00</a>
            <a href="mailto:info@barakat.estate">info@barakat.estate</a>
            <Link href="/map">Карта объектов</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 Barakat Estate. Все права защищены.</p>
          <span>Душанбе, Таджикистан</span>
        </div>
      </div>
    </footer>
  );
}
