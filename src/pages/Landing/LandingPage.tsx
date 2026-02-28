import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="navbar">
        <div className="container">
          <div className="nav-content">
            <div className="logo">
              <svg className="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span className="logo-text">TrackSpace</span>
            </div>
            <div className="nav-links">
              <a href="#features" className="nav-link">Features</a>
              <a href="#how-it-works" className="nav-link">How It Works</a>
              <a href="#benefits" className="nav-link">Benefits</a>
              <Link to="/login" className="btn-secondary">Login</Link>
              <Link to="/register" className="btn-primary">Get Started</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Manage Student Projects with
                <span className="highlight"> Confidence</span>
              </h1>
              <p className="hero-description">
                TrackSpace integrates Jira and GitHub to automate project tracking, 
                analyze contributions, and generate professional SRS documents for 
                Software Engineering courses.
              </p>
              <div className="hero-actions">
                <Link to="/register" className="btn-primary btn-large">
                  Start Free Trial
                </Link>
                <a href="#how-it-works" className="btn-secondary btn-large">
                  Watch Demo
                </a>
              </div>
              <div className="hero-stats">
                <div className="stat">
                  <div className="stat-value">500+</div>
                  <div className="stat-label">Students</div>
                </div>
                <div className="stat">
                  <div className="stat-value">50+</div>
                  <div className="stat-label">Projects</div>
                </div>
                <div className="stat">
                  <div className="stat-value">98%</div>
                  <div className="stat-label">Satisfaction</div>
                </div>
              </div>
            </div>
            <div className="hero-image">
              <div className="dashboard-preview">
                <div className="preview-header">
                  <div className="preview-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
                <div className="preview-content">
                  <div className="preview-sidebar"></div>
                  <div className="preview-main">
                    <div className="preview-card"></div>
                    <div className="preview-card"></div>
                    <div className="preview-card"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Powerful Features for Modern Education</h2>
            <p className="section-description">
              Everything you need to manage student projects effectively
            </p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon jira">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="feature-title">Jira Integration</h3>
              <p className="feature-description">
                Connect to Jira Cloud and manage sprints, issues, and tasks directly from TrackSpace with bidirectional sync.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon github">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="feature-title">GitHub Tracking</h3>
              <p className="feature-description">
                Monitor commits, analyze code contributions, and track repository activity across all team members.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon analytics">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="feature-title">Contribution Analytics</h3>
              <p className="feature-description">
                Automatically calculate task completion rates, commit metrics, and contribution scores for fair evaluation.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon ai">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="feature-title">AI-Powered SRS</h3>
              <p className="feature-description">
                Generate professional Software Requirements Specification documents automatically using AI from your Jira data.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon team">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="feature-title">Team Management</h3>
              <p className="feature-description">
                Organize students into groups, assign team leaders, and manage class projects with role-based permissions.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon notification">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="feature-title">Smart Notifications</h3>
              <p className="feature-description">
                Stay updated with in-app and email notifications for task assignments, status changes, and important events.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">How TrackSpace Works</h2>
            <p className="section-description">
              Get started in minutes with our simple workflow
            </p>
          </div>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3 className="step-title">Setup Your Class</h3>
                <p className="step-description">
                  Admin creates classes and imports students. Lecturers organize students into project groups.
                </p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3 className="step-title">Connect Tools</h3>
                <p className="step-description">
                  Team Leaders connect Jira and GitHub repositories with secure API tokens.
                </p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3 className="step-title">Track Progress</h3>
                <p className="step-description">
                  Monitor sprints, tasks, and commits in real-time with automatic synchronization.
                </p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3 className="step-title">Analyze & Report</h3>
                <p className="step-description">
                  View contribution analytics and generate professional SRS documents with AI.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="benefits">
        <div className="container">
          <div className="benefits-content">
            <div className="benefits-text">
              <h2 className="section-title">Why Choose TrackSpace?</h2>
              <div className="benefit-list">
                <div className="benefit-item">
                  <svg className="benefit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <h4>Save Time</h4>
                    <p>Automate documentation and tracking tasks</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <svg className="benefit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <h4>Fair Evaluation</h4>
                    <p>Data-driven contribution metrics for objective grading</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <svg className="benefit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <h4>Industry Tools</h4>
                    <p>Students learn professional workflows with Jira and GitHub</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <svg className="benefit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <h4>Real-time Insights</h4>
                    <p>Monitor project health and detect issues early</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="benefits-image">
              <div className="analytics-preview">
                <div className="chart-placeholder"></div>
                <div className="metrics-row">
                  <div className="metric-box"></div>
                  <div className="metric-box"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Transform Your Project Management?</h2>
            <p className="cta-description">
              Join hundreds of students and lecturers using TrackSpace
            </p>
            <Link to="/register" className="btn-primary btn-large">
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <div className="logo">
                <svg className="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span className="logo-text">TrackSpace</span>
              </div>
              <p className="footer-description">
                Modern project management platform for Software Engineering education
              </p>
            </div>
            <div className="footer-section">
              <h4 className="footer-title">Product</h4>
              <a href="#features" className="footer-link">Features</a>
              <a href="#how-it-works" className="footer-link">How It Works</a>
              <a href="#benefits" className="footer-link">Benefits</a>
            </div>
            <div className="footer-section">
              <h4 className="footer-title">Support</h4>
              <a href="#" className="footer-link">Documentation</a>
              <a href="#" className="footer-link">Help Center</a>
              <a href="#" className="footer-link">Contact Us</a>
            </div>
            <div className="footer-section">
              <h4 className="footer-title">Legal</h4>
              <a href="#" className="footer-link">Privacy Policy</a>
              <a href="#" className="footer-link">Terms of Service</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 TrackSpace. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
