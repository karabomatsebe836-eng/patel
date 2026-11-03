import { Facebook, Clock, MapPin, Mail, MessageCircle, Phone } from 'lucide-react';
import { CLINIC } from '../../lib/siteData';

export default function Contact() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="bg-gradient-to-br from-blue-700 to-teal-600 text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-3">Contact Glasses Direct</h1>
          <p className="text-blue-200 max-w-lg mx-auto">
            Contact us by phone, email, or WhatsApp to arrange your eye care.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-5">Contact Information</h2>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">Address</div>
                    <div className="text-gray-500 text-sm mt-0.5 leading-relaxed">{CLINIC.address}</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-green-50 text-green-700 flex items-center justify-center shrink-0">
                    <Phone size={18} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">Phone</div>
                    <div className="mt-1 space-y-1">
                      {CLINIC.phones.map((phone) => (
                        <a
                          key={phone.number}
                          href={phone.phoneHref}
                          className="block text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                        >
                          {phone.number}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                    <MessageCircle size={18} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">WhatsApp</div>
                    <div className="mt-1 space-y-1">
                      {CLINIC.phones.map((phone) => (
                        <a
                          key={phone.number}
                          href={phone.whatsappHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-green-600 hover:text-green-800 text-sm font-medium transition-colors"
                        >
                          Chat on WhatsApp: {phone.number}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                    <Mail size={18} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">Email</div>
                    <a href={CLINIC.emailHref} className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors">
                      {CLINIC.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                    <Facebook size={18} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">Facebook</div>
                    <a href={CLINIC.facebookHref} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors">
                      Follow Glasses Direct
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                <Clock size={18} className="text-blue-600" />Operating Hours
              </h2>
              <div className="space-y-2.5 text-sm">
                {[
                  { day: 'Monday – Friday', hours: '08:00 – 17:00', open: true },
                  { day: 'Saturday', hours: '08:00 – 13:00', open: true },
                  { day: 'Sunday', hours: 'Closed', open: false },
                  { day: 'Public Holidays', hours: 'Please call', open: false },
                ].map((row) => (
                  <div key={row.day} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-gray-600">{row.day}</span>
                    <span className={`font-semibold ${row.open ? 'text-teal-700' : 'text-gray-400'}`}>{row.hours}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs text-amber-800 font-medium">
                  Please call ahead to confirm availability and medical aid requirements.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full min-h-[400px]">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Find Us</h2>
                <p className="text-gray-500 text-sm">{CLINIC.address}</p>
              </div>
              <iframe
                title="Glasses Direct location"
                width="100%"
                height="450"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={CLINIC.mapHref}
              />
            </div>
          </div>
        </div>

        <div className="mt-10 bg-blue-50 border border-blue-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-blue-800 text-lg">Looking for new eyewear?</h3>
            <p className="text-blue-600 text-sm mt-1">Ask about prescription sunglasses and our current offers.</p>
          </div>
          <a href={CLINIC.phoneHref} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap shadow-md shadow-blue-600/20">
            <Phone size={18} /> Call {CLINIC.phone}
          </a>
        </div>
      </div>
    </div>
  );
}
