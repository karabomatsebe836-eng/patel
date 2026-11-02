import { useState } from 'react';
import { ArrowRight, Circle, Clock, Eye, Focus, Glasses, Shield, Star, Sun } from 'lucide-react';
import { useRouter } from '../../contexts/RouterContext';
import { SERVICES } from '../../lib/siteData';
import type { Service } from '../../lib/types';

const ICON_MAP: Record<string, React.ReactNode> = {
  eye: <Eye className="w-7 h-7" />, glasses: <Glasses className="w-7 h-7" />, focus: <Focus className="w-7 h-7" />,
  sun: <Sun className="w-7 h-7" />, circle: <Circle className="w-7 h-7" />, shield: <Shield className="w-7 h-7" />,
};
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  'Eye Care': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', icon: 'bg-teal-600' },
  Eyewear: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: 'bg-blue-600' },
  Prescriptions: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: 'bg-amber-600' },
  Sunglasses: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: 'bg-orange-600' },
  'Contact Lenses': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: 'bg-green-600' },
  'Medical Aid': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', icon: 'bg-cyan-600' },
};

function ServiceCard({ service }: { service: Service }) {
  const colors = CATEGORY_COLORS[service.category || ''] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: 'bg-gray-600' };
  return <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all group"><div className={`w-14 h-14 rounded-xl ${colors.icon} text-white flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>{ICON_MAP[service.icon_name || ''] || <Star className="w-7 h-7" />}</div><div className="flex items-start justify-between gap-2 mb-2"><h3 className="font-bold text-gray-900 leading-snug">{service.name}</h3><span className={`text-[10px] font-semibold border px-2 py-0.5 rounded-full shrink-0 ${colors.bg} ${colors.text} ${colors.border}`}>{service.category}</span></div><p className="text-gray-500 text-sm leading-relaxed mb-5">{service.description}</p><div className="flex items-center justify-between pt-4 border-t border-gray-100"><div className="flex items-center gap-1 text-xs text-gray-400"><Clock size={13} />{service.duration_minutes} min</div>{service.price && <div className="text-sm font-bold text-blue-700">From R{Number(service.price).toLocaleString()}</div>}</div></div>;
}

export default function Services() {
  const { navigate } = useRouter();
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', ...Array.from(new Set(SERVICES.map((service) => service.category || 'Other')))];
  const filtered = activeCategory === 'All' ? SERVICES : SERVICES.filter((service) => service.category === activeCategory);

  return <div className="min-h-screen pt-24 pb-16"><div className="bg-gradient-to-br from-blue-700 via-blue-800 to-teal-700 text-white py-16"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"><h1 className="text-4xl md:text-5xl font-bold mb-4">Our Optometry Services</h1><p className="text-blue-200 max-w-xl mx-auto text-lg">Professional eye care and eyewear solutions for you and your family, all under one roof.</p></div></div><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12"><div className="flex flex-wrap gap-2 mb-10">{categories.map((category) => <button key={category} onClick={() => setActiveCategory(category)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeCategory === category ? 'bg-blue-700 text-white shadow-md shadow-blue-700/20' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-700'}`}>{category}</button>)}</div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{filtered.map((service) => <ServiceCard key={service.id} service={service} />)}</div><div className="mt-14 bg-gradient-to-r from-blue-700 to-teal-600 rounded-2xl p-8 md:p-12 text-white text-center"><h2 className="text-2xl md:text-3xl font-bold mb-3">Ready for a clearer view?</h2><p className="text-blue-100 mb-6 max-w-lg mx-auto">Book an eye test or contact Mohamed Patel Optometrist to find the right care and eyewear for you.</p><button onClick={() => navigate('/register')} className="inline-flex items-center gap-2 bg-white text-blue-700 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all hover:scale-105 shadow-lg">Book an Eye Test <ArrowRight size={18} /></button></div></div></div>;
}
