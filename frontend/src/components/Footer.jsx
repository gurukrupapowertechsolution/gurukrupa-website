import React from 'react';
import { Link } from 'react-router-dom';
import { Download, MapPin, Mail, Phone, Clock } from 'lucide-react';
import WhatsAppIcon from './WhatsAppIcon';
import Logo from './Logo';
import {
  ADDRESS_LINES,
  EMAIL,
  PHONE_DISPLAY,
  PHONE_HREF,
  WHATSAPP_HREF,
  WORKING_HOURS_SHORT,
} from '../data/businessInfo';

export default function Footer() {
  return (
    <footer style={{ background: 'linear-gradient(180deg, #0A2540 0%, #061524 100%)', borderTop: '1px solid rgba(245,166,35,0.12)' }}>
      <div className="container-site py-16 md:py-20">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
          {/* Column 1: Brand & Contact Essentials */}
          <div className="flex flex-col gap-6">
            <Logo className="h-20 self-start" onDark />
            <p className="text-sm text-white/70 leading-relaxed">
              <span className="font-semibold text-white">28 years</span> of engineering legacy,
              5 years of solar excellence — powering Gujarat with premium commercial and residential
              solar.
            </p>
            <div className="space-y-4 text-sm text-white/60">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary-token flex-shrink-0 mt-0.5" />
                <span>
                  {ADDRESS_LINES.map((line) => (
                    <span key={line} className="block">{line}</span>
                  ))}
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-primary-token flex-shrink-0 mt-0.5" />
                <span className="break-all">{EMAIL}</span>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-primary-token flex-shrink-0 mt-0.5" />
                <a href={PHONE_HREF} className="hover:text-white transition-colors focus-ring rounded-sm">{PHONE_DISPLAY}</a>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-primary-token flex-shrink-0 mt-0.5" />
                <span>{WORKING_HOURS_SHORT}</span>
              </div>
            </div>
            <Link
              to="/quote?tab=contact"
              className="inline-flex justify-center items-center rounded-md bg-white text-secondary-token px-6 py-3 text-sm font-semibold hover:-translate-y-1 hover:shadow-xl transition-all focus-ring mt-2 w-max"
            >
              Contact Us
            </Link>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-6">Quick Links</h3>
            <ul className="space-y-4 text-sm">
              <li>
                <Link to="/projects" className="text-white/60 hover:text-white transition-colors focus-ring inline-block">
                  Projects
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-white/60 hover:text-white transition-colors focus-ring inline-block">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/quote?tab=contact" className="text-white/60 hover:text-white transition-colors focus-ring inline-block">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/quote" className="text-white/60 hover:text-white transition-colors focus-ring inline-block">
                  Get a Quote
                </Link>
              </li>
              <li>
                <Link to="/roi-calculator" className="text-white/60 hover:text-white transition-colors focus-ring inline-block">
                  EMI/ROI Calculator
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-white/60 hover:text-white transition-colors focus-ring inline-block">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: About Us */}
          <div>
            <h3 className="text-white font-semibold mb-6">About Us</h3>
            {/* Phase 2 (round 2) — these were homepage anchors (/#why-solar and
                friends). Those sections are now standalone pages, so the links
                are real routes. "Why Gurukrupa" is a section within /about
                rather than a page of its own, hence the fragment — the
                [id] scroll-margin rule in index.css keeps the heading clear of
                the fixed header on arrival. */}
            <ul className="space-y-4 text-sm">
              <li>
                <Link to="/about" className="text-white/60 hover:text-white transition-colors focus-ring inline-block">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/why-solar" className="text-white/60 hover:text-white transition-colors focus-ring inline-block">
                  Why Solar
                </Link>
              </li>
              <li>
                <Link to="/about#why-gurukrupa" className="text-white/60 hover:text-white transition-colors focus-ring inline-block">
                  Why Gurukrupa
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal & Brochure */}
          <div>
            <h3 className="text-white font-semibold mb-6">Legal</h3>
            <ul className="space-y-4 text-sm mb-8">
              <li>
                <Link to="/privacy-policy" className="text-white/60 hover:text-white transition-colors focus-ring inline-block">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-and-conditions" className="text-white/60 hover:text-white transition-colors focus-ring inline-block">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
            
            <h3 className="text-white font-semibold mb-4 text-sm">Resources</h3>
            <button
              disabled
              aria-disabled="true"
              className="focus-ring inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold bg-white/10 text-white/50 cursor-not-allowed hover:bg-white/10 transition-colors"
              title="Brochure coming soon"
            >
              <Download className="w-4 h-4" /> Download Brochure
            </button>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40 text-center md:text-left">
            © {new Date().getFullYear()} Gurukrupa Powertech Solutions. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a 
              href={WHATSAPP_HREF}
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors focus-ring text-white/60 hover:text-white"
              aria-label="WhatsApp"
            >
              <WhatsAppIcon className="w-5 h-5" />
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
