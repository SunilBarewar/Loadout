import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/85 backdrop-blur-md">
        <div className="max-w-[1180px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-display font-extrabold text-2xl tracking-wider text-foreground">
              LOADOUT<span className="text-primary">.AI</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#showcase" className="hover:text-foreground transition-colors">Routines</a>
            <a href="#gym-floor" className="hover:text-foreground transition-colors">Gym Specs</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link 
              href="/sign-in" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/sign-up" 
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold px-4 py-2 rounded-md transition-colors"
            >
              Start Free Plan
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="max-w-[1180px] mx-auto px-6 pt-16 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card text-xs font-medium text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            AI Gym Coach & Routine Planner
          </div>
          <h1 className="font-display font-extrabold text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight text-foreground">
            YOUR CUSTOM WORKOUT ROUTINE, <span className="text-primary">BUILT BY AI</span> IN SECONDS.
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl font-normal leading-relaxed">
            Tell Loadout your equipment, goals, and schedule. Get tailored training splits, live set logging, automated rest timers, and smart progressive overload—engineered for the gym floor.
          </p>

          {/* Interactive Prompt Simulator */}
          <div className="bg-card border border-border rounded-md p-3 space-y-3 shadow-lg">
            <div className="text-xs text-muted-foreground font-medium">Describe your workout goals or constraints:</div>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-surface-2 border border-border/80 rounded">
              <span className="text-primary text-sm">⚡</span>
              <input 
                type="text" 
                readOnly 
                value="Build a 4-day push/pull/legs split with dumbbells and adjustable bench"
                className="bg-transparent border-none outline-none text-sm text-foreground w-full cursor-default truncate"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] bg-surface-2 border border-border px-2.5 py-1 rounded text-muted-foreground font-medium">
                  4 Days / Wk
                </span>
                <span className="text-[11px] bg-surface-2 border border-border px-2.5 py-1 rounded text-muted-foreground font-medium">
                  Hypertrophy
                </span>
                <span className="text-[11px] bg-surface-2 border border-border px-2.5 py-1 rounded text-muted-foreground font-medium">
                  Dumbbells Only
                </span>
              </div>
              <Link 
                href="/sign-up"
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold px-5 py-2 rounded transition-colors"
              >
                Generate My Plan
              </Link>
            </div>
          </div>
        </div>

        {/* Hero Interactive App Card Mockup */}
        <div className="lg:col-span-5">
          <div className="bg-card border border-border rounded-md p-6 space-y-5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-xs font-medium text-foreground">ACTIVE SESSION</span>
              </div>
              <span className="text-xs text-muted-foreground">Day 2 • Pull Focus</span>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-display font-extrabold text-2xl text-foreground">PULL & BICEPS</h3>
                <span className="text-xs font-semibold text-accent bg-accent/15 px-2 py-0.5 rounded border border-accent/30">
                  NEW PR +5 LBS
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Target: Lats, Rhomboids & Rear Delts</p>
            </div>
            
            <div className="space-y-2.5">
              <div className="p-3 bg-surface-2 border border-border rounded flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-foreground">Dumbbell Single-Arm Row</div>
                  <div className="text-xs text-muted-foreground">3 sets × 8–10 reps • 90s rest</div>
                </div>
                <div className="text-right">
                  <span className="font-display text-xl font-bold text-primary">75 LBS</span>
                  <div className="text-[10px] text-muted-foreground">Set 2/3 Done</div>
                </div>
              </div>

              <div className="p-3 bg-surface-2 border border-border rounded flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-foreground">Incline Dumbbell Curl</div>
                  <div className="text-xs text-muted-foreground">3 sets × 10–12 reps</div>
                </div>
                <div className="text-right">
                  <span className="font-display text-xl font-bold text-foreground">35 LBS</span>
                  <div className="text-[10px] text-muted-foreground">Next Up</div>
                </div>
              </div>
            </div>

            {/* Live Rest Timer Widget */}
            <div className="border-t border-border pt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-10 rounded-md border border-primary bg-primary/10 flex items-center justify-center font-display text-base font-extrabold text-primary">
                  01:15
                </div>
                <div>
                  <div className="text-xs font-medium text-foreground">Rest Period Active</div>
                  <div className="text-[11px] text-muted-foreground">Tap to log set 3</div>
                </div>
              </div>
              <button className="bg-surface-2 hover:bg-border text-foreground text-xs px-3 py-1.5 rounded border border-border font-medium transition-colors">
                Skip Rest
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Hard Metrics Bar */}
      <section className="border-y border-border bg-card/40 py-8">
        <div className="max-w-[1180px] mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="font-display font-extrabold text-4xl text-foreground">100%</div>
            <div className="text-xs text-muted-foreground mt-1">Equipment Adapted</div>
          </div>
          <div>
            <div className="font-display font-extrabold text-4xl text-primary">12,400+</div>
            <div className="text-xs text-muted-foreground mt-1">Workouts Executed</div>
          </div>
          <div>
            <div className="font-display font-extrabold text-4xl text-foreground">3.2×</div>
            <div className="text-xs text-muted-foreground mt-1">Greater Consistency</div>
          </div>
          <div>
            <div className="font-display font-extrabold text-4xl text-foreground">0</div>
            <div className="text-xs text-muted-foreground mt-1">Fluff or Wasted Time</div>
          </div>
        </div>
      </section>

      {/* 4. How It Works Section */}
      <section id="how-it-works" className="max-w-[1180px] mx-auto px-6 py-24 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="text-xs font-medium text-primary uppercase tracking-wider">Simple 4-Step Process</div>
          <h2 className="font-display font-extrabold text-4xl sm:text-5xl text-foreground">
            HOW LOADOUT BUILDS YOUR ROUTINE
          </h2>
          <p className="text-muted-foreground text-sm">
            From natural language prompts to gym floor execution. No rigid spreadsheets or generic template PDFs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card border border-border p-6 rounded-md space-y-3 relative">
            <span className="font-display text-4xl font-extrabold text-primary">01</span>
            <h3 className="font-display text-xl font-bold text-foreground">Tell Us Your Setup</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Describe your available gear (gym, home, dumbbells), target days per week, injuries, or time limits.
            </p>
          </div>

          <div className="bg-card border border-border p-6 rounded-md space-y-3">
            <span className="font-display text-4xl font-extrabold text-primary">02</span>
            <h3 className="font-display text-xl font-bold text-foreground">Get Custom Split</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Receive a structured workout plan complete with specific exercises, target set/rep ranges, and starting loads.
            </p>
          </div>

          <div className="bg-card border border-border p-6 rounded-md space-y-3">
            <span className="font-display text-4xl font-extrabold text-primary">03</span>
            <h3 className="font-display text-xl font-bold text-foreground">Log Sets Live</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Execute workouts on the gym floor with single-tap set logging, active rest timers, and instant exercise swaps.
            </p>
          </div>

          <div className="bg-card border border-border p-6 rounded-md space-y-3">
            <span className="font-display text-4xl font-extrabold text-primary">04</span>
            <h3 className="font-display text-xl font-bold text-foreground">Auto-Progress</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The AI tracks your total volume and automatically calculates load adjustments and progressive overload for next week.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Core Product Features */}
      <section id="features" className="max-w-[1180px] mx-auto px-6 py-12 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="text-xs font-medium text-primary uppercase tracking-wider">Built For Serious Lifters</div>
          <h2 className="font-display font-extrabold text-4xl sm:text-5xl text-foreground">
            EVERYTHING YOU NEED ON THE GYM FLOOR
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border p-6 rounded-md space-y-4">
            <div className="w-10 h-10 rounded bg-surface-2 border border-border flex items-center justify-center text-primary text-xl">
              ⚡
            </div>
            <h3 className="font-display text-2xl font-bold text-foreground">Instant Exercise Swaps</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Machine occupied or equipment unavailable? Tap swap to instantly generate alternative exercises targeting the exact same muscle group with your available gear.
            </p>
          </div>

          <div className="bg-card border border-border p-6 rounded-md space-y-4">
            <div className="w-10 h-10 rounded bg-surface-2 border border-border flex items-center justify-center text-primary text-xl">
              ⏱️
            </div>
            <h3 className="font-display text-2xl font-bold text-foreground">Precision Rest Timers</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No more guessing rest intervals. Automatic countdown timers launch the second you complete a set to maximize hypertrophy and recovery.
            </p>
          </div>

          <div className="bg-card border border-border p-6 rounded-md space-y-4">
            <div className="w-10 h-10 rounded bg-surface-2 border border-border flex items-center justify-center text-primary text-xl">
              📈
            </div>
            <h3 className="font-display text-2xl font-bold text-foreground">Smart Progression</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Never stall on weights again. Loadout tracks volume, peak loads, and personal records to tell you when it&apos;s time to add weight or reps.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Gym Floor Ergonomics Section */}
      <section id="gym-floor" className="max-w-[1180px] mx-auto px-6 py-16">
        <div className="bg-card border border-border p-8 md:p-12 rounded-md grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Zero Fluff Design</span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-foreground">
              ENGINEERED FOR DARK GYMS AND CHALKY HANDS
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Most fitness apps are designed for sitting on a couch. Loadout is built dark-by-default with high contrast, minimal border radii, and big readable numbers so you can tap sets quickly between lifts under harsh gym lighting.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-3 bg-surface-2 border border-border rounded">
                <div className="font-display font-bold text-foreground text-lg">DARK BY DEFAULT</div>
                <div className="text-[11px] text-muted-foreground">Easy on the eyes under gym lights</div>
              </div>
              <div className="p-3 bg-surface-2 border border-border rounded">
                <div className="font-display font-bold text-foreground text-lg">ONE-TAP LOGGING</div>
                <div className="text-[11px] text-muted-foreground">Fast set marking, zero tedious forms</div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-sm bg-surface-2 border border-border p-5 rounded space-y-3 text-center">
              <div className="text-xs text-muted-foreground">SET COMPLETED</div>
              <div className="font-display text-5xl font-extrabold text-primary">225 LBS</div>
              <div className="text-sm font-semibold text-foreground">Barbell Bench Press</div>
              <div className="text-xs text-muted-foreground">Set 3 of 3 • 8 Reps</div>
              <button className="w-full bg-primary text-primary-foreground font-bold text-xs py-2.5 rounded transition-colors mt-2">
                Log Set & Start Rest (90s)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Bottom CTA Banner */}
      <section className="max-w-[1180px] mx-auto px-6 py-16">
        <div className="bg-card border border-primary/40 p-10 md:p-14 rounded-md text-center space-y-6">
          <h2 className="font-display font-extrabold text-4xl sm:text-6xl text-foreground">
            READY TO BUILD YOUR AI ROUTINE?
          </h2>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            Get personalized workout splits, live set logging, and automated rest timers in under 30 seconds.
          </p>
          <div>
            <Link
              href="/sign-up"
              className="inline-block bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-8 py-3.5 rounded-md text-base transition-colors"
            >
              Start Free Workout Plan
            </Link>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="border-t border-border bg-card/20 py-8">
        <div className="max-w-[1180px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div>© 2026 LOADOUT AI. Engineered for serious lifters.</div>
          <div className="flex gap-6">
            <a href="#how-it-works" className="hover:text-foreground">How It Works</a>
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#gym-floor" className="hover:text-foreground">Gym Specs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
