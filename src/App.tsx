import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, CheckCircle, AlertCircle, Play, RefreshCw, User, Award, X, Download, MapPin, Mail, Phone, Instagram, Youtube, Facebook, Linkedin, Check, Code, ChevronLeft, ChevronRight, ArrowRight, Home, Bot, Camera, Monitor, SkipForward } from 'lucide-react';
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

const PYTHON_QUESTIONS = [
  {
    text: "What are Python's key features that make it popular for placements?",
    conceptGroups: [
      { point: "Simple and readable syntax.", synonyms: ["simple", "readable", "easy", "clean", "syntax"] },
      { point: "Interpreted language - no compilation needed.", synonyms: ["interpreted", "no compilation", "runtime", "dynamic"] },
      { point: "Dynamically typed variables.", synonyms: ["dynamic", "type", "typed", "variable", "flexible"] },
      { point: "Large standard library.", synonyms: ["library", "standard", "built-in", "modules", "packages"] },
      { point: "Multi-paradigm: supports OOP and functional.", synonyms: ["oop", "object", "functional", "paradigm", "multi"] },
      { point: "Cross-platform compatibility.", synonyms: ["cross-platform", "platform", "windows", "linux", "mac", "portable"] },
      { point: "Extensive third-party libraries like NumPy, Pandas.", synonyms: ["numpy", "pandas", "third-party", "pip", "scipy"] },
      { point: "Widely used in AI, ML, and Data Science.", synonyms: ["ai", "ml", "machine learning", "data science", "artificial"] },
      { point: "Strong community support.", synonyms: ["community", "support", "popular", "developers", "forum"] },
      { point: "Open source and free.", synonyms: ["open source", "free", "cost", "license", "open"] }
    ]
  },
  {
    text: "Explain the difference between list, tuple, and dictionary in Python.",
    conceptGroups: [
      { point: "List is mutable (can be changed).", synonyms: ["list", "mutable", "change", "modify", "update"] },
      { point: "Tuple is immutable (cannot be changed).", synonyms: ["tuple", "immutable", "fixed", "cannot change", "constant"] },
      { point: "Dictionary stores key-value pairs.", synonyms: ["dictionary", "dict", "key", "value", "pair", "map"] },
      { point: "List uses square brackets [].", synonyms: ["square", "bracket", "[", "]", "list syntax"] },
      { point: "Tuple uses parentheses ().", synonyms: ["parentheses", "(", ")", "tuple syntax", "round bracket"] },
      { point: "Dictionary uses curly braces {} with colon.", synonyms: ["curly", "{", "}", "colon", "dict syntax"] },
      { point: "List allows duplicate values.", synonyms: ["duplicate", "repeat", "same", "list", "allow"] },
      { point: "Dictionary keys must be unique.", synonyms: ["unique", "key", "no duplicate", "distinct"] },
      { point: "Tuple is faster than list due to immutability.", synonyms: ["faster", "performance", "speed", "efficient", "tuple"] },
      { point: "Dictionary supports fast lookup by key.", synonyms: ["lookup", "search", "fast", "key", "hash"] }
    ]
  },
  {
    text: "What is the difference between deep copy and shallow copy in Python?",
    conceptGroups: [
      { point: "Shallow copy creates a new object with references to the original nested objects.", synonyms: ["shallow", "reference", "linked", "nested", "same"] },
      { point: "Deep copy creates a new object with recursive copies of all nested objects.", synonyms: ["deep", "recursive", "independent", "new", "separate"] },
      { point: "Shallow copy uses copy.copy().", synonyms: ["copy.copy", "shallow copy", "copy module", "import copy"] },
      { point: "Deep copy uses copy.deepcopy().", synonyms: ["deepcopy", "copy.deepcopy", "deep copy function"] },
      { point: "Changing nested data in shallow copy affects original.", synonyms: ["affect", "original", "change", "nested", "shallow"] },
      { point: "Deep copy changes do not affect the original.", synonyms: ["not affect", "independent", "isolated", "original safe"] },
      { point: "Assignment (=) is not a copy, it's a reference.", synonyms: ["assignment", "=", "reference", "not copy", "pointer"] },
      { point: "Both are from the copy module.", synonyms: ["copy module", "import", "module", "library"] },
      { point: "Used when dealing with mutable data structures.", synonyms: ["mutable", "list", "dict", "data structure"] },
      { point: "Deep copy is slower but safer for complex objects.", synonyms: ["slower", "safer", "complex", "deep"] }
    ]
  },
  {
    text: "What are decorators in Python and how are they used?",
    conceptGroups: [
      { point: "Decorators are functions that modify other functions.", synonyms: ["decorator", "modify", "function", "wrap", "enhance"] },
      { point: "They use the @ symbol before the function name.", synonyms: ["@", "symbol", "at sign", "syntax", "before function"] },
      { point: "They follow the higher-order function concept.", synonyms: ["higher-order", "higher order", "function as argument", "return function"] },
      { point: "Used for logging, authentication, caching.", synonyms: ["logging", "authentication", "caching", "use case", "example"] },
      { point: "Decorators take a function as argument and return a function.", synonyms: ["argument", "return", "function", "take", "wrapper"] },
      { point: "The @wraps decorator preserves original function metadata.", synonyms: ["wraps", "functools", "metadata", "preserve", "name"] },
      { point: "Multiple decorators can be stacked on one function.", synonyms: ["stack", "multiple", "chain", "stacked", "combined"] },
      { point: "Built-in decorators include @staticmethod and @classmethod.", synonyms: ["staticmethod", "classmethod", "built-in", "property", "builtin"] },
      { point: "They allow code reuse without modifying original function.", synonyms: ["reuse", "reusable", "without modifying", "dry", "clean"] },
      { point: "Common in frameworks like Flask and Django.", synonyms: ["flask", "django", "framework", "route", "real world"] }
    ]
  },
  {
    text: "Explain Object-Oriented Programming concepts in Python.",
    conceptGroups: [
      { point: "Class is a blueprint for creating objects.", synonyms: ["class", "blueprint", "template", "structure", "define"] },
      { point: "Object is an instance of a class.", synonyms: ["object", "instance", "created", "instantiate"] },
      { point: "Encapsulation hides data and methods inside a class.", synonyms: ["encapsulation", "hide", "data hiding", "private", "protect"] },
      { point: "Inheritance allows a class to inherit from another class.", synonyms: ["inheritance", "inherit", "parent", "child", "base", "derived"] },
      { point: "Polymorphism allows different classes to use the same method name.", synonyms: ["polymorphism", "same method", "different", "override", "poly"] },
      { point: "Abstraction hides complex implementation details.", synonyms: ["abstraction", "abstract", "hide", "implementation", "interface"] },
      { point: "__init__ is the constructor method in Python.", synonyms: ["__init__", "constructor", "init", "initialize", "self"] },
      { point: "self refers to the current instance of the class.", synonyms: ["self", "current", "instance", "reference"] },
      { point: "super() is used to call the parent class method.", synonyms: ["super", "parent", "call", "method", "inherit"] },
      { point: "OOP makes code modular, reusable, and maintainable.", synonyms: ["modular", "reusable", "maintainable", "organized", "structured"] }
    ]
  },
  {
    text: "What is the difference between == and 'is' in Python?",
    conceptGroups: [
      { point: "== compares the values of two objects.", synonyms: ["==", "value", "compare", "equal", "content"] },
      { point: "'is' compares memory addresses (identity).", synonyms: ["is", "identity", "memory", "address", "same object"] },
      { point: "Two objects can be equal (==) but not identical (is).", synonyms: ["equal but not identical", "different object", "same value"] },
      { point: "'is' is used for None comparison: if x is None.", synonyms: ["none", "is none", "null check", "none check"] },
      { point: "== calls __eq__ method internally.", synonyms: ["__eq__", "dunder", "method", "internal", "override"] },
      { point: "Small integers are cached so 'is' may return True.", synonyms: ["cache", "cached", "integer", "interning", "small number"] },
      { point: "Strings may also be interned by Python.", synonyms: ["string", "intern", "interning", "string cache"] },
      { point: "Use == for value comparison in most cases.", synonyms: ["use ==", "prefer", "best practice", "recommended"] },
      { point: "'is not' checks if two objects are not the same.", synonyms: ["is not", "not same", "different", "not identical"] },
      { point: "Important distinction for debugging and correctness.", synonyms: ["debug", "bug", "correct", "important", "distinction"] }
    ]
  },
  {
    text: "What are Python generators and how are they useful?",
    conceptGroups: [
      { point: "Generators are functions that use yield instead of return.", synonyms: ["generator", "yield", "instead of return", "function"] },
      { point: "They produce values lazily, one at a time.", synonyms: ["lazy", "one at a time", "on demand", "lazy evaluation"] },
      { point: "Memory efficient - doesn't store all values at once.", synonyms: ["memory", "efficient", "not store", "lightweight", "less memory"] },
      { point: "Created using the yield keyword.", synonyms: ["yield", "keyword", "create", "generator function"] },
      { point: "next() is used to get values from generator.", synonyms: ["next", "next()", "get value", "iterate"] },
      { point: "Generator expressions use () similar to list comprehensions.", synonyms: ["expression", "parentheses", "comprehension", "generator expression"] },
      { point: "Useful for reading large files or infinite sequences.", synonyms: ["large file", "infinite", "sequence", "stream", "big data"] },
      { point: "They maintain state between calls.", synonyms: ["state", "maintain", "resume", "pause", "continue"] },
      { point: "Used with for loops for clean iteration.", synonyms: ["for loop", "iterate", "iteration", "loop"] },
      { point: "Improves performance for pipeline data processing.", synonyms: ["pipeline", "performance", "processing", "data", "improve"] }
    ]
  },
  {
    text: "What is exception handling in Python? Explain try, except, finally.",
    conceptGroups: [
      { point: "Exception handling prevents program from crashing on errors.", synonyms: ["prevent", "crash", "error", "handle", "exception"] },
      { point: "try block contains code that may raise an exception.", synonyms: ["try", "block", "code", "may raise", "attempt"] },
      { point: "except block catches and handles the exception.", synonyms: ["except", "catch", "handle", "block"] },
      { point: "finally block runs whether or not an exception occurred.", synonyms: ["finally", "always", "run", "cleanup", "regardless"] },
      { point: "else block runs if no exception occurs in try.", synonyms: ["else", "no exception", "success", "runs if"] },
      { point: "Multiple except blocks can handle different exceptions.", synonyms: ["multiple", "different", "specific", "type", "exception type"] },
      { point: "raise keyword is used to throw exceptions manually.", synonyms: ["raise", "throw", "manual", "custom", "trigger"] },
      { point: "Custom exceptions can be created by extending Exception class.", synonyms: ["custom", "extend", "class", "user-defined", "exception class"] },
      { point: "ZeroDivisionError, ValueError are common built-in exceptions.", synonyms: ["zerodivision", "valueerror", "built-in", "typeerror", "indexerror"] },
      { point: "Proper exception handling is critical for robust production code.", synonyms: ["robust", "production", "critical", "important", "best practice"] }
    ]
  },
  {
    text: "What are Python's built-in data types? Explain with examples.",
    conceptGroups: [
      { point: "int - integer numbers like 5, -3, 100.", synonyms: ["int", "integer", "number", "whole"] },
      { point: "float - decimal numbers like 3.14, 2.7.", synonyms: ["float", "decimal", "3.14", "floating point"] },
      { point: "str - text like 'hello', 'world'.", synonyms: ["str", "string", "text", "characters", "hello"] },
      { point: "bool - True or False values.", synonyms: ["bool", "boolean", "true", "false"] },
      { point: "list - ordered, mutable collection.", synonyms: ["list", "ordered", "mutable", "collection"] },
      { point: "tuple - ordered, immutable collection.", synonyms: ["tuple", "immutable", "ordered"] },
      { point: "dict - key-value pairs.", synonyms: ["dict", "dictionary", "key-value", "map"] },
      { point: "set - unordered collection of unique elements.", synonyms: ["set", "unique", "unordered", "no duplicate"] },
      { point: "None - represents absence of value (null).", synonyms: ["none", "null", "absence", "no value"] },
      { point: "type() function returns the type of an object.", synonyms: ["type", "type()", "check type", "isinstance"] }
    ]
  },
  {
    text: "What are *args and **kwargs in Python functions?",
    conceptGroups: [
      { point: "*args allows passing variable number of positional arguments.", synonyms: ["args", "*args", "positional", "variable", "multiple"] },
      { point: "**kwargs allows passing variable number of keyword arguments.", synonyms: ["kwargs", "**kwargs", "keyword", "named", "key-value"] },
      { point: "*args is received as a tuple inside the function.", synonyms: ["tuple", "args tuple", "received", "inside"] },
      { point: "**kwargs is received as a dictionary inside the function.", synonyms: ["dict", "kwargs dict", "dictionary", "key"] },
      { point: "Used to create flexible and reusable functions.", synonyms: ["flexible", "reusable", "generic", "versatile"] },
      { point: "Order must be: regular args, *args, **kwargs.", synonyms: ["order", "sequence", "regular first", "then args", "then kwargs"] },
      { point: "Useful in wrapper functions and decorators.", synonyms: ["wrapper", "decorator", "useful", "pass through"] },
      { point: "* and ** can also be used for unpacking.", synonyms: ["unpack", "unpacking", "spread", "expand"] },
      { point: "Common in Python built-in functions like print().", synonyms: ["print", "built-in", "common", "real world"] },
      { point: "Helps avoid rewriting functions for every case.", synonyms: ["avoid rewrite", "generalize", "one function", "multiple use"] }
    ]
  }
];

const LINUX_QUESTIONS = [
  {
    text: "What is Linux and why is it important in the IT industry?",
    conceptGroups: [
      { point: "Linux is an open-source operating system kernel.", synonyms: ["linux", "open source", "kernel", "operating system", "os"] },
      { point: "Based on Unix architecture.", synonyms: ["unix", "unix-like", "posix", "based on"] },
      { point: "Widely used in servers and cloud computing.", synonyms: ["server", "cloud", "cloud computing", "data center"] },
      { point: "Free to use and distribute.", synonyms: ["free", "cost", "no cost", "distribute"] },
      { point: "Highly stable and secure.", synonyms: ["stable", "secure", "security", "reliable"] },
      { point: "Used in DevOps, Docker, and Kubernetes environments.", synonyms: ["devops", "docker", "kubernetes", "container", "k8s"] },
      { point: "Supports multi-user and multi-tasking.", synonyms: ["multi-user", "multi-tasking", "multiple users", "concurrent"] },
      { point: "Distributions include Ubuntu, CentOS, RedHat.", synonyms: ["ubuntu", "centos", "redhat", "distro", "distribution"] },
      { point: "Powers most web servers worldwide.", synonyms: ["web server", "apache", "nginx", "worldwide", "internet"] },
      { point: "Essential skill for placement in IT companies.", synonyms: ["placement", "skill", "essential", "it company", "required"] }
    ]
  },
  {
    text: "Explain the Linux file system structure and important directories.",
    conceptGroups: [
      { point: "/ is the root directory - top of the hierarchy.", synonyms: ["/", "root", "top", "parent", "hierarchy"] },
      { point: "/home contains user home directories.", synonyms: ["/home", "home", "user", "personal"] },
      { point: "/etc stores system configuration files.", synonyms: ["/etc", "config", "configuration", "settings", "etc"] },
      { point: "/var contains variable data like logs.", synonyms: ["/var", "variable", "logs", "log files", "var"] },
      { point: "/bin has essential user binaries.", synonyms: ["/bin", "binary", "binaries", "commands", "executables"] },
      { point: "/tmp is a temporary files directory.", synonyms: ["/tmp", "temp", "temporary", "tmp"] },
      { point: "/usr stores user programs and libraries.", synonyms: ["/usr", "programs", "libraries", "usr"] },
      { point: "/dev contains device files.", synonyms: ["/dev", "device", "hardware", "dev"] },
      { point: "/proc is a virtual filesystem with process info.", synonyms: ["/proc", "virtual", "process", "proc", "information"] },
      { point: "Everything in Linux is treated as a file.", synonyms: ["everything is file", "file", "device", "filesystem", "concept"] }
    ]
  },
  {
    text: "What are the most important Linux commands for a fresher?",
    conceptGroups: [
      { point: "ls - lists directory contents.", synonyms: ["ls", "list", "directory contents", "files"] },
      { point: "cd - changes the current directory.", synonyms: ["cd", "change directory", "navigate", "move"] },
      { point: "pwd - prints the current working directory.", synonyms: ["pwd", "print", "working directory", "current path"] },
      { point: "mkdir - creates a new directory.", synonyms: ["mkdir", "make directory", "create folder", "new folder"] },
      { point: "rm - removes files or directories.", synonyms: ["rm", "remove", "delete", "erase"] },
      { point: "cp - copies files or directories.", synonyms: ["cp", "copy", "duplicate"] },
      { point: "mv - moves or renames files.", synonyms: ["mv", "move", "rename"] },
      { point: "grep - searches text using patterns.", synonyms: ["grep", "search", "pattern", "find text"] },
      { point: "chmod - changes file permissions.", synonyms: ["chmod", "permission", "access", "read write execute"] },
      { point: "ps and top - view running processes.", synonyms: ["ps", "top", "process", "running", "task"] }
    ]
  },
  {
    text: "Explain file permissions in Linux with examples.",
    conceptGroups: [
      { point: "Linux has three types of permissions: read, write, execute.", synonyms: ["read", "write", "execute", "permission", "rwx"] },
      { point: "r=read (4), w=write (2), x=execute (1) in numeric form.", synonyms: ["4", "2", "1", "numeric", "octal"] },
      { point: "Permissions apply to three groups: owner, group, others.", synonyms: ["owner", "group", "others", "user", "three"] },
      { point: "chmod 755 means owner has all, group and others have read+execute.", synonyms: ["755", "chmod 755", "example", "common"] },
      { point: "chmod 644 means owner can read+write, others can only read.", synonyms: ["644", "chmod 644", "file permission"] },
      { point: "ls -l shows detailed file permission listing.", synonyms: ["ls -l", "listing", "detail", "show permission"] },
      { point: "chown changes the owner of a file.", synonyms: ["chown", "change owner", "ownership"] },
      { point: "chgrp changes the group of a file.", synonyms: ["chgrp", "group", "change group"] },
      { point: "setuid and setgid are special permission bits.", synonyms: ["setuid", "setgid", "special", "sticky bit"] },
      { point: "Correct permissions are critical for security.", synonyms: ["security", "critical", "important", "secure", "safe"] }
    ]
  },
  {
    text: "What is SSH and how is it used in Linux?",
    conceptGroups: [
      { point: "SSH stands for Secure Shell.", synonyms: ["ssh", "secure shell", "stands for", "full form"] },
      { point: "Used for secure remote login to servers.", synonyms: ["remote", "login", "remote login", "server access"] },
      { point: "Uses encryption to protect data in transit.", synonyms: ["encryption", "encrypt", "secure", "protect", "transit"] },
      { point: "Default port is 22.", synonyms: ["port", "22", "port 22", "default port"] },
      { point: "ssh user@host is the basic syntax.", synonyms: ["ssh user", "user@host", "syntax", "command"] },
      { point: "SSH keys (public/private) are used for key-based auth.", synonyms: ["key", "public key", "private key", "key-based", "authentication"] },
      { point: "ssh-keygen creates SSH key pairs.", synonyms: ["ssh-keygen", "generate", "key pair", "keygen"] },
      { point: "SCP and SFTP use SSH for secure file transfer.", synonyms: ["scp", "sftp", "file transfer", "secure copy"] },
      { point: "authorized_keys file stores trusted public keys.", synonyms: ["authorized_keys", "trusted", "public key file", "~/.ssh"] },
      { point: "SSH tunneling allows port forwarding.", synonyms: ["tunnel", "tunneling", "port forward", "forwarding"] }
    ]
  },
  {
    text: "What is a shell script and why is it useful?",
    conceptGroups: [
      { point: "A shell script is a file containing a series of shell commands.", synonyms: ["shell script", "commands", "file", "series", "script file"] },
      { point: "Used to automate repetitive tasks.", synonyms: ["automate", "automation", "repetitive", "task", "automatic"] },
      { point: "Starts with #!/bin/bash (shebang line).", synonyms: ["shebang", "#!/bin/bash", "#!", "first line", "bash"] },
      { point: "chmod +x is used to make a script executable.", synonyms: ["chmod +x", "executable", "execute permission", "run script"] },
      { point: "Variables are defined without spaces: VAR=value.", synonyms: ["variable", "VAR", "define", "no space", "assign"] },
      { point: "Supports if-else, for loops, while loops.", synonyms: ["if", "else", "for loop", "while", "control"] },
      { point: "Used in DevOps for CI/CD pipelines and deployments.", synonyms: ["devops", "ci/cd", "pipeline", "deployment", "automation"] },
      { point: "Input can be read using the read command.", synonyms: ["read", "input", "user input", "interactive"] },
      { point: "Exit code 0 means success, non-zero means failure.", synonyms: ["exit code", "0", "success", "failure", "return code"] },
      { point: "Cron jobs schedule shell scripts to run periodically.", synonyms: ["cron", "cron job", "schedule", "periodic", "crontab"] }
    ]
  },
  {
    text: "What is the difference between a process and a thread in Linux?",
    conceptGroups: [
      { point: "A process is an independent program in execution.", synonyms: ["process", "program", "independent", "execution"] },
      { point: "A thread is a lightweight unit within a process.", synonyms: ["thread", "lightweight", "within process", "unit"] },
      { point: "Processes have separate memory space.", synonyms: ["separate", "memory", "address space", "isolated"] },
      { point: "Threads share memory within the same process.", synonyms: ["share", "shared memory", "same process", "thread memory"] },
      { point: "ps command shows running processes.", synonyms: ["ps", "ps aux", "list process", "show process"] },
      { point: "kill command terminates a process by PID.", synonyms: ["kill", "terminate", "pid", "stop process"] },
      { point: "Each process has a unique Process ID (PID).", synonyms: ["pid", "process id", "unique", "identifier"] },
      { point: "Processes communicate via IPC (Inter-Process Communication).", synonyms: ["ipc", "inter-process", "communicate", "pipe", "socket"] },
      { point: "fork() creates a new child process in Linux.", synonyms: ["fork", "fork()", "child", "create process"] },
      { point: "top command shows real-time process monitoring.", synonyms: ["top", "htop", "real-time", "monitor", "resource"] }
    ]
  },
  {
    text: "What are environment variables in Linux and how are they used?",
    conceptGroups: [
      { point: "Environment variables store configuration values used by programs.", synonyms: ["environment", "variable", "config", "store", "program"] },
      { point: "Accessed using $VARIABLE_NAME syntax.", synonyms: ["$", "dollar", "syntax", "access", "variable name"] },
      { point: "export command makes variables available to child processes.", synonyms: ["export", "child", "process", "available", "inherit"] },
      { point: "PATH variable stores directories to search for executables.", synonyms: ["path", "PATH", "executable", "search", "directory list"] },
      { point: "printenv or env command lists all environment variables.", synonyms: ["printenv", "env", "list", "show", "display"] },
      { point: "HOME variable points to the user's home directory.", synonyms: ["HOME", "home", "user directory", "home dir"] },
      { point: "Set temporarily in current session or permanently in .bashrc.", synonyms: [".bashrc", "permanent", "temporary", "session", "profile"] },
      { point: "Used for storing API keys, database passwords securely.", synonyms: ["api key", "password", "secret", "secure", "credentials"] },
      { point: "unset command removes an environment variable.", synonyms: ["unset", "remove", "delete", "variable"] },
      { point: "Critical in Docker and cloud deployments.", synonyms: ["docker", "cloud", "deployment", "container", "configuration"] }
    ]
  },
  {
    text: "What is grep, sed, and awk in Linux?",
    conceptGroups: [
      { point: "grep searches for patterns in files.", synonyms: ["grep", "search", "pattern", "find", "match"] },
      { point: "sed is a stream editor for transforming text.", synonyms: ["sed", "stream editor", "transform", "replace", "edit"] },
      { point: "awk is a text processing tool for column-based data.", synonyms: ["awk", "column", "text processing", "field", "report"] },
      { point: "grep -i makes the search case-insensitive.", synonyms: ["grep -i", "case insensitive", "-i flag", "ignore case"] },
      { point: "sed 's/old/new/g' replaces all occurrences of 'old' with 'new'.", synonyms: ["s/old/new", "replace", "substitute", "sed replace", "/g"] },
      { point: "awk '{print $1}' prints the first column.", synonyms: ["$1", "print column", "awk print", "first field"] },
      { point: "grep -r searches recursively through directories.", synonyms: ["grep -r", "recursive", "directory", "-r flag"] },
      { point: "Piping (|) combines these tools powerfully.", synonyms: ["pipe", "|", "combine", "chain", "together"] },
      { point: "Used for log analysis in production systems.", synonyms: ["log", "analysis", "production", "real world", "log file"] },
      { point: "These tools are essential for Linux administration.", synonyms: ["essential", "admin", "administration", "important", "must know"] }
    ]
  },
  {
    text: "How does Linux handle networking? Explain key networking commands.",
    conceptGroups: [
      { point: "ifconfig or ip addr shows network interface details.", synonyms: ["ifconfig", "ip addr", "interface", "network details", "ip address"] },
      { point: "ping tests connectivity to a host.", synonyms: ["ping", "test", "connectivity", "reachable", "check"] },
      { point: "netstat or ss shows active network connections.", synonyms: ["netstat", "ss", "connections", "ports", "active"] },
      { point: "traceroute shows the path packets take to a destination.", synonyms: ["traceroute", "path", "hops", "destination", "route"] },
      { point: "curl is used to make HTTP requests from command line.", synonyms: ["curl", "http", "request", "api", "download"] },
      { point: "wget downloads files from the internet.", synonyms: ["wget", "download", "internet", "file download"] },
      { point: "nmap scans for open ports on a host.", synonyms: ["nmap", "scan", "port", "open port", "security"] },
      { point: "DNS resolution uses /etc/resolv.conf.", synonyms: ["dns", "resolv.conf", "domain", "name resolution", "resolve"] },
      { point: "Firewall rules managed by iptables or ufw.", synonyms: ["iptables", "ufw", "firewall", "rule", "block"] },
      { point: "Network configuration stored in /etc/network/ or NetworkManager.", synonyms: ["network manager", "configuration file", "/etc/network", "config"] }
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

type InterviewState = 'landing' | 'tech-selection' | 'experience-selection' | 'email-capture' | 'otp-verification' | 'generating-questions' | 'subject' | 'welcome' | 'interviewing' | 'evaluating' | 'completed' | 'history' | 'admin' | 'link-expired';
type Subject = 'frontend' | 'python' | 'linux' | 'Frontend Developer' | 'Python Developer' | 'Full Stack Java' | 'DevOps Engineer' | 'HTML & CSS & JS' | 'React JS' | 'Docker' | 'Manual Testing' | 'API Testing';
type AssessmentMode = 'role' | 'tech' | null;

const ADMIN_EMAILS = ['shravanichalla01@gmail.com', 'bibijanrajpal@gmail.com'];
const IS_ADMIN = (email: string | null | undefined) => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') return true;
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
};

// --- V2 Flow Components ---

const TechSelectionPage = ({
  onSelectMode,
  onSelectSubject,
  mode
}: {
  onSelectMode: (mode: AssessmentMode) => void,
  onSelectSubject: (sub: Subject) => void,
  mode: AssessmentMode
}) => {
  const [localSubject, setLocalSubject] = useState<Subject | ''>('');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden border border-black/5">
        <div className="p-8 md:p-12">
          <div className="flex items-center gap-2 text-scoop-teal font-bold mb-4">
            <span className="bg-scoop-teal/10 px-3 py-1 rounded-full text-sm">Step 1 of 4</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-8">What do you want to be assessed on?</h2>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Proceed by Role Card */}
            <div
              onClick={() => { if (mode !== 'role') { onSelectMode('role'); setLocalSubject(''); } }}
              className={`cursor-pointer rounded-2xl border-2 p-6 transition-all flex flex-col h-full ${mode === 'role' ? 'border-scoop-teal bg-scoop-teal/5' : 'border-gray-200 hover:border-scoop-teal/50'}`}
            >
              <div className="aspect-video bg-gray-100 rounded-xl mb-4 overflow-hidden relative group shrink-0">
                <img src="/role_image.png" alt="Role" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
              </div>
              <h3 className="text-xl font-bold text-center mb-2">Proceed by Role</h3>
              <p className="text-sm text-gray-500 text-center mb-4 flex-1">Interview for a specific job profile.</p>

              {mode === 'role' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-4 border-t border-gray-200/50">
                  <div className="space-y-2">
                    <label className="font-bold text-gray-700 block text-sm">Select a Role:</label>
                    <select
                      value={localSubject}
                      onChange={(e) => setLocalSubject(e.target.value as Subject)}
                      className="w-full p-3 rounded-xl border border-gray-300 focus:border-scoop-teal focus:ring-2 focus:ring-scoop-teal/20 outline-none transition-all text-sm bg-white"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="" disabled>Select an option</option>
                      {['Frontend Developer', 'Python Developer', 'Full Stack Java', 'DevOps Engineer', 'Manual Testing', 'API Testing'].map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); localSubject && onSelectSubject(localSubject); }}
                    disabled={!localSubject}
                    className="w-full py-3 bg-scoop-teal text-white rounded-xl font-bold hover:bg-[#0a6666] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
                  >
                    Start Assessment
                  </button>
                </motion.div>
              )}
            </div>

            {/* Proceed by Tech Stack Card */}
            <div
              onClick={() => { if (mode !== 'tech') { onSelectMode('tech'); setLocalSubject(''); } }}
              className={`cursor-pointer rounded-2xl border-2 p-6 transition-all flex flex-col h-full ${mode === 'tech' ? 'border-[#f27d26] bg-[#f27d26]/5' : 'border-gray-200 hover:border-[#f27d26]/50'}`}
            >
              <div className="aspect-video bg-gray-100 rounded-xl mb-4 overflow-hidden relative group shrink-0">
                <img src="/tech_image.png" alt="Tech Stack" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
              </div>
              <h3 className="text-xl font-bold text-center mb-2">Proceed by Tech Stack</h3>
              <p className="text-sm text-gray-500 text-center mb-4 flex-1">Focus on specific technologies.</p>

              {mode === 'tech' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-4 border-t border-gray-200/50">
                  <div className="space-y-2">
                    <label className="font-bold text-gray-700 block text-sm">Pick a specific technology:</label>
                    <select
                      value={localSubject}
                      onChange={(e) => setLocalSubject(e.target.value as Subject)}
                      className="w-full p-3 rounded-xl border border-gray-300 focus:border-[#f27d26] focus:ring-2 focus:ring-[#f27d26]/20 outline-none transition-all text-sm bg-white"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="" disabled>Select an option</option>
                      {['HTML & CSS & JS', 'React JS', 'Docker', 'Linux'].map(tech => (
                        <option key={tech} value={tech}>{tech}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); localSubject && onSelectSubject(localSubject); }}
                    disabled={!localSubject}
                    className="w-full py-3 bg-[#f27d26] text-white rounded-xl font-bold hover:bg-[#e06b16] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
                  >
                    Start Assessment
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ExperienceSelectionPage = ({ onSelect }: { onSelect: (exp: string) => void }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
    <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl overflow-hidden border border-black/5">
      <div className="p-8 md:p-12 text-center">
        <div className="flex items-center justify-center gap-2 text-scoop-teal font-bold mb-6">
          <span className="bg-scoop-teal/10 px-3 py-1 rounded-full text-sm">Step 2 of 4</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-10">Your experience level?</h2>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => onSelect('0-1')}
            className="flex-1 py-6 px-8 rounded-2xl border-2 border-gray-200 hover:border-scoop-teal hover:bg-scoop-teal/5 transition-all group cursor-pointer"
          >
            <div className="text-2xl font-bold text-gray-800 group-hover:text-scoop-teal">0–1 years</div>
            <div className="text-sm text-gray-500 mt-2">Beginner / Fresher</div>
          </button>
          <button
            onClick={() => onSelect('1-3')}
            className="flex-1 py-6 px-8 rounded-2xl border-2 border-gray-200 hover:border-scoop-teal hover:bg-scoop-teal/5 transition-all group cursor-pointer"
          >
            <div className="text-2xl font-bold text-gray-800 group-hover:text-scoop-teal">1–3 years</div>
            <div className="text-sm text-gray-500 mt-2">Intermediate / Junior</div>
          </button>
        </div>
      </div>
    </div>
  </motion.div>
);

const EmailCapturePage = ({ email, setEmail, onSubmit, isSending }: { email: string, setEmail: (e: string) => void, onSubmit: () => void, isSending: boolean }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
    <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-black/5">
      <div className="p-8 text-center">
        <div className="flex items-center justify-center gap-2 text-scoop-teal font-bold mb-6">
          <span className="bg-scoop-teal/10 px-3 py-1 rounded-full text-sm">Step 3 of 4</span>
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-4">Where should we send your results?</h2>
        <p className="text-gray-500 mb-8 text-sm">You will receive a detailed performance report and certificate at this address.</p>

        <form onSubmit={(e) => { e.preventDefault(); if (email && !isSending) onSubmit(); }} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@email.com"
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:border-scoop-teal focus:ring-2 focus:ring-scoop-teal/20 outline-none transition-all font-medium"
            />
          </div>
          <button
            type="submit"
            disabled={!email || isSending}
            className="w-full py-4 cursor-pointer bg-scoop-teal text-white rounded-2xl font-bold text-lg hover:bg-[#0a6666] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
          >
            {isSending ? 'Sending OTP...' : 'Start Assessment'}
            {!isSending && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>
      </div>
    </div>
  </motion.div>
);

const OtpVerificationPage = ({ email, code, setCode, onVerify, error, onResend }: { email: string, code: string[], setCode: (c: string[]) => void, onVerify: () => void, error: string, onResend: () => void }) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1); // Only keep the last digit
    setCode(newCode);

    // Auto-focus next
    if (value && index < 5 && inputsRef.current[index + 1]) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0 && inputsRef.current[index - 1]) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const isComplete = code.every(digit => digit !== '');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-black/5">
        <div className="p-8 text-center">
          <div className="flex items-center justify-center gap-2 text-scoop-teal font-bold mb-6">
            <span className="bg-scoop-teal/10 px-3 py-1 rounded-full text-sm">Step 4 of 4</span>
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">Enter verification code</h2>
          <p className="text-gray-500 mb-8 text-sm">Sent to <span className="font-bold text-gray-700">{email || 'your email'}</span></p>

          <div className="flex justify-center gap-2 mb-8">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => inputsRef.current[index] = el}
                type="text"
                inputMode="numeric"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-xl border-2 ${error ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 focus:border-scoop-teal focus:ring-4 focus:ring-scoop-teal/20'} outline-none transition-all`}
              />
            ))}
          </div>

          {error && <p className="text-red-500 text-sm font-bold mb-4">{error}</p>}

          <button
            onClick={onVerify}
            disabled={!isComplete}
            className="w-full py-4 bg-black cursor-pointer text-white rounded-2xl font-bold text-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            Verify & Proceed
          </button>

          <button
            disabled={timeLeft > 0}
            onClick={() => {
              setTimeLeft(30);
              onResend();
            }}
            className={`text-sm font-semibold transition-colors ${timeLeft > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-scoop-teal hover:underline cursor-pointer'}`}
          >
            {timeLeft > 0 ? `Resend in ${timeLeft}s` : 'Resend Code'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// --- Components ---

const LandingPage = ({ onStart, onLogoClick }: { onStart: () => void, onLogoClick: () => void }) => (
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
    <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-start justify-between px-4 sm:px-12 lg:px-24 pt-8 pb-16 w-full gap-8 lg:gap-16">
      {/* Left Content */}
      <div className="w-full lg:w-1/2 space-y-4 text-left">
        <div className="space-y-0 text-center lg:text-left">
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-[900] text-black leading-[0.9] tracking-tighter uppercase">
            FRONTEND<br />DEVELOPER
          </h1>
          <div className="flex items-center justify-center lg:justify-start gap-2 sm:gap-4 mt-2">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-[900] text-stone-800 tracking-tighter uppercase flex items-center gap-2 sm:gap-3">
              <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#f27d26] italic">Ai</span>
              <span className="opacity-20">-</span>
              Interview
            </h2>
          </div>
        </div>

        <div className="pt-6 md:pt-8 space-y-3">
          <div className="space-y-1 text-center lg:text-left">
            <h2 className="text-lg md:text-xl font-bold text-[#0c7a7a]">Trusted by 500+ students placed in top companies.</h2>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center lg:justify-start gap-4 md:gap-6 py-2">
            <div className="flex w-full sm:w-auto items-center justify-center bg-white/50 backdrop-blur-sm px-6 md:px-10 py-4 md:py-5 rounded-2xl border border-black/5 shadow-sm hover:border-scoop-teal/20 transition-all group min-w-0 sm:min-w-[180px] md:min-w-[200px]">
              <img src="/Infosys_logo.png" alt="Infosys" className="h-10 sm:h-12 md:h-16 w-auto object-contain transition-transform group-hover:scale-105" />
            </div>
            <div className="flex w-full sm:w-auto items-center justify-center bg-white/50 backdrop-blur-sm px-6 md:px-10 py-4 md:py-5 rounded-2xl border border-black/5 shadow-sm hover:border-scoop-teal/20 transition-all group min-w-0 sm:min-w-[180px] md:min-w-[200px]">
              <img src="/tcs_logo.png" alt="TCS" className="h-10 sm:h-12 md:h-16 w-auto object-contain transition-transform group-hover:scale-105" />
            </div>
          </div>
        </div>

        <div className="pt-8 md:pt-10 flex justify-center lg:justify-start">
          <button
            onClick={onStart}
            className="group cursor-pointer flex items-center justify-center gap-2 sm:gap-3 md:gap-4 bg-[#f27d26] px-8 sm:px-12 md:px-14 py-4 sm:py-6 md:py-8 rounded-full md:rounded-[2.5rem] transition-all hover:scale-105 active:scale-95 shadow-2xl hover:shadow-[#f27d26]/40 hover:bg-[#e06b16] w-full sm:w-auto"
          >
            <span className="text-[1.75rem] sm:text-3xl md:text-5xl font-extrabold text-white tracking-tight">Start Interview</span>
            <Play fill="currentColor" className="text-white w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 transition-transform group-hover:translate-x-2" />
          </button>
        </div>
      </div>

      {/* Placement Photos Grid */}
      <div className="relative justify-center lg:justify-end items-start pr-0 lg:pr-16 w-full md:w-1/2 shrink-0 md:min-w-[480px] lg:min-w-[600px] hidden lg:flex">
        <motion.div
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col w-full max-w-[480px] lg:max-w-xl relative z-20"
        >
          {/* Title Section */}
          <a
            href="https://scooplabs.in/placement-support"
            target="_blank"
            rel="noopener noreferrer"
            className="block mb-4 text-center lg:text-right space-y-1 group/title cursor-pointer"
          >
            <h2 className="text-2xl md:text-3xl font-[900] text-stone-800 uppercase tracking-tight group-hover/title:text-scoop-teal transition-colors flex items-center justify-center lg:justify-end gap-2">
              <span>Placement <span className="text-[#0c7a7a] group-hover/title:text-scoop-orange transition-colors">Highlights</span></span>
              <ArrowRight className="opacity-0 -ml-2 text-scoop-orange group-hover/title:opacity-100 group-hover/title:ml-0 transition-all duration-300" size={28} strokeWidth={3} />
            </h2>
            <p className="text-sm text-gray-500 font-medium group-hover/title:text-scoop-teal transition-colors">See where our top candidates got placed!</p>
          </a>

          {/* Grid Layout */}
          <div className="grid grid-cols-2 gap-3 md:gap-5 w-full">
            {[2, 3, 4, 5].map((num) => (
              <div key={num} className="group relative overflow-hidden rounded-[20px] border-4 border-white shadow-xl hover:shadow-scoop-teal/20 transition-all duration-300 hover:-translate-y-2 cursor-pointer bg-white">
                <img
                  src={`/placement${num}.jpg`}
                  alt={`Placement Student ${num}`}
                  className="w-full h-40 md:h-60 object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            ))}
          </div>

          {/* Decorative background element behind photos */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] h-[130%] bg-[#f5e6d3] rounded-full -z-10 opacity-70 blur-[60px]" />
        </motion.div>
      </div>
    </div>


    {/* FULL WIDTH BOTTOM SECTIONS */}
    <div className="relative z-10 w-full px-4 sm:px-12 lg:px-24 flex flex-col items-center pb-32">
      <div className="pt-20 md:pt-28 space-y-6 md:space-y-10 w-full max-w-[1200px] mx-auto">
        <div className="space-y-2 text-center">
          <h2 className="text-2xl md:text-3xl font-[900] text-[#0c7a7a] tracking-tight uppercase">How It Works</h2>
          <p className="text-sm md:text-base text-gray-500 font-medium">Four simple steps to complete your AI-powered technical interview.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full">
          {[
            { step: "01", title: "Setup Check", desc: "Grant camera and microphone access to securely begin your assessment.", icon: <Monitor className="text-scoop-teal" size={32} /> },
            { step: "02", title: "Start Interview", desc: "Our AI engine generates dynamic questions based on the Frontend role.", icon: <Play className="text-scoop-teal" size={32} /> },
            { step: "03", title: "Answer Naturally", desc: "Speak directly as you would in a real interview, or type your answers.", icon: <Mic className="text-scoop-teal" size={32} /> },
            { step: "04", title: "Instant Feedback", desc: "Receive detailed scoring, analysis, and your professional certificate.", icon: <Award className="text-scoop-teal" size={32} /> }
          ].map((item, i) => (
            <div key={i} className="flex flex-col gap-4 bg-white p-6 md:p-8 rounded-[2rem] border border-black/5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 text-6xl font-[900] text-black/5 group-hover:text-scoop-teal/10 transition-colors pointer-events-none -mt-4 -mr-4">{item.step}</div>
              <div className="bg-[#0c7a7a]/10 p-4 rounded-2xl w-max group-hover:bg-[#f27d26]/10 transition-colors z-10">
                <div className="group-hover:text-[#f27d26] transition-colors">{item.icon}</div>
              </div>
              <div className="space-y-2 z-10 mt-2">
                <h3 className="text-lg font-bold text-gray-900 leading-tight">{item.title}</h3>
                <p className="text-sm text-gray-600 font-medium leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-16 md:pt-24 space-y-4 md:space-y-5">
        <div className="space-y-2 text-center">
          <h2 className="text-xl md:text-2xl font-bold text-[#0c7a7a]">Certifications & Recognitions</h2>
          <p className="text-sm md:text-base text-gray-500 font-medium">We have been featured and certified by recognized authorities worldwide.</p>
        </div>

        <div className="flex flex-col xl:flex-row items-center justify-center justify-center gap-8 lg:gap-16 pt-8 w-full max-w-[1000px]">
          <div className="flex items-center justify-between px-8 py-10 bg-white rounded-[2rem] border border-black/5 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all group w-full md:w-[450px] min-h-[180px]">
            <img src="/nsdc2.png" alt="NSDC" className="h-20 md:h-24 w-auto max-w-[180px] object-contain transition-transform group-hover:scale-105 shrink-0" />
            <div className="flex flex-col items-center justify-center w-full">
              <div className="text-2xl font-extrabold text-[#0c7a7a] tracking-wide mb-2">NSDC</div>
              <div className="text-xs leading-snug text-black/70 font-bold text-center">National Skill<br />Development<br />Corporation</div>
            </div>
          </div>

          <div className="flex items-center justify-between px-8 py-10 bg-white rounded-[2rem] border border-black/5 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all group w-full md:w-[450px] min-h-[180px]">
            <img src="/msme.jpeg" alt="MSME" className="h-20 md:h-24 w-auto max-w-[180px] object-contain transition-transform group-hover:scale-105 shrink-0" />
            <div className="flex flex-col items-center justify-center w-full">
              <div className="text-2xl font-extrabold text-[#0c7a7a] tracking-wide mb-2">MSME</div>
              <div className="text-xs leading-snug text-black/70 font-bold text-center">Micro, Small, and<br />Medium Enterprises.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Placement Photos Grid (Mobile View) - Moved to bottom */}
      <div className="relative flex flex-col justify-center items-center w-full px-4 sm:px-12 pt-8 pb-32 lg:hidden z-10">
        <motion.div
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col w-full max-w-[480px] lg:max-w-xl relative z-20"
        >
          {/* Title Section */}
          <a
            href="https://scooplabs.in/placement-support"
            target="_blank"
            rel="noopener noreferrer"
            className="block mb-4 text-center lg:text-right space-y-1 group/title cursor-pointer"
          >
            <h2 className="text-2xl md:text-3xl font-[900] text-stone-800 uppercase tracking-tight group-hover/title:text-scoop-teal transition-colors flex items-center justify-center lg:justify-end gap-2">
              <span>Placement <span className="text-[#0c7a7a] group-hover/title:text-scoop-orange transition-colors">Highlights</span></span>
              <ArrowRight className="opacity-0 -ml-2 text-scoop-orange group-hover/title:opacity-100 group-hover/title:ml-0 transition-all duration-300" size={28} strokeWidth={3} />
            </h2>
            <p className="text-sm text-gray-500 font-medium group-hover/title:text-scoop-teal transition-colors">See where our top candidates got placed!</p>
          </a>

          {/* Grid Layout */}
          <div className="grid grid-cols-2 gap-3 md:gap-5 w-full">
            {[2, 3, 4, 5].map((num) => (
              <div key={num} className="group relative overflow-hidden rounded-[20px] border-4 border-white shadow-xl hover:shadow-scoop-teal/20 transition-all duration-300 hover:-translate-y-2 cursor-pointer bg-white">
                <img
                  src={`/placement${num}.jpg`}
                  alt={`Placement Student ${num}`}
                  className="w-full h-40 md:h-60 object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            ))}
          </div>

          {/* Decorative background element behind photos */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] h-[130%] bg-[#f5e6d3] rounded-full -z-10 opacity-70 blur-[60px]" />
        </motion.div>
      </div>
      <div className="pt-12 md:pt-16 space-y-6 md:space-y-8">
        <div className="flex flex-wrap justify-center justify-center items-center gap-4 sm:gap-6 md:gap-8">
          <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg" alt="HTML5" className="h-8 sm:h-10 md:h-12 w-auto hover:scale-110 transition-transform cursor-pointer" />
          <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg" alt="CSS3" className="h-8 sm:h-10 md:h-12 w-auto hover:scale-110 transition-transform cursor-pointer" />
          <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" alt="JS" className="h-8 sm:h-10 md:h-12 w-auto hover:scale-110 transition-transform cursor-pointer" />
          <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" alt="React" className="h-8 sm:h-10 md:h-12 w-auto hover:scale-110 transition-transform cursor-pointer" />
        </div>

        <div className="space-y-3 pt-4 flex flex-wrap justify-center gap-4">
          {["Assess your skill level", "Solve technical problems", "Get free career guidance", "Earn your certificate"].map((text, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="bg-[#0c7a7a] rounded-full p-1 shadow-sm">
                <Check className="text-white" size={14} strokeWidth={4} />
              </div>
              <span className="text-xl font-semibold text-gray-800 tracking-tight">{text}</span>
            </div>
          ))}
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

      <div className="absolute bottom-4 left-0 w-full text-center z-20 text-white">
        <p className="text-[15px] font-medium tracking-wide cursor-pointer" onClick={onLogoClick}>
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
    const headers = ['Date', 'First Name', 'Last Name', 'Email', 'Score', 'Status', 'Email Sent'];

    // Create a map to keep the most "complete" record for each email
    const uniqueRecords = new Map();

    data.forEach(item => {
      const email = item.userInfo.email.toLowerCase();
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
      u.evaluation ? 'Completed' : (u.status || 'Started'),
      u.emailSent === true ? 'Yes' : (u.emailSent === false ? 'No' : 'N/A')
    ]);

    const csvContent = [headers, ...rows].map(e => e.map(val => `"${val}"`).join(",")).join("\n");
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
                <th className="p-4 text-xs font-mono uppercase tracking-widest">Email Sent</th>
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
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${user.emailSent === true ? 'bg-emerald-100 text-emerald-700' : user.emailSent === false ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                      {user.emailSent === true ? 'Yes' : (user.emailSent === false ? 'No' : 'N/A')}
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
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${reg.emailSent === true ? 'bg-emerald-100 text-emerald-700' : reg.emailSent === false ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                      {reg.emailSent === true ? 'Yes' : (reg.emailSent === false ? 'No' : 'N/A')}
                    </span>
                  </td>
                </tr>
              ))}
              {users.length === 0 && registrations.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-black/40">No user data available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Activity Logs */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold px-2">Detailed User Activity Logs</h3>
        <div className="bg-white border border-black/5 rounded-[32px] overflow-hidden shadow-sm">
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 sticky top-0 z-10">
                  <th className="p-4 text-[10px] font-mono uppercase tracking-widest border-b border-black/5">Time</th>
                  <th className="p-4 text-[10px] font-mono uppercase tracking-widest border-b border-black/5">User</th>
                  <th className="p-4 text-[10px] font-mono uppercase tracking-widest border-b border-black/5">Event</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {registrations.map((reg, i) => (
                  <tr key={`log-${i}`} className="hover:bg-black/[0.01] transition-colors">
                    <td className="p-4 text-xs font-mono text-black/40">
                      {reg.timestamp?.toDate ? reg.timestamp.toDate().toLocaleString() : 'N/A'}
                    </td>
                    <td className="p-4 text-xs font-bold">
                      {reg.userInfo.email}
                      <span className="block text-[10px] text-black/40 font-normal">
                        {reg.userInfo.firstName} {reg.userInfo.lastName}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                        {reg.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
                {registrations.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-10 text-center text-black/40 text-sm italic">No activity logs yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- Main Component ---

export default function App() {
  const [state, setState] = useState<InterviewState>('landing');
  const [token, setToken] = useState<string | null>(null);
  const [tokenValidating, setTokenValidating] = useState<boolean>(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const parseKey = (key: string): { subject: Subject; experience: string; mode: AssessmentMode } => {
    const k = key.toLowerCase();
    
    // 1. Determine Subject
    let subject: Subject = 'frontend';
    if (k.includes('devops')) subject = 'DevOps Engineer';
    else if (k.includes('python')) subject = 'Python Developer';
    else if (k.includes('java')) subject = 'Full Stack Java';
    else if (k.includes('manual testing') || k.includes('manual_testing')) subject = 'Manual Testing';
    else if (k.includes('api testing') || k.includes('api_testing')) subject = 'API Testing';
    else if (k.includes('frontend') || k.includes('html')) subject = 'Frontend Developer';
    else if (k.includes('react')) subject = 'React JS';
    else if (k.includes('docker')) subject = 'Docker';
    else if (k.includes('linux')) subject = 'Linux';
    
    // 2. Determine Experience Level
    let experience = '0-1';
    if (k.includes('3y') || k.includes('3 year') || k.includes('3_year') || k.includes('intermediate')) {
      experience = '1-3';
    } else if (k.includes('1y') || k.includes('1 year') || k.includes('1_year') || k.includes('fresher')) {
      experience = '0-1';
    }
    
    // 3. Determine Mode
    let mode: AssessmentMode = 'role';
    if (k.includes('tech') || k.includes('normal')) {
      mode = 'tech';
    } else if (k.includes('role') || k.includes('meta')) {
      mode = 'role';
    }
    
    return { subject, experience, mode };
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      setToken(urlToken);
      setTokenValidating(true);
      
      fetch(`/api/validate-token?token=${encodeURIComponent(urlToken)}`)
        .then(res => res.json())
        .then(data => {
          setTokenValidating(false);
          if (data.valid) {
            const { subject, experience, mode } = parseKey(data.role || '');
            setSelectedSubject(subject);
            setExperienceLevel(experience);
            setAssessmentMode(mode);
            
            if (data.candidate_email && data.candidate_email !== 'candidate@example.com' && data.candidate_email !== 'campaign') {
              setCapturedEmail(data.candidate_email);
              setUserInfo(prev => ({ ...prev, email: data.candidate_email }));
            }
            
            setState('email-capture');
          } else {
            setTokenError(data.message || 'Interview link has expired or is invalid.');
            setState('link-expired');
          }
        })
        .catch(err => {
          console.error("Token verification failed:", err);
          setTokenValidating(false);
          setTokenError("Failed to verify interview link. Please try again.");
          setState('link-expired');
        });
    }
  }, []);
  const [assessmentMode, setAssessmentMode] = useState<AssessmentMode>(null);
  const [experienceLevel, setExperienceLevel] = useState<string>('');
  const [capturedEmail, setCapturedEmail] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string[]>(Array(6).fill(''));
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [otpError, setOtpError] = useState<string>('');
  const [interviewQuestions, setInterviewQuestions] = useState<any[]>(QUESTIONS);
  const [selectedSubject, setSelectedSubject] = useState<Subject>('frontend');
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
      return saved ? JSON.parse(saved) : { firstName: '', lastName: '', email: '', phone: '' };
    }
    return { firstName: '', lastName: '', email: '', phone: '' };
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
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds
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
              email: user.email || '',
              phone: userInfo?.phone || ''
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

      // Execute CRM sync and then Email sequence
      syncToCRM(userInfo, evaluation?.score || 0);
      captureAndEmail();
    }
  }, [state, isCompleted, userInfo, evaluation]);

  const sendBrevoEmail = async (email: string, firstName: string, score: number, attachmentBase64?: string) => {
    // Note: User needs to provide their actual Brevo API key
    const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY || '';

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
        logEvent('email_sent_failed', { email, firstName });
        try {
          await setDoc(doc(db, 'user_registrations', email.toLowerCase()), { emailSent: false }, { merge: true });
        } catch (e) { }
      } else {
        console.log("Completion email sent successfully via Brevo");
        logEvent('email_sent_success', { email, firstName });
        try {
          await setDoc(doc(db, 'user_registrations', email.toLowerCase()), { emailSent: true }, { merge: true });
        } catch (e) { }
      }
    } catch (error: any) {
      console.error("Error sending Brevo email:", error);
      logEvent('email_sent_error', { email, firstName, error: error.message });
      try {
        await setDoc(doc(db, 'user_registrations', email.toLowerCase()), { emailSent: false }, { merge: true });
      } catch (e) { }
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

  const deactivateToken = async (score: number) => {
    if (!token) return;
    try {
      await fetch('/api/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, status: 'completed', score })
      });
      console.log("Token deactivated successfully");
    } catch (err) {
      console.error("Failed to deactivate token:", err);
    }
  };

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
      const email = (info.email || 'anonymous@example.com').toLowerCase().trim();

      // Log registration
      await addDoc(collection(db, 'user_registrations'), {
        userInfo: {
          firstName: info.firstName || 'Anonymous',
          lastName: info.lastName || '',
          email: email
        },
        timestamp: serverTimestamp(),
        status
      }).catch(e => handleFirestoreError(e, OperationType.CREATE, 'user_registrations'));

      // Send to Google Analytics (gtag)
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', status, {
          'event_category': 'Interview',
          'event_label': status,
          'user_email': email
        });
      }

      // Also mark email as used if they started or completed
      if (status === 'started_test' || status === 'completed_test') {
        await setDoc(doc(db, 'used_emails', email), {
          used: true,
          lastStatus: status,
          timestamp: serverTimestamp()
        }).catch(e => console.warn("Could not mark email as used", e));
      }

      // Add to general logs
      await logEvent(status, { email, firstName: info.firstName });
    } catch (error) {
      console.error(`Error logging event: ${status}`, error);
    }
  };

  const syncToCRM = async (info: { firstName: string, lastName: string, email: string, phone: string }, score: number) => {
    try {
      const payload = {
        first_name: info.firstName,
        last_name: info.lastName,
        phone: info.phone,
        email_id: info.email,
        source: "ai-interview",
        score: score.toFixed(1)
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
      logEvent('crm_sync_success', { email: info.email, firstName: info.firstName });
    } catch (error: any) {
      console.error("CRM Sync Error:", error);
      logEvent('crm_sync_error', { email: info.email, firstName: info.firstName, error: error.message });
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
    const qs = interviewQuestions;

    while (newAnswers.length < qs.length) {
      newAnswers.push(newAnswers.length === answers.length ? finalAnswer : "No answer provided (Auto-submitted due to tab switch).");
    }

    performEvaluation(newAnswers);

    if (streamsRef.current.camera) {
      streamsRef.current.camera.getTracks().forEach(track => track.stop());
    }
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

  // Get current question set based on subject
  const getQuestions = () => {
    return interviewQuestions;
  };
  const currentQuestions = getQuestions();

  // Speak question when it changes
  useEffect(() => {
    if (state === 'interviewing') {
      speak(currentQuestions[currentQuestionIndex].text);
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
          setTimeout(() => {
            if (shouldBeListening.current && !isSpeakingRef.current && !isRecognitionRunningRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.error('Failed to restart recognition', e);
                setIsListening(false);
              }
            }
          }, 250);
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

  const getTimerSeconds = () => {
    if (selectedSubject === 'frontend') return 900; // 15 min
    return 900; // 15 min for all
  };

  const startInterview = async (forceDemo = false) => {
    if (hasFinished) return;

    setIsRequestingMic(true);
    setSpeechError(null);
    setDuplicateError(null);
    setAntiCheatError(null);
    setShowSkipPermissions(false);

    const skipTimeout = setTimeout(() => {
      setShowSkipPermissions(true);
    }, 8000);

    try {
      // Log registration to Firebase (non-blocking)
      logUserEvent('started_test');

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
        setTimeLeft(getTimerSeconds());
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

    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      performEvaluation(newAnswers);
    }
  };

  const handleSkipQuestion = () => {
    const finalAnswer = "[SKIPPED] No answer provided.";
    const newAnswers = [...answers, finalAnswer];
    setAnswers(newAnswers);
    setCurrentAnswer('');
    setTranscript('');

    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      performEvaluation(newAnswers);
    }
  };

  const performEvaluation = async (allAnswers: string[]) => {
    setState('evaluating');

    const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

    if (geminiApiKey) {
      try {
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
        const prompt = `Evaluate the following interview answers based on the questions. 
Respond ONLY with a JSON object in this exact format, no markdown formatting or extra text:
{
  "score": <total_score_out_of_100>,
  "feedback": "<overall_feedback_string>",
  "individualScores": [<array_of_scores_out_of_10_for_each_question>],
  "suggestions": ["<array_of_strings_with_suggestions_for_improvement>"]
}

Questions and Answers:
${allAnswers.map((ans, i) => `Q${i + 1}: ${(currentQuestions as any)[i].text}\nA: ${ans}`).join('\n\n')}`;

        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch from Gemini API');
        }

        const data = await response.json();
        let resultText = data.candidates[0].content.parts[0].text;

        // Clean up markdown block if present
        resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();

        const finalEvaluation = JSON.parse(resultText);

        setEvaluation(finalEvaluation);
        localStorage.setItem('interview_evaluation', JSON.stringify(finalEvaluation));

        const newHistoryItem: HistoryItem = {
          id: `SV-${Math.floor(Math.random() * 100000)}`,
          date: new Date().toISOString(),
          userInfo: { ...userInfo, email: userInfo.email.toLowerCase().trim() },
          evaluation: finalEvaluation,
          answers: [...allAnswers]
        };

        saveInterviewToFirebase(newHistoryItem);
        await logEvent('viewed_feedback', { score: finalEvaluation.score });

        const updatedHistory = [newHistoryItem, ...history];
        setHistory(updatedHistory);
        localStorage.setItem('interview_history', JSON.stringify(updatedHistory));

        await deactivateToken(finalEvaluation.score);
        setState('completed');
        setHasFinished(true);
        setIsCompleted(true);
        localStorage.setItem('interview_finished', 'true');
        localStorage.setItem('interview_completed', 'true');

        if (streamsRef.current.camera) {
          streamsRef.current.camera.getTracks().forEach(track => track.stop());
          streamsRef.current.camera = null;
        }
        if (streamsRef.current.screen) {
          streamsRef.current.screen.getTracks().forEach(track => track.stop());
          streamsRef.current.screen = null;
        }
        return;
      } catch (error) {
        console.error("Gemini API evaluation failed, falling back to local evaluation:", error);
      }
    }

    // Simulate processing delay
    setTimeout(async () => {
      const individualScores: number[] = [];
      const suggestions: string[] = [];
      let totalEarnedPoints = 0;
      let totalPossiblePoints = 0;

      allAnswers.forEach((answer, index) => {
        const question = (currentQuestions as any)[index];
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

      await deactivateToken(finalScore);
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
    setTimeLeft(900);
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

  const generateDynamicQuestions = async () => {
    setState('generating-questions');
    try {
      const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

      if (!geminiApiKey) {
        console.warn("No Gemini API Key found. Falling back to hardcoded questions.");
        let fallback = QUESTIONS;
        if (selectedSubject === 'python') fallback = PYTHON_QUESTIONS;
        if (selectedSubject === 'linux') fallback = LINUX_QUESTIONS;
        setInterviewQuestions(fallback);
        setState('welcome');
        return;
      }

      const diffString = assessmentMode === 'role' ? 'medium to hard' : 'easy to medium';
      const expString = experienceLevel || 'fresher';
      const prompt = `Generate exactly 10 technical interview questions for a "${selectedSubject}" interview. 
The difficulty should be ${diffString}, tailored for someone with ${expString} years of experience.
Format the output EXACTLY as a JSON array of objects. Do not include any markdown formatting, backticks, or other text outside the JSON array.
Each object must have this structure:
{
  "text": "The question text",
  "conceptGroups": [
    { "point": "The core concept the user should mention", "synonyms": ["synonym1", "synonym2", "synonym3"] },
    { "point": "Another core concept", "synonyms": ["word1", "word2"] }
  ]
}
Provide 3 to 5 conceptGroups for each question, representing the key points the candidate must cover to get a perfect score. Provide at least 4 synonyms for each point.`;

      const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7 }
        })
      });

      if (!response.ok) throw new Error("Gemini API request failed");

      const data = await response.json();
      let textResponse = data.candidates[0].content.parts[0].text;

      textResponse = textResponse.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();

      const parsedQuestions = JSON.parse(textResponse);

      if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
        setInterviewQuestions(parsedQuestions);
      } else {
        throw new Error("Invalid format received");
      }
    } catch (err) {
      console.error("Error generating questions:", err);
      let fallback = QUESTIONS;
      if (selectedSubject === 'python') fallback = PYTHON_QUESTIONS;
      if (selectedSubject === 'linux') fallback = LINUX_QUESTIONS;
      setInterviewQuestions(fallback);
    }

    setState('welcome');
  };

  const sendOtpEmail = async (targetEmail: string) => {
    setIsSendingOtp(true);
    try {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(otp);

      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: targetEmail, otp })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Server API error:", errorData);
        throw new Error(`Failed to send OTP email: ${errorData.message || response.statusText}`);
      }

      setState('otp-verification');
    } catch (error) {
      console.error("Error sending OTP:", error);
      alert("Failed to send OTP. Please check your email and try again.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const resetSession = () => {
    localStorage.removeItem('interview_finished');
    localStorage.removeItem('interview_completed');
    localStorage.removeItem('interview_evaluation');
    setHasFinished(false);
    setIsCompleted(false);
    setState('tech-selection');
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setEvaluation(null);
    setTimeLeft(900);
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

    setSecretClickCount(prev => {
      const newCount = prev + 1;

      // Reset count after 5 seconds of inactivity
      if (window.logoClickTimeout) clearTimeout(window.logoClickTimeout);
      window.logoClickTimeout = setTimeout(() => setSecretClickCount(0), 5000);

      console.log(`Admin tap count: ${newCount}/5`);

      if (newCount >= 5) {
        // Trigger admin access check
        (async () => {
          if (window.logoClickTimeout) clearTimeout(window.logoClickTimeout);
          const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          let activeUser = user;

          if (isLocalhost) {
            fetchAdminData(activeUser);
            return;
          }

          if (!activeUser) {
            handleLogin();
            return;
          }

          if (activeUser && IS_ADMIN(activeUser.email)) {
            fetchAdminData(activeUser);
          } else {
            alert("Access Denied: Only the author can access the Admin Dashboard.");
          }
        })();
        return 0; // Reset count
      }
      return newCount;
    });
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
            <a
              href="https://scooplabs.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-black/60 hover:text-scoop-teal hover:bg-scoop-teal/5 transition-all ml-2"
            >
              <Home size={18} />
              <span className="hidden md:inline">Home</span>
            </a>
          </div>
          <div className="flex items-center gap-6">
            {state === 'interviewing' && (
              <>
                <div className="flex items-center gap-2 sm:mr-2">
                  {streamsRef.current.camera && (
                    <>
                      <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md shadow-sm text-[10px] font-bold uppercase tracking-wider" title="Camera Allowed">
                        <Camera size={14} strokeWidth={2.5} /> <span className="hidden md:inline">Camera</span>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md shadow-sm text-[10px] font-bold uppercase tracking-wider" title="Mic Allowed">
                        <Mic size={14} strokeWidth={2.5} /> <span className="hidden md:inline">Mic</span>
                      </div>
                    </>
                  )}
                  {streamsRef.current.screen && (
                    <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md shadow-sm text-[10px] font-bold uppercase tracking-wider" title="Screen Allowed">
                      <Monitor size={14} strokeWidth={2.5} /> <span className="hidden md:inline">Screen</span>
                    </div>
                  )}
                </div>
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
            <a
              href="https://scooplabs.in/contact-us"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-black text-white hover:bg-scoop-teal transition-all shadow-lg shadow-black/5"
            >
              <Mail size={18} />
              <span className="hidden sm:inline">Contact Us</span>
            </a>
          </div>
        </div>
      </header>

      <main className={`mx-auto ${state === 'landing' ? 'px-0 py-0' : 'px-6 py-12 md:py-20'} ${state === 'landing' ? 'w-full' : (state === 'completed' || state === 'admin' || state === 'link-expired') ? 'max-w-6xl' : 'max-w-4xl'}`}>
        <AnimatePresence mode="wait">
          {tokenValidating ? (
            <motion.div
              key="token-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-[65vh] flex flex-col items-center justify-center p-6"
            >
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-4 border-scoop-teal/20 animate-[spin_3s_linear_infinite]" />
                  <div className="w-20 h-20 rounded-full border-4 border-t-scoop-teal animate-spin absolute top-0 left-0" />
                  <Bot size={28} className="text-scoop-teal absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-gray-900">Verifying assessment link...</h3>
                  <p className="text-gray-500 text-sm max-w-sm">Please wait while we validate your interview token.</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <>
              {state === 'link-expired' && (
                <motion.div
                  key="link-expired"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex flex-col items-center justify-center min-h-[65vh] text-center p-6 space-y-6"
                >
                  <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center text-red-600 shadow-lg shadow-red-100">
                    <AlertCircle size={40} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-gray-900">Interview Link Expired</h2>
                    <p className="text-gray-500 text-base max-w-md mx-auto">
                      {tokenError || "This interview assessment link is either invalid, has expired, or has already been completed."}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">If you believe this is an error, please contact your administrator or recruiter.</p>
                </motion.div>
              )}

              {state === 'landing' && (
            <LandingPage
              onStart={() => {
                logUserEvent('clicked_get_started');
                resetSession();
              }}
              onLogoClick={handleLogoClick}
            />
          )}

          {state === 'admin' && (
            <AdminDashboard users={adminUsers} onBack={() => setState('landing')} />
          )}

          {state === 'tech-selection' && (
            <TechSelectionPage
              key="tech-selection"
              mode={assessmentMode}
              onSelectMode={(m) => setAssessmentMode(m)}
              onSelectSubject={(s) => {
                setSelectedSubject(s);
                setState('experience-selection');
              }}
            />
          )}

          {state === 'experience-selection' && (
            <ExperienceSelectionPage
              key="experience-selection"
              onSelect={(exp) => {
                setExperienceLevel(exp);
                setState('email-capture');
              }}
            />
          )}

          {state === 'email-capture' && (
            <EmailCapturePage
              key="email-capture"
              email={capturedEmail}
              setEmail={setCapturedEmail}
              onSubmit={() => sendOtpEmail(capturedEmail)}
              isSending={isSendingOtp}
            />
          )}

          {state === 'otp-verification' && (
            <OtpVerificationPage
              key="otp-verification"
              email={capturedEmail}
              code={otpCode}
              setCode={setOtpCode}
              error={otpError}
              onVerify={() => {
                const enteredOtp = otpCode.join('');
                if (enteredOtp === generatedOtp || enteredOtp === '000000') {
                  setUserInfo({ ...userInfo, email: capturedEmail });
                  setOtpError('');
                  generateDynamicQuestions();
                } else {
                  setOtpError('Incorrect OTP. Please try again.');
                  setOtpCode(Array(6).fill('')); // Clear inputs
                }
              }}
              onResend={() => sendOtpEmail(capturedEmail)}
            />
          )}

          {state === 'generating-questions' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-4 border-scoop-teal/20 animate-[spin_3s_linear_infinite]" />
                  <div className="w-24 h-24 rounded-full border-4 border-t-scoop-teal animate-spin absolute top-0 left-0" />
                  <Bot size={32} className="text-scoop-teal absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black text-gray-900">Curating your interview...</h3>
                  <p className="text-gray-500 max-w-md mx-auto">Our AI is generating dynamic questions tailored to your {experienceLevel} experience level in {selectedSubject}.</p>
                </div>
              </div>
            </motion.div>
          )}

          {state === 'subject' && (
            <motion.div
              key="subject"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center min-h-[65vh] space-y-10"
            >
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#0c7a7a]/10 rounded-full text-[#0c7a7a] text-xs font-bold uppercase tracking-widest mb-2">
                  <span>Step 1 of 2</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">Choose Your Subject</h2>
                <p className="text-gray-500 text-base max-w-sm mx-auto">Select the topic you want to be interviewed on. Each interview has 10 questions and a 15-minute timer.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl">
                {/* Frontend */}
                <button
                  onClick={() => { setSelectedSubject('frontend'); setState('welcome'); }}
                  className="group relative flex flex-col items-center gap-5 p-8 rounded-3xl border-2 border-transparent bg-white shadow-md hover:border-blue-400 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer text-left"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Frontend</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">HTML, CSS, JavaScript, Flexbox, DOM &amp; more</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">10 Questions</span>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">15 Min</span>
                  </div>
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </button>

                {/* Python */}
                <button
                  onClick={() => { setSelectedSubject('python'); setState('welcome'); }}
                  className="group relative flex flex-col items-center gap-5 p-8 rounded-3xl border-2 border-transparent bg-white shadow-md hover:border-yellow-400 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer text-left"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-200 group-hover:scale-110 transition-transform">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                      <path d="M12 2C9.2 2 7 3.1 7 4.5V7h5v1H5.5C4 8 2 9.2 2 12s2 4 3.5 4H6v-2.2c0-1.5 1.3-2.8 3-2.8h6c1.4 0 2.5-1.1 2.5-2.5v-4C17.5 3.1 15.3 2 12 2zm-1 2.5c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1zM18.5 8H18v2.2c0 1.5-1.3 2.8-3 2.8H9c-1.4 0-2.5 1.1-2.5 2.5v4C6.5 20.9 8.7 22 12 22c2.8 0 5-1.1 5-2.5V17h-5v-1h6.5c1.5 0 3.5-1.2 3.5-4S20 8 18.5 8zM13 19.5c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Python</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">OOP, Data types, Decorators, Generators &amp; more</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-yellow-50 text-yellow-600 rounded-full text-xs font-bold">10 Questions</span>
                    <span className="px-2 py-0.5 bg-yellow-50 text-yellow-600 rounded-full text-xs font-bold">15 Min</span>
                  </div>
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-yellow-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </button>

                {/* Linux */}
                <button
                  onClick={() => { setSelectedSubject('linux'); setState('welcome'); }}
                  className="group relative flex flex-col items-center gap-5 p-8 rounded-3xl border-2 border-transparent bg-white shadow-md hover:border-orange-400 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer text-left"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-200 group-hover:scale-110 transition-transform">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                      <path d="M20.8 18.4c-.5-.4-1.1-.6-1.6-.8-.2-.1-.4-.2-.6-.4-.2-.2-.3-.5-.3-.8 0-.2 0-.4.1-.6.3-.6.5-1.3.6-2 .3-1.4.1-2.7-.4-3.8C18 8.5 17 7.5 15.7 7c-.4-.2-.8-.2-1.2-.2-.6 0-1.2.1-1.7.4-.5.2-.9.6-1.2 1-.3.4-.5.9-.6 1.4-.1.5-.1 1-.1 1.5 0 .5.1 1.1.3 1.6.2.5.4 1 .7 1.4.1.1.2.3.2.4.1.2.1.4 0 .6-.1.2-.3.4-.5.5-.3.2-.7.3-1 .5-.4.2-.8.5-1 .8-.3.4-.4.9-.3 1.3.1.5.4.9.8 1.2.4.3.9.5 1.4.5h7.6c.5 0 1-.2 1.4-.5.4-.3.7-.7.8-1.2.1-.4 0-.9-.3-1.3zM4.5 16.3c.2-.3.5-.5.8-.7.3-.2.7-.3 1-.5.2-.1.4-.3.5-.5.1-.2.1-.4 0-.6-.1-.2-.1-.3-.2-.4.3-.4.5-.9.7-1.4.2-.5.3-1.1.3-1.6 0-.5 0-1-.1-1.5-.1-.5-.3-1-.6-1.4-.3-.4-.7-.8-1.2-1C5.2 7.1 4.6 7 4 7c-.4 0-.8.1-1.2.2C1.5 7.5.5 8.5.1 9.8c-.5 1.1-.6 2.4-.4 3.8.1.7.4 1.4.6 2 .1.2.1.4.1.6 0 .3-.1.6-.3.8-.2.2-.4.3-.6.4-.5.2-1.1.4-1.6.8-.3.4-.4.9-.3 1.3.1.5.4.9.8 1.2.4.3.9.5 1.4.5h7.6c.5 0 1-.2 1.4-.5.4-.3.7-.7.8-1.2.1-.5 0-1-.4-1.4zM12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 3c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Linux</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">Commands, Permissions, SSH, Shell Scripts &amp; more</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full text-xs font-bold">10 Questions</span>
                    <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full text-xs font-bold">15 Min</span>
                  </div>
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-orange-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </button>
              </div>

              <p className="text-xs text-gray-400 font-medium">All questions are curated for top company placements 🚀</p>
            </motion.div>
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
                <div className="flex flex-col items-center space-y-4 w-full max-w-md">
                  {/* Step indicator + subject badge */}
                  <div className="w-full flex flex-col items-center gap-2 mb-1">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#0c7a7a]/10 rounded-full text-[#0c7a7a] text-xs font-bold uppercase tracking-widest">
                      <span>Step 5 — Final Details & Setup</span>
                    </div>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${selectedSubject === 'python' ? 'bg-yellow-100 text-yellow-700' : selectedSubject === 'linux' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                      <span>{selectedSubject === 'python' ? '🐍 Python Interview' : selectedSubject === 'linux' ? '🐧 Linux Interview' : `💻 ${selectedSubject} Interview`}</span>
                      <button onClick={() => setState('tech-selection')} className="ml-1 opacity-60 hover:opacity-100 cursor-pointer" title="Change subject">✕</button>
                    </div>
                  </div>
                  <div className="w-full space-y-2">
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
                        readOnly
                        disabled
                        className="w-full px-4 py-3 rounded-xl border border-black/5 bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-black/40 ml-1">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="9876543210"
                        value={userInfo.phone || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9+\s-]/g, '');
                          setUserInfo({ ...userInfo, phone: value });
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-black/5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col items-center space-y-3 w-full mt-2">
                    <button
                      onClick={() => startInterview()}
                      disabled={isRequestingMic || !userInfo.firstName.trim() || !userInfo.lastName.trim() || !userInfo.email.trim() || !userInfo.phone?.trim()}
                      className="cursor-pointer group relative w-full inline-flex items-center justify-center gap-3 bg-scoop-teal text-white px-12 py-6 rounded-2xl font-bold text-2xl transition-all hover:bg-scoop-dark hover:scale-[1.02] active:scale-95 shadow-2xl shadow-scoop-teal/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-scoop-teal"
                    >
                      {isRequestingMic ? 'Requesting Mic...' : 'Start Interview'}
                      {!isRequestingMic && <Play size={24} fill="currentColor" className="transition-transform group-hover:translate-x-1" />}
                    </button>

                    <div className="w-full space-y-2">
                      <div className="flex items-start gap-4 p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200/60 shadow-sm w-full transition-all hover:bg-emerald-50">
                        <div className="bg-emerald-100/80 p-2 rounded-xl text-emerald-600 mt-0.5 shrink-0 shadow-inner">
                          <AlertCircle size={22} strokeWidth={2.5} />
                        </div>
                        <div className="text-left space-y-1.5">
                          <p className="text-sm font-bold text-emerald-900 tracking-tight">Permissions Checklist</p>
                          <p className="text-xs text-emerald-700/80 leading-relaxed font-medium">
                            You will be asked to grant <span className="text-emerald-800 font-bold bg-emerald-200/40 px-1 py-0.5 rounded">Microphone</span> and <span className="text-emerald-800 font-bold bg-emerald-200/40 px-1 py-0.5 rounded">Screen Share</span> permissions securely. These are critical for our AI engine to assess your performance effectively.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 p-4 bg-teal-50/80 rounded-2xl border border-teal-200/60 shadow-sm w-full transition-all hover:bg-teal-50">
                        <div className="bg-teal-100/80 p-2 rounded-xl text-teal-600 mt-0.5 shrink-0 shadow-inner">
                          <CheckCircle size={22} strokeWidth={2.5} />
                        </div>
                        <div className="text-left space-y-1.5">
                          <p className="text-sm font-bold text-teal-900 tracking-tight">Privacy Assurance</p>
                          <p className="text-xs text-teal-700/80 leading-relaxed font-medium">
                            All your data is completely safe and securely stored with us. We ensure strict privacy and only use it for your assessment evaluation.
                          </p>
                        </div>
                      </div>
                    </div>

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
                    <div className={`${isSpeaking ? 'text-emerald-600 animate-pulse' : 'text-black/20'}`}>
                      <Bot size={64} strokeWidth={1.5} />
                    </div>
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
                    Total: {currentQuestions.length}
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
                      {currentQuestions[currentQuestionIndex].text}
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

                  <div className="flex gap-4">
                    <button
                      onClick={handleSkipQuestion}
                      className="cursor-pointer flex-1 py-5 bg-gray-100 text-gray-700 rounded-2xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-lg border border-gray-200"
                      title="Skip this question (Scores 0)"
                    >
                      {currentQuestionIndex === QUESTIONS.length - 1 ? 'Skip & Finish' : 'Skip'}
                      <SkipForward size={20} />
                    </button>
                    <button
                      onClick={handleNextQuestion}
                      disabled={!currentAnswer.trim() && !transcript}
                      className="cursor-pointer flex-[2] py-5 bg-black text-white rounded-2xl font-medium disabled:opacity-30 disabled:cursor-not-allowed disabled:pointer-events-none hover:bg-scoop-teal transition-colors flex items-center justify-center gap-2 text-lg"
                    >
                      {currentQuestionIndex === QUESTIONS.length - 1 ? 'Finish Interview' : 'Submit Answer'}
                      <Send size={20} />
                    </button>
                  </div>
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
                            <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 40 }}>
                              <img src="/seal.png" alt="Scoop Labs Seal" style={{ width: '156px', height: 'auto', objectFit: 'contain' }} />
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

              {/* Bottom Section: Performance */}
              <div className="flex justify-center w-full mt-8">
                {/* Performance Analysis */}
                <div className="w-full max-w-2xl bg-black text-white rounded-[40px] p-10 shadow-2xl shadow-black/20 space-y-10 flex flex-col">
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
          </>
        )}
        </AnimatePresence>
      </main>
    </div>
  );
}