tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        xarkiDark: '#1a5c2a',
                        xarkiLight: '#4a9e5c',
                        xarkiWhite: '#ffffff',
                    },
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                    },
                    animation: {
                        'blob': 'blob 7s infinite',
                    },
                    keyframes: {
                        blob: {
                            '0%': { transform: 'translate(0px, 0px) scale(1)' },
                            '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
                            '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
                            '100%': { transform: 'translate(0px, 0px) scale(1)' },
                        }
                    }
                }
            }
        }

// ===== ADVANCED SCROLL REVEAL ANIMATION =====
        // Function: revealOnScroll()
        // Purpose: Animates elements into view as the user scrolls down the page
        // Added support for multiple reveal directions (left, right, bottom)
        const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
        
        const revealOnScroll = () => {
            const windowHeight = window.innerHeight;
            revealElements.forEach(el => {
                const elementTop = el.getBoundingClientRect().top;
                // Reveal when element is within 85% of viewport height
                if (elementTop < windowHeight * 0.85) {
                    el.classList.add('active');
                }
            });
        };

        // ===== NUMBER COUNTER ANIMATION =====
        // Function: animateCounters()
        // Purpose: Animates statistics numbers from 0 to target value when visible
        const counters = document.querySelectorAll('.counter');
        const counterOptions = { threshold: 0.5 };
        
        const counterObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target;
                    const finalValue = +target.getAttribute('data-target');
                    const suffix = target.getAttribute('data-suffix') || '';
                    const duration = 2000; // 2 seconds total
                    const increment = finalValue / (duration / 30); // 30ms frames
                    let current = 0;
                    
                    const updateCounter = () => {
                        if (current < finalValue) {
                            current += increment;
                            // Ensure we don't exceed and format properly
                            target.innerText = Math.ceil(current) + suffix;
                            setTimeout(updateCounter, 30);
                        } else {
                            target.innerText = finalValue + suffix;
                        }
                    };
                    
                    updateCounter();
                    observer.unobserve(target); // Run once
                }
            });
        }, counterOptions);
        
        counters.forEach(counter => counterObserver.observe(counter));

        // ===== MOUSE PARALLAX EFFECT FOR HERO =====
        // Function: heroParallax()
        // Purpose: Moves hero text slightly based on mouse position for a 3D feel
        const heroSection = document.getElementById('inicio');
        const heroContent = document.getElementById('hero-content');
        
        heroSection.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 20; // max 20px movement
            const y = (e.clientY / window.innerHeight - 0.5) * 20;
            heroContent.style.transform = `translate(${x}px, ${y}px)`;
            heroContent.style.transition = 'transform 0.1s ease-out';
        });
        
        heroSection.addEventListener('mouseleave', () => {
            heroContent.style.transform = 'translate(0px, 0px)';
            heroContent.style.transition = 'transform 0.5s ease-out';
        });

        // ===== NAVBAR STICKY EFFECT =====
        // Function: handleNav()
        // Purpose: Changes navbar styling when scrolled past a certain threshold
        const navbar = document.getElementById('navbar');
        const handleNav = () => {
            if (window.scrollY > 50) {
                navbar.classList.add('nav-scrolled');
                navbar.classList.remove('py-4');
                navbar.classList.add('py-2');
            } else {
                navbar.classList.remove('nav-scrolled');
                navbar.classList.add('py-4');
                navbar.classList.remove('py-2');
            }
        };

        // ===== MOBILE MENU TOGGLE =====
        // Function: toggleMobileMenu logic
        // Purpose: Shows/hides the dropdown menu with animation
        const mobileBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        const mobileLinks = document.querySelectorAll('.mobile-link');

        mobileBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
            if(!mobileMenu.classList.contains('hidden')){
                // Small trick to ensure transition runs
                setTimeout(() => {
                    mobileMenu.classList.add('scale-y-100', 'opacity-100');
                    mobileMenu.classList.remove('scale-y-0', 'opacity-0');
                }, 10);
            } else {
                mobileMenu.classList.remove('scale-y-100', 'opacity-100');
                mobileMenu.classList.add('scale-y-0', 'opacity-0');
            }
        });

        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
                mobileMenu.classList.remove('scale-y-100', 'opacity-100');
                mobileMenu.classList.add('scale-y-0', 'opacity-0');
            });
        });

        // Initial setup for mobile menu classes
        mobileMenu.classList.add('scale-y-0', 'opacity-0');

        // Attach global scroll listeners
        window.addEventListener('scroll', () => {
            revealOnScroll();
            handleNav();
        });
        
        // Run initial check on page load
        document.addEventListener('DOMContentLoaded', () => {
            revealOnScroll();
            handleNav();
        });