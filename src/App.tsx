import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, CheckCircle, AlertCircle, Play, RefreshCw, User, Award, X, Download, MapPin, Mail, Phone, Instagram, Youtube, Facebook, Linkedin, Check, Code, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { onAuthStateChanged, User as FirebaseUser, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { collection, addDoc, getDocs, query, orderBy, Timestamp, serverTimestamp, where, limit, doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, googleProvider } from './firebase';
import html2canvas from 'html2canvas';

// const app = initializeApp(firebaseConfig);
// export const auth = getAuth(app);
// export const db = getFirestore(app);
// export const googleProvider = new GoogleAuthProvider();

declare global {
  interface Window {
    logoClickTimeout?: any;
  }
}

// --- Constants & Types ---

const QUESTIONS = [
  {
    text: "Explain the difference between HTML, CSS, and JavaScript.",
    conceptGroups: [
      { point: "HTML is used to structure web pages.", synonyms: ["html", "structure", "skeleton", "markup", "base", "foundation", "scaffolding"] },
      { point: "CSS is used to style and design web pages.", synonyms: ["css", "style", "design", "appearance", "look", "visual", "aesthetic", "makeup"] },
      { point: "JavaScript is used to add interactivity.", synonyms: ["javascript", "js", "interact", "dynamic", "behavior", "action", "logic", "programming"] },
      { point: "HTML uses tags like <p>, <h1>.", synonyms: ["tag", "p", "h1", "element", "markup", "heading", "paragraph"] },
      { point: "CSS controls colors, layout, fonts.", synonyms: ["color", "layout", "font", "size", "styling", "spacing", "background"] },
      { point: "JavaScript handles events and logic.", synonyms: ["event", "logic", "handle", "function", "code", "script", "engine"] },
      { point: "HTML is the skeleton of a webpage.", synonyms: ["skeleton", "foundation", "frame", "structure", "bones"] },
      { point: "CSS is the appearance of a webpage.", synonyms: ["appearance", "skin", "visual", "style", "clothing"] },
      { point: "JavaScript makes the webpage dynamic.", synonyms: ["dynamic", "change", "update", "live", "interact", "movement"] },
      { point: "All three together create a complete website.", synonyms: ["together", "complete", "website", "full", "combined", "trio", "stack"] },
      { point: "HTML defines content, CSS defines presentation, JS defines behavior.", synonyms: ["content", "presentation", "behavior", "roles", "separation of concerns"] },
      { point: "Browser parses HTML first, then applies CSS and runs JS.", synonyms: ["parse", "render", "execution", "order", "browser"] }
    ]
  },
  {
    text: "What are Semantic Elements in HTML and why are they important?",
    conceptGroups: [
      { point: "Semantic elements describe the meaning of content.", synonyms: ["semantic", "meaning", "describe", "purpose", "context", "definition"] },
      { point: "Examples: <header>, <footer>.", synonyms: ["header", "footer", "example", "tag", "top", "bottom"] },
      { point: "<section> defines a section of content.", synonyms: ["section", "content", "area", "part", "segment"] },
      { point: "<article> represents independent content.", synonyms: ["article", "independent", "post", "entry", "blog"] },
      { point: "<nav> is used for navigation links.", synonyms: ["nav", "navigation", "link", "menu", "sidebar"] },
      { point: "<main> defines the main content area.", synonyms: ["main", "primary", "content", "body", "core"] },
      { point: "Helps search engines understand the page.", synonyms: ["search engine", "seo", "google", "understand", "index", "ranking"] },
      { point: "Improves website accessibility.", synonyms: ["accessibility", "a11y", "blind", "disabled", "access", "inclusive"] },
      { point: "Makes code clean and readable.", synonyms: ["clean", "readable", "organized", "better", "clear", "maintainable"] },
      { point: "Helps screen readers interpret content.", synonyms: ["screen reader", "interpret", "voice", "assistive", "narrator"] },
      { point: "Avoids 'div-soup' by using descriptive tags.", synonyms: ["div-soup", "overuse", "descriptive", "structure", "tags"] },
      { point: "Provides a standard structure for developers.", synonyms: ["standard", "convention", "developer", "team", "consistency"] }
    ]
  },
  {
    text: "What is the difference between div and span?",
    conceptGroups: [
      { point: "div is a block-level element.", synonyms: ["div", "block", "level", "container", "box"] },
      { point: "span is an inline element.", synonyms: ["span", "inline", "text", "small", "wrapper"] },
      { point: "div starts on a new line.", synonyms: ["new line", "break", "separate", "starts", "vertical"] },
      { point: "span stays in the same line.", synonyms: ["same line", "inline", "stays", "flow", "horizontal"] },
      { point: "div is used for large layout sections.", synonyms: ["large", "layout", "section", "structure", "big", "group"] },
      { point: "span is used for small text styling.", synonyms: ["small", "text", "style", "part", "word", "phrase"] },
      { point: "div can contain block elements.", synonyms: ["contain", "nest", "block", "inside", "parent"] },
      { point: "span mostly contains text or inline elements.", synonyms: ["text", "inline", "inside", "content", "child"] },
      { point: "div takes full width.", synonyms: ["full width", "100%", "entire", "across", "stretched"] },
      { point: "span takes only required width.", synonyms: ["required", "content", "width", "necessary", "fit"] },
      { point: "div is a generic container for flow content.", synonyms: ["generic", "container", "flow", "division"] },
      { point: "span is a generic inline container for phrasing content.", synonyms: ["generic", "inline", "phrasing", "text"] }
    ]
  },
  {
    text: "What is the DOM (Document Object Model)?",
    conceptGroups: [
      { point: "DOM represents the HTML document as a tree structure.", synonyms: ["dom", "tree", "structure", "represent", "hierarchy", "map"] },
      { point: "Each HTML element becomes a node.", synonyms: ["node", "element", "part", "branch", "leaf"] },
      { point: "JavaScript can access and modify elements.", synonyms: ["access", "modify", "change", "js", "javascript", "manipulate", "edit"] },
      { point: "DOM allows dynamic webpage updates.", synonyms: ["dynamic", "update", "change", "live", "real-time", "re-render"] },
      { point: "Example: changing text using JavaScript.", synonyms: ["example", "text", "change", "content", "innerhtml"] },
      { point: "Supports event handling.", synonyms: ["event", "handle", "click", "listen", "trigger"] },
      { point: "Enables interactive web pages.", synonyms: ["interactive", "interact", "user", "action", "experience"] },
      { point: "Allows adding or removing elements.", synonyms: ["add", "remove", "delete", "create", "insert", "append"] },
      { point: "Used with methods like getElementById().", synonyms: ["getelementbyid", "method", "queryselector", "code", "api"] },
      { point: "It connects HTML with JavaScript.", synonyms: ["connect", "bridge", "link", "html", "js", "interface"] },
      { point: "The browser creates the DOM when loading the page.", synonyms: ["browser", "create", "load", "parsing", "initialization"] },
      { point: "DOM is an API for HTML and XML documents.", synonyms: ["api", "interface", "xml", "document", "standard"] }
    ]
  },
  {
    text: "Explain the difference between class and id in CSS.",
    conceptGroups: [
      { point: "class can be used multiple times.", synonyms: ["class", "multiple", "many", "reuse", "group", "reusable"] },
      { point: "id must be unique.", synonyms: ["id", "unique", "one", "single", "specific", "only"] },
      { point: "class selector uses . symbol.", synonyms: ["dot", "symbol", "selector", "period", "point"] },
      { point: "id selector uses # symbol.", synonyms: ["hash", "pound", "symbol", "selector", "sharp", "number"] },
      { point: "class is used for group styling.", synonyms: ["group", "many", "style", "common", "shared"] },
      { point: "id is used for specific element styling.", synonyms: ["specific", "unique", "one", "particular", "individual"] },
      { point: "One element can have multiple classes.", synonyms: ["multiple", "many", "element", "classes", "list"] },
      { point: "One element should have only one id.", synonyms: ["one", "single", "id", "element", "unique"] },
      { point: "id has higher CSS specificity.", synonyms: ["specificity", "priority", "higher", "weight", "override", "stronger"] },
      { point: "Both are used to apply styles or JavaScript access.", synonyms: ["style", "js", "access", "apply", "both", "hooks"] },
      { point: "Classes are for categories, IDs are for specific items.", synonyms: ["category", "item", "classification", "identity"] },
      { point: "IDs can be used as anchor links in URLs.", synonyms: ["anchor", "link", "url", "jump", "fragment"] }
    ]
  },
  {
    text: "What is the difference between Flexbox and Grid in CSS?",
    conceptGroups: [
      { point: "Flexbox is used for one-dimensional layouts.", synonyms: ["flexbox", "one-dimensional", "1d", "single", "axis", "linear"] },
      { point: "Grid is used for two-dimensional layouts.", synonyms: ["grid", "two-dimensional", "2d", "both", "axis", "rows and columns"] },
      { point: "Flexbox works in row or column.", synonyms: ["row", "column", "one", "direction", "axis"] },
      { point: "Grid works in rows and columns together.", synonyms: ["row", "column", "together", "both", "grid", "matrix"] },
      { point: "Flexbox uses display:flex.", synonyms: ["display:flex", "flex", "property", "container"] },
      { point: "Grid uses display:grid.", synonyms: ["display:grid", "grid", "property", "container"] },
      { point: "Flexbox is good for small layouts.", synonyms: ["small", "component", "simple", "layout", "alignment"] },
      { point: "Grid is good for complex layouts.", synonyms: ["complex", "large", "page", "full", "layout", "structure"] },
      { point: "Flexbox aligns items easily.", synonyms: ["align", "center", "distribute", "easy", "position"] },
      { point: "Grid provides precise layout control.", synonyms: ["precise", "control", "exact", "position", "template"] },
      { point: "Flexbox is content-driven, Grid is layout-driven.", synonyms: ["content-driven", "layout-driven", "inside-out", "outside-in"] },
      { point: "Grid can overlap elements easily using areas.", synonyms: ["overlap", "area", "z-index", "layering", "template"] }
    ]
  },
  {
    text: "What is Responsive Web Design?",
    conceptGroups: [
      { point: "It makes websites adapt to different screen sizes.", synonyms: ["responsive", "adapt", "size", "screen", "device", "adjust"] },
      { point: "Works for mobile, tablet, desktop.", synonyms: ["mobile", "tablet", "desktop", "phone", "computer", "laptop"] },
      { point: "Uses media queries.", synonyms: ["media query", "breakpoint", "@media", "condition"] },
      { point: "Uses flexible layouts.", synonyms: ["flexible", "fluid", "liquid", "layout", "percentage"] },
      { point: "Uses responsive images.", synonyms: ["image", "picture", "responsive", "size", "srcset"] },
      { point: "Improves user experience.", synonyms: ["user experience", "ux", "better", "friendly", "usability"] },
      { point: "Uses CSS Flexbox or Grid.", synonyms: ["flexbox", "grid", "css", "layout"] },
      { point: "Prevents horizontal scrolling on small screens.", synonyms: ["scroll", "horizontal", "prevent", "overflow", "fit"] },
      { point: "Makes websites mobile-friendly.", synonyms: ["mobile", "friendly", "phone", "optimized", "touch"] },
      { point: "Important for modern web development.", synonyms: ["important", "modern", "standard", "today", "essential"] },
      { point: "Uses viewports to control scaling.", synonyms: ["viewport", "scale", "zoom", "meta", "width"] },
      { point: "Ensures content is readable without zooming.", synonyms: ["readable", "zoom", "text", "legible", "size"] }
    ]
  },
  {
    text: "Explain the difference between let, const, and var.",
    conceptGroups: [
      { point: "var is function scoped.", synonyms: ["var", "function", "scope", "old"] },
      { point: "let is block scoped.", synonyms: ["let", "block", "scope", "modern"] },
      { point: "const is block scoped.", synonyms: ["const", "block", "scope", "modern"] },
      { point: "var can be redeclared.", synonyms: ["redeclared", "again", "var", "duplicate"] },
      { point: "let cannot be redeclared in the same scope.", synonyms: ["cannot", "redeclared", "let", "error"] },
      { point: "const cannot be reassigned.", synonyms: ["reassigned", "change", "constant", "const", "fixed"] },
      { point: "var supports hoisting.", synonyms: ["hoisting", "hoisted", "top", "var", "undefined"] },
      { point: "let and const are modern ES6 features.", synonyms: ["es6", "modern", "new", "javascript", "2015"] },
      { point: "const is used for fixed values.", synonyms: ["fixed", "constant", "same", "value", "immutable"] },
      { point: "let is used when value may change.", synonyms: ["change", "update", "variable", "value", "mutable"] },
      { point: "var is the legacy way of declaring variables.", synonyms: ["legacy", "old", "deprecated", "traditional"] },
      { point: "let and const prevent many common bugs.", synonyms: ["bug", "error", "safety", "clean", "prevent"] }
    ]
  },
  {
    text: "What is Event Delegation in JavaScript?",
    conceptGroups: [
      { point: "It is a technique for handling events efficiently.", synonyms: ["delegation", "efficient", "handle", "technique", "pattern"] },
      { point: "Uses event bubbling.", synonyms: ["bubbling", "bubble", "up", "propagation", "flow"] },
      { point: "A parent element handles child events.", synonyms: ["parent", "child", "handle", "element", "container"] },
      { point: "Reduces number of event listeners.", synonyms: ["reduce", "less", "fewer", "listener", "count"] },
      { point: "Improves performance.", synonyms: ["performance", "speed", "fast", "better", "memory"] },
      { point: "Works well with dynamic elements.", synonyms: ["dynamic", "new", "added", "element", "future"] },
      { point: "Uses addEventListener() on parent.", synonyms: ["addeventlistener", "parent", "attach", "listen"] },
      { point: "Detects event target using event.target.", synonyms: ["event.target", "target", "detect", "click", "source"] },
      { point: "Useful for lists or tables.", synonyms: ["list", "table", "ul", "li", "row", "grid"] },
      { point: "Simplifies event management.", synonyms: ["simplify", "easy", "manage", "clean", "centralized"] },
      { point: "Avoids attaching listeners to every single item.", synonyms: ["every", "single", "each", "individual", "avoid"] },
      { point: "Event propagation moves from target up to root.", synonyms: ["propagation", "move", "up", "root", "window"] }
    ]
  },
  {
    text: "What is the difference between localStorage, sessionStorage, and cookies?",
    conceptGroups: [
      { point: "All store data in the browser.", synonyms: ["store", "data", "browser", "client", "storage"] },
      { point: "localStorage stores data permanently.", synonyms: ["localstorage", "permanent", "forever", "persist", "long-term"] },
      { point: "sessionStorage stores data until tab closes.", synonyms: ["sessionstorage", "tab", "close", "temporary", "short-term"] },
      { point: "Cookies store small data with server requests.", synonyms: ["cookie", "server", "request", "http", "header"] },
      { point: "localStorage capacity is about 5–10 MB.", synonyms: ["5mb", "10mb", "capacity", "size", "large", "limit"] },
      { point: "Cookies store only ~4 KB.", synonyms: ["4kb", "small", "size", "limit", "tiny"] },
      { point: "localStorage is client-side only.", synonyms: ["client", "only", "browser", "not server", "local"] },
      { point: "Cookies can be sent to the server.", synonyms: ["server", "sent", "http", "request", "backend"] },
      { point: "sessionStorage is tab-specific.", synonyms: ["tab", "specific", "session", "window"] },
      { point: "Used for user preferences, sessions, login info.", synonyms: ["preference", "session", "login", "info", "user", "settings"] },
      { point: "Cookies have an expiration date.", synonyms: ["expire", "date", "time", "ttl", "max-age"] },
      { point: "Web Storage (local/session) is easier to use than cookies.", synonyms: ["easy", "simple", "api", "web storage", "modern"] }
    ]
  }
];

interface EvaluationResult {
  score: number;
  feedback: string;
  keywords: string[];
  individualScores: number[];
  suggestions: string[];
}

interface HistoryItem {
  id: string;
  date: string;
  userInfo: {
    firstName: string;
    lastName: string;
    email: string;
  };
  evaluation: EvaluationResult;
  answers: string[];
}

type InterviewState = 'landing' | 'welcome' | 'interviewing' | 'evaluating' | 'completed' | 'history' | 'admin';

const ADMIN_EMAILS = ['bibijanrajpal@gmail.com', 'shravanichalla01@gmail.com', 'scooplabsoffice@gmail.com'];
const IS_ADMIN = (email: string | null | undefined) => {
  if (!email) return false;
  return window.location.hostname === 'localhost' || ADMIN_EMAILS.includes(email.toLowerCase());
};

// --- Components ---

const LandingPage = ({ onStart }: { onStart: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="relative min-h-screen w-full bg-white overflow-hidden flex flex-col font-sans"
  >
    {/* Top Left Circuit Pattern */}
    <div className="absolute top-0 left-0 w-64 h-64 opacity-20 pointer-events-none">
      <svg viewBox="0 0 200 200" className="w-full h-full text-scoop-teal">
        <path fill="none" stroke="currentColor" strokeWidth="1" d="M0,20 L40,20 L60,40 L100,40 M40,20 L40,60 L20,80 M60,40 L60,80 L80,100 M100,40 L100,0 M20,80 L0,80 M80,100 L80,140 L120,140 M120,140 L140,160 L200,160" />
        <circle cx="40" cy="20" r="2" fill="currentColor" />
        <circle cx="60" cy="40" r="2" fill="currentColor" />
        <circle cx="100" cy="40" r="2" fill="currentColor" />
        <circle cx="20" cy="80" r="2" fill="currentColor" />
        <circle cx="80" cy="100" r="2" fill="currentColor" />
        <circle cx="120" cy="140" r="2" fill="currentColor" />
        <circle cx="140" cy="160" r="2" fill="currentColor" />
      </svg>
    </div>


    <div className="relative z-10 flex-1 flex flex-col md:flex-row items-center justify-between px-8 md:px-24 pt-8 pb-32 max-w-7xl mx-auto w-full">
      {/* Left Content */}
      <div className="flex-1 space-y-4 text-left">
        <div className="space-y-0">
          <h1 className="text-6xl md:text-8xl font-[900] text-black leading-[0.9] tracking-tighter uppercase">
            FRONTEND<br />DEVELOPER
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center">
              <span className="text-3xl md:text-4xl font-bold text-black italic">A</span>
              <span className="text-3xl md:text-4xl font-bold text-[#f27d26] italic">i</span>
            </div>
            <span className="text-5xl md:text-7xl font-bold text-black">- Interview</span>
          </div>
        </div>

        {/* CTA Button */}
        <div className="pt-2">
          <button
            onClick={onStart}
            className="cursor-pointer group relative flex items-center bg-white border-2 border-gray-200 rounded-full pl-3 pr-10 py-3 hover:border-scoop-orange transition-all shadow-xl hover:shadow-2xl active:scale-95"
          >
            <div className="bg-[#0c7a7a] rounded-full p-5 mr-5 group-hover:bg-scoop-orange transition-colors">
              <Play className="text-white fill-white" size={32} />
            </div>
            <span className="text-3xl font-bold text-black tracking-tight">Start Interview &rarr;</span>
          </button>
        </div>

        {/* Tech Icons */}
        <div className="flex items-center gap-6 pt-2">
          <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg" alt="HTML5" className="h-10 w-10" />
          <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg" alt="CSS3" className="h-10 w-10" />
          <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" alt="JS" className="h-10 w-10" />
          <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" alt="React" className="h-10 w-10" />
        </div>

        {/* Points */}
        <div className="space-y-2 pt-2">
          {[
            "Assess your skill level",
            "Solve technical problems",
            "Get free career guidance",
            "Earn your certificate"
          ].map((text, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="bg-[#0c7a7a] rounded-full p-1">
                <Check className="text-white" size={12} strokeWidth={4} />
              </div>
              <span className="text-lg font-semibold text-gray-700 tracking-tight">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Content - Character */}
      <div className="flex-1 relative hidden md:flex justify-end items-center pr-8 md:pr-16">
        <div className="relative w-full max-w-xl">
          <motion.img
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            src="/mannequin3.png"
            alt="AI Interviewer"
            className="w-full h-auto object-contain z-20 relative scale-[1.5] lg:scale-[1.6] origin-bottom drop-shadow-[0_20px_50px_rgba(0,0,0,0.15)]"
            referrerPolicy="no-referrer"
          />
          {/* Decorative background element behind character */}
          <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-[#f5e6d3] rounded-full -z-10 opacity-60 blur-3xl"></div>
        </div>
      </div>
    </div>

    {/* Wavy Bottom Background */}
    <div className="absolute bottom-0 left-0 w-full h-[30vh] z-0 pointer-events-none">
      <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full h-full preserve-3d" preserveAspectRatio="none">
        <path fill="#f27d26" fillOpacity="1" d="M0,160L48,176C96,192,192,224,288,224C384,224,480,192,576,165.3C672,139,768,117,864,128C960,139,1056,181,1152,197.3C1248,213,1344,203,1392,197.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
      </svg>

      {/* Bottom Right Circuit Pattern */}
      <div className="absolute bottom-4 right-4 w-64 h-64 opacity-30">
        <svg viewBox="0 0 200 200" className="w-full h-full text-black/20">
          <path fill="none" stroke="currentColor" strokeWidth="1.5" d="M200,180 L160,180 L140,160 L100,160 M160,180 L160,140 L180,120 M140,160 L140,120 L120,100 M100,160 L100,200 M180,120 L200,120 M120,100 L120,60 L80,60 M80,60 L60,40 L0,40" />
          <circle cx="160" cy="180" r="3" fill="currentColor" />
          <circle cx="140" cy="160" r="3" fill="currentColor" />
          <circle cx="100" cy="160" r="3" fill="currentColor" />
          <circle cx="180" cy="120" r="3" fill="currentColor" />
          <circle cx="120" cy="100" r="3" fill="currentColor" />
          <circle cx="80" cy="60" r="3" fill="currentColor" />
          <circle cx="60" cy="40" r="3" fill="currentColor" />
        </svg>
      </div>

      {/* Copyright Footer */}
      <div className="absolute bottom-4 left-0 w-full text-center z-20 text-white">
        <p className="text-[15px] font-medium tracking-wide drop-shadow-sm">
          &copy; Copyright Scoop Labs. All Rights Reserved
        </p>
      </div>
    </div>

  </motion.div>
);

const AdminDashboard = ({ users, onBack }: { users: any[], onBack: () => void }) => {
  const [registrations, setRegistrations] = useState<any[]>([]);

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const q = query(collection(db, 'user_registrations'), orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q).catch(e => {
          handleFirestoreError(e, OperationType.GET, 'user_registrations');
          return null;
        });
        if (!snapshot) return;
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRegistrations(data);
      } catch (error) {
        console.error("Error fetching registrations:", error);
      }
    };
    fetchRegistrations();
  }, []);

  const downloadExcel = (data: any[], filename: string) => {
    const headers = ['Date', 'First Name', 'Last Name', 'Email', 'Score', 'Status'];

    // Create a map to keep the most "complete" record for each email
    const uniqueRecords = new Map();

    data.forEach(item => {
      const email = item.userInfo?.email?.toLowerCase() || 'anonymous';
      const existing = uniqueRecords.get(email);

      if (!existing || (item.evaluation && !existing.evaluation)) {
        uniqueRecords.set(email, item);
      }
    });

    const rows = Array.from(uniqueRecords.values()).map(u => [
      u.timestamp?.toDate ? u.timestamp.toDate().toLocaleString() : (u.date ? new Date(u.date).toLocaleString() : 'N/A'),
      u.userInfo.firstName,
      u.userInfo.lastName,
      u.userInfo.email,
      u.evaluation ? `${u.evaluation.score}%` : 'N/A',
      u.evaluation ? 'Completed' : (u.status || 'Started')
    ]);
    const csvContent = [headers, ...rows].map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")) // Escapes internal quotes too.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
          <p className="text-black/40 text-sm">Real-time user logs and interview data.</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => downloadExcel([...registrations, ...users], "all_user_logs.csv")}
            className="cursor-pointer px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            <Download size={16} />
            Export to Excel
          </button>
          <button
            onClick={onBack}
            className="cursor-pointer p-2 text-black/40 hover:text-black transition-colors"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-black/40">Total Site Visitors</p>
          <p className="text-4xl font-black text-blue-600">
            {registrations.filter(r => r.status === 'site_visit').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-black/40">Started Test</p>
          <p className="text-4xl font-black text-scoop-teal">
            {registrations.filter(r => r.status === 'started_test').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-black/40">Drop-offs (Exits)</p>
          <p className="text-4xl font-black text-amber-600">
            {registrations.filter(r => r.status.includes('exited') || r.status.includes('tab_closed')).length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-black/40">Completion Rate</p>
          <p className="text-4xl font-black text-emerald-600">
            {Math.round((registrations.filter(r => r.status === 'completed_interview').length / Math.max(1, registrations.filter(r => r.status === 'started_test').length)) * 100)}%
          </p>
        </div>
      </div>

      <div className="bg-white border border-black/5 rounded-[32px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black text-white">
                <th className="p-4 text-xs font-mono uppercase tracking-widest">Date</th>
                <th className="p-4 text-xs font-mono uppercase tracking-widest">Name</th>
                <th className="p-4 text-xs font-mono uppercase tracking-widest">Email</th>
                <th className="p-4 text-xs font-mono uppercase tracking-widest">Score/Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {users.map((user, i) => (
                <tr key={`user-${i}`} className="hover:bg-black/[0.01] transition-colors">
                  <td className="p-4 text-sm font-mono text-black/40">
                    {user.date?.toDate ? user.date.toDate().toLocaleDateString() : new Date(user.date).toLocaleDateString()}
                  </td>
                  <td className="p-4 font-bold">{user.userInfo.firstName} {user.userInfo.lastName}</td>
                  <td className="p-4 text-sm text-black/60">{user.userInfo.email}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${user.evaluation.score >= 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {user.evaluation.score}%
                    </span>
                  </td>
                </tr>
              ))}
              {registrations.filter(r => !users.some(u => u.userInfo.email === r.userInfo.email)).map((reg, i) => (
                <tr key={`reg-${i}`} className="hover:bg-black/[0.01] transition-colors bg-gray-50/50">
                  <td className="p-4 text-sm font-mono text-black/40">
                    {reg.timestamp?.toDate ? reg.timestamp.toDate().toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="p-4 font-bold">{reg.userInfo.firstName} {reg.userInfo.lastName}</td>
                  <td className="p-4 text-sm text-black/60">{reg.userInfo.email}</td>
                  <td className="p-4">
                    <span className="text-[10px] font-mono uppercase text-amber-600 bg-amber-50 px-2 py-1 rounded">
                      {reg.status === 'started_test' ? 'Started / Incomplete' : reg.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
              {users.length === 0 && registrations.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-20 text-center text-black/40">No user data available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

// --- Main Component ---

export default function App() {
  const [state, setState] = useState<InterviewState>('landing');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [hasFinished, setHasFinished] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('interview_finished') === 'true';
    }
    return false;
  });
  const [isCompleted, setIsCompleted] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('interview_completed') === 'true';
    }
    return false;
  });
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('interview_evaluation');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  const [userInfo, setUserInfo] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('interview_user_info');
      return saved ? JSON.parse(saved) : { firstName: '', lastName: '', email: '' };
    }
    return { firstName: '', lastName: '', email: '' };
  });
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isRequestingMic, setIsRequestingMic] = useState(false);
  const [showSkipPermissions, setShowSkipPermissions] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [antiCheatError, setAntiCheatError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [autoStartEnabled, setAutoStartEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [secretClickCount, setSecretClickCount] = useState(0);
  const [logoError, setLogoError] = useState(false);
  const [certLogoError, setCertLogoError] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('interview_user_info', JSON.stringify(userInfo));
    }
  }, [userInfo]);

  useEffect(() => {
    if (typeof window !== 'undefined' && evaluation) {
      localStorage.setItem('interview_evaluation', JSON.stringify(evaluation));
    }
  }, [evaluation]);

  const streamsRef = useRef<{ camera: MediaStream | null, screen: MediaStream | null }>({ camera: null, screen: null });

  useEffect(() => {
    // Check for redirect result on mount
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          const user = result.user;
          setUser(user);

          // Auto-fill userInfo if we are in the welcome screen
          if (user.displayName) {
            const names = user.displayName.split(' ');
            const newUserInfo = {
              firstName: names[0] || '',
              lastName: names.slice(1).join(' ') || '',
              email: user.email || ''
            };
            setUserInfo(newUserInfo);

            // If they were on the welcome screen, auto-start the interview
            if (localStorage.getItem('pending_interview_start') === 'true') {
              localStorage.removeItem('pending_interview_start');
              setTimeout(() => startInterview(), 500);
            }
          }
        }
      } catch (error) {
        console.error("Redirect Auth Error:", error);
      }
    };
    handleRedirectResult();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u && ADMIN_EMAILS.includes(u.email?.toLowerCase() || '')) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Log visit only once per session/load when they land
    if (state === 'landing') {
      logUserEvent('site_visit');
    }
  }, [state]);

  useEffect(() => {
    // Sync state with browser history for back/forward support
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.interviewState) {
        setState(event.state.interviewState);
      }
    };
    window.addEventListener('popstate', handlePopState);

    // Initial history state
    if (!window.history.state) {
      window.history.replaceState({ interviewState: state }, "");
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync current state to history whenever it changes
  useEffect(() => {
    if (window.history.state?.interviewState !== state) {
      window.history.pushState({ interviewState: state }, "");
    }
  }, [state]);

  const handleGoogleAuth = async () => {
    try {
      localStorage.setItem('pending_interview_start', 'true');
      await signInWithRedirect(auth, googleProvider);
    } catch (error) {
      console.error("Google Auth error:", error);
    }
  };

  // --- Silent Background Email Sender ---
  useEffect(() => {
    if (state === 'completed' && isCompleted && userInfo.email) {
      if (sessionStorage.getItem('email_delivered')) return;
      sessionStorage.setItem('email_delivered', 'true');

      const captureAndEmail = async () => {
        try {
          // Wait 2500ms for everything to fully render visually
          await new Promise(resolve => setTimeout(resolve, 2500));
          
          const element = document.getElementById('certificate-to-download');
          if (!element) {
            await sendBrevoEmail(userInfo.email, userInfo.firstName, evaluation?.score || 0);
            return;
          }

          const canvas = await html2canvas(element, {
            scale: 2, 
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            width: 1123,
            height: 794
          });
          
          const base64Data = canvas.toDataURL('image/png', 0.9).split(',')[1];
          await sendBrevoEmail(userInfo.email, userInfo.firstName, evaluation?.score || 0, base64Data);
        } catch (error) {
          console.error("Silent capture failed", error);
          await sendBrevoEmail(userInfo.email, userInfo.firstName, evaluation?.score || 0);
        }
      };
      captureAndEmail();
    }
  }, [state, isCompleted, userInfo, evaluation]);

  const sendBrevoEmail = async (email: string, firstName: string, score: number, attachmentBase64?: string) => {
    // Note: User needs to provide their actual Brevo API key
    const BREVO_API_KEY = process.env.BREVO_API_KEY || '';

    try {
      const payload: any = {
        sender: { name: "Scoop Labs", email: "support@scooplabs.in" },
        to: [{ email, name: firstName }],
        subject: `Interview Update: ${firstName}`,
        htmlContent: `
          <div style="font-family: 'Inter', system-ui, sans-serif; padding: 40px; background-color: #ffffff; color: #1e293b; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
            <p style="font-size: 16px; margin-bottom: 24px;">Hi ${firstName},</p>
            
            <p style="font-size: 16px; margin-bottom: 16px;">Thank you for actively participating in the interview. Your time and effort are greatly appreciated.</p>
            
            <p style="font-size: 16px; margin-bottom: 32px;">Wishing you all the best in your future endeavors.</p>
            
            <div style="border-top: 1px solid #f1f5f9; padding-top: 24px; color: #1e293b; line-height: 1.8;">
              <p style="margin: 0 0 1.5em 0; font-size: 16px;">Best regards,</p>
              <p style="margin: 0; font-size: 18px; font-weight: bold;">Team Scoop Labs</p>
              <div style="margin: 16px 0;">
                <p style="margin: 0; font-size: 16px;"><strong>Contact No:</strong> +91 98444 00550</p>
                <p style="margin: 0; font-size: 16px;"><strong>Email:</strong> <a href="mailto:info@scooplabs.in" style="color: #3b82f6; text-decoration: none;">info@scooplabs.in</a></p>
                <p style="margin: 0; font-size: 16px;"><strong>Website:</strong> <a href="https://www.scooplabs.in" style="color: #1e293b; text-decoration: none;">www.scooplabs.in</a></p>
              </div>
              <div style="margin-top: 24px;">
                <img src="https://crm.scooplabs.in/images/logo.png" alt="Scoop Labs" style="max-height: 40px; display: block;" />
                <p style="margin: 8px 0 0 0; font-size: 16px; color: #f27d26;">-Innovative Labs for Tech Learning-</p>
              </div>
            </div>
          </div>
        `
      };

      if (attachmentBase64) {
        payload.attachment = [{
          name: `${firstName}_Certificate.png`,
          content: attachmentBase64
        }];
      }

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': BREVO_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error("Brevo Email Error:", await response.text());
      } else {
        console.log("Completion email sent successfully via Brevo");
      }
    } catch (error) {
      console.error("Error sending Brevo email:", error);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const fetchAdminData = async (overrideUser?: any) => {
    const activeUser = overrideUser || user;
    if (!activeUser || !IS_ADMIN(activeUser.email)) return;
    try {
      const q = query(collection(db, 'interviews'), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q).catch(e => {
        handleFirestoreError(e, OperationType.GET, 'interviews');
        return null;
      });
      if (!querySnapshot) return;
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAdminUsers(data);
      setState('admin');
    } catch (error) {
      console.error("Error fetching admin data", error);
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state === 'interviewing') {
        logUserEvent(`tab_closed_at_q${currentQuestionIndex + 1}`);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state, currentQuestionIndex]);

  const saveInterviewToFirebase = async (interviewData: any) => {
    try {
      await addDoc(collection(db, 'interviews'), {
        ...interviewData,
        date: Timestamp.now()
      }).catch(e => handleFirestoreError(e, OperationType.CREATE, 'interviews'));

      // Also log as a completion event
      await logUserEvent('completed_interview', interviewData.userInfo);
    } catch (error) {
      console.error("Error saving interview", error);
    }
  };

  const logUserEvent = async (status: string, customUserInfo?: any) => {
  try {
    const info = customUserInfo || userInfo;
    
    // 1. Safety check: Exit if no email is present
    if (!info.email) return;
    const email = info.email.toLowerCase().trim();

    // 2. Update the UNIQUE user record
    // Using the email as the ID ensures one row per person in your Dashboard
    await setDoc(doc(db, 'user_registrations', email), {
      userInfo: {
        firstName: info.firstName || 'Anonymous',
        lastName: info.lastName || '',
        email: email
      },
      lastUpdated: serverTimestamp(),
      status: status
    }, { merge: true });

    // 3. Send to Google Analytics (gtag) if present
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', status, {
        'event_category': 'Interview',
        'event_label': status,
        'user_email': email
      });
    }

    // 4. Mark email as used/active
    if (status === 'started_test' || status === 'completed_test') {
      await setDoc(doc(db, 'used_emails', email), {
        used: true,
        lastStatus: status,
        timestamp: serverTimestamp()
      }, { merge: true });
    }
  } catch (error) {
    console.error(`Error logging event: ${status}`, error);
  }
};

  const syncToCRM = async (info: { firstName: string, lastName: string, email: string }) => {
    try {
      const payload = {
        first_name: info.firstName,
        last_name: info.lastName,
        email_id: info.email,
        source: "ai-interview"
      };

      const response = await fetch('https://crm.scooplabs.in/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`CRM Sync failed with status: ${response.status}`);
      }

      console.log("Successfully synced contact to CRM");
    } catch (error) {
      console.error("CRM Sync Error:", error);
    }
  };

  const logEvent = async (event: string, details: any = {}) => {
    try {
      await addDoc(collection(db, 'logs'), {
        event,
        timestamp: serverTimestamp(),
        userId: auth.currentUser?.uid || 'anonymous',
        email: userInfo.email || 'anonymous',
        details
      }).catch(e => console.warn("Could not save log", e));
    } catch (error) {
      // Silent fail for logs to not interrupt user flow
    }
  };

  const [certificateImages, setCertificateImages] = useState<{ [key: string]: string }>({});
  const [isPreloading, setIsPreloading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [certError, setCertError] = useState<string | null>(null);

  const preloadImages = async () => {
    if (isPreloading) return;
    setIsPreloading(true);
    setCertError(null);

    const imagesToLoad: Record<string, string> = {};

    console.log("Starting image preloading for certificate...");

    try {
      const loadPromises = Object.entries(imagesToLoad).map(async ([key, url]) => {
        try {
          // Try direct fetch first with a timeout
          const tryDirect = async () => {
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout for direct
              const res = await fetch(url, { mode: 'cors', signal: controller.signal });
              clearTimeout(timeoutId);
              if (res.ok) return await res.blob();
            } catch (e) { return null; }
            return null;
          };

          let blob = await tryDirect();

          if (!blob) {
            console.log(`Direct fetch failed for ${key}, trying proxies...`);
            const proxies = [
              `https://images.weserv.nl/?url=${encodeURIComponent(url)}&default=${encodeURIComponent(url)}`,
              `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
              `https://corsproxy.io/?${encodeURIComponent(url)}`,
              `https://api.codetabs.com/v1/proxy?quest=${url}`,
              `https://thingproxy.freeboard.io/fetch/${url}`
            ];

            for (const proxyUrl of proxies) {
              try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout per proxy

                const response = await fetch(proxyUrl, { signal: controller.signal });
                clearTimeout(timeoutId);

                if (!response.ok) continue;
                const b = await response.blob();
                if (b.size > 100) {
                  blob = b;
                  break;
                }
              } catch (e) { continue; }
            }
          }

          if (blob) {
            const base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob!);
            });

            if (base64.length > 200) {
              setCertificateImages(prev => ({ ...prev, [key]: base64 }));
              console.log(`Successfully preloaded ${key}`);
            }
          } else {
            console.warn(`Failed to preload image: ${key}`);
          }
        } catch (error) {
          console.error(`Error preloading image ${key}:`, error);
        }
      });

      // Wait for all preloads to finish or timeout the whole batch
      await Promise.race([
        Promise.all(loadPromises),
        new Promise(resolve => setTimeout(resolve, 45000)) // 45s max for all images
      ]);

      console.log("Image preloading batch finished.");
    } catch (error) {
      console.error("Error in preloadImages batch:", error);
    } finally {
      setIsPreloading(false);
    }
  };

  useEffect(() => {
    if (state === 'evaluating') {
      preloadImages();
    }
  }, [state]);

  const downloadCertificate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    setCertError(null);
    console.log("Starting certificate download process...");
    const element = document.getElementById('certificate-to-download');

    if (!element) {
      console.error("CRITICAL: Certificate element 'certificate-to-download' not found in DOM");
      setCertError("Certificate template not found. Please try refreshing the page.");
      setIsGenerating(false);
      return;
    }

    console.log("Certificate element found. Proceeding with generation...");

    try {
      // Generate a unique certificate ID for security/verification
      const certId = `ML-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;

      // Save certificate record to Firestore for verification
      if (auth.currentUser) {
        try {
          await addDoc(collection(db, 'certificates'), {
            certId,
            userId: auth.currentUser.uid,
            userName: `${userInfo.firstName} ${userInfo.lastName}`,
            score: evaluation?.score || 0,
            date: serverTimestamp(),
            type: 'Frontend Developer Interview'
          });
          console.log("Certificate record saved to Firestore:", certId);

          // Log the download event
          await logEvent('downloaded_certificate', { certId, score: evaluation?.score });
        } catch (fsError) {
          console.error("Error saving certificate to Firestore:", fsError);
          // Continue with download even if Firestore fails
        }
      }

      // Small delay to ensure everything is rendered
      await new Promise(resolve => setTimeout(resolve, 800));

      console.log("Preparing for html2canvas rendering...");

      const elementToCapture = element;

      const canvas = await html2canvas(elementToCapture, {
        scale: 3, // High resolution
        useCORS: true,
        logging: false,
        allowTaint: false,
        backgroundColor: '#ffffff',
        width: 1123,
        height: 794,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          const container = clonedDoc.getElementById('certificate-container');
          if (container) {
            container.style.visibility = 'visible';
            container.style.display = 'block';
            container.style.left = '0';
            container.style.top = '0';
            container.style.position = 'relative';
            container.style.zIndex = '9999';
            container.style.opacity = '1';
          }
          const clonedElement = clonedDoc.getElementById('certificate-to-download');
          if (clonedElement) {
            clonedElement.style.visibility = 'visible';
            clonedElement.style.display = 'flex';
            clonedElement.style.opacity = '1';
            clonedElement.style.transform = 'none';
          }
          // Update the ID in the cloned document
          const idElement = clonedDoc.getElementById('cert-id-display');
          if (idElement) {
            idElement.innerText = `Verification ID: ${certId}`;
          }
        }
      });

      console.log("Canvas rendering complete. Size:", canvas.width, "x", canvas.height);

      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error("Generated canvas has zero dimensions. This usually happens if the element is hidden.");
      }

      console.log("Converting canvas to image data...");
      const imgData = canvas.toDataURL('image/png', 1.0);

      console.log("Saving PNG file...");
      const fileName = `${userInfo.firstName}_${userInfo.lastName}_Certificate.png`.replace(/\s+/g, '_');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log("Certificate download triggered successfully!");
      setHasDownloaded(true);
    } catch (error) {
      console.error("FATAL ERROR during certificate generation:", error);
      setCertError(`Failed to generate certificate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const shareToLinkedInPost = () => {
    const url = window.location.origin;
    const text = `I am pleased to announce that I have successfully completed a rigorous AI-driven technical interview simulation on Mockify, a platform by Scoop Labs. 🚀\n\nThis experience provided invaluable insights into my technical proficiency and communication skills, simulating a real-world interview environment with precision. It's an excellent tool for anyone looking to refine their interview performance and gain confidence.\n\nHighly recommend checking out Mockify for your career preparation: ${url}\n\n#ScoopLabs #ProfessionalDevelopment #AITechnology #TechnicalInterview #CareerGrowth #Mockify #InterviewPrep`;
    const shareUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank', 'width=600,height=600');
  };

  const addToLinkedInProfile = () => {
    const certName = 'Frontend Developer Interview Certification';
    const orgName = 'Scoop Labs';
    const issueYear = new Date().getFullYear();
    const issueMonth = new Date().getMonth() + 1;
    const certUrl = window.location.origin;
    const certId = `${userInfo.firstName}_${userInfo.lastName}_${Date.now()}`;

    const addUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(certName)}&organizationName=${encodeURIComponent(orgName)}&issueYear=${issueYear}&issueMonth=${issueMonth}&certUrl=${encodeURIComponent(certUrl)}&certId=${encodeURIComponent(certId)}`;

    window.open(addUrl, '_blank', 'width=600,height=600');
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && state === 'interviewing') {
        console.log('Tab switch detected. Auto-submitting...');
        forceSubmitInterview();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [state, currentQuestionIndex, answers, currentAnswer]);

  const forceSubmitInterview = () => {
    // We need to use refs or functional updates to get the latest state inside this function
    // if it's called from an event listener, but since we're in a useEffect with dependencies,
    // it should be fine. However, to be extra safe with state closures:
    setState(currentState => {
      if (currentState !== 'interviewing') return currentState;

      // We can't easily access currentAnswer/answers here without refs if we want to be 100% safe
      // but let's assume the closure is fresh enough or use a ref for answers if needed.
      // For now, let's just trigger the evaluation with what we have.
      return currentState;
    });

    // Actually, let's just use the current state values as they are captured in the effect
    if (state !== 'interviewing') return;

    const finalAnswer = currentAnswer.trim() || "No answer provided (Auto-submitted due to tab switch).";
    const newAnswers = [...answers];

    while (newAnswers.length < QUESTIONS.length) {
      newAnswers.push(newAnswers.length === answers.length ? finalAnswer : "No answer provided (Auto-submitted due to tab switch).");
    }

    performEvaluation(newAnswers);
    /*if (streamsRef.current.camera) {
      streamsRef.current.camera.getTracks().forEach(track => track.stop());
    } */
    if (streamsRef.current.screen) {
      streamsRef.current.screen.getTracks().forEach(track => track.stop());
    }
  };

  useEffect(() => {
    const savedHistory = localStorage.getItem('interview_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const shouldBeListening = useRef(false);
  const isSpeakingRef = useRef(false);
  const isRecognitionRunningRef = useRef(false);

  // Text to Speech
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);

      const setVoiceAndSpeak = () => {
        const voices = window.speechSynthesis.getVoices();
        const femaleVoice = voices.find(v => v.name.includes('Google US English') && v.name.includes('Female')) ||
          voices.find(v => v.name.includes('Samantha')) ||
          voices.find(v => v.name.includes('Victoria')) ||
          voices.find(v => v.name.toLowerCase().includes('female')) ||
          voices.find(v => v.name.includes('Zira')) ||
          voices.find(v => v.lang.startsWith('en') && v.name.includes('Female'));

        if (femaleVoice) utterance.voice = femaleVoice;

        utterance.rate = 1.0;
        utterance.pitch = 1.0; // Slightly lower pitch for a more natural professional female voice

        utterance.onstart = () => {
          setIsSpeaking(true);
          isSpeakingRef.current = true;
          // Stop listening immediately when AI starts talking to avoid feedback loop
          if (recognitionRef.current && shouldBeListening.current) {
            recognitionRef.current.stop();
          }
        };
        utterance.onend = () => {
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          // Resume listening if user had it turned on and it's not already running
          if (shouldBeListening.current && !isRecognitionRunningRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.error('Failed to resume recognition', e);
            }
          }
        };
        utterance.onerror = () => {
          setIsSpeaking(false);
          isSpeakingRef.current = false;
        };

        window.speechSynthesis.speak(utterance);
      };

      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          setVoiceAndSpeak();
          window.speechSynthesis.onvoiceschanged = null;
        };
      } else {
        setVoiceAndSpeak();
      }
    }
  };

  // Speak question when it changes
  useEffect(() => {
    if (state === 'interviewing') {
      speak(QUESTIONS[currentQuestionIndex].text);
    } else {
      window.speechSynthesis.cancel();
    }
  }, [state, currentQuestionIndex]);

  // Timer Logic
  useEffect(() => {
    if (state === 'interviewing' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            performEvaluation([...answers, currentAnswer]);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        isRecognitionRunningRef.current = true;
      };

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        const CONFIDENCE_THRESHOLD = 0.4;
        const FILLER_WORDS = /\b(um|uh|ah|like|you know|actually|basically|literally|sort of|kind of)\b/gi;

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i][0];
          const confidence = result.confidence;
          let text = result.transcript;

          // Filter by confidence
          if (confidence < CONFIDENCE_THRESHOLD) {
            continue;
          }

          // Handle filler words and pauses (trimming)
          text = text.replace(FILLER_WORDS, '').replace(/\s+/g, ' ').trim();

          if (event.results[i].isFinal) {
            if (text) {
              setCurrentAnswer(prev => (prev.trim() + ' ' + text).trim() + ' ');
            }
          } else {
            interimTranscript += text;
          }
        }
        setTranscript(interimTranscript);
        setSpeechError(null);
      };

      recognitionRef.current.onerror = (event: any) => {
        // Suppress 'no-speech' error as it's common and often benign
        if (event.error === 'no-speech') {
          return;
        }

        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone access denied.');
        } else if (event.error === 'network') {
          setSpeechError('Network error during recognition.');
        } else {
          setSpeechError('Speech recognition error.');
        }
        setIsListening(false);
        shouldBeListening.current = false;
      };

      recognitionRef.current.onend = () => {
        isRecognitionRunningRef.current = false;
        // Only restart if user wants it AND AI isn't currently talking AND it's not already running
        if (shouldBeListening.current && !isSpeakingRef.current && !isRecognitionRunningRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.error('Failed to restart recognition', e);
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      shouldBeListening.current = false;
      recognitionRef.current?.stop();
    } else {
      setSpeechError(null);
      setTranscript('');
      shouldBeListening.current = true;
      if (!isRecognitionRunningRef.current) {
        try {
          recognitionRef.current?.start();
          setIsListening(true);
        } catch (e) {
          console.error('Failed to start recognition', e);
          shouldBeListening.current = false;
          setIsListening(false);
        }
      }
    }
  };

  const startInterview = async (forceDemo = false) => {
    if (hasFinished) return;

    setIsRequestingMic(true);
    setSpeechError(null);
    setDuplicateError(null);
    setAntiCheatError(null);
    setShowSkipPermissions(false);

    // Check for duplicate email
    // Check for duplicate email in history (local check)
    const isLocalDuplicate = history.some(item => item.userInfo.email.toLowerCase().trim() === userInfo.email.toLowerCase().trim());
    if (isLocalDuplicate) {
      setDuplicateError('This email address has already been used for an interview. Only one attempt is allowed.');
      setIsRequestingMic(false);
      return;
    }

    // Check for duplicate email in Firestore (server check)
    try {
      // Check a dedicated 'used_emails' collection where doc ID is the email
      // This is more secure than querying the full interviews collection
      const emailDoc = await getDoc(doc(db, 'used_emails', userInfo.email.toLowerCase().trim()));

      if (emailDoc.exists()) {
        setDuplicateError('This email address has already been used for an interview. Only one attempt is allowed.');
        setIsRequestingMic(false);
        return;
      }
    } catch (error) {
      console.error("Error checking for duplicate email", error);
      // If it's a permission error, it means the rules are blocking us.
      // We'll proceed for now to not block the user, but log it.
    }

    const skipTimeout = setTimeout(() => {
      setShowSkipPermissions(true);
    }, 8000);

    try {
      // Log registration to Firebase (non-blocking)
      logUserEvent('started_test');

      // Sync to Scoop Labs CRM (non-blocking)
      syncToCRM(userInfo);

      if (isDemoMode || forceDemo) {
        // Skip hardware in demo mode
        clearTimeout(skipTimeout);
        setIsRequestingMic(false);
        startCountdown();
        return;
      }

      // Request microphone and camera permission
      try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        streamsRef.current.camera = cameraStream;
      } catch (micErr) {
        console.error("Mic/Camera error:", micErr);
        throw micErr;
      }

      // Request screen sharing permission (optional if not supported)
      if (navigator.mediaDevices && (navigator.mediaDevices as any).getDisplayMedia) {
        try {
          const screenStream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
          streamsRef.current.screen = screenStream;

          // Listen for screen sharing stop
          screenStream.getVideoTracks()[0].onended = () => {
            if (state === 'interviewing') {
              forceSubmitInterview();
            }
          };
        } catch (screenErr) {
          console.error('Screen sharing access error:', screenErr);
          // If user cancelled, we still require it for anti-cheat
          if (screenErr instanceof Error && (screenErr.name === 'NotAllowedError' || screenErr.name === 'PermissionDeniedError')) {
            setAntiCheatError('Screen sharing is mandatory to prevent cheating. Please allow screen access.');
            setIsRequestingMic(false);
            clearTimeout(skipTimeout);
            if (streamsRef.current.camera) {
              streamsRef.current.camera.getTracks().forEach(track => track.stop());
            }
            return;
          }
          // For other errors (like not supported in this context), we might proceed
          console.warn("Proceeding without screen share due to error:", screenErr);
        }
      } else {
        console.warn("Screen sharing not supported on this device/browser.");
      }

      clearTimeout(skipTimeout);
      setIsRequestingMic(false);
      startCountdown();

    } catch (err) {
      clearTimeout(skipTimeout);
      console.error('Permission access error:', err);
      setSpeechError('Microphone and Camera access are required to start the interview. If you are having trouble, try Demo Mode.');
      setIsRequestingMic(false);
      setShowSkipPermissions(true);
    }
  };

  const startCountdown = () => {
    // Start 3-second countdown
    let count = 3;
    setCountdown(count);

    const interval = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(interval);
        setCountdown(null);
        setState('interviewing');
        setCurrentQuestionIndex(0);
        setAnswers([]);
      } else {
        setCountdown(count);
      }
    }, 1000);
  };

  const handleNextQuestion = () => {
    const finalAnswer = currentAnswer.trim() || "No answer provided.";
    const newAnswers = [...answers, finalAnswer];
    setAnswers(newAnswers);
    setCurrentAnswer('');
    setTranscript('');

    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      performEvaluation(newAnswers);
    }
  };

  const performEvaluation = (allAnswers: string[]) => {
    setState('evaluating');

    // Simulate processing delay
    setTimeout(async () => {
      const individualScores: number[] = [];
      const suggestions: string[] = [];
      let totalEarnedPoints = 0;
      let totalPossiblePoints = 0;

      allAnswers.forEach((answer, index) => {
        const question = (QUESTIONS as any)[index];
        const lowerAnswer = answer.toLowerCase();

        let qEarned = 0;
        const missedConcepts: string[] = [];

        question.conceptGroups.forEach((group: any) => {
          // Check if any synonym in the group is present in the answer
          const isFound = group.synonyms.some((synonym: string) => {
            // Use word boundaries to avoid partial matches (e.g., "id" in "idea")
            const escapedSynonym = synonym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${escapedSynonym}\\b`, 'i');
            return regex.test(lowerAnswer);
          });

          if (isFound) {
            qEarned += 1;
          } else {
            missedConcepts.push(group.point); // The descriptive point
          }
        });

        const qPossible = question.conceptGroups.length;
        const normalizedQScore = Math.round((qEarned / qPossible) * 10);

        individualScores.push(normalizedQScore);
        totalEarnedPoints += qEarned;
        totalPossiblePoints += qPossible;

        if (missedConcepts.length > 0) {
          suggestions.push(`Q${index + 1} Insight: You could improve by mentioning concepts like: ${missedConcepts.slice(0, 2).join(', ')}.`);
        }
      });

      const finalScore = Math.round((totalEarnedPoints / totalPossiblePoints) * 100);

      const feedback = finalScore >= 80 ? "Exceptional! You have a deep understanding of web development and explained concepts clearly." :
        finalScore >= 60 ? "Great job! You know the core concepts well, though some details could be more precise." :
          finalScore >= 40 ? "Good effort. You understand the basics, but try to use more technical terminology or explain the 'why' behind concepts." :
            "Keep learning! Focus on the fundamental concepts of HTML, CSS, and JS. Try to explain things in terms of structure, style, and logic.";

      const finalEvaluation = {
        score: finalScore,
        feedback,
        keywords: [],
        individualScores,
        suggestions
      };

      setEvaluation(finalEvaluation);
      localStorage.setItem('interview_evaluation', JSON.stringify(finalEvaluation));

      const newHistoryItem: HistoryItem = {
        id: `SV-${Math.floor(Math.random() * 100000)}`,
        date: new Date().toISOString(),
        userInfo: {
          ...userInfo,
          email: userInfo.email.toLowerCase().trim()
        },
        evaluation: finalEvaluation,
        answers: [...allAnswers]
      };

      saveInterviewToFirebase(newHistoryItem);

      // Email sending is now handled by the silent background capture effect below

      // Log viewing feedback
      await logEvent('viewed_feedback', { score: finalScore });

      const updatedHistory = [newHistoryItem, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('interview_history', JSON.stringify(updatedHistory));

      setState('completed');
      setHasFinished(true);
      setIsCompleted(true);
      localStorage.setItem('interview_finished', 'true');
      localStorage.setItem('interview_completed', 'true');

      // Stop all streams
      if (streamsRef.current.camera) {
        streamsRef.current.camera.getTracks().forEach(track => track.stop());
        streamsRef.current.camera = null;
      }
      if (streamsRef.current.screen) {
        streamsRef.current.screen.getTracks().forEach(track => track.stop());
        streamsRef.current.screen = null;
      }
    }, 2500);
  };

  const resetInterview = () => {
    setState('welcome');
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setEvaluation(null);
    setTimeLeft(600);
    setAutoStartEnabled(false); // Disable auto-start after exit/reset
    window.speechSynthesis.cancel();
    setHasFinished(true);
    localStorage.setItem('interview_finished', 'true');

    // Log exit event with progress
    logUserEvent(`interview_exited_at_q${currentQuestionIndex + 1}`);

    // Stop microphone
    shouldBeListening.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping recognition', e);
      }
    }
    setIsListening(false);
    setTranscript('');
    setCurrentAnswer('');

    // Stop all streams
    if (streamsRef.current.camera) {
      streamsRef.current.camera.getTracks().forEach(track => track.stop());
      streamsRef.current.camera = null;
    }
    if (streamsRef.current.screen) {
      streamsRef.current.screen.getTracks().forEach(track => track.stop());
      streamsRef.current.screen = null;
    }
  };

  const resetSession = () => {
    localStorage.removeItem('interview_finished');
    localStorage.removeItem('interview_completed');
    localStorage.removeItem('interview_evaluation');
    setHasFinished(false);
    setIsCompleted(false);
    setState('welcome');
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setEvaluation(null);
    setTimeLeft(600);
    setAutoStartEnabled(false);
    window.speechSynthesis.cancel();

    // Stop and reset microphone state
    shouldBeListening.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping recognition', e);
      }
    }
    setIsListening(false);
    setSpeechError(null);
    setTranscript('');
    setCurrentAnswer('');

    // Stop all streams
    if (streamsRef.current.camera) {
      streamsRef.current.camera.getTracks().forEach(track => track.stop());
      streamsRef.current.camera = null;
    }
    if (streamsRef.current.screen) {
      streamsRef.current.screen.getTracks().forEach(track => track.stop());
      streamsRef.current.screen = null;
    }
  };

  const exportHistory = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "interview_training_data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const deleteHistoryItem = (id: string) => {
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem('interview_history', JSON.stringify(updated));
  };

  const handleLogoClick = async () => {
    if (state !== 'interviewing') {
      setState('landing');
    }

    const newCount = secretClickCount + 1;
    setSecretClickCount(newCount);

    // Reset count after 3 seconds of inactivity
    if (window.logoClickTimeout) clearTimeout(window.logoClickTimeout);
    window.logoClickTimeout = setTimeout(() => setSecretClickCount(0), 3000);

    if (newCount >= 5) {
      setSecretClickCount(0);
      if (window.logoClickTimeout) clearTimeout(window.logoClickTimeout);
      let activeUser = user;
      if (!activeUser) {
        handleLogin();
        return;
      }
      if (activeUser && IS_ADMIN(activeUser.email)) {
        fetchAdminData(activeUser);
      } else {
        alert("Access Denied: Only the author can access the Admin Dashboard.");
      }
    }
  };

  useEffect(() => {
    if (state === 'welcome' && autoStartEnabled) {
      const timer = setTimeout(() => {
        startInterview();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state, autoStartEnabled]);

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#1a1a1a] font-sans selection:bg-emerald-100">
      {/* Header */}
      <header className="border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="w-full px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-black/50 hidden sm:flex">
              <button
                onClick={() => window.history.back()}
                className="p-2 rounded-full hover:bg-black/5 transition-colors hover:text-black cursor-pointer"
                title="Click to go back"
              >
                <ChevronLeft size={20} strokeWidth={2.5} />
              </button>
              <button
                onClick={() => window.history.forward()}
                className="p-2 rounded-full hover:bg-black/5 transition-colors hover:text-black cursor-pointer"
                title="Click to go forward"
              >
                <ChevronRight size={20} strokeWidth={2.5} />
              </button>
            </div>
            <div
              className="flex items-center gap-3 cursor-pointer select-none sm:pl-4 sm:border-l border-black/10"
              onClick={handleLogoClick}
            >
              <img
                src="https://scooplabs.in/images/sl2.svg"
                alt="Scoop Labs"
                className="h-12 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            {state === 'interviewing' && (
              <>
                <div className={`flex items-center gap-2 font-mono text-sm px-3 py-1 rounded-full border ${timeLeft < 60 ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-black/5 border-black/5 text-black/60'}`}>
                  <span className="w-2 h-2 rounded-full bg-current"></span>
                  {formatTime(timeLeft)}
                </div>
                <button
                  onClick={resetInterview}
                  className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
                >
                  <X size={14} />
                  Exit
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className={`mx-auto ${state === 'landing' ? 'px-0 py-0' : 'px-6 py-12 md:py-20'} ${state === 'landing' ? 'w-full' : (state === 'completed' || state === 'admin') ? 'max-w-6xl' : 'max-w-4xl'}`}>
        <AnimatePresence mode="wait">
          {state === 'landing' && (
            <LandingPage onStart={() => {
              logUserEvent('clicked_get_started');
              resetSession();
            }} />
          )}

          {state === 'admin' && (
            <AdminDashboard users={adminUsers} onBack={() => setState('landing')} />
          )}

          {state === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center min-h-[60vh] space-y-8"
            >
              {hasFinished ? (
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                    <CheckCircle size={40} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">
                      {isCompleted ? 'Interview Completed' : 'Interview Exited'}
                    </h2>
                    <p className="text-black/60 max-w-md mx-auto">
                      {isCompleted
                        ? 'Congratulations! You have successfully completed your technical interview.'
                        : 'You have exited the interview. Thank you for your participation.'}
                    </p>
                  </div>

                  {isCompleted && (
                    <div className="w-full max-w-md space-y-4">
                      <button
                        onClick={() => setState('completed')}
                        className="cursor-pointer w-full px-6 py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
                      >
                        <Award size={20} />
                        View Results & Certificate
                      </button>
                    </div>
                  )}

                  {/* Restart button removed per user request */}
                </div>
              ) : countdown !== null ? (
                <div className="text-center space-y-4">
                  <motion.div
                    key={countdown}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-8xl font-bold text-emerald-600"
                  >
                    {countdown}
                  </motion.div>
                  <p className="text-black/40 font-mono uppercase tracking-widest text-sm">Starting Interview...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-8 w-full max-w-md">
                  <div className="w-full space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-black/40 ml-1">First Name</label>
                        <input
                          type="text"
                          placeholder="John"
                          value={userInfo.firstName}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                            setUserInfo({ ...userInfo, firstName: value });
                          }}
                          className="w-full px-4 py-3 rounded-xl border border-black/5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-black/40 ml-1">Last Name</label>
                        <input
                          type="text"
                          placeholder="Doe"
                          value={userInfo.lastName}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                            setUserInfo({ ...userInfo, lastName: value });
                          }}
                          className="w-full px-4 py-3 rounded-xl border border-black/5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-black/40 ml-1">Email Address</label>
                      <input
                        type="email"
                        placeholder="john.doe@example.com"
                        value={userInfo.email}
                        onChange={(e) => {
                          setUserInfo({ ...userInfo, email: e.target.value });
                          setDuplicateError(null);
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-black/5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col items-center space-y-4 w-full">
                    <button
                      onClick={() => startInterview()}
                      disabled={isRequestingMic || !userInfo.firstName.trim() || !userInfo.lastName.trim() || !userInfo.email.trim()}
                      className="cursor-pointer group relative w-full inline-flex items-center justify-center gap-3 bg-scoop-teal text-white px-12 py-6 rounded-2xl font-bold text-2xl transition-all hover:bg-scoop-dark hover:scale-[1.02] active:scale-95 shadow-2xl shadow-scoop-teal/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-scoop-teal"
                    >
                      {isRequestingMic ? 'Requesting Mic...' : 'Start Interview'}
                      {!isRequestingMic && <Play size={24} fill="currentColor" className="transition-transform group-hover:translate-x-1" />}
                    </button>

                    {showSkipPermissions && (
                      <button
                        onClick={() => {
                          setIsDemoMode(true);
                          setSpeechError(null);
                          setAntiCheatError(null);
                          startInterview(true);
                        }}
                        className="cursor-pointer text-scoop-teal text-sm font-bold hover:underline"
                      >
                        Trouble starting? Try Demo Mode (Skip Hardware)
                      </button>
                    )}
                  </div>

                  {speechError && (
                    <p className="text-red-500 text-sm font-medium flex items-center gap-2">
                      <AlertCircle size={16} />
                      {speechError}
                    </p>
                  )}

                  {duplicateError && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600">
                      <AlertCircle size={20} className="shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-bold">Access Denied</p>
                        <p className="text-xs leading-relaxed">{duplicateError}</p>
                      </div>
                    </div>
                  )}

                  {antiCheatError && (
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3 text-amber-700">
                      <AlertCircle size={20} className="shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-bold">Anti-Cheat Requirement</p>
                        <p className="text-xs leading-relaxed">{antiCheatError}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {state === 'interviewing' && (
            <motion.div
              key="interviewing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-12"
            >
              {/* Left Side: Avatar & Question Count */}
              <div className="flex flex-col items-center gap-8">
                {/* Talking Avatar Container */}
                <div className="relative flex flex-col items-center">
                  {/* Avatar Circle */}
                  <div className={`relative w-32 h-32 rounded-full overflow-hidden border-4 transition-all duration-500 z-10 flex items-center justify-center ${isSpeaking ? 'border-emerald-500 scale-110 shadow-2xl shadow-emerald-200 bg-emerald-50' : 'border-black/5 bg-gray-100'}`}>
                    <img
                      src="/mannequin3.png"
                      alt="AI Interviewer"
                      className={`w-full h-full object-cover object-top transition-transform duration-500 ${isSpeaking ? 'scale-110' : 'scale-100'}`}
                      referrerPolicy="no-referrer"
                      loading="eager"
                    />
                  </div>

                  {/* Desk Background (Simulated) */}
                  <div className="absolute top-16 w-48 h-24 bg-stone-100 border border-stone-200 rounded-t-3xl -z-0 shadow-inner">
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-1 bg-stone-200 rounded-full opacity-50"></div>
                  </div>

                  <div className={`mt-4 px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider transition-colors duration-300 z-20 ${isSpeaking ? 'bg-emerald-600 text-white' : 'bg-black text-white opacity-40'}`}>
                    {isSpeaking ? 'Speaking...' : 'Listening'}
                  </div>
                </div>

                <div className="hidden md:flex flex-col items-center gap-4 w-full">
                  <div className="text-[40px] font-bold tracking-tighter leading-none text-black/10 overflow-hidden h-[40px]">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentQuestionIndex}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      >
                        {String(currentQuestionIndex + 1).padStart(2, '0')}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  <div className="h-px bg-black/10 w-full"></div>
                  <div className="text-xs font-mono text-black/40 uppercase">
                    Total: {QUESTIONS.length}
                  </div>
                </div>
              </div>

              <div className="space-y-12">
                {/* Question */}
                <div className="space-y-6 min-h-[120px]">
                  <AnimatePresence mode="wait">
                    <motion.h2
                      key={currentQuestionIndex}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className={`text-2xl md:text-4xl font-medium leading-snug tracking-tight transition-colors duration-500 ${isSpeaking ? 'text-emerald-900' : 'text-black'}`}
                    >
                      {QUESTIONS[currentQuestionIndex].text}
                    </motion.h2>
                  </AnimatePresence>
                </div>

                {/* Answer Area */}
                <div className="space-y-4">
                  <div className="relative">
                    <textarea
                      value={currentAnswer + (transcript ? transcript : '')}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      placeholder={isSpeaking ? "AI is speaking... listening will resume shortly." : "Type your answer here or use the microphone..."}
                      className={`w-full min-h-[250px] p-8 bg-white border rounded-[32px] shadow-inner focus:ring-4 focus:ring-scoop-teal/5 focus:border-scoop-teal outline-none transition-all resize-none text-xl leading-relaxed ${isSpeaking ? 'border-scoop-teal/20 bg-scoop-teal/[0.01]' : 'border-black/10'}`}
                    />

                    <div className="absolute top-6 right-6 flex items-center gap-2">
                      {(currentAnswer || transcript) && (
                        <button
                          onClick={() => { setCurrentAnswer(''); setTranscript(''); }}
                          className="cursor-pointer p-2 text-black/20 hover:text-red-500 transition-colors"
                          title="Clear Answer"
                        >
                          <RefreshCw size={18} />
                        </button>
                      )}
                    </div>

                    <div className="absolute bottom-6 right-6 flex items-center gap-3">
                      <AnimatePresence>
                        {isSpeaking && shouldBeListening.current && (
                          <motion.span
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-[10px] font-mono text-scoop-teal bg-scoop-teal/5 px-2 py-1 rounded uppercase tracking-widest"
                          >
                            AI Speaking - Mic Paused
                          </motion.span>
                        )}
                        {speechError && (
                          <motion.span
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-xs font-mono text-red-500 bg-red-50 px-2 py-1 rounded"
                          >
                            {speechError}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      <button
                        onClick={toggleListening}
                        className={`cursor-pointer p-4 rounded-full transition-all shadow-lg ${isListening
                          ? 'bg-red-500 text-white animate-pulse'
                          : isSpeaking && shouldBeListening.current
                            ? 'bg-scoop-teal/10 text-scoop-teal cursor-wait'
                            : 'bg-black/5 text-black hover:bg-scoop-teal hover:text-white'
                          }`}
                        title={isListening ? "Stop Listening" : "Start Voice Input"}
                      >
                        {isListening ? <MicOff size={24} /> : <Mic size={24} />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleNextQuestion}
                    disabled={!currentAnswer.trim() && !transcript}
                    className="cursor-pointer w-full py-5 bg-black text-white rounded-2xl font-medium disabled:opacity-30 disabled:cursor-not-allowed disabled:pointer-events-none hover:bg-scoop-teal transition-colors flex items-center justify-center gap-2 text-lg"
                  >
                    {currentQuestionIndex === QUESTIONS.length - 1 ? 'Finish Interview' : 'Next Question'}
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {state === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-3xl font-bold tracking-tight">Interview History</h2>
                  <p className="text-black/40 text-sm">Review your past performance and training data.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={exportHistory}
                    className="flex items-center gap-2 px-4 py-2 bg-scoop-teal/10 text-scoop-teal rounded-xl text-sm font-bold hover:bg-scoop-teal/20 transition-colors"
                  >
                    <Send size={16} />
                    Export for Training
                  </button>
                  <button
                    onClick={() => setState('welcome')}
                    className="p-2 text-black/40 hover:text-black transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {history.map((item) => (
                  <div key={item.id} className="p-6 bg-white border border-black/5 rounded-[32px] hover:border-scoop-teal transition-all group">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-scoop-teal text-white rounded-2xl flex items-center justify-center font-bold text-xl">
                          {item.evaluation.score}
                        </div>
                        <div>
                          <div className="font-bold text-lg">{item.userInfo.firstName} {item.userInfo.lastName}</div>
                          <div className="text-xs font-mono text-black/40 uppercase tracking-widest">
                            {new Date(item.date).toLocaleDateString()} • {item.id}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setUserInfo(item.userInfo);
                            setEvaluation(item.evaluation);
                            setAnswers(item.answers);
                            setState('completed');
                          }}
                          className="px-4 py-2 bg-black text-white rounded-xl text-xs font-bold hover:bg-scoop-teal transition-colors"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => deleteHistoryItem(item.id)}
                          className="p-2 text-black/10 hover:text-red-500 transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {history.length === 0 && (
                  <div className="text-center py-20 bg-black/[0.02] rounded-[40px] border border-dashed border-black/10">
                    <p className="text-black/40">No history found.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {state === 'evaluating' && (
            <motion.div
              key="evaluating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 space-y-8"
            >
              <div className="relative">
                <div className="w-24 h-24 border-4 border-scoop-teal/10 rounded-full animate-spin border-t-scoop-teal"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-scoop-teal rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-medium">Analyzing your responses...</h3>
                <p className="text-black/40 font-mono text-sm">AI is evaluating technical depth and sentiment</p>
              </div>
            </motion.div>
          )}

          {state === 'completed' && evaluation && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col gap-12"
            >
              {/* Top Section: Certificate & Actions */}
              <div className="bg-white rounded-[40px] p-8 md:p-12 border border-black/5 shadow-xl space-y-8 flex flex-col items-center">
                <div className="text-center space-y-2 w-full">
                  <h2 className="text-3xl font-bold tracking-tight">Your AI Interview Certificate</h2>
                  <p className="text-black/40">Congratulations on completing the assessment.</p>
                </div>
                <div className="w-full space-y-8 max-w-[900px]">
                  <div id="certificate-container" style={{ position: 'fixed', left: 0, top: 0, zIndex: -100, opacity: 0, pointerEvents: 'none' }}>
                    <div id="certificate-to-download" style={{
                      backgroundColor: '#f8fcfe',
                      color: '#000000',
                      fontFamily: "'Inter', sans-serif",
                      width: '1123px',
                      height: '794px',
                      padding: '24px',
                      position: 'relative',
                      boxSizing: 'border-box'
                    }} className="flex flex-col shadow-2xl">

                      {/* Outer Decorative Border precisely at the edges */}
                      <div style={{ position: 'absolute', top: '24px', left: '24px', right: '24px', bottom: '24px', border: '2px solid #146162', zIndex: 10 }}></div>

                      {/* Corner Accents - 18x18 squares intersecting the border corners */}
                      <div style={{ position: 'absolute', top: '15px', left: '15px', width: '18px', height: '18px', border: '2px solid #146162', backgroundColor: '#f8fcfe', zIndex: 15 }}></div>
                      <div style={{ position: 'absolute', top: '15px', right: '15px', width: '18px', height: '18px', border: '2px solid #146162', backgroundColor: '#f8fcfe', zIndex: 15 }}></div>
                      <div style={{ position: 'absolute', bottom: '15px', left: '15px', width: '18px', height: '18px', border: '2px solid #146162', backgroundColor: '#f8fcfe', zIndex: 15 }}></div>
                      <div style={{ position: 'absolute', bottom: '15px', right: '15px', width: '18px', height: '18px', border: '2px solid #146162', backgroundColor: '#f8fcfe', zIndex: 15 }}></div>

                      <div style={{ position: 'relative', zIndex: 20, height: '100%', display: 'flex', flexDirection: 'column', paddingTop: '15px' }}>

                        {/* Top Logos perfectly balanced sizes */}
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '15px', height: '65px' }}>
                          <img src="/skill_india2.png" alt="Skill India" style={{ height: '60px', objectFit: 'contain', mixBlendMode: 'multiply' }} crossOrigin="anonymous" />

                          <div style={{ width: '1.5px', height: '40px', background: '#000', margin: '0 30px' }}></div>

                          <div style={{ transform: 'translateY(-3px)' }}>
                            <span style={{ fontSize: '38px', fontWeight: 'bold', color: '#007070', letterSpacing: '-1.5px' }}>Scoop Labs<span style={{ color: '#f27d26' }}>.</span></span>
                          </div>

                          <div style={{ width: '1.5px', height: '40px', background: '#000', margin: '0 30px' }}></div>

                          <img src="/nsdc2.png" alt="NSDC" style={{ height: '70px', objectFit: 'contain', mixBlendMode: 'multiply' }} crossOrigin="anonymous" />
                        </div>

                        <div style={{ textAlign: 'center', fontSize: '12px', color: '#444', marginBottom: '20px' }}>
                          Authorized Training Partner of the National Skill Development Corporation (NSDC)<br />
                          (Under the Skill India Mission)
                        </div>

                        {/* Title with HTML Flourishes */}
                        <div style={{ position: 'relative', textAlign: 'center', margin: '0' }}>

                          {/* Top Flourish */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                            <div style={{ width: '140px', height: '1.5px', background: '#aaa', marginRight: '8px' }}></div>
                            <div style={{ width: '6px', height: '6px', border: '1.5px solid #aaa', borderRadius: '50%' }}></div>
                            <div style={{ width: '10px', height: '10px', backgroundColor: '#aaa', borderRadius: '50%', margin: '0 6px' }}></div>
                            <div style={{ width: '6px', height: '6px', border: '1.5px solid #aaa', borderRadius: '50%', marginRight: '8px' }}></div>
                            <div style={{ width: '140px', height: '1.5px', background: '#aaa' }}></div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="#000" style={{ marginRight: '20px', alignSelf: 'center', transform: 'translateY(-5px)' }}>
                              <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" />
                            </svg>
                            <div style={{
                              fontSize: '40px',
                              fontWeight: '500',
                              color: '#286a94',
                              fontFamily: "'Playfair Display', serif",
                              textTransform: 'uppercase',
                              letterSpacing: '1px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <div>AI Interview Completion</div>
                              <div>Certificate</div>
                            </div>
                          </div>

                          {/* Bottom Flourish */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '10px' }}>
                            <div style={{ width: '140px', height: '1.5px', background: '#aaa', marginRight: '8px' }}></div>
                            <div style={{ width: '6px', height: '6px', border: '1.5px solid #aaa', borderRadius: '50%' }}></div>
                            <div style={{ width: '10px', height: '10px', backgroundColor: '#aaa', borderRadius: '50%', margin: '0 6px' }}></div>
                            <div style={{ width: '6px', height: '6px', border: '1.5px solid #aaa', borderRadius: '50%', marginRight: '8px' }}></div>
                            <div style={{ width: '140px', height: '1.5px', background: '#aaa' }}></div>
                          </div>
                        </div>

                        {/* Reduced inner margins for neat clean look */}
                        <div style={{ textAlign: 'center', fontSize: '18px', margin: '15px 0 10px', fontWeight: '600', letterSpacing: '0.5px' }}>
                          THIS IS TO CERTIFY THAT
                        </div>

                        {/* Name Block */}
                        <div style={{ textAlign: 'center', margin: '0 0 10px' }}>
                          <div style={{ fontSize: '42px', fontWeight: 'bold', padding: '0 40px 10px', minWidth: '400px', display: 'inline-block', position: 'relative' }}>
                            {userInfo.firstName} {userInfo.lastName}
                            {/* Explicit Absolute Underline to enforce html2canvas render */}
                            <div style={{ position: 'absolute', bottom: '0', left: '0', width: '100%', height: '3px', background: '#000' }}></div>
                          </div>
                        </div>

                        <div style={{ textAlign: 'center', fontSize: '18px', margin: '10px 0' }}>
                          has successfully completed the
                        </div>

                        <div style={{ textAlign: 'center', fontSize: '22px', fontWeight: 'bold', margin: '5px 0 15px', textTransform: 'uppercase' }}>
                          AI Technical Interview Assessment
                        </div>

                        <div style={{ textAlign: 'center', width: '600px', margin: '0 auto', fontSize: '18px', color: '#333', lineHeight: '1.5', zIndex: 10 }}>
                          conducted as part of the Scoop Labs Career<br />Readiness Program.
                        </div>

                        {/* Bottom Section Layout */}
                        <div style={{ position: 'absolute', bottom: '50px', left: '70px', right: '70px', height: '170px' }}>

                          {/* Left Signature Block - constrained width */}
                          <div style={{ position: 'absolute', left: 0, top: 0, width: '240px', height: '100%', textAlign: 'center' }}>
                            <img src="/signature2.png" alt="Signature" style={{ height: '65px', position: 'absolute', top: '50px', left: '50%', transform: 'translateX(-50%)', mixBlendMode: 'multiply' }} crossOrigin="anonymous" />

                            {/* Rigid Baseline */}
                            <div style={{ position: 'absolute', top: '120px', left: 0, width: '240px', height: '2px', background: '#000' }}></div>

                            {/* Text below baseline */}
                            <div style={{ position: 'absolute', top: '130px', left: 0, width: '240px', textAlign: 'center' }}>
                              <div style={{ fontSize: '15px', fontWeight: 'bold' }}>K PRASANNA</div>
                              <div style={{ fontSize: '13px' }}>PROGRAM COORDINATOR</div>
                              <div style={{ fontSize: '15px', fontWeight: 'bold' }}>SCOOP LABS</div>
                            </div>
                          </div>

                          {/* Center AI Brain Icon */}
                          <div style={{ position: 'absolute', left: '50%', top: '0', transform: 'translateX(-50%)', opacity: 0.10, zIndex: 5 }}>
                            <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                              <path d="M12 8v4" />
                              <path d="M12 16h.01" />
                            </svg>
                          </div>

                          {/* Right Stamp Block - constrained width */}
                          <div style={{ position: 'absolute', right: 0, top: 0, width: '240px', height: '100%', textAlign: 'center' }}>
                            <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', zIndex: 40 }}>
                              <img src="/seal.png" alt="Scoop Labs Seal" style={{ width: '130px', height: 'auto', objectFit: 'contain' }} />
                            </div>

                            {/* Rigid Baseline */}
                            <div style={{ position: 'absolute', top: '120px', left: 0, width: '240px', height: '2px', background: '#000' }}></div>

                            {/* Text below baseline */}
                            <div style={{ position: 'absolute', top: '130px', left: 0, width: '240px', textAlign: 'center' }}>
                              <div style={{ fontSize: '15px', fontWeight: 'bold' }}>SCOOP LABS</div>
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8 w-full">
                    <button
                      onClick={downloadCertificate}
                      disabled={isGenerating}
                      className={`flex-1 w-full py-5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 text-lg shadow-xl ${isGenerating
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-scoop-teal text-white hover:bg-scoop-dark shadow-scoop-teal/20'
                        }`}
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw size={20} className="animate-spin" />
                          Generating PDF...
                        </>
                      ) : (
                        <>
                          <Download size={20} />
                          Download Certificate
                        </>
                      )}
                    </button>

                    <a
                      href="https://scooplabs.in/full-stack-mern-course-bengaluru"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 w-full py-5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 text-lg shadow-xl bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/20"
                    >
                      View Our Full Stack Course
                    </a>
                  </div>

                  {hasDownloaded && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4 pt-4 border-t border-black/5"
                    >
                      <p className="text-center font-bold text-scoop-teal uppercase tracking-widest text-sm">Share your achievement</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                          onClick={shareToLinkedInPost}
                          className="flex items-center justify-center gap-2 py-4 bg-[#0077b5] text-white rounded-xl font-bold hover:bg-[#005582] transition-all shadow-lg shadow-blue-500/10"
                        >
                          <Linkedin size={20} />
                          Share as Post
                        </button>
                        <button
                          onClick={addToLinkedInProfile}
                          className="flex items-center justify-center gap-2 py-4 border-2 border-[#0077b5] text-[#0077b5] rounded-xl font-bold hover:bg-[#0077b5]/5 transition-all"
                        >
                          <Award size={20} />
                          Add to Profile
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {certError && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-200 text-sm"
                    >
                      <AlertCircle size={18} className="shrink-0" />
                      <p>{certError}</p>
                    </motion.div>
                  )}

                  {/* Restart button removed per user request */}
                </div>
              </div>

              {/* Bottom Section: Summary & Performance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Left Side: Summary */}
                <div className="space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-4xl font-bold tracking-tight">Interview Summary</h2>
                    <p className="text-black/40 font-mono text-sm uppercase tracking-wider">Candidate ID: #SV-{Math.floor(Math.random() * 10000)}</p>
                  </div>

                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                    {QUESTIONS.map((q, i) => (
                      <div key={i} className="p-5 bg-white border border-black/5 rounded-2xl space-y-3 relative group hover:border-scoop-teal transition-colors">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-mono uppercase text-black/30">Question {i + 1}</span>
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-scoop-teal/5 border border-scoop-teal/10 text-scoop-teal text-[10px] font-bold">
                            {evaluation.individualScores[i]}/10
                          </div>
                        </div>
                        <div className="text-sm font-medium leading-tight text-black/80">{q.text}</div>
                        <div className="p-3 rounded-xl bg-black/[0.02] text-xs text-black/60 italic leading-relaxed">
                          "{answers[i]}"
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Side: Performance */}
                <div className="bg-black text-white rounded-[40px] p-10 shadow-2xl shadow-black/20 space-y-10 flex flex-col">
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold">Performance Analysis</h3>
                      <div className="flex flex-col items-end">
                        <span className="text-lg font-black tracking-tighter text-scoop-teal leading-none">SCOOP</span>
                        <span className="text-lg font-black tracking-tighter text-scoop-teal leading-none">LABS<span className="text-scoop-orange">.</span></span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <span className="text-xs font-mono uppercase tracking-widest text-white/40">Overall AI Score</span>
                        <span className="text-5xl font-bold tracking-tighter text-emerald-400">{evaluation.score}%</span>
                      </div>
                      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${evaluation.score}%` }}
                          transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                          className="h-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-white/10">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <CheckCircle size={18} />
                        <span className="text-xs font-mono uppercase tracking-widest">AI Insights</span>
                      </div>
                      <p className="text-lg font-medium leading-snug text-white/90">
                        {evaluation.feedback}
                      </p>
                    </div>

                    {evaluation.suggestions.length > 0 && (
                      <div className="space-y-4 pt-6 border-t border-white/10">
                        <div className="flex items-center gap-2 text-amber-400">
                          <AlertCircle size={18} />
                          <span className="text-xs font-mono uppercase tracking-widest">Corrections</span>
                        </div>
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                          {evaluation.suggestions.map((s, i) => (
                            <div key={i} className="text-xs text-white/60 leading-relaxed flex gap-2 border-b border-white/5 pb-2">
                              <span className="text-amber-400 font-bold shrink-0">•</span>
                              <span>{s}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
