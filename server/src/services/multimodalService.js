/**
 * Multimodal Service providing Course Flowcharts, Infographic Data, and Audio Regulation Narrations.
 */

// B.Tech CSE Curriculum Knowledge Graph for Interactive Visual Flowchart
export const CURRICULUM_FLOWCHART = {
  degree: 'Bachelor of Technology in Computer Science and Engineering',
  university: 'Vidyashilp University',
  totalCredits: 160,
  semesters: [
    {
      semester: 1,
      theme: 'Foundations & Mathematics',
      courses: [
        { code: 'MATH101', name: 'Calculus and Linear Algebra', credits: 4, type: 'Math', prerequisites: [] },
        { code: 'CSEN101', name: 'Programming in Python', credits: 4, type: 'Core', prerequisites: [] },
        { code: 'PHYS101', name: 'Applied Physics', credits: 4, type: 'Science', prerequisites: [] },
        { code: 'ENGL101', name: 'Technical Communication', credits: 3, type: 'Humanities', prerequisites: [] },
        { code: 'ENVR101', name: 'Environmental Science', credits: 3, type: 'University Core', prerequisites: [] }
      ]
    },
    {
      semester: 2,
      theme: 'Data Structures & Statistics',
      courses: [
        { code: 'CSEN102', name: 'Data Structures', credits: 4, type: 'Core', prerequisites: ['CSEN101'] },
        { code: 'MATH201', name: 'Probability and Statistics', credits: 4, type: 'Math', prerequisites: ['MATH101'] },
        { code: 'ELEC101', name: 'Digital Logic Design', credits: 4, type: 'Core', prerequisites: [] },
        { code: 'HUMA101', name: 'Ethics and Values', credits: 3, type: 'Humanities', prerequisites: [] },
        { code: 'CSEN103', name: 'Web Technologies Lab', credits: 3, type: 'Core', prerequisites: ['CSEN101'] }
      ]
    },
    {
      semester: 3,
      theme: 'Core Systems & Analysis',
      courses: [
        { code: 'CSEN201', name: 'Design and Analysis of Algorithms', credits: 4, type: 'Core', prerequisites: ['CSEN102'] },
        { code: 'CSEN202', name: 'Database Management Systems', credits: 4, type: 'Core', prerequisites: ['CSEN101'] },
        { code: 'CSEN203', name: 'Computer Organization & Architecture', credits: 4, type: 'Core', prerequisites: ['ELEC101'] },
        { code: 'CSEN204', name: 'Exploratory Data Analysis', credits: 4, type: 'Core', prerequisites: ['CSEN101', 'MATH201'] },
        { code: 'MINOR1', name: 'Minor Track Course I (e.g. Psychology / Law / Start-up)', credits: 4, type: 'Minor', prerequisites: [] }
      ]
    },
    {
      semester: 4,
      theme: 'Operating Systems & Networks',
      courses: [
        { code: 'CSEN205', name: 'Operating Systems', credits: 4, type: 'Core', prerequisites: ['CSEN203'] },
        { code: 'CSEN206', name: 'Computer Networks', credits: 4, type: 'Core', prerequisites: ['CSEN201'] },
        { code: 'CSEN207', name: 'Software Engineering', credits: 4, type: 'Core', prerequisites: ['CSEN102'] },
        { code: 'CSEN208', name: 'Theory of Computation', credits: 4, type: 'Core', prerequisites: ['CSEN201'] },
        { code: 'MINOR2', name: 'Minor Track Course II', credits: 4, type: 'Minor', prerequisites: ['MINOR1'] }
      ]
    },
    {
      semester: 5,
      theme: 'Advanced Intelligence & Machine Learning',
      courses: [
        { code: 'CSEN301', name: 'Machine Learning', credits: 4, type: 'Specialization', prerequisites: ['CSEN101', 'MATH101', 'CSEN204'] },
        { code: 'CSEN302', name: 'Compiler Design', credits: 4, type: 'Core', prerequisites: ['CSEN208'] },
        { code: 'CSEN303', name: 'Cloud Computing & DevOps', credits: 4, type: 'Elective', prerequisites: ['CSEN205', 'CSEN206'] },
        { code: 'MINOR3', name: 'Minor Track Course III (e.g. LAWM305)', credits: 4, type: 'Minor', prerequisites: ['MINOR2'] }
      ]
    },
    {
      semester: 6,
      theme: 'Deep Learning & Big Data',
      courses: [
        { code: 'CSEN304', name: 'Deep Learning & Neural Networks', credits: 4, type: 'Specialization', prerequisites: ['CSEN301'] },
        { code: 'CSEN305', name: 'Information Security & Cryptography', credits: 4, type: 'Core', prerequisites: ['CSEN206'] },
        { code: 'PROJ301', name: 'Capstone Design Project I', credits: 4, type: 'Project', prerequisites: ['CSEN207'] }
      ]
    },
    {
      semester: 7,
      theme: 'Industry Electives & Advanced Practice',
      courses: [
        { code: 'CSEN401', name: 'Generative AI & LLM Systems', credits: 4, type: 'Specialization', prerequisites: ['CSEN304'] },
        { code: 'PROJ401', name: 'Capstone Design Project II', credits: 6, type: 'Project', prerequisites: ['PROJ301'] },
        { code: 'ELEC401', name: 'Open Elective (Interdisciplinary)', credits: 4, type: 'Elective', prerequisites: [] }
      ]
    },
    {
      semester: 8,
      theme: 'Industry Internship / Capstone',
      courses: [
        { code: 'INTN401', name: 'Industry Internship / Semester Practice', credits: 12, type: 'Internship', prerequisites: [] }
      ]
    }
  ],
  prerequisiteEdges: [
    { from: 'CSEN101', to: 'CSEN102', reason: 'Programming fundamentals needed for pointer and memory structures' },
    { from: 'CSEN102', to: 'CSEN201', reason: 'Data structures needed for asymptotic complexity and algorithmic analysis' },
    { from: 'MATH101', to: 'MATH201', reason: 'Calculus concepts applied in probability distributions' },
    { from: 'CSEN101', to: 'CSEN204', reason: 'Python used for statistical data frame processing' },
    { from: 'MATH201', to: 'CSEN204', reason: 'Statistical hypothesis testing applied in exploratory analysis' },
    { from: 'CSEN204', to: 'CSEN301', reason: 'Exploratory data analysis is mandatory prerequisite for Machine Learning' },
    { from: 'CSEN301', to: 'CSEN304', reason: 'Machine Learning required before Deep Learning and Neural Networks' },
    { from: 'CSEN304', to: 'CSEN401', reason: 'Deep Learning fundamentals needed for Transformer and GenAI architectures' }
  ]
};

// Curated Audio Explanations for Key Academic Regulations
export const AUDIO_REGULATIONS = [
  {
    id: 'audio-attendance-policy',
    title: 'Attendance Policy & FA Grade Regulations',
    source: 'Student Handbook (Page 29-30)',
    durationSec: 42,
    audioScript: 'Welcome to Vidyashilp University Academic Regulations audio briefing on Attendance. Students are required to maintain a minimum of seventy-five percent attendance in every registered course to be eligible to sit for the end-semester examination. In exceptional circumstances, such as approved medical leaves or official representation of the university in sports or cultural events, the attendance may be condoned up to a minimum of sixty-five percent with prior approval from the Dean. A student whose attendance falls below seventy-five percent without authorized condonation will be awarded an FA grade, meaning Failed on Attendance, and will not be permitted to take the term-end exam.',
    keyPoints: [
      'Standard Requirement: Minimum 75% attendance in each course.',
      'Condonation Limit: 65% absolute minimum for verified sports/cultural representation.',
      'Penalty: "FA" grade (Failed on Attendance) and exam disqualification.'
    ]
  },
  {
    id: 'audio-credit-system',
    title: 'Semester Credit Limits & Progression Rules',
    source: 'Student Handbook & SOP (Section 4)',
    durationSec: 48,
    audioScript: 'This briefing covers the Vidyashilp University Credit System and progression guidelines. For undergraduate B.Tech engineering programs, the graduation requirement is one hundred and sixty credits. In any standard semester, a student must register for a minimum of sixteen credits and may register for a maximum load of twenty-four credits. Overload registrations beyond twenty-four credits are not permitted to ensure academic well-being. Progression to the third year requires a student to have successfully completed at least seventy-two credits and to have cleared all first-year core course backlogs.',
    keyPoints: [
      'Total Graduation Requirement: 160 credits for 4-year B.Tech.',
      'Per Semester Range: Minimum 16 credits, Maximum 24 credits.',
      'Progression to Year 3: Minimum 72 credits earned + 0 Year 1 core backlogs.'
    ]
  },
  {
    id: 'audio-grading-system',
    title: '10-Point Relative Grading & SGPA/CGPA Calculation',
    source: 'Student Handbook (Section 5)',
    durationSec: 40,
    audioScript: 'Under Vidyashilp University academic policies, student performance is assessed using a ten-point relative grading scale. Grades range from A-plus, corresponding to ten grade points, down to C, corresponding to five grade points. An F grade denotes academic failure, and FA denotes failure due to attendance shortage; both carry zero grade points. The Semester Grade Point Average, or SGPA, is the credit-weighted sum of grade points earned in that semester divided by the total registered credits. The Cumulative CGPA reflects overall performance across all completed semesters.',
    keyPoints: [
      'Grading Scale: 10-point scale (A+ = 10, A = 9, B+ = 8, B = 7, C+ = 6, C = 5).',
      'Zero Points: F (Academic Failure) and FA (Attendance Shortage).',
      'Weighted Metric: SGPA and CGPA calculated proportional to course credit weights.'
    ]
  },
  {
    id: 'audio-minor-specializations',
    title: 'Minor Specializations & Interdisciplinary Tracks',
    source: 'Minor Courses for B.Tech Students Workbook',
    durationSec: 45,
    audioScript: 'Vidyashilp University empowers engineering students to pursue interdisciplinary minors such as Psychology, Law, and Start-up Entrepreneurship. Minors comprise sixteen to twenty specialized credits starting from Semester Three. For instance, the Psychology minor begins with Biological Psychology and Foundations of Psychology in Semester Three with nil prerequisites. The Law minor features courses such as Regulating Platform and Gig Workers in Semester Five. The Start-up track includes Design Thinking for Entrepreneurship. Courses must be completed in their designated odd or even semester offerings.',
    keyPoints: [
      'Minor Requirement: 16 to 20 additional credits across designated semesters.',
      'Available Tracks: Psychology, Law, Start-up Entrepreneurship, and Liberal Arts.',
      'Prerequisite Status: Most entry minor courses have NIL prerequisites for B.Tech students.'
    ]
  }
];

