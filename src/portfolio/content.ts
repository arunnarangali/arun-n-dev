export const heroContent = {
  title: 'Frontend developer building fast, accessible React experiences',
  subtitle:
    '2+ years crafting reusable components, optimizing performance, and integrating robust React.js + TypeScript applications.',
  ctas: [
    { label: 'View Projects', href: '#projects' },
    { label: 'Contact Me', href: '#contact', variant: 'ghost' },
  ],
  metrics: [
    { label: 'Years experience', value: '2+' },
    { label: 'Primary stack', value: 'React + TS' },
    { label: 'Projects shipped', value: '5+' },
  ],
}

export const aboutContent = {
  name: 'Arun N',
  role: 'Frontend Developer',
  bio: `Frontend Developer with 2+ years experience building fast, accessible React.js and TypeScript applications. Skilled at designing reusable components, improving performance, and ensuring smooth backend integration. Experienced in guiding teams, maintaining code quality, and delivering great user experiences using React.js, Redux, and Tailwind CSS.`,
  highlights: ['Calicut, Kerala', 'React + TypeScript', 'Open to Work'],
}

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
      'Multi-portal learning platform with student, teacher, and HR portals for attendance, certification, and institute management.',
    stack: ['React.js', 'Golang', 'PostgreSQL'],
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1000&q=80',
    href: '#',
  },
  {
    title: 'Tsepp Skill Mapping (Intelitraits)',
    summary:
      'Skill assessment platform with EI/MI MCQ exams, automated scoring, and consolidated reporting dashboards.',
    stack: ['React.js', 'Tailwind CSS', 'Golang'],
    image: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1000&q=80',
    href: '#',
  },
  {
    title: 'VanForces — Van Sales Management System',
    summary:
      'SaaS platform for van sales operations with live route planning, monitoring, and mobile-first field workflows.',
    stack: ['React.js', 'Golang', 'GPS Integration'],
    image: 'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=1000&q=80',
    href: '#',
  },
  {
    title: 'DataStream — Real-Time Data Processing',
    summary:
      'Streaming pipeline built with Kafka and Golang, backed by SQL + ClickHouse for fast analytics.',
    stack: ['Golang', 'Kafka', 'SQL', 'ClickHouse'],
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80',
    href: '#',
  },
  {
    title: 'My Library — Digital Book Platform',
    summary:
      'MERN application for book discovery, search, and management with responsive UI and optimized backend queries.',
    stack: ['MongoDB', 'Express.js', 'React.js', 'Node.js'],
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1000&q=80',
    href: '#',
  },
]

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
  { label: 'Languages', items: ['JavaScript', 'TypeScript', 'Go (Basic)'] },
  { label: 'Frontend', items: ['React.js', 'Redux', 'Tailwind CSS', 'HTML5', 'CSS3', 'Responsive Design'] },
  { label: 'Tooling', items: ['Git', 'Vite', 'npm', 'Webpack', 'VS Code', 'Chrome DevTools'] },
  { label: 'Backend & APIs', items: ['Node.js', 'REST APIs', 'MongoDB', 'SQL', 'Axios', 'Gin Framework'] },
  { label: 'Testing & Quality', items: ['Code Reviews', 'Performance Optimization', 'Cross-Browser Testing', 'Debugging', 'Unit Testing'] },
]

export const socials = [
  { label: 'Email', value: 'arunnarangali123@gmail.com', href: 'mailto:arunnarangali123@gmail.com' },
  { label: 'LinkedIn', value: 'linkedin.com/in/arun', href: 'https://linkedin.com/in/arun' },
  { label: 'Phone', value: '+91 8086370576', href: 'tel:+918086370576' },
]
