import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Globe,
  Zap,
  AlertTriangle,
  Clock,
  EyeOff,
  Star,
  CheckCircle2,
  ShieldCheck,
  Factory,
  Warehouse,
  Store,
  Rocket,
  Plane,
  Shield,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import heroVisual from "@/assets/hero-visual.png";

const features = [
  {
    icon: Bot,
    title: "AI Content Builder",
    problem: "45 minutes per listing, manually",
    description:
      "Upload your product data, choose marketplace + country, and get publish-ready titles, bullets, A+ content, and backend keywords — with quality scores and policy validation built in.",
  },
  {
    icon: Globe,
    title: "Multi-Country in One Click",
    problem: "Separate teams per country",
    description:
      "Generate content for Amazon DE, NL, FR, ES, and IT from a single product feed. Each listing is localized, policy-compliant, and optimized for the target market.",
  },
  {
    icon: BarChart3,
    title: "Quality Score & Validation",
    problem: "Policy rejections and listing errors",
    description:
      "Every listing gets a quality score (completeness, readability, compliance, keyword coverage). Forbidden phrases, byte limits, and marketplace rules are checked automatically.",
  },
  {
    icon: Zap,
    title: "Auto-Fix & Export",
    problem: "Manual edits after every rejection",
    description:
      "One-click repair for all validation issues. Export directly to Amazon flatfile CSV or JSON — ready for Seller Central upload.",
  },
];

const personas = [
  {
    icon: Factory,
    title: "Brand Owners",
    description: "Losing share to resellers? Take control of your marketplace content with brand-locked listings and governance.",
  },
  {
    icon: Warehouse,
    title: "Wholesalers",
    description: "Thousands of SKUs, no listing power? Turn your ERP data into optimized marketplace content at scale.",
  },
  {
    icon: Store,
    title: "Retailers",
    description: "Store traffic declining? Launch on marketplaces with professional listings — without hiring a team.",
  },
  {
    icon: Rocket,
    title: "D2C Brands",
    description: "CAC too high on Meta/Google? Diversify to marketplaces with content that converts from day one.",
  },
  {
    icon: Plane,
    title: "EU Exporters",
    description: "Want EU scale without 5 local teams? Generate localized content for DE/FR/ES/IT/NL in minutes.",
  },
  {
    icon: Shield,
    title: "Regulated Categories",
    description: "Auto, beauty, supplements? Built-in compliance checks for claims, certifications, and safety labeling.",
  },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "€49",
    period: "/month",
    description: "For individual sellers getting started",
    features: [
      "50 SKU credits/month",
      "1 marketplace",
      "CSV import & export",
      "Quality score & validation",
      "Email support",
    ],
    cta: "Start Free Trial",
    highlight: false,
  },
  {
    name: "Pro",
    price: "€149",
    period: "/month",
    description: "For growing brands scaling content",
    features: [
      "500 SKU credits/month",
      "All EU marketplaces",
      "Bulk mode (1000+ SKUs)",
      "Brand voice presets",
      "Content governance",
      "Auto-fix & repair",
      "Priority support",
    ],
    cta: "Start Free Trial",
    highlight: true,
  },
  {
    name: "Agency",
    price: "€349",
    period: "/month",
    description: "For agencies managing multiple brands",
    features: [
      "Unlimited SKU credits",
      "Multi-workspace",
      "Team seats & roles",
      "White-label exports",
      "API access",
      "Dedicated account manager",
    ],
    cta: "Contact Sales",
    highlight: false,
  },
];

const testimonials = [
  {
    name: "Sophie van Dijk",
    role: "E-commerce Manager",
    company: "NordicHome",
    initials: "SD",
    quote:
      "We cut our content creation time by 80% and saw a 35% increase in conversion rates within the first month. This platform pays for itself.",
  },
  {
    name: "Marco Rossi",
    role: "Head of Digital",
    company: "TechGear Europe",
    initials: "MR",
    quote:
      "Managing listings across 5 marketplaces used to take our team a full week. Now it takes an afternoon. The AI quality is genuinely impressive.",
  },
  {
    name: "Lisa Bergström",
    role: "Founder",
    company: "PureBeauty Co",
    initials: "LB",
    quote:
      "As a solo founder selling on Bol.com and Amazon, this is the unfair advantage I needed. My listings now outperform competitors with entire teams.",
  },
];

const faqs = [
  {
    question: "How does the Content Builder work?",
    answer:
      "Upload your product data (CSV or manual entry), choose your marketplace and country, and our AI generates optimized titles, bullet points, descriptions, A+ content, and backend keywords. Every field is validated against marketplace rules and scored for quality. You review, approve, and export — ready for Seller Central.",
  },
  {
    question: "Which marketplaces and countries do you support?",
    answer:
      "We currently support Amazon (DE, NL, FR, ES, IT), with Bol.com and eBay coming soon. Content is generated in the target language with country-specific compliance rules (e.g., stricter claim rules for DE, nuance requirements for FR).",
  },
  {
    question: "Will AI-generated content sound generic?",
    answer:
      "No. Our AI uses per-field micro-task prompts specifically trained on high-converting marketplace content. It adapts to your brand voice, includes your product specs, and follows marketplace best practices. Each field (title, bullets, A+) has its own specialized prompt.",
  },
  {
    question: "What is the Quality Score?",
    answer:
      "Every listing gets a score from 0-100 based on: completeness (25%), readability (25%), keyword coverage (20%), compliance (20%), and consistency (10%). Scores above 80 are publish-ready. Below that, the auto-fix feature resolves issues with one click.",
  },
  {
    question: "Can I use it for bulk content generation?",
    answer:
      "Yes. The Pro plan supports bulk mode — upload 1000+ SKUs via CSV, generate all content in one batch, review issues in a sortable queue, and batch-repair with one click. Export the entire catalog as an Amazon flatfile.",
  },
  {
    question: "Is my product data secure?",
    answer:
      "Absolutely. We use sovereign AI infrastructure — your data never leaves EU servers and is never used to train third-party models. We're GDPR-native and all data is encrypted at rest and in transit.",
  },
];

const logoPlaceholders = [
  "Amazon",
  "Bol.com",
  "Shopify",
  "WooCommerce",
  "Kaufland",
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-16 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(142_70%_49%/0.08),transparent_60%)]" />
        <div className="container mx-auto px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-8">
              <Zap className="h-3.5 w-3.5" />
              AI-Powered Marketplace Content Builder
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] mb-6">
              Van productdata naar
              <br />
              <span className="text-gradient">publish-ready listings</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-4">
              Upload je productfeed, kies marketplace en land, en genereer
              geoptimaliseerde Amazon listings — met kwaliteitsscore, policy-validatie
              en export in minuten, niet dagen.
            </p>
            <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-10">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Amazon DE/NL/FR/ES/IT · Quality Score · Auto-fix · CSV Export
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth?tab=signup">
                <Button size="lg" className="gap-2 px-8">
                  Start Free Trial <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#pricing">
                <Button variant="outline" size="lg" className="px-8">
                  See Pricing
                </Button>
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 max-w-4xl mx-auto"
          >
            <div className="rounded-xl border border-border overflow-hidden shadow-2xl">
              <img
                src={heroVisual}
                alt="Content Builder wizard — import, generate, validate, export"
                className="w-full"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Logo / Trust Bar */}
      <section className="py-12 border-y border-border/50">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-8">
              Trusted by brands selling on
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
              {logoPlaceholders.map((name) => (
                <span
                  key={name}
                  className="text-lg font-semibold text-muted-foreground/40 select-none"
                >
                  {name}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="max-w-3xl mx-auto text-center mb-16"
          >
            <motion.div variants={fadeUp} custom={0}>
              <Badge variant="outline" className="mb-4">
                The Problem
              </Badge>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-3xl sm:text-4xl font-bold mb-4"
            >
              Marketplace content is{" "}
              <span className="text-gradient">broken</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-muted-foreground text-lg"
            >
              Most revenue leaks through bad content structure, missing attributes,
              policy rejections, and inconsistency across countries.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto"
          >
            {[
              {
                icon: Clock,
                title: "45 Min Per Listing",
                description:
                  "Writing titles, bullets, A+ content, and backend keywords manually for each SKU across each country eats entire weeks.",
              },
              {
                icon: AlertTriangle,
                title: "Policy Rejections",
                description:
                  "Forbidden claims, byte limits, missing attributes — listings get rejected and you don't know why until it's too late.",
              },
              {
                icon: EyeOff,
                title: "No Quality Measurement",
                description:
                  "You publish and hope. No score, no validation, no way to know which listings are costing you sales.",
              },
            ].map((problem, i) => (
              <motion.div
                key={problem.title}
                variants={fadeUp}
                custom={i}
                className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center"
              >
                <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                  <problem.icon className="h-5 w-5 text-destructive" />
                </div>
                <h3 className="font-semibold mb-2">{problem.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {problem.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features / Solution */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp} custom={0}>
              <Badge className="mb-4">The Solution</Badge>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-3xl sm:text-4xl font-bold mb-4"
            >
              From product data to{" "}
              <span className="text-gradient">publish-ready</span> in minutes
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-muted-foreground max-w-lg mx-auto"
            >
              Upload, generate, validate, fix, export. The Content Builder handles
              the entire listing lifecycle.
            </motion.p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
            className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto"
          >
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                custom={i}
                className="group rounded-xl border border-border bg-card p-8 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <f.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground/60 line-through mb-1">
                      {f.problem}
                    </p>
                    <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {f.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Use Cases / Personas */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp} custom={0}>
              <Badge variant="outline" className="mb-4">Who It's For</Badge>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-3xl sm:text-4xl font-bold mb-4"
            >
              Built for every{" "}
              <span className="text-gradient">marketplace seller</span>
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto"
          >
            {personas.map((p, i) => (
              <motion.div
                key={p.title}
                variants={fadeUp}
                custom={i}
                className="rounded-xl border border-border bg-card p-6 hover:border-primary/20 transition-colors"
              >
                <p.icon className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-1">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Case Study Teaser */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <div className="rounded-2xl border border-border bg-card overflow-hidden md:flex">
              <div className="md:w-1/2 p-8 md:p-10 flex flex-col justify-center">
                <Badge variant="outline" className="w-fit mb-4">Case Study</Badge>
                <h3 className="text-2xl font-bold mb-3">Connect Car Parts</h3>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  2,400+ automotive SKUs optimized across Amazon DE, NL, and FR.
                  Content creation time reduced from 45 minutes to 3 minutes per listing.
                  Zero policy rejections after implementation.
                </p>
                <div className="flex gap-6 mb-6">
                  <div>
                    <p className="text-2xl font-bold text-primary">94/100</p>
                    <p className="text-xs text-muted-foreground">Avg Quality Score</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">93%</p>
                    <p className="text-xs text-muted-foreground">Time Saved</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">0</p>
                    <p className="text-xs text-muted-foreground">Policy Rejections</p>
                  </div>
                </div>
                <a
                  href="https://hansvanleeuwen.com/work/connect-car-parts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  Read the full case study <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
              <div className="md:w-1/2 bg-muted/50 flex items-center justify-center p-6">
                <img
                  src="/demo/abs-comparison.png"
                  alt="ABS brake parts — marketplace content optimization"
                  className="rounded-lg w-full max-w-sm"
                  loading="lazy"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="text-3xl sm:text-4xl font-bold mb-4"
            >
              Loved by <span className="text-gradient">e-commerce teams</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="text-muted-foreground max-w-lg mx-auto"
            >
              See why growing brands trust us with their marketplace content.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
          >
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                variants={fadeUp}
                custom={i}
                className="rounded-xl border border-border bg-card p-8 flex flex-col"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, si) => (
                    <Star
                      key={si}
                      className="h-4 w-4 fill-primary text-primary"
                    />
                  ))}
                </div>
                <blockquote className="text-sm leading-relaxed text-muted-foreground flex-1 mb-6">
                  "{t.quote}"
                </blockquote>
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-xs font-medium">
                      {t.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.role}, {t.company}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="text-3xl sm:text-4xl font-bold mb-4"
            >
              Simple, transparent pricing
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="text-muted-foreground"
            >
              Start free. Scale as you grow. No credit card required.
            </motion.p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className={`rounded-xl border p-8 flex flex-col ${
                  plan.highlight
                    ? "border-primary/40 bg-card glow-border"
                    : "border-border bg-card"
                }`}
              >
                {plan.highlight && (
                  <span className="text-xs font-medium text-primary mb-4">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-6">
                  {plan.description}
                </p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feat) => (
                    <li
                      key={feat}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link to="/auth?tab=signup">
                  <Button
                    variant={plan.highlight ? "default" : "outline"}
                    className="w-full"
                  >
                    {plan.cta}
                  </Button>
                </Link>
                {plan.cta === "Start Free Trial" && (
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    No credit card required
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="text-3xl sm:text-4xl font-bold mb-4"
            >
              Frequently asked questions
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="text-muted-foreground max-w-lg mx-auto"
            >
              Everything you need to know about the Content Builder.
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto"
          >
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto text-center"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to build{" "}
              <span className="text-gradient">publish-ready listings</span>?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Upload your product data and generate optimized marketplace content
              in minutes. Start your free trial today — no credit card needed.
            </p>
            <Link to="/auth?tab=signup">
              <Button size="lg" className="gap-2 px-10">
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-6">
              <ShieldCheck className="h-4 w-4 text-primary" />
              14-day free trial · No credit card · Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>
    </>
  );
}
