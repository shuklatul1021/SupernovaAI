// ─── Mock Data for Supernova Dashboard ──────────────────

export const mockUser = {
  id: "user-1",
  name: "Priya Sharma",
  email: "priya@example.com",
  image: null,
  joinedDate: "2025-01-15",
  streak: 12,
  totalStudyHours: 156,
  plansCompleted: 3,
};

export const mockStudyPlan = {
  id: "plan-1",
  subject: "Physics",
  exam: "JEE Mains 2025",
  totalDays: 30,
  currentDay: 8,
  hoursPerDay: 4,
  status: "active" as const,
  overallProgress: 27,
  startDate: "2025-03-01",
  endDate: "2025-03-30",
  days: [
    {
      day: 1,
      date: "2025-03-01",
      topics: [
        { name: "Kinematics - 1D Motion", status: "completed", difficulty: "medium", duration: "2h", resources: [
          { type: "video", title: "1D Motion - Khan Academy", url: "https://khanacademy.org" },
          { type: "article", title: "Kinematics Notes", url: "https://example.com" },
        ]},
        { name: "Units & Dimensions", status: "completed", difficulty: "easy", duration: "1.5h", resources: [
          { type: "video", title: "Units & Dimensions Crash Course", url: "https://youtube.com" },
        ]},
      ],
    },
    {
      day: 2,
      date: "2025-03-02",
      topics: [
        { name: "Kinematics - 2D Motion", status: "completed", difficulty: "medium", duration: "2h", resources: [
          { type: "video", title: "Projectile Motion Explained", url: "https://youtube.com" },
        ]},
        { name: "Vectors", status: "completed", difficulty: "easy", duration: "1.5h", resources: [
          { type: "article", title: "Vector Algebra", url: "https://example.com" },
        ]},
      ],
    },
    {
      day: 3,
      date: "2025-03-03",
      topics: [
        { name: "Newton's Laws of Motion", status: "completed", difficulty: "medium", duration: "2.5h", resources: [
          { type: "video", title: "Newton's Laws - Physics Wallah", url: "https://youtube.com" },
          { type: "practice", title: "Practice Problems Set 1", url: "https://example.com" },
        ]},
        { name: "Friction", status: "completed", difficulty: "hard", duration: "1.5h", resources: [
          { type: "video", title: "Friction Problems", url: "https://youtube.com" },
        ]},
      ],
    },
    {
      day: 4,
      date: "2025-03-04",
      topics: [
        { name: "Work, Energy & Power", status: "completed", difficulty: "medium", duration: "2h", resources: [
          { type: "video", title: "Work Energy Theorem", url: "https://youtube.com" },
        ]},
        { name: "Conservative Forces", status: "completed", difficulty: "hard", duration: "2h", resources: [
          { type: "article", title: "Conservation of Energy", url: "https://example.com" },
        ]},
      ],
    },
    {
      day: 5,
      date: "2025-03-05",
      topics: [
        { name: "Circular Motion", status: "completed", difficulty: "medium", duration: "2h", resources: [
          { type: "video", title: "Uniform Circular Motion", url: "https://youtube.com" },
        ]},
        { name: "Centripetal Force", status: "completed", difficulty: "medium", duration: "1.5h", resources: [
          { type: "practice", title: "Circular Motion Problems", url: "https://example.com" },
        ]},
      ],
    },
    {
      day: 6,
      date: "2025-03-06",
      topics: [
        { name: "Rotational Motion", status: "completed", difficulty: "hard", duration: "2.5h", resources: [
          { type: "video", title: "Moment of Inertia", url: "https://youtube.com" },
        ]},
        { name: "Torque", status: "completed", difficulty: "hard", duration: "1.5h", resources: [
          { type: "article", title: "Torque & Angular Momentum", url: "https://example.com" },
        ]},
      ],
    },
    {
      day: 7,
      date: "2025-03-07",
      topics: [
        { name: "Revision: Mechanics", status: "completed", difficulty: "medium", duration: "3h", resources: [
          { type: "practice", title: "Mechanics — Full Practice Test", url: "https://example.com" },
        ]},
      ],
    },
    {
      day: 8,
      date: "2025-03-08",
      topics: [
        { name: "Thermodynamics - Basics", status: "in_progress", difficulty: "hard", duration: "2.5h", resources: [
          { type: "video", title: "Laws of Thermodynamics", url: "https://youtube.com" },
          { type: "article", title: "Thermodynamics Notes", url: "https://example.com" },
        ]},
        { name: "Heat Transfer", status: "pending", difficulty: "medium", duration: "1.5h", resources: [
          { type: "video", title: "Conduction, Convection, Radiation", url: "https://youtube.com" },
        ]},
      ],
    },
    {
      day: 9,
      date: "2025-03-09",
      topics: [
        { name: "Kinetic Theory of Gases", status: "pending", difficulty: "hard", duration: "2h", resources: [
          { type: "video", title: "KTG Explained", url: "https://youtube.com" },
        ]},
        { name: "Calorimetry", status: "pending", difficulty: "medium", duration: "1.5h", resources: [
          { type: "article", title: "Calorimetry Problems", url: "https://example.com" },
        ]},
      ],
    },
    {
      day: 10,
      date: "2025-03-10",
      topics: [
        { name: "Wave Motion", status: "pending", difficulty: "medium", duration: "2h", resources: [
          { type: "video", title: "Transverse & Longitudinal Waves", url: "https://youtube.com" },
        ]},
        { name: "Sound Waves", status: "pending", difficulty: "medium", duration: "2h", resources: [
          { type: "video", title: "Doppler Effect", url: "https://youtube.com" },
        ]},
      ],
    },
  ],
};

export const mockQuizQuestions = [
  {
    id: "q1",
    topic: "Kinematics",
    question: "A ball is thrown vertically upward with a velocity of 20 m/s. What is the maximum height reached? (g = 10 m/s²)",
    options: ["10 m", "20 m", "30 m", "40 m"],
    correctAnswer: 1,
    explanation: "Using v² = u² - 2gh, at max height v=0, so h = u²/2g = 400/20 = 20m",
  },
  {
    id: "q2",
    topic: "Newton's Laws",
    question: "A 5 kg block is pushed with a force of 30 N on a frictionless surface. What is its acceleration?",
    options: ["3 m/s²", "6 m/s²", "10 m/s²", "150 m/s²"],
    correctAnswer: 1,
    explanation: "F = ma, so a = F/m = 30/5 = 6 m/s²",
  },
  {
    id: "q3",
    topic: "Work & Energy",
    question: "A 2 kg object falls from a height of 5 m. What is its kinetic energy just before hitting the ground? (g = 10 m/s²)",
    options: ["50 J", "100 J", "200 J", "25 J"],
    correctAnswer: 1,
    explanation: "KE = mgh = 2 × 10 × 5 = 100 J (by conservation of energy)",
  },
  {
    id: "q4",
    topic: "Thermodynamics",
    question: "In an isothermal process, which quantity remains constant?",
    options: ["Pressure", "Volume", "Temperature", "Entropy"],
    correctAnswer: 2,
    explanation: "Isothermal means constant temperature (iso = same, thermal = heat/temperature)",
  },
  {
    id: "q5",
    topic: "Circular Motion",
    question: "A car moves in a circle of radius 50 m at a speed of 10 m/s. What is its centripetal acceleration?",
    options: ["0.5 m/s²", "2 m/s²", "5 m/s²", "500 m/s²"],
    correctAnswer: 1,
    explanation: "a = v²/r = 100/50 = 2 m/s²",
  },
];

export const mockQuizResult = {
  id: "result-1",
  subject: "Physics",
  totalQuestions: 20,
  correctAnswers: 14,
  score: 70,
  timeTaken: "18 min",
  date: "2025-03-01",
  topicBreakdown: [
    { topic: "Kinematics", total: 4, correct: 4, percentage: 100, strength: "strong" as const },
    { topic: "Newton's Laws", total: 4, correct: 3, percentage: 75, strength: "strong" as const },
    { topic: "Work & Energy", total: 3, correct: 2, percentage: 67, strength: "moderate" as const },
    { topic: "Circular Motion", total: 3, correct: 2, percentage: 67, strength: "moderate" as const },
    { topic: "Thermodynamics", total: 3, correct: 1, percentage: 33, strength: "weak" as const },
    { topic: "Waves", total: 3, correct: 2, percentage: 67, strength: "moderate" as const },
  ],
};

export const mockProgressData = {
  weeklyStudyHours: [
    { day: "Mon", hours: 4 },
    { day: "Tue", hours: 3.5 },
    { day: "Wed", hours: 5 },
    { day: "Thu", hours: 4.5 },
    { day: "Fri", hours: 3 },
    { day: "Sat", hours: 6 },
    { day: "Sun", hours: 2 },
  ],
  topicProgress: [
    { topic: "Kinematics", progress: 100 },
    { topic: "Newton's Laws", progress: 100 },
    { topic: "Work & Energy", progress: 100 },
    { topic: "Circular Motion", progress: 100 },
    { topic: "Rotational Motion", progress: 100 },
    { topic: "Thermodynamics", progress: 35 },
    { topic: "Waves", progress: 0 },
    { topic: "Optics", progress: 0 },
    { topic: "Electrostatics", progress: 0 },
    { topic: "Current Electricity", progress: 0 },
  ],
  overallStats: {
    totalTopics: 30,
    completedTopics: 12,
    inProgressTopics: 1,
    pendingTopics: 17,
    averageScore: 78,
    studyStreak: 12,
  },
};
