import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
  benefits: string[];
  color: string;
  locked: boolean;
}

interface PricingPlan {
  name: string;
  price: string;
  period: string;
  features: string[];
  unlockCount: number;
  popular?: boolean;
  badge?: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      
      <!-- Navigation Bar -->
      <nav class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <div class="flex items-center gap-2">
              <div class="h-10 w-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-xl">E</span>
              </div>
              <div>
                <h1 class="text-xl font-bold text-gray-900 dark:text-white">ExITS Business Suite</h1>
                <p class="text-xs text-gray-500 dark:text-gray-400">All-in-One Financial Platform</p>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <a routerLink="/auth/login" class="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                Sign In
              </a>
              <a routerLink="/register" class="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all">
                Get Started Free
              </a>
            </div>
          </div>
        </div>
      </nav>

      <!-- Hero Section -->
      <section class="relative overflow-hidden py-20 lg:py-32">
        <div class="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10"></div>
        <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center">
            <h1 class="text-5xl lg:text-7xl font-extrabold text-gray-900 dark:text-white mb-6">
              🏦 ExITS Business Suite
            </h1>
            <p class="text-2xl lg:text-3xl text-gray-700 dark:text-gray-300 font-medium mb-4">
              Your All-in-One Platform for Loan, Pawnshop, and BNPL Management
            </p>
            <p class="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
              Empower your business with the tools you need.<br>
              Choose your features. Pay only for what you use.
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a routerLink="/register" 
                 class="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all">
                Get Started Free
              </a>
              <button 
                (click)="showDemo.set(true)"
                class="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg font-semibold rounded-xl border-2 border-gray-300 dark:border-gray-700 hover:border-blue-600 dark:hover:border-blue-500 transition-all">
                Watch Demo
              </button>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-4">
              ✨ Free 14-day trial • No credit card required • Cancel anytime
            </p>
          </div>

          <!-- Hero Dashboard Preview -->
          <div class="mt-16 relative">
            <div class="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 blur-3xl opacity-20"></div>
            <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div class="h-64 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl flex items-center justify-center">
                <p class="text-gray-500 dark:text-gray-400 text-lg">📊 Dashboard Preview Coming Soon</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Feature Unlock Section -->
      <section class="py-20 bg-white dark:bg-gray-900">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16">
            <h2 class="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Unlock Powerful Features
            </h2>
            <p class="text-xl text-gray-600 dark:text-gray-400">
              Choose what you need. Scale as you grow.
            </p>
          </div>

          <div class="grid md:grid-cols-3 gap-8">
            @for (feature of features(); track feature.id) {
              <div class="group relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 border-2 border-gray-200 dark:border-gray-700 hover:border-{{ feature.color }}-500 dark:hover:border-{{ feature.color }}-400 transition-all hover:shadow-2xl"
                   [class.opacity-75]="feature.locked">
                
                <!-- Lock Overlay -->
                @if (feature.locked) {
                  <div class="absolute inset-0 bg-gray-900/5 dark:bg-gray-900/40 rounded-2xl backdrop-blur-[1px] flex items-center justify-center z-10">
                    <div class="text-center">
                      <div class="w-16 h-16 mx-auto mb-4 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg">
                        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                        </svg>
                      </div>
                      <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Feature Locked</p>
                      <button class="px-4 py-2 bg-gradient-to-r from-{{ feature.color }}-600 to-{{ feature.color }}-700 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all">
                        Unlock Now
                      </button>
                    </div>
                  </div>
                }

                <!-- Feature Icon -->
                <div class="text-6xl mb-4">{{ feature.icon }}</div>

                <!-- Feature Title -->
                <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  {{ feature.title }}
                </h3>

                <!-- Feature Description -->
                <p class="text-gray-600 dark:text-gray-400 mb-6">
                  {{ feature.description }}
                </p>

                <!-- Feature Benefits -->
                <ul class="space-y-3 mb-6">
                  @for (benefit of feature.benefits; track benefit) {
                    <li class="flex items-start gap-2">
                      <svg class="w-5 h-5 text-{{ feature.color }}-600 dark:text-{{ feature.color }}-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                      </svg>
                      <span class="text-sm text-gray-700 dark:text-gray-300">{{ benefit }}</span>
                    </li>
                  }
                </ul>

                <!-- Unlock Button -->
                <button class="w-full py-3 bg-gradient-to-r from-{{ feature.color }}-600 to-{{ feature.color }}-700 text-white rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
                        [class.opacity-50]="feature.locked">
                  {{ feature.locked ? '🔒 Unlock ' : '✅ Unlocked - ' }}{{ feature.title }} Feature
                </button>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- Pricing Section -->
      <section class="py-20 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-900">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16">
            <h2 class="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              💼 Flexible Pricing
            </h2>
            <p class="text-xl text-gray-600 dark:text-gray-400">
              Pay Only for What You Need
            </p>
          </div>

          <div class="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            @for (plan of pricingPlans(); track plan.name) {
              <div class="relative bg-white dark:bg-gray-800 rounded-2xl p-8 border-2 transition-all hover:shadow-2xl"
                   [class.border-blue-600]="plan.popular"
                   [class.border-gray-200]="!plan.popular"
                   [class.dark:border-blue-500]="plan.popular"
                   [class.dark:border-gray-700]="!plan.popular"
                   [class.transform]="plan.popular"
                   [class.scale-105]="plan.popular">
                
                @if (plan.badge) {
                  <div class="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span class="px-4 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold rounded-full shadow-lg">
                      {{ plan.badge }}
                    </span>
                  </div>
                }

                <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">{{ plan.name }}</h3>
                <div class="mb-6">
                  <span class="text-5xl font-extrabold text-gray-900 dark:text-white">{{ plan.price }}</span>
                  <span class="text-gray-600 dark:text-gray-400">/{{ plan.period }}</span>
                </div>

                <ul class="space-y-3 mb-8">
                  @for (feature of plan.features; track feature) {
                    <li class="flex items-start gap-2">
                      <svg class="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                      </svg>
                      <span class="text-gray-700 dark:text-gray-300">{{ feature }}</span>
                    </li>
                  }
                </ul>

                <button class="w-full py-3 rounded-lg font-semibold transition-all"
                        [class.bg-gradient-to-r]="plan.popular"
                        [class.from-blue-600]="plan.popular"
                        [class.to-purple-600]="plan.popular"
                        [class.text-white]="plan.popular"
                        [class.shadow-xl]="plan.popular"
                        [class.hover:shadow-2xl]="plan.popular"
                        [class.bg-gray-100]="!plan.popular"
                        [class.dark:bg-gray-700]="!plan.popular"
                        [class.text-gray-900]="!plan.popular"
                        [class.dark:text-white]="!plan.popular">
                  Subscribe Now
                </button>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- Testimonials Section -->
      <section class="py-20 bg-white dark:bg-gray-900">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16">
            <h2 class="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Trusted by Growing Businesses
            </h2>
          </div>

          <div class="grid md:grid-cols-2 gap-8">
            <div class="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
              <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 italic">
                "After unlocking the Loan feature, our approval process became 3x faster. The automation saved us countless hours."
              </p>
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  S
                </div>
                <div>
                  <p class="font-semibold text-gray-900 dark:text-white">SmartFin Lending Corp.</p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Microfinance Company</p>
                </div>
              </div>
            </div>

            <div class="bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
              <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 italic">
                "We started with Pawnshop only, then added BNPL — now everything is in one place. Best decision ever!"
              </p>
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  G
                </div>
                <div>
                  <p class="font-semibold text-gray-900 dark:text-white">GoldWin Pawnshop</p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Pawnshop Chain</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- How It Works Section -->
      <section class="py-20 bg-gradient-to-br from-gray-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16">
            <h2 class="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p class="text-xl text-gray-600 dark:text-gray-400">
              Get started in minutes, not days
            </p>
          </div>

          <div class="grid md:grid-cols-3 gap-8">
            <div class="text-center">
              <div class="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                1
              </div>
              <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">Create Your Account</h3>
              <p class="text-gray-600 dark:text-gray-400">
                Sign up with your business details and get instant access to your tenant portal.
              </p>
            </div>

            <div class="text-center">
              <div class="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                2
              </div>
              <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">Choose Your Features</h3>
              <p class="text-gray-600 dark:text-gray-400">
                Select the features that match your business needs. Unlock more as you grow.
              </p>
            </div>

            <div class="text-center">
              <div class="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                3
              </div>
              <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">Start Managing</h3>
              <p class="text-gray-600 dark:text-gray-400">
                Access your dashboard instantly and start managing your operations right away.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Final CTA Section -->
      <section class="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 class="text-4xl lg:text-5xl font-bold mb-6">
            Ready to Modernize Your Business?
          </h2>
          <p class="text-xl mb-8 text-blue-100">
            Start your free trial today and unlock your first feature.
          </p>
          <a routerLink="/register" 
             class="inline-block px-8 py-4 bg-white text-blue-600 text-lg font-bold rounded-xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all">
            Create Tenant Account →
          </a>
          <p class="text-sm text-blue-100 mt-4">
            Join 500+ businesses already using ExITS Business Suite
          </p>
        </div>
      </section>

      <!-- Footer -->
      <footer class="bg-gray-900 text-gray-400 py-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid md:grid-cols-4 gap-8">
            <div>
              <h4 class="text-white font-bold mb-4">ExITS Business Suite</h4>
              <p class="text-sm">All-in-One Financial Platform for Modern Businesses</p>
            </div>
            <div>
              <h4 class="text-white font-semibold mb-4">Features</h4>
              <ul class="space-y-2 text-sm">
                <li><a href="#" class="hover:text-white transition-colors">Money Loan</a></li>
                <li><a href="#" class="hover:text-white transition-colors">Pawnshop</a></li>
                <li><a href="#" class="hover:text-white transition-colors">BNPL</a></li>
              </ul>
            </div>
            <div>
              <h4 class="text-white font-semibold mb-4">Company</h4>
              <ul class="space-y-2 text-sm">
                <li><a href="#" class="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" class="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" class="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 class="text-white font-semibold mb-4">Legal</h4>
              <ul class="space-y-2 text-sm">
                <li><a href="#" class="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" class="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div class="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2025 ExITS Business Suite. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  `
})
export class LandingComponent {
  showDemo = signal(false);

  features = signal<Feature[]>([
    {
      id: 'loan',
      icon: '💸',
      title: 'Money Loan',
      description: 'Manage lending operations seamlessly with automated workflows and intelligent tracking.',
      benefits: [
        'Track borrower profiles and credit history',
        'Automated interest calculations',
        'Flexible repayment schedules',
        'Perfect for microfinance companies'
      ],
      color: 'blue',
      locked: false
    },
    {
      id: 'pawnshop',
      icon: '💍',
      title: 'Pawnshop',
      description: 'Digitize your pawnshop operations with automated ticketing and inventory management.',
      benefits: [
        'Automated ticketing and tracking',
        'Renewal and redemption management',
        'Inventory and collateral tracking',
        'Built for gold, gadgets, or any collateral'
      ],
      color: 'purple',
      locked: true
    },
    {
      id: 'bnpl',
      icon: '🛒',
      title: 'Buy Now, Pay Later',
      description: 'Offer flexible payment plans to your customers with automated installment tracking.',
      benefits: [
        'Track purchases and installments',
        'Manage customer credit limits',
        'Automated payment reminders',
        'Ideal for retail and appliance stores'
      ],
      color: 'green',
      locked: true
    }
  ]);

  pricingPlans = signal<PricingPlan[]>([
    {
      name: 'Starter',
      price: 'Free',
      period: '14 days',
      features: [
        'Dashboard Access',
        '1 Feature of Your Choice',
        'Basic Analytics',
        'Email Support',
        'Up to 100 transactions'
      ],
      unlockCount: 1
    },
    {
      name: 'Standard',
      price: '$29',
      period: 'month',
      features: [
        'Unlock Any 2 Features',
        'Advanced Analytics',
        'Priority Email Support',
        'Up to 1,000 transactions/month',
        'API Access',
        'Custom Reports'
      ],
      unlockCount: 2,
      popular: true,
      badge: 'MOST POPULAR'
    },
    {
      name: 'Premium',
      price: '$49',
      period: 'month',
      features: [
        'Unlock All 3 Features',
        'Unlimited Transactions',
        'Premium Support (24/7)',
        'Full API Access',
        'White-Label Options',
        'Dedicated Account Manager'
      ],
      unlockCount: 3
    }
  ]);
}
