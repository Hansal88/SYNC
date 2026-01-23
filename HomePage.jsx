import React from "react";
import { motion } from "framer-motion";
import { 
  Sparkles, ArrowRight, Zap, Shield, Users, 
  CheckCircle, Code, Palette, Languages, Globe, LockOpen,
  BookOpen, GraduationCap
} from "lucide-react";
import Navbar from "../components/Navbar.jsx";

// 1. IMPORT YOUR LOCAL IMAGE
import img1 from "../assets/img1.png";
import { useNavigate } from "react-router-dom";

// Animation Presets
const slideInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const slideInLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const slideInRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const HomePage = () => {
  const navigate = useNavigate();

  // --- UPDATED NAVIGATION LOGIC ---
  const handleStartJourney = () => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");

    // If token and role exist, send to their dashboard
    if (token && role) {
      if (role === "tutor") {
        navigate("/TutorDashboard");
      } else {
        navigate("/dashboard/learner");
      }
    } else {
      // OTHERWISE: Always force them to the signup page
      navigate("/signup");
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-blue-100 overflow-x-hidden text-left">
      <Navbar />

      {/* --- SECTION 1: HERO --- */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20">
        <motion.img 
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 0.07, scale: 1 }}
          viewport={{ once: false }}
          transition={{ duration: 1.5 }}
          src={img1} 
          className="absolute top-20 -left-20 w-96 rounded-full blur-sm -z-10 hidden lg:block"
          alt=""
        />

        <div className="max-w-5xl text-center z-10">
          <motion.h1 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.3 }}
            variants={slideInLeft}
            className="text-6xl md:text-8xl font-black mb-8 leading-[1.05] tracking-tight"
          >
            Learn skills by <br />
            <span className="text-blue-600 relative">
              teaching what you know
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 20" fill="none">
                <path d="M5 15Q150 5 295 15" stroke="#2563eb" strokeWidth="4" strokeLinecap="round"/>
              </svg>
            </span>
          </motion.h1>

          <motion.p 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.3 }}
            variants={slideInRight}
            className="text-xl text-gray-500 max-w-2xl mx-auto mb-12 leading-relaxed font-medium"
          >
            A simple way for students to help each other. Use the Skill Exchange Model to trade your expertise for new skills without spending any money.
          </motion.p>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.3 }}
            variants={slideInUp}
            className="flex flex-col sm:flex-row justify-center gap-5 mb-20"
          >
            {/* Action 1: Primary Button */}
            <button 
              onClick={handleStartJourney}
              className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-bold text-lg flex items-center gap-3 justify-center hover:bg-blue-700 shadow-2xl shadow-blue-200 transition-all hover:scale-105 active:scale-95"
            >
              Get Started <ArrowRight size={22} />
            </button>
            
            {/* Action 2: Secondary Button */}
            <button 
              onClick={handleStartJourney}
              className="bg-white border-2 border-gray-100 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all"
            >
              Explore Skills
            </button>
          </motion.div>

          {/* --- HONEST STAT BAR --- */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.1 }}
            variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
            }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-gray-100 pt-12"
          >
            {[
              { label: "Community", value: "Peer-to-Peer" },
              { label: "Our System", value: "Exchange Model" },
              { label: "Expertise", value: "Multidisciplinary" },
              { label: "Platform", value: "Free & Open Access" }
            ].map((stat, i) => (
              <motion.div variants={slideInUp} key={i} className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500 font-medium uppercase tracking-widest">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <div className="absolute top-1/4 -left-10 w-64 h-64 bg-blue-100 rounded-full blur-[100px] -z-10 opacity-60" />
        <div className="absolute bottom-1/4 -right-10 w-64 h-64 bg-indigo-100 rounded-full blur-[100px] -z-10 opacity-60" />
      </section>

      {/* --- SECTION 2: WHY IT WORKS --- */}
      <section id="features" className="py-32 bg-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.3 }}
            variants={slideInUp}
            className="mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-gray-900">
              Built for students to learn together.
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl leading-relaxed">
              SkillExchange focuses on learning through people, not videos.
              You connect, talk, and grow by exchanging real skills with others.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-10">
            {/* CARD 1 */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.2 }}
              variants={slideInUp}
              className="relative bg-gray-200/70 p-10 rounded-[2.5rem] border border-gray-300 hover:shadow-lg transition-all overflow-hidden cursor-pointer"
              onClick={handleStartJourney}
            >
              <div
                className="absolute inset-0 opacity-[0.06] bg-cover bg-center"
                style={{ backgroundImage: "url(https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=800)" }}
              />
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Student Network</h3>
                <p className="text-gray-700 leading-relaxed text-lg mb-6">
                  Connect directly with students and learners who already know the skills you want to learn.
                </p>
                <ul className="space-y-3 text-gray-700 text-base">
                  <li>• Learn from people with real experience</li>
                  <li>• Ask doubts and get clear explanations</li>
                  <li>• Build genuine learning connections</li>
                </ul>
              </div>
            </motion.div>

            {/* CARD 2 */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.2 }}
              variants={slideInUp}
              className="relative bg-gray-200/70 p-10 rounded-[2.5rem] border border-gray-300 hover:shadow-lg transition-all overflow-hidden cursor-pointer"
              onClick={handleStartJourney}
            >
              <div
                className="absolute inset-0 opacity-[0.06] bg-cover bg-center"
                style={{ backgroundImage: "url(https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=800)" }}
              />
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Skill Swapping</h3>
                <p className="text-gray-700 leading-relaxed text-lg mb-6">
                  Teach a skill you already know and learn a new one in return. Knowledge is the only currency.
                </p>
                <ul className="space-y-3 text-gray-700 text-base">
                  <li>• Teach what you are confident in</li>
                  <li>• Learn skills that help your growth</li>
                  <li>• No monetary transactions needed</li>
                </ul>
              </div>
            </motion.div>

            {/* CARD 3 */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.2 }}
              variants={slideInUp}
              className="relative bg-gray-200/70 p-10 rounded-[2.5rem] border border-gray-300 hover:shadow-lg transition-all overflow-hidden cursor-pointer"
              onClick={handleStartJourney}
            >
              <div
                className="absolute inset-0 opacity-[0.06] bg-cover bg-center"
                style={{ backgroundImage: "url(https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800)" }}
              />
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Free & Open Access</h3>
                <p className="text-gray-700 leading-relaxed text-lg mb-6">
                  Anyone can join SkillExchange without paying anything. There are no subscriptions.
                </p>
                <ul className="space-y-3 text-gray-700 text-base">
                  <li>• Free for all users</li>
                  <li>• No hidden costs or locks</li>
                  <li>• Learning stays accessible</li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- SECTION 3: HOW IT WORKS --- */}
      <section id="how-it-works" className="py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            {/* LEFT CONTENT */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.3 }}
              variants={slideInLeft}
            >
              <h2 className="text-5xl font-black mb-10 leading-tight text-gray-900">
                How skill exchange <br /> works in practice.
              </h2>
              <p className="text-lg text-gray-600 mb-12 max-w-xl leading-relaxed">
                Learning on SkillExchange is simple. You connect with other students,
                agree on a skill swap, and learn by working together.
              </p>

              <div className="space-y-12">
                {[
                  { step: "01", t: "Find a partner", d: "Search our network for students who have the skill you want to learn." },
                  { step: "02", t: "Send a request", d: "Start a conversation. Request an exchange and explain what you can teach." },
                  { step: "03", t: "Learn together", d: "Practice, discuss, and build projects. Master new skills through teamwork." }
                ].map((step, i) => (
                  <div key={i} className="flex gap-8 group cursor-pointer" onClick={handleStartJourney}>
                    <div className="flex flex-col items-center">
                      <span className="text-4xl font-black text-gray-200 group-hover:text-blue-100 transition-colors">
                        {step.step}
                      </span>
                      {i !== 2 && <div className="w-[2px] h-full bg-gray-50 mt-2" />}
                    </div>
                    <div className="pb-2">
                      <h4 className="text-xl font-bold mb-2 text-gray-900">{step.t}</h4>
                      <p className="text-gray-500 text-lg leading-relaxed">{step.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* RIGHT IMAGE */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.3 }}
              variants={slideInRight}
              className="relative"
            >
              <div className="absolute inset-0 bg-blue-100 rounded-[4rem] blur-3xl opacity-30 -z-10 transform scale-90" />
              <img 
                src={img1} 
                className="rounded-[3rem] shadow-2xl z-10 relative object-cover w-full h-[600px] border border-gray-100"
                alt="Skill exchange process"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="py-32 bg-gray-900 text-white overflow-hidden relative">
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.5 }}
            variants={slideInUp}
          >
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter">
              Ready to start learning with others?
            </h2>

            <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-xl mx-auto">
              Join the community and learn new skills by exchanging what you already know.
            </p>

            <motion.button
              onClick={handleStartJourney}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-blue-600 text-white px-12 py-5 rounded-2xl font-black text-xl shadow-xl shadow-blue-500/20 hover:bg-blue-500 transition-colors inline-flex items-center gap-3"
            >
              JOIN & START LEARNING
            </motion.button>

            <p className="mt-6 text-sm text-gray-400">
              Free to join · No payments required
            </p>
          </motion.div>
        </div>
        
        <div className="absolute top-0 left-0 w-full h-full opacity-30">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px]" />
        </div>
      </section>
    </div>
  );
};

export default HomePage;