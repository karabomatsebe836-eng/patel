import {
  ArrowRight, Award, CheckCircle, ChevronRight, Clock, Eye, Focus,
  Glasses, Heart, Phone, Shield, Star, Sun
} from 'lucide-react';
import { useRouter } from '../../contexts/RouterContext';
import { CLINIC, MEDICAL_AIDS, SERVICES } from '../../lib/siteData';
import type { Service } from '../../lib/types';

const ICON_MAP: Record<string, React.ReactNode> = {
  eye: <Eye className="w-6 h-6" />,
  glasses: <Glasses className="w-6 h-6" />,
  focus: <Focus className="w-6 h-6" />,
  sun: <Sun className="w-6 h-6" />,
  circle: <div className="w-6 h-6 rounded-full border-2 border-current" />,
  shield: <Shield className="w-6 h-6" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  'Eye Care': 'bg-teal-50 text-teal-700 border-teal-200',
  Eyewear: 'bg-blue-50 text-blue-700 border-blue-200',
  Prescriptions: 'bg-amber-50 text-amber-700 border-amber-200',
  Sunglasses: 'bg-orange-50 text-orange-700 border-orange-200',
  'Contact Lenses': 'bg-green-50 text-green-700 border-green-200',
  'Medical Aid': 'bg-cyan-50 text-cyan-700 border-cyan-200',
};

const ICON_BG: Record<string, string> = {
  'Eye Care': 'bg-teal-600',
  Eyewear: 'bg-blue-600',
  Prescriptions: 'bg-amber-600',
  Sunglasses: 'bg-orange-600',
  'Contact Lenses': 'bg-green-600',
  'Medical Aid': 'bg-cyan-600',
};

function ServiceCard({ service }: { service: Service }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all group">
      <div className={`w-12 h-12 rounded-xl ${ICON_BG[service.category || ''] || 'bg-blue-600'} text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        {ICON_MAP[service.icon_name || ''] || <Eye className="w-6 h-6" />}
      </div>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight">{service.name}</h3>
        <span className={`text-[10px] font-medium border px-2 py-0.5 rounded-full shrink-0 ${CATEGORY_COLORS[service.category || ''] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
          {service.category}
        </span>
      </div>
      <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2">{service.description}</p>
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-400 flex items-center gap-1"><Clock size={12} /> {service.duration_minutes} min</div>
        {service.price && <div className="text-sm font-semibold text-blue-700">From R{service.price.toLocaleString()}</div>}
      </div>
    </div>
  );
}

export default function Home() {
  const { navigate } = useRouter();

  return (
    <div className="min-h-screen">
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/glasses-direct-banner.png')" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950/90 via-blue-900/75 to-teal-900/40" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3 py-1 rounded-full text-xs font-medium mb-6 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              Clear vision starts here
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              See Life More Clearly
              <span className="block text-teal-400">with Glasses Direct</span>
            </h1>
            <p className="text-lg text-blue-100 leading-relaxed mb-8 max-w-xl">
              Personalised optometry and quality eyewear in the heart of Kimberley. From comprehensive eye tests to prescription glasses and sunglasses, your vision is in caring hands.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => navigate('/register')} className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg shadow-teal-500/30">
                Book an Eye Test <ArrowRight size={18} />
              </button>
              <button onClick={() => navigate('/services')} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/30 px-6 py-3 rounded-xl font-semibold transition-all backdrop-blur-sm">
                Explore Our Services <ChevronRight size={18} />
              </button>
            </div>
            <div className="flex flex-wrap gap-6 mt-12 pt-8 border-t border-white/20">
              {[
                { value: 'UV', label: 'Protection for your eyes' },
                { value: '6+', label: 'Trusted medical aids' },
                { value: '1:1', label: 'Personalised attention' },
                { value: '8301', label: 'Kimberley location' },
              ].map((stat) => <div key={stat.label}><div className="text-2xl font-bold text-white">{stat.value}</div><div className="text-xs text-blue-200">{stat.label}</div></div>)}
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce"><div className="w-px h-8 bg-white/40" /><div className="w-1.5 h-1.5 rounded-full bg-white/60" /></div>
      </section>

      <section className="bg-blue-700 text-white py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: <Clock size={18} />, text: 'Mon–Fri 08:00–17:00' },
            { icon: <Phone size={18} />, text: CLINIC.phone },
            { icon: <Shield size={18} />, text: 'Medical Aid Accepted' },
            { icon: <Sun size={18} />, text: 'Prescription sunglasses' }
          ].map((item) => <div key={item.text} className="flex items-center justify-center gap-2 text-sm font-medium text-blue-100"><span className="text-teal-300 shrink-0">{item.icon}</span>{item.text}</div>)}
        </div></div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14"><span className="text-teal-600 font-semibold text-sm uppercase tracking-wider">What We Offer</span><h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">Complete Eye Care for Everyday Life</h2><p className="text-gray-500 mt-3 max-w-xl mx-auto">Professional advice, dependable eye care, and frames to suit your style, comfort, and prescription.</p></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{SERVICES.map((service) => <ServiceCard key={service.id} service={service} />)}</div>
          <div className="text-center mt-10"><button onClick={() => navigate('/services')} className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 shadow-md shadow-blue-700/20">View All Services <ArrowRight size={18} /></button></div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <div><span className="text-teal-600 font-semibold text-sm uppercase tracking-wider">Why Choose Us</span><h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-6">Thoughtful Eye Care<br />You Can Trust</h2><div className="space-y-5">
            {[
              { icon: <Award size={20} />, title: 'Personalised attention', desc: 'Take the time to discuss your vision, answer your questions, and find the right solution for you.' },
              { icon: <Eye size={20} />, title: 'Complete eye care', desc: 'From eye examinations to lenses and frames, we support your vision journey in one welcoming practice.' },
              { icon: <Heart size={20} />, title: 'Quality you can feel', desc: 'Choose eyewear that combines clear vision, lasting comfort, and a style that feels like you.' },
              { icon: <CheckCircle size={20} />, title: 'Medical aid friendly', desc: `We work with ${MEDICAL_AIDS.slice(0, 4).join(', ')} and other contracted medical aids.` },
            ].map((item) => <div key={item.title} className="flex items-start gap-4"><div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">{item.icon}</div><div><div className="font-semibold text-gray-900 text-sm">{item.title}</div><div className="text-gray-500 text-sm mt-1 leading-relaxed">{item.desc}</div></div></div>)}
          </div></div>
          <div className="relative"><div className="rounded-2xl overflow-hidden shadow-xl"><img src="/images/image copy 2.png" alt="Eyewear display at Glasses Direct" className="w-full h-80 object-cover" /></div><div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-5 max-w-[190px]"><div className="flex gap-0.5 mb-2">{[1,2,3,4,5].map((i) => <Star key={i} size={14} className="text-amber-400 fill-amber-400" />)}</div><p className="text-xs text-gray-600 leading-relaxed italic">“Professional care and a great selection of frames.”</p><p className="text-xs font-semibold text-gray-800 mt-2">— A Kimberley patient</p></div><div className="absolute -top-4 -right-4 bg-teal-500 text-white rounded-2xl p-4 text-center shadow-lg"><div className="text-2xl font-bold">UV</div><div className="text-xs text-teal-100">Eye protection</div></div></div>
        </div></div>
      </section>

      <section className="py-20 bg-gradient-to-r from-blue-700 to-teal-600 text-white"><div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"><h2 className="text-3xl md:text-4xl font-bold mb-4">Your Clearer View Starts Here</h2><p className="text-blue-100 mb-8 max-w-xl mx-auto">Visit Glasses Direct at 97 Jones Street, Kimberley, or get in touch to arrange your next eye test.</p><div className="flex flex-wrap gap-4 justify-center"><button onClick={() => navigate('/register')} className="flex items-center gap-2 bg-white text-blue-700 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all hover:scale-105 shadow-lg">Book an Eye Test <ArrowRight size={18} /></button><a href={CLINIC.phoneHref} className="flex items-center gap-2 bg-white/10 border border-white/30 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition-all"><Phone size={18} /> Call {CLINIC.phone}</a></div></div></section>
    </div>
  );
}
