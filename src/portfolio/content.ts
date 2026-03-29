export type ProjectCard = {
  title: string
  summary: string
  stack: string[]
  image: string
  href: string
}

export const projects: ProjectCard[] = [
  {
    title: 'Tseep — Learning Management Platform',
    summary:
      'Architected a multi-portal ecosystem for institutional scale, featuring high-availability student, teacher, and HR flows with complex state synchronization.',
    stack: ['React.js', 'Golang', 'PostgreSQL'],
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1000&q=80',
    href: '#',
  },
  {
    title: 'Intelitraits — Cognitive Assessment Engine',
    summary:
      'Engineered a high-throughput skill mapping platform leveraging automated scoring algorithms and consolidated real-time reporting dashboards.',
    stack: ['React.js', 'Tailwind CSS', 'Golang'],
    image: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1000&q=80',
    href: '#',
  },
  {
    title: 'VanForces — Logistics Micro-Workflows',
    summary:
      'Developed a mission-critical SaaS for field operations, optimizing live route planning and mobile-first data synchronization for complex supply chains.',
    stack: ['React.js', 'Golang', 'GPS Integration'],
    image: 'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=1000&q=80',
    href: '#',
  },
  {
    title: 'DataStream — Real-Time Analytics Pipeline',
    summary:
      'Engineered a streaming architecture utilizing Kafka for event-driven data processing, backed by ClickHouse for sub-second analytical queries.',
    stack: ['Golang', 'Kafka', 'SQL', 'ClickHouse'],
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80',
    href: '#',
  },
  {
    title: 'Libro — Optimized Discovery Platform',
    summary:
      'Full-stack MERN orchestration focused on UX-driven search and high-performance backend query patterns for seamless book discovery.',
    stack: ['MongoDB', 'Express.js', 'React.js', 'Node.js'],
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1000&q=80',
    href: '#',
  },
]

export const heroContent = {
  title: 'My name is Arun N',
  subtitle:
    'Senior Frontend Specialist crafting resilient, mission-critical React systems with a focus on deep accessibility and elite engineering standards.',
  ctas: [
    { label: 'Explore Systems', href: '#projects' },
    { label: 'Strategic Connection', href: '#contact', variant: 'ghost' },
  ],
  metrics: [
    { label: 'Specialized Experience', value: '2.5+', icon: 'history_edu' },
    { label: 'Expert Stack', value: 'React / TS / Go', icon: 'terminal' },
    { label: 'Production Shipments', value: `${projects.length}+`, icon: 'rocket_launch' },
  ],
}

export const aboutContent = {
  name: 'Arun N',
  role: 'Frontend Architect',
  bio: `Frontend Architect with over 2.5 years of experience in engineering high-performance, accessible digital ecosystems. Specialized in bridging complex design systems with robust engineering, ensuring every interaction feels premium and every line of code is scalable. Expert in systems thinking, pragmatic architecting, and cross-functional leadership within agile environments.`,
  highlights: ['Calicut, Kerala', 'Systems Specialist', 'Open to Strategic Roles'],
}

export const experiences = [
  {
    company: 'Texol',
    title: 'Software Developer',
    period: 'Dec 2023 — Present',
    bullets: [
      'Developed responsive web applications with React.js and TypeScript using modern component architecture.',
      'Built scalable UI systems with Tailwind CSS and ensured cross-browser, mobile-first design quality.',
      'Implemented Redux workflows and optimized performance with code splitting and lazy loading.',
      'Integrated REST APIs and handled async flows with robust error handling patterns.',
    ],
  },
  {
    company: 'Vinam Solutions Pvt Ltd',
    title: 'Software Developer Internship',
    period: 'Jul 2023 — Nov 2023',
    bullets: [
      'Learned Bash scripting fundamentals and applied them to automation tasks.',
      'Built basic APIs while studying Golang and Gin Framework fundamentals.',
      'Explored Kafka and ClickHouse for real-time data processing workflows.',
      'Practiced SQL queries and database optimization concepts.',
    ],
  },
  {
    company: 'Futura Labs',
    title: 'MERN Stack Intern',
    period: 'Nov 2022 — Nov 2023',
    bullets: [
      'Built full-stack MERN applications with REST APIs and secure authentication.',
      'Designed MongoDB schemas and implemented responsive React frontends.',
    ],
  },
  {
    company: 'Direction Group of Institutions Pvt Ltd',
    title: 'IT Specialist',
    period: 'Mar 2021 — Aug 2022',
    bullets: [
      'Managed LMS uploads and edited online class recordings.',
      'Supported faculty with presentation prep and Google Meet sessions.',
      'Handled OBS-based YouTube live streaming for institutional events.',
    ],
  },
]

export const skillGroups = [
  { label: 'Engineering Core', items: ['TypeScript', 'JavaScript', 'Golang', 'SQL'] },
  { label: 'Digital Experiences', items: ['React.js', 'Redux', 'Tailwind CSS', 'Framer Motion', 'Responsive Architecture'] },
  { label: 'Architectural Tooling', items: ['Vite', 'Git', 'Webpack', 'VS Code', 'Chrome DevTools', 'Postmen'] },
  { label: 'Backend & Ecosystem', items: ['Node.js', 'REST APIs', 'MongoDB', 'Kafka', 'ClickHouse', 'Gin Framework'] },
  { label: 'Quality Assurance', items: ['Performance Auditing', 'Unit Testing', 'Code Reviews', 'Accessibility Auditing'] },
]

export const allSkills = skillGroups.flatMap((g) => g.items)

export const socials = [
  { label: 'Direct Email', value: 'arunnarangali123@gmail.com', href: 'mailto:arunnarangali123@gmail.com' },
  { label: 'Professional Orbit', value: 'linkedin.com/in/arun-narangali', href: 'https://www.linkedin.com/in/arun-narangali' },
  { label: 'Secure Line', value: '+91 8086370576', href: 'tel:+918086370576' },
  { label: 'Repositories', value: 'github.com/arunnarangali', href: 'https://github.com/arunnarangali?tab=repositories' },
]
