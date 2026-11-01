import site from '../content/site.json';
import Tracker from '../components/Tracker';
import { Link } from '../components/Ph';

export default function Page() {
  const { hero, about, skills, projects, timeline, contact, ui } = site;
  const mail = contact.email.includes('PLACEHOLDER') ? contact.email : `mailto:${contact.email}`;
  return (
    <>
      <div className="stars" aria-hidden="true">
        <div className="stars-far" />
        <div className="stars-near" />
      </div>
      <a className="skip" href="#summary" data-skip>{ui.skip}</a>
      <main className="journey">
        <section id="hero" className="station" aria-labelledby="hero-h">
          <div className="layer">
            <p className="eyebrow">{hero.role}</p>
            <h1 id="hero-h">{hero.name}</h1>
            <p className="lead">{hero.tagline}</p>
            <p className="hint">{ui.scrollHint}</p>
          </div>
        </section>

        <section id="about" className="station" aria-labelledby="about-h">
          <div className="layer">
            <h2 id="about-h">{about.title}</h2>
            <p className="lead">{about.body}</p>
          </div>
        </section>

        <section id="skills" className="station" aria-labelledby="skills-h">
          <div className="layer">
            <h2 id="skills-h">{skills.title}</h2>
            <ul className="chips">{skills.items.map((s, i) => <li key={i}>{s}</li>)}</ul>
          </div>
        </section>

        <section id="projects" className="station" aria-labelledby="projects-h">
          <div className="layer">
            <h2 id="projects-h">{projects.title}</h2>
            <div className="cards">
              {projects.items.map((p, i) => (
                <article className="card" key={i} data-project>
                  <h3 data-f="title">{p.title}</h3>
                  <p data-f="description">{p.description}</p>
                  <p className="tech" data-f="tech">{p.tech.join(' · ')}</p>
                  <p data-f="link"><Link href={p.link} track={`project-${i + 1}`}>{ui.visit}</Link></p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="timeline" className="station" aria-labelledby="timeline-h">
          <div className="layer">
            <h2 id="timeline-h">{timeline.title}</h2>
            <ol className="tl">
              {timeline.items.map((t, i) => (
                <li key={i} data-milestone><span className="period">{t.period}</span><strong>{t.title}</strong><span>{t.detail}</span></li>
              ))}
            </ol>
          </div>
        </section>

        <section id="contact" className="station" aria-labelledby="contact-h">
          <div className="layer">
            <h2 id="contact-h">{contact.title}</h2>
            <ul className="links">
              <li><Link href={mail} track="email">Email</Link></li>
              <li><Link href={contact.github} track="github">GitHub</Link></li>
              <li><Link href={contact.linkedin} track="linkedin">LinkedIn</Link></li>
              <li><Link href={contact.blog} track="blog">{ui.blog}</Link></li>
            </ul>
          </div>
        </section>
      </main>

      <section id="summary" className="summary" aria-labelledby="summary-h">
        <h2 id="summary-h">{ui.summaryTitle}</h2>
        <p><strong>{hero.name}</strong> — {hero.role}</p>
        <ul>{projects.items.slice(0, 3).map((p, i) => <li key={i}>{p.title}</li>)}</ul>
      </section>
      <Tracker />
    </>
  );
}
