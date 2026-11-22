import { Link } from 'react-router-dom';
import { FileText, Shield, Zap, CheckCircle, ArrowRight } from 'lucide-react';

const features = [
  {
    icon: FileText,
    title: 'Bates Stamping',
    description: 'Add sequential page numbers with customizable prefixes, fonts, positions, and colors to your legal documents.',
    href: '/bates',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: Shield,
    title: 'Permanent Redaction',
    description: 'Irreversibly remove sensitive content from PDFs. Not just visual overlay—content is permanently deleted.',
    href: '/redact',
    color: 'text-red-600',
    bg: 'bg-red-50',
  },
  {
    icon: Zap,
    title: 'Fast & Secure',
    description: 'RAM-only processing with no file storage. Files are processed in memory and never written to disk.',
    href: '/bates',
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
];

const stats = [
  { value: '50MB', label: 'Max File Size' },
  { value: 'RAM Only', label: 'Processing' },
  { value: 'AES-256', label: 'Encryption Ready' },
  { value: 'No Storage', label: 'Data Retention' },
];

export function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white py-20 lg:py-32">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Production Ready • No Data Stored • Open Source
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight mb-6">
              Professional{' '}
              <span className="text-blue-600">PDF Tools</span> for Legal Professionals
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Bates Stamping and Permanent PDF Redaction built for law firms, legal departments, and paralegals.
              Fast, secure, and compliant with legal document standards.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
              <Link to="/bates" className="btn btn-primary btn-lg">
                Start Bates Stamping
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/redact" className="btn btn-outline btn-lg">
                Redact PDF
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                No file storage
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Client-side preview
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Audit trail ready
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need for professional legal document processing, built with modern web technology.
            </p>
          </div>

          <div className="feature-grid">
            {features.map((feature) => (
              <Link
                key={feature.href}
                to={feature.href}
                className="feature-card card group"
              >
                <div className={`feature-icon ${feature.bg} rounded-full w-16 h-16 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
                <div className="mt-4 pt-4 border-t flex items-center justify-center gap-1 text-sm font-medium">
                  <span className={feature.color}>Get Started</span>
                  <ArrowRight className={`w-4 h-4 ${feature.color} group-hover:translate-x-1 transition-transform`} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-blue-400 mb-2">{stat.value}</div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Simple three-step process for professional results.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '01', title: 'Upload', description: 'Drag and drop your PDF file (up to 50MB). We validate the file type and size instantly.' },
              { step: '02', title: 'Configure', description: 'Set your Bates numbering options or draw redaction areas on the live preview.' },
              { step: '03', title: 'Download', description: 'Get your processed PDF instantly. Files are processed in RAM and never stored.' },
            ].map((item, index) => (
              <div key={index} className="text-center relative">
                <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 font-bold text-xl">
                  {item.step}
                </div>
                {index < 2 && (
                  <div className="absolute top-8 left-1/2 w-full h-1 bg-gray-200 hidden md:block" />
                )}
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Process Your Documents?</h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of legal professionals using LegalPDFTools for secure, compliant document processing.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/bates" className="btn btn-lg bg-white text-blue-600 hover:bg-blue-50">
              Try Bates Stamping
            </Link>
            <Link to="/redact" className="btn btn-lg border-white text-white hover:bg-blue-700">
              Try Redaction
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}