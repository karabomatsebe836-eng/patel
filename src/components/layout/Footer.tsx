import { Phone, MapPin, Mail, Clock, Facebook, MessageCircle } from 'lucide-react';
import { useRouter } from '../../contexts/RouterContext';
import { CLINIC } from '../../lib/siteData';

export default function Footer() {
  const { navigate } = useRouter();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2C8 2 6 5 6 8c0 2 .5 3.5 1 5 .5 1.5 1 3 1 5 0 1 .5 2 2 2h4c1.5 0 2-1 2-2 0-2 .5-3.5 1-5 .5-1.5 1-3 1-5 0-3-2-6-6-6z"/>
                </svg>
              </div>
              <div>
                <div className="font-bold text-white text-sm">{CLINIC.name}</div>
                <div className="text-xs text-teal-400">Helping Kimberley see clearly</div>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Professional optometry and quality eyewear in the heart of Kimberley. We are committed to
              helping every patient find clearer, more comfortable vision.
            </p>
            <div className="flex gap-3 mt-5">
              <a href={CLINIC.facebookHref} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-blue-600 flex items-center justify-center transition-colors" aria-label="Facebook">
                <Facebook size={15} />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: 'Home', path: '/' },
                { label: 'Our Services', path: '/services' },
                { label: 'Book Appointment', path: '/register' },
                { label: 'Patient Portal', path: '/login' },
                { label: 'Contact Us', path: '/contact' },
              ].map((item) => (
                <li key={item.path}>
                  <button
                    onClick={() => navigate(item.path)}
                    className="text-gray-400 hover:text-teal-400 transition-colors"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Our Services</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              {['Eye Examinations', 'Prescription Frames', 'Prescription Sunglasses', 'Single Vision Glasses', 'Contact Lenses', 'Medical Aid Eye Care'].map((s) => (
                <li key={s}>
                  <button onClick={() => navigate('/services')} className="hover:text-teal-400 transition-colors">{s}</button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Contact Info</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="text-teal-400 mt-0.5 shrink-0" />
                <span className="text-gray-400">{CLINIC.address}</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone size={16} className="text-teal-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  {CLINIC.phones.map((phone) => (
                    <a key={phone.number} href={phone.phoneHref} className="block text-gray-400 hover:text-teal-400 transition-colors">{phone.number}</a>
                  ))}
                </div>
              </li>
              <li className="flex items-center gap-3">
                <MessageCircle size={16} className="text-teal-400 shrink-0" />
                <a href={CLINIC.whatsappHref} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-teal-400 transition-colors">WhatsApp Glasses Direct</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-teal-400 shrink-0" />
                <a href={CLINIC.emailHref} className="text-gray-400 hover:text-teal-400 transition-colors">{CLINIC.email}</a>
              </li>
              <li className="flex items-start gap-3">
                <Clock size={16} className="text-teal-400 mt-0.5 shrink-0" />
                <div className="text-gray-400 text-xs leading-relaxed">
                  Mon–Fri: 08:00 – 17:00<br />
                  Saturday: 08:00 – 13:00<br />
                  Sunday: Closed
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} {CLINIC.name}. All rights reserved.</p>
          <p>{CLINIC.address}</p>
        </div>
      </div>
    </footer>
  );
}
