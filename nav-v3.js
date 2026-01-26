// V3 Glass Navigation - Fluid RGB Spotlight Animation
// Universal nav component for scottbertrand.com ecosystem

(function() {
    const header = document.querySelector('.header');
    const headerGlass = document.querySelector('.header__glass');

    if (!header || !headerGlass) return;

    // Skip animations if reduced motion preferred
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    // Reactive header lighting - responds to mouse + organic drift
    let mouseInfluenceRed = 0;
    let mouseInfluenceYellow = 0;
    let mouseInfluenceBlue = 0;
    let currentRedPos = 20;
    let currentYellowPos = 50;
    let currentBluePos = 75;

    document.addEventListener('mousemove', (e) => {
        if (!header.classList.contains('lights-on')) return;

        const mouseX = e.clientX / window.innerWidth;
        // Mouse adds subtle influence on top of organic motion
        mouseInfluenceRed = mouseX * 12;
        mouseInfluenceYellow = (mouseX - 0.5) * 8;
        mouseInfluenceBlue = -mouseX * 12;
    });

    // Organic drift using layered sine waves - living, wandering lights
    let lastFrameTime = performance.now();

    function animateLights(currentTime) {
        const elapsed = currentTime / 1000;
        const deltaTime = (currentTime - lastFrameTime) / 16.67; // Normalize to ~60fps
        lastFrameTime = currentTime;

        // Each light wanders across the bar with its own rhythm
        // Using irrational-ish ratios so the pattern never visibly repeats
        const redDrift = Math.sin(elapsed * 0.23) * 15 + Math.sin(elapsed * 0.57 + 1.2) * 8 + Math.sin(elapsed * 0.89) * 4;
        const yellowDrift = Math.sin(elapsed * 0.19 + 2.5) * 18 + Math.sin(elapsed * 0.47) * 9;
        const blueDrift = Math.sin(elapsed * 0.31 + 4.0) * 15 + Math.sin(elapsed * 0.71 + 0.8) * 8 + Math.sin(elapsed * 0.43) * 4;

        // Combine organic drift with mouse influence
        const targetRedPos = 20 + redDrift + mouseInfluenceRed;
        const targetYellowPos = 50 + yellowDrift + mouseInfluenceYellow;
        const targetBluePos = 75 + blueDrift + mouseInfluenceBlue;

        // Frame-rate independent smoothing
        const ease = 1 - Math.pow(0.92, deltaTime);
        currentRedPos += (targetRedPos - currentRedPos) * ease;
        currentYellowPos += (targetYellowPos - currentYellowPos) * ease;
        currentBluePos += (targetBluePos - currentBluePos) * ease;

        headerGlass.style.setProperty('--red-pos', currentRedPos + '%');
        headerGlass.style.setProperty('--yellow-pos', currentYellowPos + '%');
        headerGlass.style.setProperty('--blue-pos', currentBluePos + '%');

        requestAnimationFrame(animateLights);
    }
    requestAnimationFrame(animateLights);

    // Hide on scroll down, show on scroll up
    let lastScrollY = window.scrollY;
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const currentScrollY = window.scrollY;

                if (currentScrollY > 100) {
                    if (currentScrollY > lastScrollY && currentScrollY > 150) {
                        // Scrolling down - hide header
                        header.classList.add('hidden-scroll');
                    } else {
                        // Scrolling up - show header
                        header.classList.remove('hidden-scroll');
                    }
                } else {
                    // At top of page - always show
                    header.classList.remove('hidden-scroll');
                }

                lastScrollY = currentScrollY;
                ticking = false;
            });
            ticking = true;
        }
    });
})();
