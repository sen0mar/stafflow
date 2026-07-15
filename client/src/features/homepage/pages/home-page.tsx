import { FeatureCard } from '@/features/homepage/components/feature-card'
import { HeroSection } from '@/features/homepage/components/hero-section'
import { LandingFooter } from '@/features/homepage/components/landing-footer'
import { LandingHeader } from '@/features/homepage/components/landing-header'
import { modules } from '@/features/homepage/components/landing-data'
import { ReactiveDotGrid } from '@/features/homepage/components/reactive-dot-grid'

export const HomePage = () => (
  <main className="relative min-h-screen overflow-hidden bg-base text-primary">
    <ReactiveDotGrid />
    <div className="relative z-10">
      <LandingHeader />
      <HeroSection />
      <section className="mx-auto grid max-w-[1440px] gap-5 px-5 py-5 sm:px-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 xl:px-8 2xl:max-w-[1760px] 2xl:gap-6 2xl:px-10 min-[2200px]:!max-w-[2200px]">
        {modules.map((module) => (
          <FeatureCard
            key={module.title}
            description={module.description}
            icon={module.icon}
            title={module.title}
          />
        ))}
      </section>
      <LandingFooter />
    </div>
  </main>
)
