import { useState, useEffect } from 'react';
import portfolioData from './data/portfolio.json';

const parseSkillsList = (skillArray) => {
  if (!skillArray) return [];
  let flatList = [];
  skillArray.forEach(item => {
    if (item.includes('\n') || item.includes('•')) {
      const parts = item.split(/[\n•]/).map(s => s.trim()).filter(Boolean);
      flatList.push(...parts);
    } else {
      flatList.push(item.trim());
    }
  });
  return flatList.filter(s => s.toLowerCase() !== 'photography' && s.toLowerCase() !== 'videography');
};

function App() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedWork, setSelectedWork] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.message) {
      setFormSubmitted(true);
      setTimeout(() => {
        setFormSubmitted(false);
        setFormData({ name: '', email: '', message: '' });
      }, 5000);
    }
  };

  const filteredGallery = activeFilter === 'All'
    ? portfolioData.gallery
    : portfolioData.gallery.filter(item => item.category.toLowerCase() === activeFilter.toLowerCase());

  const categories = ['All', 'Wedding', 'Portraits', 'Event', 'Fashion', 'Aerial', 'Product'];

  return (
    <div className="app-container">
      {/* Navigation */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="logo">
          SHIVA<span>.</span>
        </div>
        <ul className="nav-links">
          <li><a href="#home">Home</a></li>
          <li><a href="#about">About</a></li>
          <li><a href="#gallery">Gallery</a></li>
          <li><a href="#experience">Experience</a></li>
          <li><a href="#gear">Gear</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
      </nav>

      {/* Hero Section */}
      <header id="home" className="hero" style={{ backgroundImage: `url('/portfolio-images/SHIVA PORTFOLIO_page10_img4.jpeg')` }}>
        <div className="hero-content">
          <div className="hero-subtitle">Visual Storyteller</div>
          <h1 className="hero-title">Shiva Rama Krishna <span>Bodala</span></h1>
          <p className="hero-description">
            Professional Photographer & Videographer based in Vizag, India. Specialized in capturing corporate events, commercial campaigns, traditional weddings, and aerial documentation with cinematic excellence.
          </p>
          <div className="hero-actions">
            <a href="#gallery" className="btn-primary">View Portfolio</a>
            <a href="#contact" className="btn-secondary">Get In Touch</a>
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* About Section */}
        <section id="about" className="section">
          <div className="about-grid">
            <div className="about-img-container">
              <img src="/portfolio-images/SHIVA PORTFOLIO_page2_img3.jpeg" alt="Shiva Rama Krishna Bodala" className="about-img" />
            </div>
            <div className="about-text">
              <div>
                <div className="section-subtitle">Biography</div>
                <h2 className="section-title">About Me</h2>
              </div>
              <p className="about-summary">{portfolioData.summary}</p>
              
              <div className="skills-container">
                <div>
                  <h3 className="skill-group-title">Photography Specialties</h3>
                  <div className="skills-tags">
                    {parseSkillsList(portfolioData.skills.photography).map((skill, index) => (
                      <span key={index} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="skill-group-title">Videography & Storytelling</h3>
                  <div className="skills-tags">
                    {parseSkillsList(portfolioData.skills.videography).map((skill, index) => (
                      <span key={index} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="skill-group-title">Editing & Post Production</h3>
                  <div className="skills-tags">
                    {parseSkillsList(portfolioData.skills.software).map((software, index) => (
                      <span key={index} className="skill-tag">{software}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Gallery / Works Section */}
        <section id="gallery" className="section">
          <div className="section-header">
            <div className="section-subtitle">My Work</div>
            <h2 className="section-title">Creative Portfolio</h2>
          </div>

          <div className="gallery-filters">
            {categories.map((cat, index) => (
              <button
                key={index}
                className={`filter-btn ${activeFilter === cat ? 'active' : ''}`}
                onClick={() => handleFilterChange(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="gallery-grid">
            {filteredGallery.map((work, index) => (
              <div
                key={index}
                className="gallery-item"
                onClick={() => setSelectedWork(work)}
              >
                <img src={`/${work.image}`} alt={work.title} className="gallery-img" />
                <div className="gallery-overlay">
                  <span className="gallery-cat">{work.category}</span>
                  <h3 className="gallery-item-title">{work.title}</h3>
                  <p className="gallery-item-desc">{work.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Experience Section */}
        <section id="experience" className="section">
          <div className="section-header">
            <div className="section-subtitle">Timeline</div>
            <h2 className="section-title">Professional Journey</h2>
          </div>

          <div className="timeline">
            {portfolioData.experience.map((exp, index) => (
              <div key={index} className="timeline-item">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <div className="timeline-period">{exp.period}</div>
                  <h3 className="timeline-role">{exp.role}</h3>
                  <div className="timeline-company">{exp.company} | {exp.location}</div>
                  <ul className="timeline-highlights">
                    {exp.responsibilities.map((resp, i) => (
                      <li key={i}>{resp}</li>
                    ))}
                    {exp.highlights && exp.highlights.map((high, i) => (
                      <li key={i} style={{ color: 'var(--text-primary)' }}><strong>{high.split(':')[0]}:</strong>{high.split(':')[1]}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Gear / Equipment Section */}
        <section id="gear" className="section">
          <div className="section-header">
            <div className="section-subtitle">Production Assets</div>
            <h2 className="section-title">The Gear Locker</h2>
          </div>

          <div className="gear-grid">
            {portfolioData.gear.map((g, index) => (
              <div key={index} className="gear-card">
                <div className="gear-icon">🎥</div>
                <div className="gear-type">{g.type}</div>
                <h3 className="gear-name">{g.name}</h3>
                <p className="gear-desc">{g.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="section">
          <div className="section-header">
            <div className="section-subtitle">Collaboration</div>
            <h2 className="section-title">Let's Work Together</h2>
          </div>

          <div className="contact-container">
            <div className="contact-info">
              <div className="contact-card">
                <div className="contact-card-icon">✉️</div>
                <div>
                  <div className="contact-card-title">Email</div>
                  <a href={`mailto:${portfolioData.contact.email}`} className="contact-card-value">{portfolioData.contact.email}</a>
                </div>
              </div>

              <div className="contact-card">
                <div className="contact-card-icon">📞</div>
                <div>
                  <div className="contact-card-title">Phone</div>
                  <a href={`tel:${portfolioData.contact.phone}`} className="contact-card-value">{portfolioData.contact.phone}</a>
                </div>
              </div>

              <div className="contact-card">
                <div className="contact-card-icon">📍</div>
                <div>
                  <div className="contact-card-title">Location</div>
                  <div className="contact-card-value">{portfolioData.contact.location}</div>
                </div>
              </div>
            </div>

            <form className="contact-form glass-panel" onSubmit={handleFormSubmit}>
              {formSubmitted ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--accent-gold)' }}>
                  <h3>✓ Thank you for reaching out!</h3>
                  <p style={{ marginTop: '8px' }}>Your message has been sent. Shiva will contact you shortly.</p>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-input"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Message</label>
                    <textarea
                      className="form-textarea"
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    ></textarea>
                  </div>
                  <button type="submit" className="submit-btn">Send Message</button>
                </>
              )}
            </form>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-logo">
          SHIVA<span>.</span>
        </div>
        <p className="footer-text">
          &copy; {new Date().getFullYear()} Shiva Rama Krishna Bodala. All rights reserved. Synced via Notion Connect.
        </p>
      </footer>

      {/* Lightbox Modal */}
      {selectedWork && (
        <div className="lightbox" onClick={() => setSelectedWork(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setSelectedWork(null)}>×</button>
            <img src={`/${selectedWork.image}`} alt={selectedWork.title} className="lightbox-img" />
            <div className="lightbox-caption">
              <span className="gallery-cat">{selectedWork.category}</span>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '8px 0 4px', color: 'var(--text-primary)' }}>{selectedWork.title}</h3>
              <p style={{ fontSize: '0.95rem' }}>{selectedWork.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
