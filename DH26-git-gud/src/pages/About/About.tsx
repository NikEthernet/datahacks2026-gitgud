import './About.css';

interface TeamMember {
  name: string;
  year: string;
  major: string;
  role: string;
  bio?: string;
  photoUrl: string;
  linkedIn: string;
  github: string;
}

const teamMembers: TeamMember[] = [
  {
    name: 'Nikolas Espinoza',
    year: '1st',
    major: 'Computer Science',
    role: 'Full-Stack Developer',
    bio: 'Likes lizards!',
    photoUrl: '/data/nik.png',
    linkedIn: 'https://www.linkedin.com/in/nikolasespinoza/',
    github: 'https://github.com/NikEthernet',
  },
  {
    name: 'Eric Lu',
    year: '2028',
    major: 'Math-Econ',
    role: 'UI/UX',
    bio: 'Short bio placeholder.',
    photoUrl: '/data/eric.png',
    linkedIn: 'https://linkedin.com/in/placeholder',
    github: 'https://github.com/ericlu2',
  },
  {
    name: 'Seena Ghasemi',
    year: '2029',
    major: 'Majo',
    role: 'Role in Project',
    bio: 'Likes dogs!',
    photoUrl: '/data/seena.png',
    linkedIn: 'https://linkedin.com/in/placeholder',
    github: 'https://github.com/SeenaG123',
  },
  {
    name: 'Catherine Hu',
    year: 'Year',
    major: 'Major',
    role: 'Role in Project',
    bio: 'likes to sleep!',
    photoUrl: '/data/catherine.jpg',
    linkedIn: 'https://linkedin.com/in/placeholder',
    github: 'https://github.com/Catinherhat',
  },
];

function About() {
  return (
    <div className="about">
      <section className="about-hero">
        <h1>Meet the Team</h1>
        <p className="about-subtitle">
          We're four students at UC San Diego. We built this game during
          DataHacks 2026 because climate strategy is too important to only live
          in spreadsheets.
        </p>
      </section>

      <section className="team-grid">
        {teamMembers.map((member) => (
          <TeamCard key={member.name} member={member} />
        ))}
      </section>

      <section className="about-project">
        <h2>About the Project</h2>
        <p>
          This project was built over 36 hours at DataHacks 2026, hosted by
          UC San Diego's Data Science Student Society. Our goal: turn raw EIA,
          NREL, and Scripps Oceanography datasets into an interactive
          experience that lets anyone — not just policy experts — feel the
          weight of a 76-year energy transition.
        </p>
      </section>
    </div>
  );
}

interface TeamCardProps {
  member: TeamMember;
}

function TeamCard({ member }: TeamCardProps) {
  return (
    <div className="team-card">
      <div className="team-photo-wrapper">
        <img src={member.photoUrl} alt={member.name}
          className="team-photo"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </div>
      <h3 className="team-name">{member.name}</h3>
      <div className="team-details">
        <p className="team-detail"><strong>Year:</strong> {member.year}</p>
        <p className="team-detail"><strong>Major:</strong> {member.major}</p>
        <p className="team-detail"><strong>Role:</strong> {member.role}</p>
      </div>
      {member.bio && <p className="team-bio">{member.bio}</p>}
      <div className="team-socials">
        <a
          href={member.linkedIn}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${member.name}'s LinkedIn`}
          className="social-icon"
        >
          <LinkedInIcon />
        </a>
        <a

          href={member.github}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${member.name}'s GitHub`}
          className="social-icon"
        >
          <GitHubIcon />
        </a>
      </div >
    </div >
  );
}

/* Inline SVG icons — no extra dependency needed */
function LinkedInIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

export default About;